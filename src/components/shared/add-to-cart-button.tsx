"use client";

import * as React from "react";
import { ShoppingBag, Loader2, Check } from "lucide-react";
import { useAddToCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center w-full"
          >
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-accent" /> Adding to Cart
          </motion.span>
        ) : success ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center w-full text-green-600"
          >
            <Check className="h-4 w-4 mr-2 text-green-600 animate-bounce" /> Added Successfully
          </motion.span>
        ) : !inStock ? (
          <motion.span
            key="out-of-stock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center w-full"
          >
            Out of Stock
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center w-full"
          >
            <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
