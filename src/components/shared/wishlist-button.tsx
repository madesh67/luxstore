"use client";

import * as React from "react";
import { Heart, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { motion } from "framer-motion";

interface WishlistButtonProps {
  productId: string;
  product?: Product & {
    images?: { imageUrl: string; altText: string | null; displayOrder: number }[];
    inventory?: { quantity: number } | null;
    category?: unknown;
    brand?: unknown;
  };
  className?: string;
  variant?: "icon" | "full";
}

export function WishlistButton({
  productId,
  product,
  className = "",
  variant = "icon",
}: WishlistButtonProps) {
  const { data: user } = useUser();
  const { data: serverWishlist } = useWishlist();
  
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  // Local storage state for guest wishlist
  const [guestWishlist, setGuestWishlist] = React.useState<string[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!user) {
      const stored = localStorage.getItem("luxstore_guest_wishlist");
      if (stored) {
        try {
          setGuestWishlist(JSON.parse(stored));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [user]);

  const isLiked = React.useMemo(() => {
    if (user) {
      return !!serverWishlist?.wishlist.items.some((item) => item.productId === productId);
    }
    return guestWishlist.includes(productId);
  }, [user, serverWishlist, guestWishlist, productId]);

  const isLoading = React.useMemo(() => {
    return addToWishlistMutation.isPending || removeFromWishlistMutation.isPending;
  }, [addToWishlistMutation.isPending, removeFromWishlistMutation.isPending]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (user) {
      if (isLiked) {
        const item = serverWishlist?.wishlist.items.find((item) => item.productId === productId);
        if (item) {
          removeFromWishlistMutation.mutate(item.id);
        }
      } else {
        addToWishlistMutation.mutate({ productId });
      }
    } else {
      // Guest User Wishlist: Local Storage persistence
      let updatedList = [...guestWishlist];
      let storedObjects: Record<string, unknown> = {};

      const storedObjRaw = localStorage.getItem("luxstore_guest_wishlist_objects");
      if (storedObjRaw) {
        try {
          storedObjects = JSON.parse(storedObjRaw);
        } catch {}
      }

      if (isLiked) {
        updatedList = updatedList.filter((id) => id !== productId);
        delete storedObjects[productId];
      } else {
        updatedList.push(productId);
        if (product) {
          storedObjects[productId] = product;
        }
      }

      setGuestWishlist(updatedList);
      localStorage.setItem("luxstore_guest_wishlist", JSON.stringify(updatedList));
      localStorage.setItem("luxstore_guest_wishlist_objects", JSON.stringify(storedObjects));

      // Trigger standard analytics foundation event
      window.dispatchEvent(new CustomEvent("wishlist-update", { detail: { productId, action: isLiked ? "remove" : "add" } }));
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`h-11 w-11 md:h-10 md:w-10 border-border/40 ${className}`}
        disabled
      >
        <Heart className="h-4 w-4 text-muted-foreground/60" />
      </Button>
    );
  }

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        disabled={isLoading}
        className={`w-full uppercase tracking-widest text-[10px] font-semibold h-12 flex items-center justify-center gap-2 border-border/60 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : (
          <motion.span
            animate={isLiked ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="inline-flex"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "text-accent fill-accent" : "text-foreground"}`} />
          </motion.span>
        )}
        {isLiked ? "Saved in Wishlist" : "Save to Wishlist"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={`h-11 w-11 md:h-10 md:w-10 border-border/60 transition-all ${isLiked ? "border-accent/40 bg-accent/5" : ""} ${className}`}
      aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
      ) : (
        <motion.span
          animate={isLiked ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="inline-flex"
        >
          <Heart className={`h-4 w-4 transition-colors ${isLiked ? "text-accent fill-accent" : "text-muted-foreground hover:text-foreground"}`} />
        </motion.span>
      )}
    </Button>
  );
}
