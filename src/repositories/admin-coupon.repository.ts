import { prisma } from "@/lib/prisma";
import { CouponType, Prisma } from "@prisma/client";

export interface CouponQueryParams {
  page: number;
  limit: number;
  search?: string;
  activeOnly?: boolean;
}

export const AdminCouponRepository = {
  /**
   * Find paginated list of all coupons.
   */
  async findMany(params: CouponQueryParams) {
    const { page, limit, search, activeOnly = false } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {
      deletedAt: null,
      ...(activeOnly ? { isActive: true } : {}),
      ...(search
        ? {
            code: { contains: search, mode: "insensitive" },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.coupon.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Find a specific coupon by ID.
   */
  async findById(id: string) {
    return prisma.coupon.findFirst({
      where: { id, deletedAt: null },
    });
  },

  /**
   * Find a coupon by code (for checkout validation).
   */
  async findByCode(code: string) {
    return prisma.coupon.findFirst({
      where: {
        code: { equals: code, mode: "insensitive" },
        deletedAt: null,
      },
    });
  },

  /**
   * Create a new coupon in the store.
   */
  async create(data: {
    code: string;
    discountType: CouponType;
    value: number | Prisma.Decimal | string;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    startDate: Date;
    endDate: Date;
    usageLimit?: number | null;
    perUserLimit?: number | null;
    isActive?: boolean;
  }) {
    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        value: data.value,
        minOrderValue: data.minOrderValue,
        maxDiscount: data.maxDiscount,
        startDate: data.startDate,
        endDate: data.endDate,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit || 1,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  },

  /**
   * Update an existing coupon.
   */
  async update(
    id: string,
    data: {
      code?: string;
      discountType?: CouponType;
      value?: number;
      minOrderValue?: number | null;
      maxDiscount?: number | null;
      startDate?: Date;
      endDate?: Date;
      usageLimit?: number | null;
      perUserLimit?: number | null;
      isActive?: boolean;
    }
  ) {
    return prisma.coupon.update({
      where: { id },
      data: {
        code: data.code ? data.code.toUpperCase() : undefined,
        discountType: data.discountType,
        value: data.value,
        minOrderValue: data.minOrderValue,
        maxDiscount: data.maxDiscount,
        startDate: data.startDate,
        endDate: data.endDate,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        isActive: data.isActive,
      },
    });
  },

  /**
   * Soft delete a coupon.
   */
  async delete(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  /**
   * Track usage of a coupon by logging user redemptions.
   */
  async trackUsage(couponId: string, userId: string, orderId: string) {
    return prisma.$transaction(async (tx) => {
      // Create redemption audit log
      const usage = await tx.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId,
        },
      });

      // Increment Coupon usageCount counter
      await tx.coupon.update({
        where: { id: couponId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      return usage;
    });
  },

  /**
   * Get the number of times a user has used a specific coupon.
   */
  async getUserUsageCount(couponId: string, userId: string): Promise<number> {
    return prisma.couponUsage.count({
      where: {
        couponId,
        userId,
      },
    });
  },
};
