"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { WishlistItemType, useRemoveFromWishlist, useMoveToCart } from "@/hooks/use-wishlist";
import { useUser } from "@/hooks/use-auth";
import { useAddToCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

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
            })
          );
        }
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
            })
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
      moveToCartMutation.mutate({ wishlistItemId: item.id }, {
        onSuccess: () => {
          // Analytics Foundation event broadcast
          window.dispatchEvent(
            new CustomEvent("wishlist-event", {
              detail: { type: "RemoveFromWishlist", productId: item.productId },
            })
          );
          window.dispatchEvent(
            new CustomEvent("cart-event", {
              detail: { type: "AddToCart", productId: item.productId, quantity: 1 },
            })
          );
        }
      });
    } else {
      // Guest move to cart: Add to cart then remove from guest wishlist local storage
      addToCartMutation.mutate({ productId: item.productId, quantity: 1 }, {
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
                })
              );
              window.dispatchEvent(
                new CustomEvent("cart-event", {
                  detail: { type: "AddToCart", productId: item.productId, quantity: 1 },
                })
              );
            } catch (err) {
              console.error("Failed to update guest wishlist after moving to cart", err);
            }
          }
        }
      });
    }
  };

  const primaryImage = item.product.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800";
  const isPending = user
    ? (removeMutation.isPending || moveToCartMutation.isPending)
    : addToCartMutation.isPending;
  const inStock = item.product.inventory && item.product.inventory.quantity > 0;

  return (
    <div className="group border border-border/30 bg-card hover:border-accent/40 p-4 hover-lift rounded-sm relative flex flex-col justify-between">
      <div>
        {/* Product image */}
        <div className="relative aspect-square w-full overflow-hidden bg-secondary/15 rounded-sm mb-4">
          <img
            src={primaryImage}
            alt={item.product.name}
            className="object-cover h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-destructive hover:text-white transition-colors border border-border/20"
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Brand & Category */}
        <div className="flex justify-between items-center text-[9px] tracking-widest text-muted-foreground uppercase font-semibold mb-1">
          <span>{item.product.brand?.name || "LuxStore"}</span>
          <span>{item.product.category?.name}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-display font-medium uppercase tracking-wider text-foreground group-hover:text-accent transition-colors line-clamp-1">
          <Link href={`/products/${item.product.slug}`}>{item.product.name}</Link>
        </h3>
        
        {/* Pricing */}
        <div className="mt-2 text-xs font-mono font-semibold text-foreground">
          {formatPrice(Number(item.product.price))}
          {item.product.compareAtPrice && (
            <span className="text-[10px] text-muted-foreground line-through font-light ml-2">
              {formatPrice(Number(item.product.compareAtPrice))}
            </span>
          )}
        </div>
      </div>

      {/* Move to Cart button */}
      <div className="mt-4 pt-4 border-t border-border/40">
        <Button
          onClick={handleMoveToCart}
          disabled={isPending || !inStock}
          variant="gold"
          className="w-full text-[10px] uppercase tracking-widest h-10 font-bold"
        >
          {moveToCartMutation.isPending ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Moving...
            </>
          ) : !inStock ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Move to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
