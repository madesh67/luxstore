"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { WishlistItemType, useRemoveFromWishlist, useMoveToCart } from "@/hooks/use-wishlist";
import { useUser } from "@/hooks/use-auth";
import { useAddToCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { formatPrice, getProductImageUrl } from "@/lib/utils";

interface WishlistCardProps {
  item: WishlistItemType;
}

export function WishlistCard({ item }: WishlistCardProps) {
  const { data: user } = useUser();
  const removeMutation = useRemoveFromWishlist();
  const moveToCartMutation = useMoveToCart();
  const addToCartMutation = useAddToCart();

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      removeMutation.mutate(item.id, {
        onSuccess: () => {
          // Analytics Foundation event broadcast
          window.dispatchEvent(
            new CustomEvent("wishlist-event", {
              detail: { type: "RemoveFromWishlist", productId: item.productId },
            }),
          );
        },
      });
    } else {
      // Guest User Wishlist: Local Storage persistence
      const storedRaw = localStorage.getItem("luxstore_guest_wishlist");
      const storedObjRaw = localStorage.getItem("luxstore_guest_wishlist_objects");
      if (storedRaw && storedObjRaw) {
        try {
          const list = JSON.parse(storedRaw) as string[];
          const objects = JSON.parse(storedObjRaw) as Record<string, unknown>;

          const updatedList = list.filter((id) => id !== item.productId);
          delete objects[item.productId];

          localStorage.setItem("luxstore_guest_wishlist", JSON.stringify(updatedList));
          localStorage.setItem("luxstore_guest_wishlist_objects", JSON.stringify(objects));

          // Notify components
          window.dispatchEvent(new CustomEvent("wishlist-update"));
          window.dispatchEvent(
            new CustomEvent("wishlist-event", {
              detail: { type: "RemoveFromWishlist", productId: item.productId },
            }),
          );
        } catch (err) {
          console.error("Failed to remove guest wishlist item", err);
        }
      }
    }
  };

  const handleMoveToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      moveToCartMutation.mutate(
        { wishlistItemId: item.id },
        {
          onSuccess: () => {
            // Analytics Foundation event broadcast
            window.dispatchEvent(
              new CustomEvent("wishlist-event", {
                detail: { type: "RemoveFromWishlist", productId: item.productId },
              }),
            );
            window.dispatchEvent(
              new CustomEvent("cart-event", {
                detail: { type: "AddToCart", productId: item.productId, quantity: 1 },
              }),
            );
          },
        },
      );
    } else {
      // Guest move to cart: Add to cart then remove from guest wishlist local storage
      addToCartMutation.mutate(
        { productId: item.productId, quantity: 1 },
        {
          onSuccess: () => {
            const storedRaw = localStorage.getItem("luxstore_guest_wishlist");
            const storedObjRaw = localStorage.getItem("luxstore_guest_wishlist_objects");
            if (storedRaw && storedObjRaw) {
              try {
                const list = JSON.parse(storedRaw) as string[];
                const objects = JSON.parse(storedObjRaw) as Record<string, unknown>;

                const updatedList = list.filter((id) => id !== item.productId);
                delete objects[item.productId];

                localStorage.setItem("luxstore_guest_wishlist", JSON.stringify(updatedList));
                localStorage.setItem("luxstore_guest_wishlist_objects", JSON.stringify(objects));

                // Notify components
                window.dispatchEvent(new CustomEvent("wishlist-update"));
                window.dispatchEvent(
                  new CustomEvent("wishlist-event", {
                    detail: { type: "RemoveFromWishlist", productId: item.productId },
                  }),
                );
                window.dispatchEvent(
                  new CustomEvent("cart-event", {
                    detail: { type: "AddToCart", productId: item.productId, quantity: 1 },
                  }),
                );
              } catch (err) {
                console.error("Failed to update guest wishlist after moving to cart", err);
              }
            }
          },
        },
      );
    }
  };

  const primaryImage = getProductImageUrl(item.product);
  const isPending = user
    ? removeMutation.isPending || moveToCartMutation.isPending
    : addToCartMutation.isPending;
  const inStock = item.product.inventory && item.product.inventory.quantity > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hover-lift group relative flex h-full flex-col justify-between rounded-sm border border-border/30 bg-card p-4 hover:border-accent/40 md:p-6"
    >
      <div>
        {/* Product image */}
        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-sm bg-secondary/15 md:mb-6">
          <img
            src={primaryImage}
            alt={item.product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border/20 bg-background/80 p-3 transition-colors hover:bg-destructive hover:text-destructive-foreground md:min-h-0 md:min-w-0 md:p-1.5"
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Brand & Category */}
        <div className="mb-1 flex items-center justify-between text-[9px] font-semibold uppercase tracking-widest text-muted-foreground md:mb-2 md:text-[10px]">
          <span>{item.product.brand?.name || "LuxStore"}</span>
          <span>{item.product.category?.name}</span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-1 font-display text-sm font-medium uppercase tracking-wider text-foreground transition-colors group-hover:text-accent md:text-base">
          <Link href={`/products/${item.product.slug}`}>{item.product.name}</Link>
        </h3>

        {/* Pricing */}
        <div className="mt-2 font-mono text-xs font-semibold text-foreground md:text-sm">
          {formatPrice(Number(item.product.price))}
          {item.product.compareAtPrice && (
            <span className="ml-2 text-[10px] font-light text-muted-foreground line-through md:text-xs">
              {formatPrice(Number(item.product.compareAtPrice))}
            </span>
          )}
        </div>
      </div>

      {/* Move to Cart button */}
      <div className="mt-4 border-t border-border/40 pt-4 md:mt-6 md:pt-4">
        <Button
          onClick={handleMoveToCart}
          disabled={isPending || !inStock}
          variant="gold"
          className="h-10 w-full text-[10px] font-bold uppercase tracking-widest"
        >
          {moveToCartMutation.isPending ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Moving...
            </>
          ) : !inStock ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingBag className="mr-1 h-3.5 w-3.5" /> Move to Cart
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
