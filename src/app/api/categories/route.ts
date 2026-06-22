import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { CategoryService } from "@/services/category.service";

export async function GET(_request: NextRequest) {
  try {
    const categories = await CategoryService.getCategories();
    return successResponse({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}
