import { AdminCouponRepository, CouponQueryParams } from "@/repositories/admin-coupon.repository";
import { CouponType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const AdminCouponService = {
  async getCoupons(params: CouponQueryParams) {
    return AdminCouponRepository.findMany(params);
  },

  async getCouponById(id: string) {
    return AdminCouponRepository.findById(id);
  },

  async getCouponByCode(code: string) {
    return AdminCouponRepository.findByCode(code);
  },

  async createCoupon(
    data: {
      code: string;
      discountType: CouponType;
      value: number;
      minOrderValue?: number | null;
      maxDiscount?: number | null;
      startDate: Date;
      endDate: Date;
      usageLimit?: number | null;
      perUserLimit?: number | null;
      isActive?: boolean;
    },
    userId: string
  ) {
    const existing = await AdminCouponRepository.findByCode(data.code);
    if (existing) {
      throw new Error(`Coupon with code "${data.code.toUpperCase()}" already exists`);
    }

    const coupon = await AdminCouponRepository.create(data);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "COUPON_CREATE",
        details: `Created coupon code: "${coupon.code}" (Value: ${coupon.value}, Type: ${coupon.discountType})`,
      },
    });

    return coupon;
  },

  async updateCoupon(
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
    },
    userId: string
  ) {
    if (data.code) {
      const existing = await AdminCouponRepository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new Error(`Coupon with code "${data.code.toUpperCase()}" already exists`);
      }
    }

    const coupon = await AdminCouponRepository.update(id, data);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "COUPON_UPDATE",
        details: `Updated coupon (ID: ${id}). Fields: ${Object.keys(data).join(", ")}`,
      },
    });

    return coupon;
  },

  async deleteCoupon(id: string, userId: string) {
    const coupon = await AdminCouponRepository.delete(id);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "COUPON_DELETE",
        details: `Deleted coupon: "${coupon.code}" (ID: ${id})`,
      },
    });

    return coupon;
  },

  /**
   * Validate a coupon code for a given checkout state.
   */
  async validateCoupon(code: string, userId: string, cartSubtotal: number) {
    const coupon = await AdminCouponRepository.findByCode(code);

    if (!coupon) {
      return { isValid: false, message: "Invalid coupon code." };
    }

    if (!coupon.isActive) {
      return { isValid: false, message: "This coupon is inactive." };
    }

    const now = new Date();
    if (now < coupon.startDate) {
      return { isValid: false, message: "This coupon promotion hasn't started yet." };
    }

    if (now > coupon.endDate) {
      return { isValid: false, message: "This coupon has expired." };
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { isValid: false, message: "This coupon redemption limit has been reached." };
    }

    if (coupon.minOrderValue !== null) {
      const minVal = Number(coupon.minOrderValue.toString());
      if (cartSubtotal < minVal) {
        return {
          isValid: false,
          message: `Minimum order value of INR ${minVal.toFixed(2)} is required to use this coupon.`,
        };
      }
    }

    // Check user limits
    if (coupon.perUserLimit !== null) {
      const userUsage = await AdminCouponRepository.getUserUsageCount(coupon.id, userId);
      if (userUsage >= coupon.perUserLimit) {
        return { isValid: false, message: "You have reached your usage limit for this coupon." };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    const value = Number(coupon.value.toString());

    if (coupon.discountType === CouponType.PERCENTAGE) {
      discountAmount = (cartSubtotal * value) / 100;
      if (coupon.maxDiscount !== null) {
        const maxDisc = Number(coupon.maxDiscount.toString());
        if (discountAmount > maxDisc) {
          discountAmount = maxDisc;
        }
      }
    } else if (coupon.discountType === CouponType.FIXED_AMOUNT) {
      discountAmount = Math.min(cartSubtotal, value);
    } else if (coupon.discountType === CouponType.FREE_SHIPPING) {
      // Handled separately during shipping application, but valid here
      discountAmount = 0; 
    }

    return {
      isValid: true,
      coupon,
      discountAmount,
      message: "Coupon applied successfully.",
    };
  },

  /**
   * Log coupon usage.
   */
  async trackUsage(couponId: string, userId: string, orderId: string) {
    return AdminCouponRepository.trackUsage(couponId, userId, orderId);
  },
};
