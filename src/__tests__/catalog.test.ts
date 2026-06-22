import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductRepository } from "../repositories/product.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { ProductService } from "../services/product.service";
import { verifyAdmin } from "../lib/auth-guards";
import { signAccessToken } from "../lib/jwt";
import { NextRequest } from "next/server";

// 1. Mock the prisma database client
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    brand: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../lib/prisma";

describe("Catalog Repository Tier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should format search parameters into valid Prisma query options", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    const filters = {
      search: "watch",
      category: "timepieces",
      minPrice: 5000,
      maxPrice: 20000,
      page: 1,
      limit: 12,
      sortBy: "featured" as const,
    };

    await ProductRepository.findManyAndCount(filters);

    expect(prisma.product.findMany).toHaveBeenCalled();
    const findArgs = vi.mocked(prisma.product.findMany).mock.calls[0][0];
    
    // Check filter structures
    expect(findArgs?.where?.deletedAt).toBeNull();
    expect(findArgs?.where?.active).toBe(true);
    expect(findArgs?.where?.category).toEqual({ slug: "timepieces", active: true, deletedAt: null });
    expect(findArgs?.where?.price).toEqual({ gte: 5000, lte: 20000 });
    
    // Check OR search query structure
    expect(findArgs?.where?.OR).toContainEqual({
      name: { contains: "watch", mode: "insensitive" },
    });
  });

  it("should request categories filtering out soft-deleted items by default", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([]);

    await CategoryRepository.findMany(true);

    expect(prisma.category.findMany).toHaveBeenCalled();
    const catArgs = vi.mocked(prisma.category.findMany).mock.calls[0][0];
    expect(catArgs?.where?.deletedAt).toBeNull();
    expect(catArgs?.where?.active).toBe(true);
  });
});

describe("Catalog Service Tier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch products and calculate total page counts correctly", async () => {
    // Return mock data list of 2 products and total of 25 matching
    const mockProducts = [{ id: "p1", name: "Watch" }, { id: "p2", name: "Wallet" }];
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as unknown as import("@prisma/client").Product[]);
    vi.mocked(prisma.product.count).mockResolvedValue(25);

    const result = await ProductService.getProducts({ page: 2, limit: 10, sortBy: "newest" });
    
    expect(result.products).toHaveLength(2);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.pages).toBe(3); // 25 total / 10 limit = 3 pages
    expect(result.pagination.page).toBe(2);
  });

  it("should throw a 404 error if requesting a non-existent product slug", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

    await expect(ProductService.getProductDetails("missing-item")).rejects.toThrow(
      "Product with slug \"missing-item\" not found"
    );
  });
});

describe("Admin Resource Guards (RBAC)", () => {
  vi.stubEnv("JWT_SECRET", "testsecretkeytestsecretkeytestsecretkey");

  it("should permit Admin or SuperAdmin access tokens through guards", async () => {
    const adminToken = await signAccessToken({
      userId: "usr_admin",
      role: "ADMIN",
      email: "admin@luxstore.com",
    });

    const mockRequest = new NextRequest("http://localhost:3000/api/admin/products", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const payload = await verifyAdmin(mockRequest);
    expect(payload.role).toBe("ADMIN");
  });

  it("should reject standard Customer access tokens on admin guards with 403", async () => {
    const customerToken = await signAccessToken({
      userId: "usr_customer",
      role: "CUSTOMER",
      email: "cust@luxstore.com",
    });

    const mockRequest = new NextRequest("http://localhost:3000/api/admin/products", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    await expect(verifyAdmin(mockRequest)).rejects.toThrow(
      "Forbidden. Administrator access required."
    );
  });
});
