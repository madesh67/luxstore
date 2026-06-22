import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { CategoryService } from "@/services/category.service";
import { adminCategoryCreateSchema } from "@/schemas/catalog";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    const categories = await CategoryService.getCategories(false);
    return successResponse({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = await request.json();
    const validatedData = adminCategoryCreateSchema.parse(body);

    const category = await CategoryService.createCategory(validatedData);

    return successResponse({
      message: "Category created successfully",
      category,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

