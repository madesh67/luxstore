/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddressService } from "../services/address.service";
import { ShippingService } from "../services/shipping.service";
import { TaxService } from "../services/tax.service";
import { CheckoutService } from "../services/checkout.service";
import { prisma } from "../lib/prisma";
import Stripe from "stripe";

// 1. Mock Prisma
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    address: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    shippingMethod: {
      count: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    checkoutSession: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    paymentTransaction: {
      create: vi.fn(),
    },
    inventory: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// 2. Mock Stripe
vi.mock("stripe", () => {
  const mockPaymentIntents = {
    create: vi.fn().mockResolvedValue({ id: "pi_123", client_secret: "secret_123" }),
    update: vi.fn().mockResolvedValue({ id: "pi_123", client_secret: "secret_123" }),
  };
  const mockWebhooks = {
    constructEvent: vi.fn().mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    }),
  };

  return {
    default: class MockStripe {
      paymentIntents = mockPaymentIntents;
      static webhooks = mockWebhooks;
      webhooks = mockWebhooks;
    },
  };
});

// Mock Resend Email integration
vi.mock("../lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true),
}));

describe("Checkout, Payments & Order Creation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Address CRUD & Default Toggle Rules", () => {
    it("should create address and clear other defaults if set to true", async () => {
      vi.mocked(prisma.address.count).mockResolvedValue(2);
      (prisma.address.create as any).mockImplementation(async (args: any) => ({
        id: "addr_123",
        ...args.data,
      }));

      const addressInput = {
        firstName: "Jane",
        lastName: "Doe",
        phoneNumber: "9876543210",
        email: "jane@gmail.com",
        addressLine1: "Flat 101, Luxury Apts",
        addressLine2: "Main Road",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
        addressType: "HOME" as const,
        isDefault: true,
      };

      const result = await AddressService.createAddress("user_1", addressInput);

      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: "user_1", isDefault: true },
        data: { isDefault: false },
      });
      expect(result.fullName).toBe("Jane Doe");
      expect(result.isDefault).toBe(true);
    });

    it("should set specific address as default and clear previous defaults", async () => {
      vi.mocked(prisma.address.findFirst).mockResolvedValue({
        id: "addr_123",
        userId: "user_1",
        isDefault: false,
      } as any);

      await AddressService.setDefaultAddress("addr_123", "user_1");

      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: "user_1", isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: "addr_123" },
        data: { isDefault: true },
      });
    });
  });

  describe("Shipping Calculation Rules", () => {
    beforeEach(() => {
      const mockMethods = [
        { id: "s1", name: "Standard", slug: "standard", baseCost: 150.00, estimatedDays: "3-5 days", isActive: true },
        { id: "s2", name: "Express", slug: "express", baseCost: 350.00, estimatedDays: "1-2 days", isActive: true },
      ];
      vi.mocked(prisma.shippingMethod.count).mockResolvedValue(2);
      vi.mocked(prisma.shippingMethod.findMany).mockResolvedValue(mockMethods as any);
    });

    it("should offer free standard shipping on orders over ₹10,000", async () => {
      const cost = await ShippingService.calculateCost(12000, "standard", "Maharashtra", "India");
      expect(cost).toBe(0);
    });

    it("should add remote location surcharges within India", async () => {
      const cost = await ShippingService.calculateCost(5000, "standard", "Jammu and Kashmir", "India");
      expect(cost).toBe(350); // 150 base + 200 surcharge
    });

    it("should add international surcharge for other countries", async () => {
      const cost = await ShippingService.calculateCost(5000, "express", "California", "USA");
      expect(cost).toBe(1850); // 350 base + 1500 international
    });
  });

  describe("Tax Calculation Rules", () => {
    it("should apply 18% standard GST rate in India", async () => {
      const tax = await TaxService.calculateTax(1000, "Maharashtra", "India");
      expect(tax).toBe(180);
    });

    it("should apply specific state sales tax rates in US", async () => {
      const taxCA = await TaxService.calculateTax(1000, "CA", "USA");
      expect(taxCA).toBe(82.5); // 8.25%

      const taxNY = await TaxService.calculateTax(1000, "New York", "USA");
      expect(taxNY).toBe(88.75); // 8.875%
    });
  });

  describe("Checkout Session Lifecycle & Order Workflows", () => {
    it("should fail validation if address or shipping is missing before payment intent", async () => {
      vi.mocked(prisma.checkoutSession.findUnique).mockResolvedValue({
        id: "sess_123",
        userId: "user_1",
        subtotal: 5000,
        addressSnapshot: null, // missing
        expiresAt: new Date(Date.now() + 100000),
      } as any);

      await expect(
        CheckoutService.createPaymentIntent("sess_123", "user_1", null)
      ).rejects.toThrow("Shipping address is missing");
    });
  });

  describe("Order Transaction Idempotency Rules", () => {
    it("should skip recreation and return order details if order already exists for paymentIntentId", async () => {
      const mockOrder = {
        id: "order_123",
        orderNumber: "LUX-12345",
        paymentIntentId: "pi_success",
        total: 5400,
      };
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

      const result = await CheckoutService.handlePaymentSuccess("pi_success");

      expect(prisma.order.create).not.toHaveBeenCalled();
      expect(result.id).toBe("order_123");
    });

    it("should place order, reduce inventory, log payment, and clear cart in one database transaction", async () => {
      const sessionSnapshot = {
        id: "sess_123",
        userId: "user_1",
        email: "buyer@luxstore.in",
        cartSnapshot: [
          { productId: "prod_1", quantity: 2, price: 2000, name: "Premium Watch", sku: "SKU-WATCH" },
        ],
        addressSnapshot: {
          firstName: "Jane",
          lastName: "Doe",
          addressLine1: "Apt 2B",
          city: "Delhi",
          state: "Delhi",
          postalCode: "110001",
          country: "India",
        },
        shippingMethodId: "standard_id",
        subtotal: 4000,
        shippingCost: 0,
        taxCost: 720,
        total: 4720,
        stripePaymentIntentId: "pi_success",
        paymentStatus: "PENDING",
      };

      vi.mocked(prisma.order.findFirst).mockResolvedValue(null); // first lookup returns null (no dupes)
      vi.mocked(prisma.checkoutSession.findUnique).mockResolvedValue(sessionSnapshot as any);
      vi.mocked(prisma.inventory.findUnique).mockResolvedValue({ productId: "prod_1", quantity: 15 } as any);
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({ id: "cart_123" } as any);

      (prisma.order.create as any).mockImplementation(async (args: any) => ({
        id: "order_new",
        ...args.data,
        items: [],
      }));

      const order = await CheckoutService.handlePaymentSuccess("pi_success");

      // Verify stock decrement inside transaction
      expect(prisma.inventory.update).toHaveBeenCalledWith({
        where: { productId: "prod_1" },
        data: { quantity: { decrement: 2 } },
      });

      // Verify order creation
      expect(prisma.order.create).toHaveBeenCalled();
      expect(prisma.orderItem.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          productId: "prod_1",
          productName: "Premium Watch",
          productSku: "SKU-WATCH",
          quantity: 2,
        }),
      }));

      // Verify cart clearance
      expect(prisma.cart.findUnique).toHaveBeenCalled();
      expect(prisma.cartItem.deleteMany).toHaveBeenCalled();
      expect(order.id).toBe("order_new");
    });
  });
});
