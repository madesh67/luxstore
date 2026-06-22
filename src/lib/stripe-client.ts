import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51P1234567890abcdefghijklmnopqrstuvwxyz";
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};
