"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { CartType } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  cart: CartType;
  showCheckoutCTA?: boolean;
}

export function CartSummary({ cart, showCheckoutCTA = false }: CartSummaryProps) {
  const isFreeShipping = cart.subtotal >= 10000;
  const shippingCost = isFreeShipping ? 0 : 500;

  return (
    <div className="bg-card border border-border/40 p-6 rounded-sm space-y-6">
      <h3 className="text-xs tracking-widest font-semibold text-foreground uppercase border-b border-border pb-4">
        Order Summary
      </h3>

      <div className="space-y-4 text-xs">
        {/* Item Count details */}
        <div className="flex justify-between text-muted-foreground">
          <span>Items ({cart.totalQuantity})</span>
          <span className="font-mono text-foreground">{formatPrice(cart.subtotal)}</span>
        </div>

        {/* Shipping details */}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping Est.</span>
          <span className="font-mono text-foreground">
            {shippingCost === 0 ? (
              <span className="text-green-600 font-semibold uppercase tracking-wider text-[10px]">Free</span>
            ) : (
              formatPrice(shippingCost)
            )}
          </span>
        </div>

        {shippingCost > 0 && (
          <p className="text-[9px] text-muted-foreground/80 font-light leading-normal">
            💡 Spend <span className="font-semibold text-accent font-mono">₹{formatPrice(10000 - cart.subtotal)}</span> more to receive complimentary worldwide shipping.
          </p>
        )}

        {/* Divider line */}
        <div className="border-t border-border/40 pt-4 flex justify-between font-semibold text-sm">
          <span>Estimated Total</span>
          <span className="text-accent font-mono">{formatPrice(cart.subtotal + shippingCost)}</span>
        </div>
      </div>

      {showCheckoutCTA ? (
        <div className="space-y-3">
          <Button
            asChild
            variant="gold"
            className="w-full h-12 uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2"
          >
            <Link href="/cart">
              View Cart Details <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground/80 font-light">
            <Lock className="h-3 w-3" /> Secure checkout locks in Phase 5.
          </div>
        </div>
      ) : null}
    </div>
  );
}
