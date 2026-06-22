import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminCouponService } from "@/services/admin-coupon.service";
import { adminCouponUpdateSchema } from "@/schemas/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const coupon = await AdminCouponService.getCouponById(id);
    if (!coupon) {
      return successResponse({ success: false, error: { message: "Coupon not found" } }, 404);
    }

    return successResponse({ coupon });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const validatedData = adminCouponUpdateSchema.parse(body);

    const coupon = await AdminCouponService.updateCoupon(id, validatedData, admin.userId);

    return successResponse({
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await verifyAdmin(request);

    const coupon = await AdminCouponService.deleteCoupon(id, admin.userId);

    return successResponse({
      message: "Coupon deleted successfully",
      coupon,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
