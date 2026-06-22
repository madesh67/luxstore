"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types";
import { trackAnalyticsEvent } from "@/lib/analytics";

export interface CartItemType {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: Product & {
    images: { imageUrl: string; altText: string | null; displayOrder: number }[];
    inventory: { quantity: number } | null;
  };
}

export interface CartType {
  id: string;
  userId: string | null;
  guestToken: string | null;
  createdAt: string;
  updatedAt: string;
  items: CartItemType[];
  subtotal: number;
  estimatedTotal: number;
  itemCount: number;
  totalQuantity: number;
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

export function useCart() {
  return useQuery<{ cart: CartType }, Error>({
    queryKey: ["cart"],
    queryFn: () => fetcher<{ cart: CartType }>("/api/cart"),
    staleTime: 1000 * 30, // 30 seconds stale time
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      fetcher<{ cart: CartType }>("/api/cart/items", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["cart"], data);
      trackAnalyticsEvent("AddToCart", { productId: variables.productId, quantity: variables.quantity });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; quantity: number }) =>
      fetcher<{ cart: CartType }>(`/api/cart/items/${data.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: data.quantity }),
      }),
    onMutate: async (updatedItem) => {
      // 1. Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      // 2. Snapshot current cart state
      const previousCart = queryClient.getQueryData<{ cart: CartType }>(["cart"]);

      // 3. Optimistically update query data
      if (previousCart) {
        const updatedItems = previousCart.cart.items.map((item) => {
          if (item.id === updatedItem.id) {
            return { ...item, quantity: updatedItem.quantity };
          }
          return item;
        });

        // Compute updated totals
        let subtotal = 0;
        let totalQuantity = 0;
        updatedItems.forEach((item) => {
          subtotal += Number(item.product.price) * item.quantity;
          totalQuantity += item.quantity;
        });

        queryClient.setQueryData<{ cart: CartType }>(["cart"], {
          cart: {
            ...previousCart.cart,
            items: updatedItems,
            subtotal,
            estimatedTotal: subtotal,
            totalQuantity,
          },
        });
      }

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous state on failure
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      trackAnalyticsEvent("UpdateQuantity", { cartItemId: variables.id, quantity: variables.quantity });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ cart: CartType }>(`/api/cart/items/${id}`, {
        method: "DELETE",
      }),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<{ cart: CartType }>(["cart"]);

      if (previousCart) {
        const updatedItems = previousCart.cart.items.filter((item) => item.id !== itemId);
        let subtotal = 0;
        let totalQuantity = 0;
        updatedItems.forEach((item) => {
          subtotal += Number(item.product.price) * item.quantity;
          totalQuantity += item.quantity;
        });

        queryClient.setQueryData<{ cart: CartType }>(["cart"], {
          cart: {
            ...previousCart.cart,
            items: updatedItems,
            subtotal,
            estimatedTotal: subtotal,
            itemCount: updatedItems.length,
            totalQuantity,
          },
        });
      }

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      trackAnalyticsEvent("RemoveFromCart", { cartItemId: variables });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher<{ cart: CartType }>("/api/cart/clear", {
        method: "DELETE",
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });
}
