import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAccessToken } from "@/lib/jwt";
import { AdminCouponService } from "@/services/admin-coupon.service";

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code) {
      return successResponse({ success: false, error: { message: "Coupon code is required" } }, 400);
    }
    if (subtotal === undefined || typeof subtotal !== "number") {
      return successResponse({ success: false, error: { message: "Subtotal is required and must be a number" } }, 400);
    }

    // Extract user token if available
    let token = request.cookies.get("accessToken")?.value;
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    let userId = "";
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    const validationResult = await AdminCouponService.validateCoupon(
      code,
      userId,
      subtotal
    );

    return successResponse(validationResult);
  } catch (error) {
    return handleApiError(error);
  }
}
