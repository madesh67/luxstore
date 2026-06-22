import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { CheckoutService } from "@/services/checkout.service";
import { logger } from "@/lib/logger";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown verification error";
    logger.error(`⚠️ Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid Webhook Signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await CheckoutService.handlePaymentSuccess(paymentIntent.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const errorMessage = paymentIntent.last_payment_error?.message || "Payment intent processing failure";
        await CheckoutService.handlePaymentFailure(paymentIntent.id, errorMessage);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_intent) {
          const piId = typeof session.payment_intent === "string" 
            ? session.payment_intent 
            : (session.payment_intent as Stripe.PaymentIntent).id;
          await CheckoutService.handlePaymentSuccess(piId);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_intent) {
          const piId = typeof session.payment_intent === "string" 
            ? session.payment_intent 
            : (session.payment_intent as Stripe.PaymentIntent).id;
          await CheckoutService.handlePaymentFailure(piId, "Checkout session expired");
        }
        break;
      }
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown webhook handling error";
    logger.error(`⚠️ Error handling Stripe event ${event.type}:`, err as Error);
    return NextResponse.json({ error: message || "Webhook processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
