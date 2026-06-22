import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { BannerService } from "@/services/banner.service";
import { adminBannerCreateSchema } from "@/schemas/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const activeOnly = searchParams.get("activeOnly") === "true";
    const position = searchParams.get("position") || undefined;

    // Public users can fetch active banners, but list dashboard might require admin.
    // Let's check token and only require admin if fetching all (not activeOnly).
    if (!activeOnly) {
      await verifyAdmin(request);
    }

    if (activeOnly && position) {
      const activeBanners = await BannerService.getActiveBanners(position);
      return successResponse({ data: activeBanners });
    }

    const result = await BannerService.getBanners({
      page,
      limit,
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
    const validatedData = adminBannerCreateSchema.parse(body);

    const banner = await BannerService.createBanner(validatedData, admin.userId);

    return successResponse({
      message: "Banner created successfully",
      banner,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
