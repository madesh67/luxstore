"use client";

import * as React from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface QuantitySelectorProps {
  quantity: number;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function QuantitySelector({
  quantity,
  max = 10,
  min = 1,
  onChange,
  isLoading = false,
  className = "",
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  return (
    <div className={`flex items-center border border-border/60 bg-background/50 rounded-sm w-fit ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDecrement}
        disabled={quantity <= min || isLoading}
        className="h-11 w-11 md:h-8 md:w-8 rounded-none hover:bg-muted/50 hover:text-accent disabled:opacity-40 flex items-center justify-center"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <div className="w-10 text-center text-xs font-mono font-medium text-foreground select-none relative h-4 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-3 w-3 animate-spin text-accent" />
          </div>
        ) : null}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={quantity}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="block w-full text-center"
          >
            {quantity}
          </motion.span>
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleIncrement}
        disabled={quantity >= max || isLoading}
        className="h-11 w-11 md:h-8 md:w-8 rounded-none hover:bg-muted/50 hover:text-accent disabled:opacity-40 flex items-center justify-center"
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
