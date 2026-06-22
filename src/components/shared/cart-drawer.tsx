"use client";

import * as React from "react";
import Link from "next/link";
import { X, ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart, useClearCart } from "@/hooks/use-cart";
import { CartItemCard } from "./cart-item-card";
import { CartSummary } from "./cart-summary";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: cartData, isLoading, isError } = useCart();
  const clearCartMutation = useClearCart();

  // Listen to global open drawer event
  React.useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-cart-drawer", handleOpen);
    
    // Auto-open drawer when a product is added
    const handleCartAdd = () => setIsOpen(true);
    window.addEventListener("cart-event", handleCartAdd);

    return () => {
      window.removeEventListener("open-cart-drawer", handleOpen);
      window.removeEventListener("cart-event", handleCartAdd);
    };
  }, []);

  // Lock page scrolling when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const cart = cartData?.cart;
  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Cart Sidebar panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-background border-l border-border/40 shadow-2xl flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/40 flex justify-between items-center bg-secondary/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-accent" />
                <h2 className="text-xs tracking-[0.25em] font-semibold text-foreground uppercase">
                  Shopping Bag ({cart?.totalQuantity || 0})
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Close cart drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <span className="text-[10px] tracking-widest text-muted-foreground uppercase">Syncing cart...</span>
                </div>
              ) : isError ? (
                <div className="text-center py-12 border border-destructive/20 bg-destructive/5 rounded-sm p-4">
                  <h4 className="text-xs font-semibold text-destructive uppercase tracking-widest">Connection Offline</h4>
                  <p className="text-[10px] text-muted-foreground font-light mt-1">
                    Failed to fetch cart. Please check your network or try again.
                  </p>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center h-72 text-center space-y-4">
                  <div className="h-12 w-12 bg-secondary/50 rounded-full flex items-center justify-center text-muted-foreground/60 animate-pulse">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">Your bag is empty</h3>
                    <p className="text-[10px] text-muted-foreground font-light max-w-[240px] mx-auto mt-1 leading-relaxed">
                      Explore our handcrafted briefcases, polarized eyewear, and watches to begin.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="gold"
                    className="text-[10px] uppercase tracking-widest h-10 px-6 font-semibold"
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                /* Cart Items List */
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemCard key={item.id} item={item} />
                  ))}
                  
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => clearCartMutation.mutate()}
                      disabled={clearCartMutation.isPending}
                      className="text-[9px] tracking-widest font-semibold text-muted-foreground hover:text-destructive hover:underline uppercase"
                    >
                      Clear All Items
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Summary (Sticky at bottom) */}
            {!isEmpty && cart && (
              <div className="p-6 border-t border-border/40 bg-secondary/10 space-y-6">
                <CartSummary cart={cart} showCheckoutCTA={false} />
                
                <div className="space-y-2">
                  <Button
                    asChild
                    variant="gold"
                    onClick={() => setIsOpen(false)}
                    className="w-full h-12 uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Link href="/cart">
                      Proceed to Bag <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center text-[10px] tracking-widest font-semibold text-accent hover:underline uppercase py-2"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
