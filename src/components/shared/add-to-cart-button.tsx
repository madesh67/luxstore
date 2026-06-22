"use client";

import * as React from "react";
import { ShoppingBag, Loader2, Check } from "lucide-react";
import { useAddToCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  inStock?: boolean;
  _maxStock?: number;
  className?: string;
}

export function AddToCartButton({
  productId,
  quantity = 1,
  inStock = true,
  _maxStock = 10,
  className = "",
}: AddToCartButtonProps) {
  const addToCartMutation = useAddToCart();
  const [success, setSuccess] = React.useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!inStock) return;

    addToCartMutation.mutate(
      { productId, quantity },
      {
        onSuccess: () => {
          setSuccess(true);
          const timer = setTimeout(() => setSuccess(false), 2000);
          
          // Analytics Foundation event broadcast
          window.dispatchEvent(
            new CustomEvent("cart-event", {
              detail: { type: "AddToCart", productId, quantity },
            })
          );
          
          return () => clearTimeout(timer);
        },
      }
    );
  };

  const isLoading = addToCartMutation.isPending;

  return (
    <Button
      onClick={handleAddToCart}
      disabled={!inStock || isLoading || success}
      variant={success ? "outline" : "gold"}
      className={`h-12 uppercase tracking-widest text-xs font-bold transition-all duration-300 ${success ? "border-green-600 text-green-600 bg-green-50/20" : ""} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin text-accent" /> Adding to Cart
        </>
      ) : success ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-600 animate-bounce" /> Added Successfully
        </>
      ) : !inStock ? (
        "Out of Stock"
      ) : (
        <>
          <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
        </>
      )}
    </Button>
  );
}
