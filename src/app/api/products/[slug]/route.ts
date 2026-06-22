import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { ProductService } from "@/services/product.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await ProductService.getProductDetails(slug);
    
    // Fetch related products (same category or brand)
    const relatedProducts = await ProductService.getRelatedProducts(
      product.id,
      product.categoryId,
      product.brandId,
      4
    );

    return successResponse({
      product,
      relatedProducts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
