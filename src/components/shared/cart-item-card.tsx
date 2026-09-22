"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { CartItemType, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import { QuantitySelector } from "./quantity-selector";
import { formatPrice, getProductImageUrl } from "@/lib/utils";

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
          }),
        );
      },
    });
  };

  const primaryImage = getProductImageUrl(item.product);
  const maxStock = item.product.inventory?.quantity || 10;
  const isPending = updateMutation.isPending || removeMutation.isPending;

  return (
    <div className="group relative flex gap-4 overflow-hidden rounded-sm border border-border/40 bg-card p-4 transition-all hover:border-accent/30 md:gap-6 md:p-6">
      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-border/30 bg-secondary/15 md:h-24 md:w-24">
        <img src={primaryImage} alt={item.product.name} className="h-full w-full object-cover" />
      </div>

      {/* Item Details */}
      <div className="flex min-w-0 flex-grow flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[8px] font-semibold uppercase tracking-widest text-accent md:text-[9px]">
                {item.product.brand?.name || "LuxStore"}
              </span>
              <h4 className="truncate font-display text-xs uppercase tracking-wider text-foreground transition-colors hover:text-accent md:text-sm">
                <Link href={`/products/${item.product.slug}`}>{item.product.name}</Link>
              </h4>
            </div>

            <button
              onClick={handleRemove}
              disabled={isPending}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center p-3 text-muted-foreground transition-colors hover:text-destructive md:min-h-0 md:min-w-0 md:p-1"
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-[10px] font-light uppercase text-muted-foreground md:text-xs">
            Category: {item.product.category?.name}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <QuantitySelector
            quantity={item.quantity}
            max={maxStock}
            onChange={handleQuantityChange}
            isLoading={isPending}
          />

          <div className="text-right">
            <span className="font-mono text-xs font-semibold text-foreground md:text-sm">
              {formatPrice(Number(item.product.price) * item.quantity)}
            </span>
            {item.quantity > 1 && (
              <span className="block font-mono text-[9px] text-muted-foreground md:text-[10px]">
                ({formatPrice(Number(item.product.price))} each)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
