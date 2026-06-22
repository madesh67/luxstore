"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AddressType {
  id: string;
  userId: string;
  title: string | null; // e.g., HOME, WORK, OTHER
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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

export function useAddresses() {
  return useQuery<{ addresses: AddressType[] }, Error>({
    queryKey: ["addresses"],
    queryFn: () => fetcher<{ addresses: AddressType[] }>("/api/addresses"),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      addressType: "HOME" | "WORK" | "OTHER";
      isDefault?: boolean;
    }) =>
      fetcher<{ address: AddressType }>("/api/addresses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      addressType: "HOME" | "WORK" | "OTHER";
      isDefault?: boolean;
    }) =>
      fetcher<{ address: AddressType }>(`/api/addresses/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ message: string }>(`/api/addresses/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ address: AddressType }>(`/api/addresses/${id}/default`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}
