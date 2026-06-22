import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCartSession } from "@/lib/session";
import { CartService } from "@/services/cart.service";

export async function DELETE(request: NextRequest) {
  try {
    const { userId, guestToken } = await getCartSession(request);
    const cart = await CartService.clearCart(userId, guestToken);
    return successResponse({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
