import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCartSession } from "@/lib/session";
import { CartService } from "@/services/cart.service";
import { updateCartItemSchema } from "@/schemas/cart";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, guestToken } = await getCartSession(request);
    const { id } = await params;
    const body = await request.json();
    const { quantity } = updateCartItemSchema.parse(body);

    const cart = await CartService.updateCartItem(userId, guestToken, id, quantity);
    return successResponse({
      message: "Cart item updated successfully",
      cart,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, guestToken } = await getCartSession(request);
    const { id } = await params;

    const cart = await CartService.removeCartItem(userId, guestToken, id);
    return successResponse({
      message: "Cart item removed successfully",
      cart,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
