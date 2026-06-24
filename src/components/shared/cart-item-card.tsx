"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { CartItemType, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import { QuantitySelector } from "./quantity-selector";
import { formatPrice } from "@/lib/utils";

interface CartItemCardProps {
  item: CartItemType;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const handleQuantityChange = (newQty: number) => {
    updateMutation.mutate({ id: item.id, quantity: newQty });
  };

  const handleRemove = () => {
    removeMutation.mutate(item.id, {
      onSuccess: () => {
        // Analytics Foundation event broadcast
        window.dispatchEvent(
          new CustomEvent("cart-event", {
            detail: { type: "RemoveFromCart", productId: item.productId, quantity: item.quantity },
          })
        );
      }
    });
  };

  const primaryImage = item.product.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800";
  const maxStock = item.product.inventory?.quantity || 10;
  const isPending = updateMutation.isPending || removeMutation.isPending;

  return (
    <div className="flex gap-4 md:gap-6 p-4 md:p-6 bg-card border border-border/40 rounded-sm relative group overflow-hidden transition-all hover:border-accent/30">
      {/* Thumbnail */}
      <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 bg-secondary/15 rounded-sm overflow-hidden border border-border/30">
        <img
          src={primaryImage}
          alt={item.product.name}
          className="object-cover h-full w-full"
        />
      </div>

      {/* Item Details */}
      <div className="flex-grow flex flex-col justify-between min-w-0">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-[8px] md:text-[9px] tracking-widest font-semibold uppercase text-accent">
                {item.product.brand?.name || "LuxStore"}
              </span>
              <h4 className="text-xs md:text-sm font-display uppercase tracking-wider text-foreground hover:text-accent transition-colors truncate">
                <Link href={`/products/${item.product.slug}`}>{item.product.name}</Link>
              </h4>
            </div>
            
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-3 md:p-1 flex items-center justify-center"
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase font-light">
            Category: {item.product.category?.name}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-2">
          {/* Quantity selector */}
          <QuantitySelector
            quantity={item.quantity}
            max={maxStock}
            onChange={handleQuantityChange}
            isLoading={isPending}
          />
          
          <div className="text-right">
            <span className="text-xs md:text-sm font-semibold text-foreground font-mono">
              {formatPrice(Number(item.product.price) * item.quantity)}
            </span>
            {item.quantity > 1 && (
              <span className="block text-[9px] md:text-[10px] text-muted-foreground font-mono">
                ({formatPrice(Number(item.product.price))} each)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
