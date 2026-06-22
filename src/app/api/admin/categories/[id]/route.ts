import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { CategoryService } from "@/services/category.service";
import { adminCategoryCreateSchema } from "@/schemas/catalog";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const validatedData = adminCategoryCreateSchema.partial().parse(body);

    const category = await CategoryService.updateCategory(id, validatedData);

    return successResponse({
      message: "Category updated successfully",
      category,
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

    await CategoryService.deleteCategory(id);

    return successResponse({
      message: "Category deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
