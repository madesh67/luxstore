import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getCartSession } from "@/lib/session";
import { CheckoutService } from "@/services/checkout.service";

export async function POST(request: NextRequest) {
  try {
    const { userId, guestToken } = await getCartSession(request);
    const body = await request.json();
    const { sessionId, step, address, shippingMethodId } = body;

    if (!sessionId) {
      throw new AppError("sessionId is required", 400, "BAD_REQUEST");
    }

    if (step === "address" && address) {
      const session = await CheckoutService.updateAddress(sessionId, userId, guestToken, address);
      return successResponse({ session });
    } 
    
    if (step === "shipping" && shippingMethodId) {
      const session = await CheckoutService.updateShippingMethod(sessionId, userId, guestToken, shippingMethodId);
      return successResponse({ session });
    } 
    
    if (step === "payment") {
      const intentData = await CheckoutService.createPaymentIntent(sessionId, userId, guestToken);
      return successResponse(intentData);
    }

    throw new AppError("Invalid checkout step parameters", 400, "BAD_REQUEST");
  } catch (error) {
    return handleApiError(error);
  }
}
