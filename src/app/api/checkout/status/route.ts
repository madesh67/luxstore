import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("paymentIntentId");
    const orderNumber = searchParams.get("orderNumber");

    if (!paymentIntentId && !orderNumber) {
      throw new AppError("paymentIntentId or orderNumber query parameter is required", 400, "BAD_REQUEST");
    }

    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      });
      if (!order) {
        throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
      }
      return successResponse({ order });
    }

    if (paymentIntentId) {
      const order = await prisma.order.findFirst({
        where: { paymentIntentId },
        include: { items: true },
      });

      if (order) {
        return successResponse({ status: "PAID", order });
      }

      const session = await prisma.checkoutSession.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!session) {
        throw new AppError("Payment session not found", 404, "SESSION_NOT_FOUND");
      }

      return successResponse({ status: session.paymentStatus });
    }

    throw new AppError("Invalid search query parameter combo", 400, "BAD_REQUEST");
  } catch (error) {
    return handleApiError(error);
  }
}
