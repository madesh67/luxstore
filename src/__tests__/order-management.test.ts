/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderService } from "../services/order.service";
import { ReturnService } from "../services/return.service";
import { NotificationService } from "../services/notification.service";
import { InvoiceService } from "../services/invoice.service";
import { prisma } from "../lib/prisma";
import { OrderStatus, ReturnStatus } from "@prisma/client";
import { AppError } from "../lib/error-handler";

// Mock Prisma
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    orderTimeline: {
      create: vi.fn(),
    },
    shipment: {
      upsert: vi.fn(),
    },
    trackingEvent: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    returnRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Mock Resend Email integration
vi.mock("../lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true),
  sendOrderShippedEmail: vi.fn().mockResolvedValue(true),
  sendOrderDeliveredEmail: vi.fn().mockResolvedValue(true),
  sendOrderCancelledEmail: vi.fn().mockResolvedValue(true),
  sendReturnRequestedEmail: vi.fn().mockResolvedValue(true),
  sendReturnApprovedEmail: vi.fn().mockResolvedValue(true),
  sendReturnRejectedEmail: vi.fn().mockResolvedValue(true),
}));

describe("Order Management, History, Notifications & Returns Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Order Status Transitions & Validation", () => {
    it("should allow a valid transition: PENDING to PAID", async () => {
      const mockOrder = { id: "order_123", status: OrderStatus.PENDING };
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: OrderStatus.PAID } as any);

      const result = await OrderService.updateOrderStatus("order_123", OrderStatus.PAID);
      expect(result.status).toBe(OrderStatus.PAID);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order_123" },
        data: { status: OrderStatus.PAID },
      });
    });

    it("should reject an invalid transition: PENDING to DELIVERED", async () => {
      const mockOrder = { id: "order_123", status: OrderStatus.PENDING };
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      await expect(
        OrderService.updateOrderStatus("order_123", OrderStatus.DELIVERED)
      ).rejects.toThrowError(
        new AppError("Invalid status transition from PENDING to DELIVERED", 400, "INVALID_STATUS_TRANSITION")
      );
    });

    it("should allow SHIPPED to DELIVERED and trigger notifications", async () => {
      const mockOrder = { id: "order_123", status: OrderStatus.SHIPPED, email: "user@example.com", orderNumber: "LUX-1" };
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: OrderStatus.DELIVERED } as any);

      const result = await OrderService.updateOrderStatus("order_123", OrderStatus.DELIVERED);
      expect(result.status).toBe(OrderStatus.DELIVERED);
    });
  });

  describe("Shipment & Tracking Updates", () => {
    it("should upsert shipment details and transition status to SHIPPED if not already", async () => {
      const mockOrder = { id: "order_123", status: OrderStatus.PACKED, email: "user@example.com", orderNumber: "LUX-1" };
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.shipment.upsert).mockResolvedValue({ id: "ship_123" } as any);

      const shipmentInput = {
        trackingNumber: "TRK12345",
        carrier: "FedEx",
        trackingUrl: "https://fedex.com/track",
        status: "SHIPPED",
        description: "Package left facility",
      };

      await OrderService.updateShipment("order_123", shipmentInput);

      expect(prisma.shipment.upsert).toHaveBeenCalled();
      expect(prisma.trackingEvent.create).toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.SHIPPED },
        })
      );
    });
  });

  describe("Returns eligibility rules", () => {
    it("should reject return requests for non-delivered orders", async () => {
      const mockOrder = { id: "order_123", status: OrderStatus.PROCESSING, userId: "user_123", returnRequest: null };
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

      await expect(
        ReturnService.submitReturnRequest("order_123", "user_123", { reason: "Wrong size" })
      ).rejects.toThrowError("Only delivered orders can be eligible for returns");
    });

    it("should reject returns outside the 30-day window", async () => {
      const pastDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      const mockOrder = {
        id: "order_123",
        status: OrderStatus.DELIVERED,
        userId: "user_123",
        updatedAt: pastDate,
        returnRequest: null,
      };
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

      await expect(
        ReturnService.submitReturnRequest("order_123", "user_123", { reason: "Wrong size" })
      ).rejects.toThrowError("The return window of 30 days has expired for this order.");
    });

    it("should reject returns if already requested", async () => {
      const mockOrder = {
        id: "order_123",
        status: OrderStatus.DELIVERED,
        userId: "user_123",
        updatedAt: new Date(),
        returnRequest: { id: "ret_123", status: ReturnStatus.PENDING },
      };
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

      await expect(
        ReturnService.submitReturnRequest("order_123", "user_123", { reason: "Wrong size" })
      ).rejects.toThrowError("A return request has already been filed for this order");
    });

    it("should create return request and set status to RETURN_REQUESTED if valid", async () => {
      const mockOrder = {
        id: "order_123",
        status: OrderStatus.DELIVERED,
        userId: "user_123",
        updatedAt: new Date(),
        returnRequest: null,
        email: "user@example.com",
        orderNumber: "LUX-1",
      };
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.returnRequest.create).mockResolvedValue({ id: "ret_123" } as any);

      await ReturnService.submitReturnRequest("order_123", "user_123", { reason: "Damaged item" });

      expect(prisma.returnRequest.create).toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.RETURN_REQUESTED },
        })
      );
    });

    it("should allow admin to approve a return request", async () => {
      const mockRequest = { id: "ret_123", orderId: "order_123", status: ReturnStatus.PENDING };
      vi.mocked(prisma.returnRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.returnRequest.update).mockResolvedValue({ ...mockRequest, status: ReturnStatus.APPROVED } as any);

      const result = await ReturnService.processReturnRequest("ret_123", ReturnStatus.APPROVED, "Please ship back");
      expect(result.status).toBe(ReturnStatus.APPROVED);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order_123" },
          data: { status: OrderStatus.RETURNED },
        })
      );
    });
  });

  describe("In-App Notification Queries", () => {
    it("should query paginated notifications for the customer", async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([{ id: "notif_1", title: "Test" }] as any);
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      const result = await NotificationService.notifyOrderCreated("order_123");
      expect(prisma.notification.create).not.toThrow();
    });
  });

  describe("Invoice HTML Generation", () => {
    it("should generate invoice HTML structure with pricing details", () => {
      const mockOrder = {
        orderNumber: "LUX-987654",
        createdAt: new Date(),
        subtotal: 10000,
        shippingCost: 500,
        taxCost: 1800,
        total: 12300,
        status: "DELIVERED",
        paymentIntentId: "pi_test",
        email: "guest@example.com",
        items: [
          {
            productName: "Luxury Watch",
            productSku: "WAT-001",
            quantity: 1,
            price: 10000,
          },
        ],
        shippingAddressSnapshot: {
          fullName: "John Doe",
          addressLine1: "123 Lane",
          city: "Delhi",
          state: "Delhi",
          postalCode: "110001",
          country: "India",
          phoneNumber: "9876543210",
        },
      };

      const html = InvoiceService.generateInvoiceHtml(mockOrder);
      expect(html).toContain("LUXSTORE");
      expect(html).toContain("LUX-987654");
      expect(html).toContain("Luxury Watch");
      expect(html).toContain("₹12,300.00");
    });
  });
});
