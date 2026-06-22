import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCartSession, getSessionUser } from "@/lib/session";
import { WishlistService } from "@/services/wishlist.service";
import { moveToCartSchema } from "@/schemas/cart";
import { AppError } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to transfer wishlist items", 401, "UNAUTHORIZED");
    }

    const { guestToken } = await getCartSession(request);
    const body = await request.json();
    const { wishlistItemId } = moveToCartSchema.parse(body);

    const wishlist = await WishlistService.moveToCart(user.userId, guestToken, wishlistItemId);
    return successResponse({
      message: "Item moved to cart successfully",
      wishlist,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
