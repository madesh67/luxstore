import { CartRepository } from "@/repositories/cart.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { AppError } from "@/lib/error-handler";

const MAX_QUANTITY_PER_ITEM = 10;

export interface CartCalculationResult {
  subtotal: number;
  estimatedTotal: number;
  itemCount: number;
  totalQuantity: number;
}

export const CartService = {
  /**
   * Helper to calculate cart totals
   */
  calculateTotals(items: { product: { price: unknown }; quantity: number }[]): CartCalculationResult {
    let subtotal = 0;
    let totalQuantity = 0;

    for (const item of items) {
      const price = Number(item.product.price);
      subtotal += price * item.quantity;
      totalQuantity += item.quantity;
    }

    return {
      subtotal,
      estimatedTotal: subtotal, // For phase 4, no taxes or shipping are calculated yet
      itemCount: items.length,
      totalQuantity,
    };
  },

  /**
   * Validates product availability: exists, active, and has sufficient stock.
   */
  async validateProductAvailability(productId: string, requestedQuantity: number) {
    const product = await ProductRepository.findById(productId);

    if (!product || product.deletedAt) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    if (!product.active) {
      throw new AppError("This product is currently inactive and cannot be purchased", 400, "PRODUCT_INACTIVE");
    }

    if (!product.inventory || product.inventory.quantity <= 0) {
      throw new AppError("Product is out of stock", 400, "PRODUCT_OUT_OF_STOCK");
    }

    if (requestedQuantity > product.inventory.quantity) {
      throw new AppError(
        `Insufficient inventory. Only ${product.inventory.quantity} units available.`,
        400,
        "INSUFFICIENT_STOCK",
        { availableStock: product.inventory.quantity }
      );
    }

    return product;
  },

  async getCart(userId: string | null, guestToken: string | null) {
    let cart;
    if (userId) {
      cart = await CartRepository.findOrCreateForUser(userId);
    } else if (guestToken) {
      cart = await CartRepository.findOrCreateForGuest(guestToken);
    } else {
      throw new AppError("Authentication or guest token required to fetch cart", 400, "BAD_REQUEST");
    }

    const calculations = this.calculateTotals(cart.items);
    return {
      ...cart,
      ...calculations,
    };
  },

  async addToCart(
    userId: string | null,
    guestToken: string | null,
    productId: string,
    quantity: number
  ) {
    // 1. Validate quantity inputs
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError("Quantity must be a positive integer", 400, "INVALID_QUANTITY");
    }

    if (quantity > MAX_QUANTITY_PER_ITEM) {
      throw new AppError(`Maximum quantity per item is ${MAX_QUANTITY_PER_ITEM}`, 400, "QUANTITY_EXCEEDED");
    }

    // 2. Locate or create Cart container
    let cart;
    if (userId) {
      cart = await CartRepository.findOrCreateForUser(userId);
    } else if (guestToken) {
      cart = await CartRepository.findOrCreateForGuest(guestToken);
    } else {
      throw new AppError("Authentication or guest token required", 400, "BAD_REQUEST");
    }

    // 3. Find if item already exists in the cart
    const existingItem = await CartRepository.findCartItem(cart.id, productId);
    const targetQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (targetQuantity > MAX_QUANTITY_PER_ITEM) {
      throw new AppError(
        `Adding this would exceed the maximum limit of ${MAX_QUANTITY_PER_ITEM} units per item`,
        400,
        "QUANTITY_EXCEEDED"
      );
    }

    // 4. Validate stock/product availability
    await this.validateProductAvailability(productId, targetQuantity);

    // 5. Update database
    if (existingItem) {
      await CartRepository.updateCartItem(existingItem.id, targetQuantity);
    } else {
      await CartRepository.addCartItem(cart.id, productId, quantity);
    }

    // 6. Return fully updated cart
    return this.getCart(userId, guestToken);
  },

  async updateCartItem(
    userId: string | null,
    guestToken: string | null,
    cartItemId: string,
    quantity: number
  ) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError("Quantity must be a positive integer", 400, "INVALID_QUANTITY");
    }

    if (quantity > MAX_QUANTITY_PER_ITEM) {
      throw new AppError(`Maximum quantity per item is ${MAX_QUANTITY_PER_ITEM}`, 400, "QUANTITY_EXCEEDED");
    }

    // 1. Get user/guest cart container
    const cart = await this.getCart(userId, guestToken);
    const itemToUpdate = cart.items.find((item) => item.id === cartItemId);

    if (!itemToUpdate) {
      throw new AppError("Cart item not found in your session", 404, "CART_ITEM_NOT_FOUND");
    }

    // 2. Validate product stock status
    await this.validateProductAvailability(itemToUpdate.productId, quantity);

    // 3. Apply update
    await CartRepository.updateCartItem(cartItemId, quantity);

    return this.getCart(userId, guestToken);
  },

  async removeCartItem(userId: string | null, guestToken: string | null, cartItemId: string) {
    const cart = await this.getCart(userId, guestToken);
    const itemToDelete = cart.items.find((item) => item.id === cartItemId);

    if (!itemToDelete) {
      throw new AppError("Cart item not found in your session", 404, "CART_ITEM_NOT_FOUND");
    }

    await CartRepository.deleteCartItem(cartItemId);
    return this.getCart(userId, guestToken);
  },

  async clearCart(userId: string | null, guestToken: string | null) {
    const cart = await this.getCart(userId, guestToken);
    await CartRepository.clearCart(cart.id);
    return this.getCart(userId, guestToken);
  },

  async mergeGuestCart(userId: string, guestToken: string) {
    await CartRepository.mergeGuestCart(userId, guestToken, MAX_QUANTITY_PER_ITEM);
    return this.getCart(userId, null);
  },
};
