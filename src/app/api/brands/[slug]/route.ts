import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { BrandService } from "@/services/brand.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const brand = await BrandService.getBrandDetails(slug);
    return successResponse({ brand });
  } catch (error) {
    return handleApiError(error);
  }
}
