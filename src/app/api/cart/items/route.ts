import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCartSession } from "@/lib/session";
import { CartService } from "@/services/cart.service";
import { addToCartSchema } from "@/schemas/cart";

export async function POST(request: NextRequest) {
  try {
    const { userId, guestToken } = await getCartSession(request);
    const body = await request.json();
    const { productId, quantity } = addToCartSchema.parse(body);

    const cart = await CartService.addToCart(userId, guestToken, productId, quantity);
    return successResponse({
      message: "Item added to cart successfully",
      cart,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
