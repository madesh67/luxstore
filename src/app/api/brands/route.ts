import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { BrandService } from "@/services/brand.service";

export async function GET(_request: NextRequest) {
  try {
    const brands = await BrandService.getBrands();
    return successResponse({ brands });
  } catch (error) {
    return handleApiError(error);
  }
}
