import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { BannerService } from "@/services/banner.service";
import { adminBannerUpdateSchema } from "@/schemas/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const banner = await BannerService.getBannerById(id);
    if (!banner) {
      return successResponse({ success: false, error: { message: "Banner not found" } }, 404);
    }

    return successResponse({ banner });
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
    const validatedData = adminBannerUpdateSchema.parse(body);

    const banner = await BannerService.updateBanner(id, validatedData, admin.userId);

    return successResponse({
      message: "Banner updated successfully",
      banner,
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

    const banner = await BannerService.deleteBanner(id, admin.userId);

    return successResponse({
      message: "Banner deleted successfully",
      banner,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
