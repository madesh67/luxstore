import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCartSession } from "@/lib/session";
import { CartService } from "@/services/cart.service";

export async function GET(request: NextRequest) {
  try {
    const { userId, guestToken } = await getCartSession(request);
    const cart = await CartService.getCart(userId, guestToken);
    return successResponse({ cart });
  } catch (error) {
    return handleApiError(error);
  }
}
