"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface NotificationType {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  data: NotificationType[];
  total: number;
  unreadCount: number;
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

export function useNotifications(params: { page: number; limit: number; unreadOnly?: boolean }) {
  const queryParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.unreadOnly ? { unreadOnly: "true" } : {}),
  });

  return useQuery<NotificationsResponse, Error>({
    queryKey: ["notifications", params],
    queryFn: () => fetcher<NotificationsResponse>(`/api/notifications?${queryParams.toString()}`),
    refetchInterval: 15000, // Poll every 15s to keep Notification Center sync'd
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ message: string }>(`/api/notifications/${id}/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher<{ message: string }>("/api/notifications/read-all", {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ message: string }>(`/api/notifications/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
