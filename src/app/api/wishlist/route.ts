import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { WishlistService } from "@/services/wishlist.service";
import { AppError } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to view wishlist", 401, "UNAUTHORIZED");
    }

    const wishlist = await WishlistService.getWishlist(user.userId);
    return successResponse({ wishlist });
  } catch (error) {
    return handleApiError(error);
  }
}
