import { z } from "zod";

// Catalog Filter & Search Schema
export const catalogFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(), // Category slug
  brand: z.string().optional(),    // Brand slug
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z
    .string()
    .transform((val) => val === "true")
    .or(z.boolean())
    .optional(),
  inStock: z
    .string()
    .transform((val) => val === "true")
    .or(z.boolean())
    .optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  sortBy: z
    .enum(["newest", "price_asc", "price_desc", "highest_rated", "featured"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export type CatalogFilterInput = z.infer<typeof catalogFilterSchema>;

// Admin Product Create Schema
export const adminProductCreateSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(100),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  description: z.string().min(20, "Detailed description must be at least 20 characters"),
  sku: z.string().min(3, "SKU must be at least 3 characters").max(30),
  categoryId: z.string().cuid("Invalid category ID").optional().nullable(),
  brandId: z.string().cuid("Invalid brand ID").optional().nullable(),
  price: z.coerce.number().positive("Price must be a positive number"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  images: z
    .array(
      z.object({
        imageUrl: z.string().url("Image URL must be valid"),
        altText: z.string().optional(),
        displayOrder: z.number().int().default(0),
      })
    )
    .min(1, "At least one product image is required"),
});

export type AdminProductCreateInput = z.infer<typeof adminProductCreateSchema>;

// Admin Category Create Schema
export const adminCategoryCreateSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(50),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(50),
  description: z.string().optional(),
  image: z.string().url("Category image URL must be valid").optional().nullable(),
  active: z.boolean().default(true),
  parentId: z.string().cuid().optional().nullable(),
});

export type AdminCategoryCreateInput = z.infer<typeof adminCategoryCreateSchema>;

// Admin Brand Create Schema
export const adminBrandCreateSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").max(50),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(50),
  logo: z.string().url("Brand logo URL must be valid").optional().nullable(),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export type AdminBrandCreateInput = z.infer<typeof adminBrandCreateSchema>;
