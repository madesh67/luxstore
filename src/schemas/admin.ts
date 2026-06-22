import { z } from "zod";
import { CouponType, ReviewStatus } from "@prisma/client";

// Coupon Validation Schemas
export const adminCouponCreateSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").max(20).toUpperCase(),
  discountType: z.nativeEnum(CouponType),
  value: z.coerce.number().positive("Discount value must be a positive number"),
  minOrderValue: z.coerce.number().nonnegative().optional().nullable(),
  maxDiscount: z.coerce.number().nonnegative().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().optional().nullable().default(1),
  isActive: z.boolean().default(true),
});

export const adminCouponUpdateSchema = adminCouponCreateSchema.partial();

// Inventory Validation Schemas
export const adminInventoryThresholdSchema = z.object({
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
  incoming: z.coerce.number().int().nonnegative().optional(),
});

export const adminInventoryAdjustmentSchema = z.object({
  quantityChange: z.coerce.number().int("Quantity change must be an integer"),
  action: z.enum(["ADJUSTMENT", "RECONCILIATION", "RESERVATION", "DISPATCH"]),
  notes: z.string().max(200).optional(),
});

// Review Moderation Validation Schemas
export const adminReviewStatusSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
});

export const adminReviewFlagSchema = z.object({
  isFlagged: z.boolean(),
});

export const adminReviewBulkStatusSchema = z.object({
  ids: z.array(z.string().cuid()),
  status: z.nativeEnum(ReviewStatus),
});

export const adminReviewBulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()),
});

// Store Settings Validation Schema
export const storeSettingUpdateSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
  group: z.string().min(1, "Group is required"),
});

export const storeSettingsBulkUpdateSchema = z.record(
  z.object({
    value: z.string(),
    group: z.string(),
  })
);

// Banner Validation Schemas
export const adminBannerCreateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  subtitle: z.string().max(200).optional().nullable(),
  imageUrl: z.string().url("Image URL must be a valid URL"),
  linkUrl: z.string().url("Link URL must be a valid URL").optional().nullable().or(z.literal("")),
  position: z.string().default("HERO"),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const adminBannerUpdateSchema = adminBannerCreateSchema.partial();

export const adminBannerSortSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string().cuid(),
      order: z.number().int(),
    })
  ),
});
