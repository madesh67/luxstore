"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

export interface CheckoutSessionType {
  id: string;
  userId: string | null;
  guestToken: string | null;
  email: string | null;
  cartSnapshot: unknown;
  addressSnapshot: unknown;
  shippingMethodId: string | null;
  shippingMethod?: ShippingMethodType | null;
  shippingCost: number | null;
  taxCost: number | null;
  subtotal: number;
  total: number;
  stripePaymentIntentId: string | null;
  stripeClientSecret: string | null;
  paymentStatus: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethodType {
  id: string;
  name: string;
  slug: string;
  baseCost: number;
  estimatedDays: string;
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
    const errorMsg = payload?.error?.message || "An unexpected error occurred during checkout";
    throw new Error(errorMsg);
  }

  return payload.data as T;
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (data?: { email?: string }) =>
      fetcher<{ session: CheckoutSessionType }>("/api/checkout/session", {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      }),
  });
}

export function useUpdateCheckoutStep() {
  return useMutation({
    mutationFn: (data: {
      sessionId: string;
      step: "address" | "shipping" | "payment";
      address?: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        addressType: "HOME" | "WORK" | "OTHER";
      };
      shippingMethodId?: string;
    }) =>
      fetcher<{
        session?: CheckoutSessionType;
        clientSecret?: string;
        paymentIntentId?: string;
        total?: number;
      }>("/api/checkout/payment-intent", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useCheckoutStatus(params: { paymentIntentId?: string; orderNumber?: string }) {
  const queryKey = params.paymentIntentId 
    ? ["checkoutStatus", "intent", params.paymentIntentId] 
    : ["checkoutStatus", "order", params.orderNumber];

  return useQuery({
    queryKey,
    queryFn: () => {
      const url = params.paymentIntentId 
        ? `/api/checkout/status?paymentIntentId=${params.paymentIntentId}`
        : `/api/checkout/status?orderNumber=${params.orderNumber}`;
      return fetcher<{ status?: string; order: unknown }>(url);
    },
    enabled: !!params.paymentIntentId || !!params.orderNumber,
    refetchInterval: (query) => {
      // Poll if we are checking payment intent status and order hasn't been completed yet
      if (params.paymentIntentId && query.state.data?.status !== "PAID") {
        return 2000;
      }
      return false;
    },
  });
}

export function useShippingMethods() {
  return useQuery<{ methods: ShippingMethodType[] }, Error>({
    queryKey: ["shippingMethods"],
    queryFn: () => fetcher<{ methods: ShippingMethodType[] }>("/api/shipping/methods"),
  });
}
