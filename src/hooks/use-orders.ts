"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OrderItemType {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  productSku: string;
  productImage: string | null;
  quantity: number;
  price: string | number;
}

export interface TimelineType {
  id: string;
  orderId: string;
  status: string;
  description: string;
  createdAt: string;
}

export interface TrackingEventType {
  id: string;
  shipmentId: string;
  status: string;
  description: string;
  location: string | null;
  timestamp: string;
}

export interface ShipmentType {
  id: string;
  orderId: string;
  trackingNumber: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  status: string;
  events: TrackingEventType[];
}

export interface ReturnRequestType {
  id: string;
  orderId: string;
  userId: string;
  status: string;
  reason: string;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderType {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  shippingAddressSnapshot: unknown;
  shippingMethodId: string | null;
  subtotal: string | number;
  discount: string | number;
  shippingCost: string | number;
  taxCost: string | number;
  total: string | number;
  paymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemType[];
  timeline?: TimelineType[];
  shipment?: ShipmentType | null;
  returnRequest?: ReturnRequestType | null;
}

export interface OrdersResponse {
  data: OrderType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReturnRequestsResponse {
  data: ReturnRequestType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
    const errorMsg = payload?.error?.message || "An unexpected error occurred";
    throw new Error(errorMsg);
  }

  return payload.data as T;
}

export function useOrders(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const queryParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
  });

  return useQuery<OrdersResponse, Error>({
    queryKey: ["orders", params],
    queryFn: () => fetcher<OrdersResponse>(`/api/orders?${queryParams.toString()}`),
  });
}

export function useOrderDetails(id: string) {
  return useQuery<{ order: OrderType }, Error>({
    queryKey: ["order", id],
    queryFn: () => fetcher<{ order: OrderType }>(`/api/orders/${id}`),
    enabled: !!id,
  });
}

export function useOrderTracking(id: string) {
  return useQuery<{ shipment: ShipmentType }, Error>({
    queryKey: ["order-tracking", id],
    queryFn: () => fetcher<{ shipment: ShipmentType }>(`/api/orders/${id}/tracking`),
    enabled: !!id,
  });
}

export function useCreateReturnRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      orderId: string;
      reason: string;
      customerNotes?: string;
      attachments?: unknown;
    }) =>
      fetcher<{ returnRequest: ReturnRequestType }>(`/api/orders/${data.orderId}/returns`, {
        method: "POST",
        body: JSON.stringify({
          reason: data.reason,
          customerNotes: data.customerNotes,
          attachments: data.attachments,
        }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["return-request", variables.orderId] });
    },
  });
}

export function useReturnRequest(orderId: string) {
  return useQuery<{ returnRequest: ReturnRequestType | null }, Error>({
    queryKey: ["return-request", orderId],
    queryFn: () => fetcher<{ returnRequest: ReturnRequestType | null }>(`/api/orders/${orderId}/returns`),
    enabled: !!orderId,
  });
}

// ADMIN HOOKS

export function useAdminOrders(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const queryParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
  });

  return useQuery<OrdersResponse, Error>({
    queryKey: ["admin-orders", params],
    queryFn: () => fetcher<OrdersResponse>(`/api/admin/orders?${queryParams.toString()}`),
  });
}

export function useAdminOrderDetails(id: string) {
  return useQuery<{ order: OrderType }, Error>({
    queryKey: ["admin-order", id],
    queryFn: () => fetcher<{ order: OrderType }>(`/api/admin/orders/${id}`),
    enabled: !!id,
  });
}

export function useAdminUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; status: string; timelineDescription?: string }) =>
      fetcher<{ order: OrderType }>(`/api/admin/orders/${data.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: data.status,
          timelineDescription: data.timelineDescription,
        }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useAdminUpdateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      orderId: string;
      trackingNumber: string;
      carrier: string;
      trackingUrl: string;
      status: string;
      description: string;
      location?: string;
    }) =>
      fetcher<{ shipment: ShipmentType }>(`/api/admin/orders/${data.orderId}/shipment`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["order-tracking", variables.orderId] });
    },
  });
}

export function useAdminReturns(params: { page: number; limit: number }) {
  const queryParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  return useQuery<ReturnRequestsResponse, Error>({
    queryKey: ["admin-returns", params],
    queryFn: () => fetcher<ReturnRequestsResponse>(`/api/admin/returns?${queryParams.toString()}`),
  });
}

export function useAdminProcessReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; orderId: string; status: string; adminNotes?: string }) =>
      fetcher<{ returnRequest: ReturnRequestType }>(`/api/admin/returns/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: data.status,
          adminNotes: data.adminNotes,
        }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    },
  });
}
