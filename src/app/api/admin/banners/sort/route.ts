import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { BannerService } from "@/services/banner.service";
import { adminBannerSortSchema } from "@/schemas/admin";

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const validatedData = adminBannerSortSchema.parse(body);

    const sorted = await BannerService.sortBanners(validatedData.orders, admin.userId);

    return successResponse({
      message: "Banners re-sorted successfully",
      banners: sorted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
