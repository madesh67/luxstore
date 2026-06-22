import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCartSession } from "@/lib/session";
import { CheckoutService } from "@/services/checkout.service";

export async function POST(request: NextRequest) {
  try {
    const { userId, guestToken } = await getCartSession(request);
    
    let email: string | undefined;
    try {
      const body = await request.json();
      email = body.email;
    } catch {
      // Body might be empty
    }

    const session = await CheckoutService.createSession(userId, guestToken, email);
    return successResponse({ session }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
