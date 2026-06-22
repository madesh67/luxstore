import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { signAccessToken } from "../lib/jwt";

vi.stubEnv("JWT_SECRET", "testsecretkeytestsecretkeytestsecretkey");
vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

// Mock NextRequest and cookies parsing
function createMockRequest(urlPath: string, method = "GET", cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const url = `http://localhost:3000${urlPath}`;
  const req = new NextRequest(url, {
    method,
    headers: new Headers(headers),
  });

  // Set cookies manually on request object
  Object.entries(cookies).forEach(([key, val]) => {
    req.cookies.set(key, val);
  });

  return req;
}

describe("Next.js Security Middleware & Routing Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Security Response Headers", () => {
    it("should inject security headers on standard page requests", async () => {
      const request = createMockRequest("/");
      const response = await middleware(request);
      
      expect(response).toBeDefined();
      expect(response?.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response?.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response?.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(response?.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    });
  });

  describe("CSRF Protection Layer", () => {
    it("should block API mutations with mismatched Origin/Referer domains", async () => {
      const request = createMockRequest("/api/auth/profile", "PATCH", {}, {
        origin: "http://malicioussite.com",
      });

      const response = await middleware(request);
      expect(response).toBeDefined();
      expect(response?.status).toBe(403);
      
      const body = await response?.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toBe("CSRF verification failed");
    });

    it("should allow API mutations matching application domain", async () => {
      const request = createMockRequest("/api/auth/profile", "PATCH", {}, {
        origin: "http://localhost:3000",
      });

      const response = await middleware(request);
      expect(response).toBeDefined();
      expect(response?.status).not.toBe(403);
    });
  });

  describe("Route Guards", () => {
    it("should redirect anonymous guests accessing protected account pages to /auth/login", async () => {
      const request = createMockRequest("/account");
      const response = await middleware(request);
      
      expect(response).toBeDefined();
      expect(response?.status).toBe(307); // Next.js temporary redirect status code
      expect(response?.headers.get("location")).toBe("http://localhost:3000/auth/login");
    });

    it("should allow logged-in users to access protected account pages", async () => {
      const accessToken = await signAccessToken({
        userId: "usr_customer",
        role: "CUSTOMER",
        email: "customer@domain.com",
      });

      const request = createMockRequest("/account", "GET", { accessToken });
      const response = await middleware(request);
      
      expect(response).toBeDefined();
      expect(response?.status).toBe(200); // Pass-through status
    });

    it("should redirect logged-in users attempting to access guest-only auth pages back to /account", async () => {
      const accessToken = await signAccessToken({
        userId: "usr_customer",
        role: "CUSTOMER",
        email: "customer@domain.com",
      });

      const request = createMockRequest("/auth/login", "GET", { accessToken });
      const response = await middleware(request);
      
      expect(response).toBeDefined();
      expect(response?.status).toBe(307);
      expect(response?.headers.get("location")).toBe("http://localhost:3000/account");
    });

    it("should block normal customers trying to view admin pathways", async () => {
      const accessToken = await signAccessToken({
        userId: "usr_customer",
        role: "CUSTOMER",
        email: "customer@domain.com",
      });

      const request = createMockRequest("/admin/products", "GET", { accessToken });
      const response = await middleware(request);
      
      expect(response).toBeDefined();
      expect(response?.status).toBe(307);
      expect(response?.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("should allow verified admins to access administrative routes", async () => {
      const accessToken = await signAccessToken({
        userId: "usr_admin",
        role: "ADMIN",
        email: "admin@domain.com",
      });

      const request = createMockRequest("/admin/products", "GET", { accessToken });
      const response = await middleware(request);
      
      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
    });
  });
});
