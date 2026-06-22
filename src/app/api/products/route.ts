import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { ProductService } from "@/services/product.service";
import { catalogFilterSchema } from "@/schemas/catalog";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Convert query parameters into Zod validation targets
    const queryParams: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      if (key === "featured" || key === "inStock") {
        queryParams[key] = value === "true";
      } else {
        queryParams[key] = value;
      }
    });

    // Handle price range conversions
    if (searchParams.has("minPrice")) {
      queryParams.minPrice = parseFloat(searchParams.get("minPrice") || "0");
    }
    if (searchParams.has("maxPrice")) {
      queryParams.maxPrice = parseFloat(searchParams.get("maxPrice") || "0");
    }
    if (searchParams.has("rating")) {
      queryParams.rating = parseFloat(searchParams.get("rating") || "0");
    }
    if (searchParams.has("page")) {
      queryParams.page = parseInt(searchParams.get("page") || "1", 10);
    }
    if (searchParams.has("limit")) {
      queryParams.limit = parseInt(searchParams.get("limit") || "12", 10);
    }

    const validatedFilters = catalogFilterSchema.parse(queryParams);
    const result = await ProductService.getProducts(validatedFilters);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
