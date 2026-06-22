import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth";
import { isRateLimited } from "@/lib/rate-limiter";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/cookies";
import crypto from "crypto";
import { CartService } from "@/services/cart.service";

// Dummy hash generated for timing-attack countermeasure
const DUMMY_HASH = "$2a$12$L7kG31Uplk7gK4B.qgX3nOtH0nN7HlX3hD5Z.gX3nOtH0nN7HlX3h";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // 1. Rate Limiting: Max 5 login attempts per IP in 5 minutes
    const limitResult = await isRateLimited(`login:${ip}`, 5, 5 * 60 * 1000);
    if (limitResult.limited) {
      return errorResponse(
        "Too many login attempts. Please try again in a few minutes.",
        429,
        "RATE_LIMIT_ERROR",
        { resetTime: limitResult.resetTime }
      );
    }

    // 2. Validate input schema
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // 3. Search user
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    // Timing-attack prevention: compare password with dummy hash if user doesn't exist
    const userExists = !!user;
    const hashToCompare = userExists ? user.passwordHash : DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    if (!userExists || !isPasswordValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // 4. Email Verification Enforcement (can be toggled via env flag)
    const enforceVerification = process.env.ENFORCE_EMAIL_VERIFICATION === "true";
    if (enforceVerification && !user.isEmailVerified) {
      throw new AppError(
        "Please verify your email address before logging in.",
        403,
        "EMAIL_UNVERIFIED"
      );
    }

    // 5. Generate Access & Refresh Tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const jti = crypto.randomUUID();
    const refreshToken = await signRefreshToken({
      userId: user.id,
      jti,
    });

    // Token expirations
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 6. DB operations: Save RefreshToken, Create Session, and log Audit
    const sessionToken = crypto.randomBytes(32).toString("hex");

    await prisma.$transaction(async (tx) => {
      // Store JTI tracked refresh token
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          jti,
          expiresAt: refreshExpiry,
        },
      });

      // Store HTTP session mapping
      await tx.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt: sessionExpiry,
          ipAddress: ip,
          userAgent,
        },
      });

      // Write login audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          details: `User logged in from IP: ${ip}`,
          ipAddress: ip,
        },
      });
    });

    // 7. Merge Guest Cart (if guestToken exists)
    const guestToken = request.cookies.get("guestToken")?.value;
    if (guestToken) {
      try {
        await CartService.mergeGuestCart(user.id, guestToken);
      } catch (mergeError) {
        console.error("⚠️ Failed to merge guest cart on login:", mergeError);
      }
    }

    // 8. Formulate response and set secure HTTP-only cookies
    const response = successResponse({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });

    setAuthCookies(response, accessToken, refreshToken);

    if (guestToken) {
      response.cookies.set("guestToken", "", { path: "/", maxAge: 0 });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
