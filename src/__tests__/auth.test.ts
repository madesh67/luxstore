import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { hasPermission, hasRole } from "../lib/permissions";

// Mock environment values for tests
vi.stubEnv("JWT_SECRET", "testsecretkeytestsecretkeytestsecretkey");

describe("Password Security & Hashing", () => {
  it("should securely hash password and verify match", async () => {
    const password = "Password123!";
    const saltRounds = 10;
    
    const hash = await bcrypt.hash(password, saltRounds);
    
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isMatch = await bcrypt.compare(password, hash);
    expect(isMatch).toBe(true);

    const isFailedMatch = await bcrypt.compare("WrongPass123!", hash);
    expect(isFailedMatch).toBe(false);
  });
});

describe("JWT Generation & Signature Validation", () => {
  it("should issue and verify valid short-lived access tokens", async () => {
    const payload = {
      userId: "usr_12345",
      role: "CUSTOMER",
      email: "test@domain.com",
    };

    const token = await signAccessToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.role).toBe(payload.role);
    expect(decoded?.email).toBe(payload.email);
  });

  it("should fail validation on structural token corruption", async () => {
    const corruptedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.signature";
    const decoded = await verifyAccessToken(corruptedToken);
    expect(decoded).toBeNull();
  });

  it("should generate and verify valid long-lived refresh tokens with unique JTIs", async () => {
    const payload = {
      userId: "usr_12345",
      jti: "uuid-jti-token-rotation-identifier",
    };

    const token = await signRefreshToken(payload);
    expect(token).toBeDefined();

    const decoded = await verifyRefreshToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.jti).toBe(payload.jti);
  });
});

describe("Role-Based Access Controls (RBAC)", () => {
  describe("Permission Checks", () => {
    it("should allow Customers to manage own accounts and view own orders", () => {
      expect(hasPermission("CUSTOMER", "MANAGE_OWN_ACCOUNT")).toBe(true);
      expect(hasPermission("CUSTOMER", "VIEW_OWN_ORDERS")).toBe(true);
      expect(hasPermission("CUSTOMER", "MANAGE_PRODUCTS")).toBe(false);
    });

    it("should allow Admins to manage products and orders in addition to user rights", () => {
      expect(hasPermission("ADMIN", "MANAGE_OWN_ACCOUNT")).toBe(true);
      expect(hasPermission("ADMIN", "MANAGE_PRODUCTS")).toBe(true);
      expect(hasPermission("ADMIN", "MANAGE_ORDERS")).toBe(true);
      expect(hasPermission("ADMIN", "FULL_ACCESS")).toBe(false);
    });

    it("should allow SuperAdmins full access to everything in the system", () => {
      expect(hasPermission("SUPERADMIN", "MANAGE_OWN_ACCOUNT")).toBe(true);
      expect(hasPermission("SUPERADMIN", "MANAGE_PRODUCTS")).toBe(true);
      expect(hasPermission("SUPERADMIN", "FULL_ACCESS")).toBe(true);
    });

    it("should deny Guests any permissions", () => {
      expect(hasPermission("GUEST", "MANAGE_OWN_ACCOUNT")).toBe(false);
      expect(hasPermission("GUEST", "VIEW_OWN_ORDERS")).toBe(false);
    });
  });

  describe("Hierarchical Role Weights", () => {
    it("should validate minimum role requirements correctly", () => {
      // CUSTOMER target
      expect(hasRole("CUSTOMER", "CUSTOMER")).toBe(true);
      expect(hasRole("ADMIN", "CUSTOMER")).toBe(true);
      expect(hasRole("SUPERADMIN", "CUSTOMER")).toBe(true);

      // ADMIN target
      expect(hasRole("CUSTOMER", "ADMIN")).toBe(false);
      expect(hasRole("ADMIN", "ADMIN")).toBe(true);
      expect(hasRole("SUPERADMIN", "ADMIN")).toBe(true);

      // SUPERADMIN target
      expect(hasRole("ADMIN", "SUPERADMIN")).toBe(false);
      expect(hasRole("SUPERADMIN", "SUPERADMIN")).toBe(true);
    });
  });
});
