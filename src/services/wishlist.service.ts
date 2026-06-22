import { WishlistRepository } from "@/repositories/wishlist.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { CartService } from "./cart.service";
import { AppError } from "@/lib/error-handler";

export const WishlistService = {
  async getWishlist(userId: string) {
    if (!userId) {
      throw new AppError("Authentication required to access wishlist", 401, "UNAUTHORIZED");
    }
    return WishlistRepository.findOrCreate(userId);
  },

  async addToWishlist(userId: string, productId: string) {
    if (!userId) {
      throw new AppError("Authentication required to add items to wishlist", 401, "UNAUTHORIZED");
    }

    // 1. Validate product exists and is active
    const product = await ProductRepository.findById(productId);
    if (!product || product.deletedAt) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    if (!product.active) {
      throw new AppError("Inactive products cannot be saved to wishlist", 400, "PRODUCT_INACTIVE");
    }

    // 2. Fetch or create wishlist container
    const wishlist = await WishlistRepository.findOrCreate(userId);

    // 3. Prevent duplicate entries
    const existingItem = await WishlistRepository.findWishlistItem(wishlist.id, productId);
    if (existingItem) {
      throw new AppError("Product is already in your wishlist", 400, "DUPLICATE_WISHLIST_ITEM");
    }

    // 4. Add item to database
    await WishlistRepository.addWishlistItem(wishlist.id, productId);
    return this.getWishlist(userId);
  },

  async removeFromWishlist(userId: string, wishlistItemId: string) {
    const wishlist = await this.getWishlist(userId);
    const itemToDelete = wishlist.items.find((item) => item.id === wishlistItemId);

    if (!itemToDelete) {
      throw new AppError("Wishlist item not found in your collection", 404, "WISHLIST_ITEM_NOT_FOUND");
    }

    await WishlistRepository.deleteWishlistItem(wishlistItemId);
    return this.getWishlist(userId);
  },

  async moveToCart(userId: string, guestToken: string | null, wishlistItemId: string) {
    const wishlist = await this.getWishlist(userId);
    const wishlistItem = wishlist.items.find((item) => item.id === wishlistItemId);

    if (!wishlistItem) {
      throw new AppError("Wishlist item not found in your collection", 404, "WISHLIST_ITEM_NOT_FOUND");
    }

    // 1. Add to shopping cart (handles quantity bounds, active, and stock validation)
    await CartService.addToCart(userId, guestToken, wishlistItem.productId, 1);

    // 2. Remove from wishlist
    await WishlistRepository.deleteWishlistItem(wishlistItemId);

    // 3. Return updated wishlist
    return this.getWishlist(userId);
  },
};
