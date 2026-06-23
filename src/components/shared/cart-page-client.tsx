"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Loader2, ArrowLeft, Trash2, ArrowRight } from "lucide-react";
import { useCart, useClearCart } from "@/hooks/use-cart";
import { CartItemCard } from "./cart-item-card";
import { CartSummary } from "./cart-summary";
import { Button } from "@/components/ui/button";
import { Container } from "./container";

export function CartPageClient() {
  const { data: cartData, isLoading, isError, error } = useCart();
  const clearCartMutation = useClearCart();

  const cart = cartData?.cart;
  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <Container className="py-12 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-border/40 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] tracking-[0.3em] font-semibold text-accent uppercase">
            Your Selection
          </span>
          <h1 className="text-3xl font-display font-light uppercase tracking-wider text-foreground mt-1">
            Shopping Bag
          </h1>
        </div>
        
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>
      </div>

      {/* Main Layout */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Syncing your bag...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-20 border border-destructive/20 bg-destructive/5 rounded-sm max-w-xl mx-auto space-y-4">
          <h3 className="text-lg font-semibold text-destructive uppercase tracking-widest">Connection Offline</h3>
          <p className="text-xs text-muted-foreground font-light max-w-sm mx-auto leading-relaxed">
            {error?.message || "We encountered an issue syncing your cart with our servers."}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="text-xs uppercase tracking-widest">
            Reload Page
          </Button>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-24 border border-border/40 rounded-sm bg-card space-y-6 max-w-xl mx-auto">
          <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center text-muted-foreground/60 mx-auto animate-pulse">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl uppercase tracking-widest text-foreground font-display font-medium">Your Bag is Empty</h3>
            <p className="text-xs text-muted-foreground font-light max-w-xs mx-auto mt-2 leading-relaxed">
              Before you can check out, you must add some handcrafted accessories to your bag.
            </p>
          </div>
          <Button asChild variant="gold" className="text-xs uppercase tracking-widest h-12 px-8">
            <Link href="/shop">Explore Catalog</Link>
          </Button>
        </div>
      ) : (
        /* Populated Cart Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Items List Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest font-semibold hover:text-accent transition-colors min-h-[44px] sm:min-h-0 py-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Keep Adding Masterpieces
              </Link>
              
              <button
                onClick={() => clearCartMutation.mutate()}
                disabled={clearCartMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 text-xs tracking-widest font-semibold text-muted-foreground hover:text-destructive hover:underline uppercase min-h-[44px] sm:min-h-0 py-2"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All Items
              </button>
            </div>
          </div>

          {/* Pricing Summary Column */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <CartSummary cart={cart!} showCheckoutCTA={false} />
            
            {process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === "true" ? (
              <div className="bg-secondary/25 border border-border/40 p-6 rounded-sm text-center space-y-4">
                <span className="text-[10px] tracking-[0.25em] font-semibold text-accent uppercase block">
                  Ready to Order
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Secure Checkout
                </h3>
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  Stripe payment gate and order processing pipelines are active.
                </p>
                <Button asChild variant="gold" className="w-full h-12 uppercase tracking-widest text-xs font-bold">
                  <Link href="/checkout">
                    Proceed to Secure Checkout <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="bg-secondary/25 border border-border/40 p-6 rounded-sm text-center py-6">
                <p className="text-xs text-muted-foreground/80 font-light">
                  🔒 Payments and Checkout are currently unavailable in preview mode.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
