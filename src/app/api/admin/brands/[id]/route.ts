import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { BrandService } from "@/services/brand.service";
import { adminBrandCreateSchema } from "@/schemas/catalog";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const validatedData = adminBrandCreateSchema.partial().parse(body);

    const brand = await BrandService.updateBrand(id, validatedData);

    return successResponse({
      message: "Brand updated successfully",
      brand,
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
    await verifyAdmin(request);
    const { id } = await params;

    await BrandService.deleteBrand(id);

    return successResponse({
      message: "Brand deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
