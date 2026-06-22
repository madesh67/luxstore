import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminCouponService } from "@/services/admin-coupon.service";
import { adminCouponCreateSchema } from "@/schemas/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const result = await AdminCouponService.getCoupons({
      page,
      limit,
      search,
      activeOnly,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const validatedData = adminCouponCreateSchema.parse(body);

    const coupon = await AdminCouponService.createCoupon(validatedData, admin.userId);

    return successResponse({
      message: "Coupon created successfully",
      coupon,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
