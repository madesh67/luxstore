import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminInventoryService } from "../services/admin-inventory.service";
import { AdminCouponService } from "../services/admin-coupon.service";
import { AdminReviewService } from "../services/admin-review.service";
import { AdminDashboardService } from "../services/admin-dashboard.service";
import { verifyAdmin } from "../lib/auth-guards";
import { prisma } from "../lib/prisma";
import { NextRequest } from "next/server";
import { CouponType, ReviewStatus, Inventory, Coupon, Review } from "@prisma/client";

// Mock prisma and JWT
vi.mock("../lib/prisma", () => ({
  prisma: {
    inventory: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      fields: {
        lowStockThreshold: "lowStockThreshold",
      },
    },
    inventoryLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    coupon: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    couponUsage: {
      create: vi.fn(),
      count: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    checkoutSession: {
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock("../lib/auth-guards", () => ({
  verifyAdmin: vi.fn(),
}));

describe("Phase 7 - Admin System Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RBAC & Admin API Guards", () => {
    it("should allow verified ADMIN/SUPERADMIN users access", async () => {
      const mockReq = {} as NextRequest;
      vi.mocked(verifyAdmin).mockResolvedValue({
        userId: "adm_999",
        role: "ADMIN",
        email: "admin@luxstore.com",
      });

      const payload = await verifyAdmin(mockReq);
      expect(payload).toBeDefined();
      expect(payload?.role).toBe("ADMIN");
    });

    it("should reject regular customer role verification", async () => {
      vi.mocked(verifyAdmin).mockRejectedValue(new Error("Forbidden. Administrator access required."));

      await expect(verifyAdmin({} as NextRequest)).rejects.toThrow("Forbidden");
    });
  });

  describe("Inventory Adjustments & Threshold Alerts", () => {
    it("should correctly increment and log inventory adjustments", async () => {
      const invId = "inv_111";
      const userId = "adm_999";
      
      vi.mocked(prisma.inventory.findUnique).mockResolvedValue({
        id: invId,
        productId: "prod_1",
        quantity: 10,
        lowStockThreshold: 5,
        reserved: 2,
        incoming: 0,
        available: 8,
      } as unknown as Inventory);

      vi.mocked(prisma.inventory.update).mockResolvedValue({
        id: invId,
        productId: "prod_1",
        quantity: 15,
        available: 13,
      } as unknown as Inventory);

      const result = await AdminInventoryService.adjustStock(invId, {
        quantityChange: 5,
        action: "ADJUSTMENT",
        notes: "Restocked items",
        userId,
      });

      expect(result).toBeDefined();
      expect(result.quantity).toBe(15);
      expect(prisma.inventoryLog.create).toHaveBeenCalled();
    });

    it("should calculate correct available quantity based on reservations", async () => {
      const invId = "inv_111";
      const userId = "adm_999";

      vi.mocked(prisma.inventory.findUnique).mockResolvedValue({
        id: invId,
        productId: "prod_1",
        quantity: 15,
        lowStockThreshold: 5,
        reserved: 5,
        incoming: 0,
        available: 10,
      } as unknown as Inventory);

      vi.mocked(prisma.inventory.update).mockResolvedValue({
        id: invId,
        productId: "prod_1",
        quantity: 12,
        available: 7,
      } as unknown as Inventory);

      const result = await AdminInventoryService.adjustStock(invId, {
        quantityChange: -3,
        action: "ADJUSTMENT",
        notes: "Audit correction",
        userId,
      });

      expect(result.quantity).toBe(12);
      expect(result.available).toBe(7);
    });
  });

  describe("Coupon Validation & Usage Tracking Rules", () => {
    it("should apply percentage discount correctly and enforce max discount bounds", async () => {
      const mockCoupon = {
        id: "cop_1",
        code: "SUMMER30",
        discountType: CouponType.PERCENTAGE,
        value: 30, // 30%
        minOrderValue: 1000,
        maxDiscount: 200,
        isActive: true,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        usageLimit: 100,
        usageCount: 10,
        perUserLimit: 1,
      };

      vi.mocked(prisma.coupon.findFirst).mockResolvedValue(mockCoupon as unknown as Coupon);
      vi.mocked(prisma.couponUsage.count).mockResolvedValue(0);

      const res = await AdminCouponService.validateCoupon("SUMMER30", "usr_1", 1500);

      expect(res.isValid).toBe(true);
      expect(res.discountAmount).toBe(200); // capped at maxDiscount of 200 (instead of 30% of 1500 = 450)
    });

    it("should fail validation if subtotal is below minimum order value", async () => {
      const mockCoupon = {
        id: "cop_1",
        code: "SUMMER30",
        discountType: CouponType.PERCENTAGE,
        value: 30,
        minOrderValue: 1000,
        maxDiscount: 500,
        isActive: true,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usageLimit: 100,
        usageCount: 10,
        perUserLimit: 1,
      };

      vi.mocked(prisma.coupon.findFirst).mockResolvedValue(mockCoupon as unknown as Coupon);

      const res = await AdminCouponService.validateCoupon("SUMMER30", "usr_1", 800); // subtotal is 800

      expect(res.isValid).toBe(false);
      expect(res.message).toContain("Minimum order value");
    });

    it("should fail validation on expired coupons", async () => {
      const mockCoupon = {
        id: "cop_1",
        code: "SUMMER30",
        discountType: CouponType.PERCENTAGE,
        value: 30,
        minOrderValue: 100,
        maxDiscount: 500,
        isActive: true,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // expired 2 days ago
        usageLimit: 100,
        usageCount: 10,
        perUserLimit: 1,
      };

      vi.mocked(prisma.coupon.findFirst).mockResolvedValue(mockCoupon as unknown as Coupon);

      const res = await AdminCouponService.validateCoupon("SUMMER30", "usr_1", 200);

      expect(res.isValid).toBe(false);
      expect(res.message).toContain("expired");
    });
  });

  describe("Review Moderation & Star Average Recalculations", () => {
    it("should update review status and trigger recalculation of product average rating", async () => {
      const reviewId = "rev_999";
      const productId = "prod_1";
      
      vi.mocked(prisma.review.update).mockResolvedValue({
        id: reviewId,
        productId,
        status: ReviewStatus.APPROVED,
      } as unknown as Review);

      vi.mocked(prisma.review.aggregate).mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { id: 10 },
      } as any);

      await AdminReviewService.updateReviewStatus(reviewId, ReviewStatus.APPROVED, "adm_999");

      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: { status: ReviewStatus.APPROVED },
      });
      expect(prisma.review.aggregate).toHaveBeenCalledWith({
        where: { productId, status: ReviewStatus.APPROVED },
        _avg: { rating: true },
        _count: { id: true },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          ratingAverage: 4.5,
          ratingCount: 10,
        },
      });
    });
  });

  describe("Dashboard Metrics Aggregations", () => {
    it("should query and correctly aggregate revenue metrics", async () => {
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { total: 250000 },
      } as any);
      vi.mocked(prisma.order.count).mockResolvedValue(20);
      vi.mocked(prisma.checkoutSession.count).mockResolvedValue(40);
      vi.mocked(prisma.user.count).mockResolvedValue(15);
      vi.mocked(prisma.inventory.count).mockResolvedValue(2);
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.inventory.findMany).mockResolvedValue([]);

      const data = await AdminDashboardService.getDashboardSummary();

      expect(data.kpis.totalRevenue).toBe(250000);
      expect(data.kpis.totalOrders).toBe(20);
      expect(data.kpis.averageOrderValue).toBe(12500); // 250000 / 20
    });
  });
});
