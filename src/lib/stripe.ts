import Stripe from "stripe";
import { env } from "./env";

let stripeInstance: Stripe | null = null;

/**
 * Lazy initializer for Stripe server client.
 * Returns the Stripe instance, or throws if not configured.
 */
export function getStripeClient(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const apiKey = env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Stripe API key is not configured. Please set STRIPE_SECRET_KEY.");
  }

  stripeInstance = new Stripe(apiKey);
  return stripeInstance;
}
