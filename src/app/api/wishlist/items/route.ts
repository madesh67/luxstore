import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { WishlistService } from "@/services/wishlist.service";
import { addToWishlistSchema } from "@/schemas/cart";
import { AppError } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to add items to wishlist", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const { productId } = addToWishlistSchema.parse(body);

    const wishlist = await WishlistService.addToWishlist(user.userId, productId);
    return successResponse({
      message: "Product added to wishlist successfully",
      wishlist,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
