"use client";

import * as React from "react";
import { Heart, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useWishlist, WishlistItemType } from "@/hooks/use-wishlist";
import { Product } from "@/types";
import { WishlistCard } from "./wishlist-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function WishlistGrid() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: serverWishlist, isLoading: isWishlistLoading } = useWishlist();

  const [guestItems, setGuestItems] = React.useState<WishlistItemType[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Listen to local changes on guest wishlist updates
    const loadGuestWishlist = () => {
      if (!user) {
        const stored = localStorage.getItem("luxstore_guest_wishlist_objects");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Map to WishlistItemType shape: { id, productId, product }
            const mapped = Object.values(parsed).map((prod) => {
              const p = prod as Product & {
                images: { imageUrl: string; altText: string | null; displayOrder: number }[];
                inventory: { quantity: number } | null;
              };
              return {
                id: `guest_${p.id}`,
                wishlistId: "guest",
                productId: p.id,
                createdAt: new Date().toISOString(),
                product: p,
              };
            });
            setGuestItems(mapped);
          } catch {
            // Ignore parse errors
          }
        } else {
          setGuestItems([]);
        }
      }
    };

    loadGuestWishlist();

    window.addEventListener("wishlist-update", loadGuestWishlist);
    return () => {
      window.removeEventListener("wishlist-update", loadGuestWishlist);
    };
  }, [user]);

  const isLoading = isUserLoading || (user && isWishlistLoading);

  const items = React.useMemo(() => {
    if (user) {
      return serverWishlist?.wishlist.items || [];
    }
    return guestItems;
  }, [user, serverWishlist, guestItems]);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Loading Wishlist...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 border border-border/40 rounded-sm bg-card space-y-4 max-w-xl mx-auto">
        <Heart className="h-12 w-12 text-accent mx-auto animate-pulse" />
        <h3 className="text-lg uppercase tracking-widest text-foreground font-display font-medium">Your Wishlist is Empty</h3>
        <p className="text-xs text-muted-foreground font-light max-w-xs mx-auto leading-relaxed">
          Keep track of masterpieces you love. Save items to purchase them later.
        </p>
        <Button asChild variant="gold" className="text-xs uppercase tracking-widest">
          <Link href="/shop">Explore Catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
      {items.map((item) => (
        <WishlistCard key={item.id} item={item} />
      ))}
    </div>
  );
}
