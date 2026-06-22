import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { CategoryService } from "@/services/category.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const category = await CategoryService.getCategoryDetails(slug);
    return successResponse({ category });
  } catch (error) {
    return handleApiError(error);
  }
}
