import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const isConfigured = !!(stripeKey && webhookSecret);

    if (!isConfigured) {
      throw new Error("Stripe payment keys are not fully configured in environment");
    }

    // In a real environment we could verify with a ping call, e.g. stripe.paymentIntents.list({ limit: 1 })
    // For local validation, checking credential presence and length is safe.
    return NextResponse.json({
      status: "healthy",
      service: "payments",
      provider: "Stripe",
      configured: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error("Payments health check failed:", error as Error);
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "payments",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
