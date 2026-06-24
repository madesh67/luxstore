"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { useUser } from "./use-auth";

export interface WishlistItemType {
  id: string;
  wishlistId: string;
  productId: string;
  createdAt: string;
  product: Product & {
    images: { imageUrl: string; altText: string | null; displayOrder: number }[];
    inventory: { quantity: number } | null;
  };
}

export interface WishlistType {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: WishlistItemType[];
}

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = payload?.error?.message || "An unexpected network error occurred";
    throw new Error(errorMsg);
  }

  return payload.data as T;
}

export function useWishlist() {
  const { data: user } = useUser();
  return useQuery<{ wishlist: WishlistType }, Error>({
    queryKey: ["wishlist"],
    queryFn: () => fetcher<{ wishlist: WishlistType }>("/api/wishlist"),
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
    retry: false, // Don't retry if not authenticated
    enabled: !!user,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string }) =>
      fetcher<{ wishlist: WishlistType }>("/api/wishlist/items", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["wishlist"], data);
      trackAnalyticsEvent("AddToWishlist", { productId: variables.productId });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ wishlist: WishlistType }>(`/api/wishlist/items/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["wishlist"], data);
      trackAnalyticsEvent("RemoveFromWishlist", { wishlistItemId: variables });
    },
  });
}

export function useMoveToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { wishlistItemId: string }) =>
      fetcher<{ wishlist: WishlistType }>("/api/wishlist/move-to-cart", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      // Invalidate cart to show newly added item, and update local wishlist data
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.setQueryData(["wishlist"], data);
      
      // Look up target productId if possible or track the wishlistItemId move
      trackAnalyticsEvent("RemoveFromWishlist", { wishlistItemId: variables.wishlistItemId, action: "moved_to_cart" });
    },
  });
}
