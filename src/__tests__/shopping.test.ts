import { describe, it, expect, vi, beforeEach } from "vitest";
import { CartRepository } from "../repositories/cart.repository";
import { CartService } from "../services/cart.service";
import { WishlistService } from "../services/wishlist.service";
import { Product, Cart, Wishlist, WishlistItem } from "@prisma/client";

// 1. Mock the prisma client database
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    cartItem: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    wishlist: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    wishlistItem: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../lib/prisma";

describe("Shopping Experience Foundation - Cart & Wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Cart Totals Calculations", () => {
    it("should compute subtotal and quantities correctly", () => {
      const items = [
        {
          id: "item1",
          quantity: 2,
          product: { price: 5000 },
        },
        {
          id: "item2",
          quantity: 3,
          product: { price: 2000 },
        },
      ];

      // Cast item array as unknown then structurally type it for calculation
      const result = CartService.calculateTotals(items as unknown as { product: { price: unknown }; quantity: number }[]);

      expect(result.subtotal).toBe(16000); // (5000 * 2) + (2000 * 3) = 16000
      expect(result.totalQuantity).toBe(5);
      expect(result.itemCount).toBe(2);
      expect(result.estimatedTotal).toBe(16000);
    });

    it("should handle empty cart totals", () => {
      const result = CartService.calculateTotals([]);
      expect(result.subtotal).toBe(0);
      expect(result.totalQuantity).toBe(0);
      expect(result.itemCount).toBe(0);
    });
  });

  describe("Cart Item Quantity & Stock Validations", () => {
    it("should reject quantities that are negative or zero", async () => {
      await expect(
        CartService.addToCart("user1", null, "prod1", 0)
      ).rejects.toThrow("Quantity must be a positive integer");

      await expect(
        CartService.addToCart("user1", null, "prod1", -2)
      ).rejects.toThrow("Quantity must be a positive integer");
    });

    it("should reject quantities exceeding the maximum per-item limit", async () => {
      await expect(
        CartService.addToCart("user1", null, "prod1", 11)
      ).rejects.toThrow("Maximum quantity per item is 10");
    });

    it("should throw error if product is inactive or out of stock", async () => {
      // Mock ProductRepository to return inactive product
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod1",
        name: "Sunglasses",
        active: false,
        deletedAt: null,
      } as unknown as Product);

      await expect(
        CartService.validateProductAvailability("prod1", 1)
      ).rejects.toThrow("This product is currently inactive and cannot be purchased");
    });

    it("should throw error if stock is insufficient", async () => {
      // Mock ProductRepository to return product with quantity = 2
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod1",
        name: "Wallet",
        active: true,
        deletedAt: null,
        inventory: { quantity: 2 },
      } as unknown as Product);

      await expect(
        CartService.validateProductAvailability("prod1", 5)
      ).rejects.toThrow("Insufficient inventory. Only 2 units available.");
    });
  });

  describe("Guest to Authenticated Cart Merging Strategy", () => {
    it("should combine quantities of overlapping items up to limits and delete guest cart", async () => {
      const mockUserCart = {
        id: "cart_user",
        userId: "user1",
        items: [
          { id: "u_item1", productId: "prod1", quantity: 3 },
          { id: "u_item2", productId: "prod2", quantity: 5 },
        ],
      };

      const mockGuestCart = {
        id: "cart_guest",
        guestToken: "guest123",
        items: [
          { id: "g_item1", productId: "prod1", quantity: 2 }, // overlaps: 3 + 2 = 5
          { id: "g_item3", productId: "prod3", quantity: 4 }, // new addition
        ],
      };

      vi.mocked(prisma.cart.findUnique)
        .mockResolvedValueOnce(mockUserCart as unknown as Cart) // first call inside merge finds user cart
        .mockResolvedValueOnce(mockGuestCart as unknown as Cart); // second finds guest cart

      const txMock = {
        cart: {
          findUnique: vi.fn()
            .mockResolvedValueOnce(mockUserCart as unknown as Cart)
            .mockResolvedValueOnce(mockGuestCart as unknown as Cart)
            .mockResolvedValueOnce({
              id: "cart_user",
              items: [],
            } as unknown as Cart), // final retrieval
          create: vi.fn(),
          delete: vi.fn(),
        },
        cartItem: {
          update: vi.fn(),
          create: vi.fn(),
          deleteMany: vi.fn(),
        },
      };

      // Mock transaction execution
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (cb) => {
        const transactionCallback = cb as any;
        return transactionCallback(txMock);
      });

      await CartRepository.mergeGuestCart("user1", "guest123", 10);

      // Verify overlap combined
      expect(txMock.cartItem.update).toHaveBeenCalledWith({
        where: { id: "u_item1" },
        data: { quantity: 5 }, // 3 + 2
      });

      // Verify new item added
      expect(txMock.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: "cart_user",
          productId: "prod3",
          quantity: 4,
        },
      });

      // Verify guest cart deleted
      expect(txMock.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: "cart_guest" },
      });
      expect(txMock.cart.delete).toHaveBeenCalledWith({
        where: { id: "cart_guest" },
      });
    });
  });

  describe("Wishlist Duplicates Prevention", () => {
    it("should reject adding products that already exist in the wishlist", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod1",
        active: true,
        deletedAt: null,
      } as unknown as Product);

      vi.mocked(prisma.wishlist.findUnique).mockResolvedValue({
        id: "wish1",
        items: [{ productId: "prod1" }],
      } as unknown as Wishlist);

      vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
        id: "w_item1",
        wishlistId: "wish1",
        productId: "prod1",
      } as unknown as WishlistItem);

      await expect(
        WishlistService.addToWishlist("user1", "prod1")
      ).rejects.toThrow("Product is already in your wishlist");
    });
  });
});
