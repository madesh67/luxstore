"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginInput, RegisterInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput } from "@/schemas/auth";
import { User } from "@/types";

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

export function useUser() {
  return useQuery<User | null, Error>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        const data = await fetcher<{ user: User }>("/api/auth/me");
        return data.user;
      } catch {
        // Return null if unauthorized or error (i.e. guest user)
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache profile for 5 minutes
    retry: false, // Don't retry auth checks repeatedly on fail
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginInput) =>
      fetcher<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (data) => {
      // Seed user cache immediately
      queryClient.setQueryData(["auth-user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterInput) =>
      fetcher<{ user: User; message: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetcher<{ message: string }>("/api/auth/logout", {
        method: "POST",
      }),
    onSuccess: () => {
      // Evict user cache on logout
      queryClient.setQueryData(["auth-user"], null);
      queryClient.removeQueries({ queryKey: ["auth-user"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string }) =>
      fetcher<{ user: User; message: string }>("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth-user"], data.user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      fetcher<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordInput) =>
      fetcher<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResetPassword(token: string) {
  return useMutation({
    mutationFn: (data: Omit<ResetPasswordInput, "token">) =>
      fetcher<{ message: string }>(`/api/auth/reset-password?token=${token}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useVerifyEmail(token: string) {
  return useQuery({
    queryKey: ["verify-email", token],
    queryFn: () =>
      fetcher<{ message: string }>(`/api/api/auth/verify?token=${token}`, {
        method: "POST",
      }),
    enabled: !!token,
    retry: false,
  });
}
