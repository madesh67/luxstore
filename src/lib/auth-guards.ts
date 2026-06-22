import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";
import { AppError } from "./error-handler";

/**
 * Validates request cookies/headers and enforces ADMIN or SUPERADMIN role clearance.
 * Throws AppError 401/403 upon validation failure.
 */
export async function verifyAdmin(request: NextRequest) {
  let token = request.cookies.get("accessToken")?.value;
  
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    throw new AppError("Session expired. Please log in again.", 401, "TOKEN_EXPIRED");
  }

  if (payload.role !== "ADMIN" && payload.role !== "SUPERADMIN") {
    throw new AppError("Forbidden. Administrator access required.", 403, "FORBIDDEN");
  }

  return payload;
}
