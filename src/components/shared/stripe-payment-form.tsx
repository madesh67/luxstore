"use client";

import * as React from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";

interface StripePaymentFormProps {
  clientSecret: string;
  total: number;
  email: string;
  onSuccess: (paymentIntentId: string) => void;
}

export function StripePaymentForm({ clientSecret, total, email, onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email,
          },
        },
      });

      if (paymentError) {
        setError(paymentError.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else {
        setError("Payment processing error. Please contact support.");
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected payment error occurred";
      setError(message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-border/40 p-4 rounded-sm bg-background/50">
        <label className="text-[10px] tracking-widest font-semibold uppercase text-muted-foreground block mb-3">
          Credit or Debit Card Details
        </label>
        <div className="py-2.5 px-1">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#1f2937",
                  fontFamily: "Inter, sans-serif",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#dc2626",
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-3 rounded-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isProcessing || !stripe}
        variant="gold"
        className="w-full h-12 text-xs uppercase tracking-widest font-bold"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authorizing Payment...
          </>
        ) : (
          <>
            Authorize Payment & Place Order (₹{total.toLocaleString("en-IN")}) <ArrowRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </form>
  );
}
