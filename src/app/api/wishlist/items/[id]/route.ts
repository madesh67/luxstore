import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { WishlistService } from "@/services/wishlist.service";
import { AppError } from "@/lib/error-handler";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to modify wishlist", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const wishlist = await WishlistService.removeFromWishlist(user.userId, id);
    return successResponse({
      message: "Product removed from wishlist successfully",
      wishlist,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
