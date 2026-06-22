import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { BrandService } from "@/services/brand.service";
import { adminBrandCreateSchema } from "@/schemas/catalog";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    const brands = await BrandService.getBrands(false);
    return successResponse({ brands });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = await request.json();
    const validatedData = adminBrandCreateSchema.parse(body);

    const brand = await BrandService.createBrand(validatedData);

    return successResponse({
      message: "Brand created successfully",
      brand,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

