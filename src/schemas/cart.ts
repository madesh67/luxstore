import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

export const addToWishlistSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
});

export const moveToCartSchema = z.object({
  wishlistItemId: z.string().cuid("Invalid wishlist item ID"),
});
