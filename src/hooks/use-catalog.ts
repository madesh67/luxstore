"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CatalogFilterInput, AdminProductCreateInput } from "@/schemas/catalog";
import { Product, Category, Brand } from "@/types";

// Standard JSON fetcher mapping standard ApiResponse wrappers
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

// Convert object filters to standard URLSearchParams
function buildQueryString(filters: CatalogFilterInput): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useProducts(filters: CatalogFilterInput) {
  const queryString = buildQueryString(filters);
  
  return useQuery<{ products: Product[]; pagination: { total: number; page: number; limit: number; pages: number } }, Error>({
    queryKey: ["catalog-products", filters],
    queryFn: () => fetcher(`/api/products${queryString}`),
    staleTime: 2 * 60 * 1000, // 2 minutes cache duration
  });
}

export function useProductDetails(slug: string) {
  return useQuery<{ product: Product & { images: { imageUrl: string; altText: string | null; displayOrder: number }[]; reviews: unknown[] }; relatedProducts: Product[] }, Error>({
    queryKey: ["product-detail", slug],
    queryFn: () => fetcher(`/api/products/${slug}`),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery<{ categories: Category[] }, Error>({
    queryKey: ["catalog-categories"],
    queryFn: () => fetcher("/api/categories"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useBrands() {
  return useQuery<{ brands: Brand[] }, Error>({
    queryKey: ["catalog-brands"],
    queryFn: () => fetcher("/api/brands"),
    staleTime: 10 * 60 * 1000,
  });
}

// Admin mutations
export function useAdminCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminProductCreateInput) =>
      fetcher("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    },
  });
}

export function useAdminUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminProductCreateInput>) =>
      fetcher<{ product?: { slug: string } }>(`/api/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (data: { product?: { slug: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-detail", data.product?.slug] });
    },
  });
}

export function useAdminDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/admin/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    },
  });
}
