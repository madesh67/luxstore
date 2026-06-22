import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { ProductService } from "@/services/product.service";
import { adminProductCreateSchema } from "@/schemas/catalog";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const validatedData = adminProductCreateSchema.partial().parse(body);

    const product = await ProductService.updateProduct(id, validatedData);

    return successResponse({
      message: "Product updated successfully",
      product,
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

    await ProductService.deleteProduct(id);

    return successResponse({
      message: "Product deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
