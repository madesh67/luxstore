import { OrderRepository, OrderQueryParams } from "@/repositories/order.repository";
import { OrderStatus } from "@prisma/client";
import { AppError } from "@/lib/error-handler";
import { NotificationService } from "./notification.service";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [OrderStatus.RETURN_REQUESTED, OrderStatus.CANCELLED],
  CANCELLED: [],
  REFUNDED: [],
  RETURN_REQUESTED: [OrderStatus.RETURNED, OrderStatus.DELIVERED, OrderStatus.REFUNDED],
  RETURNED: [OrderStatus.REFUNDED],
};

export const OrderService = {
  /**
   * Get paginated orders for a customer.
   */
  async getCustomerOrders(userId: string, params: OrderQueryParams) {
    return OrderRepository.findManyByUserId(userId, params);
  },

  /**
   * Get order details for a customer with ownership check.
   */
  async getCustomerOrderDetails(orderId: string, userId: string) {
    const order = await OrderRepository.findByIdAndUserId(orderId, userId);
    if (!order) {
      throw new AppError("Order not found or unauthorized access", 404, "ORDER_NOT_FOUND");
    }
    return order;
  },

  /**
   * Get tracking info for a customer.
   */
  async getCustomerOrderTracking(orderId: string, userId: string) {
    const order = await OrderRepository.findByIdAndUserId(orderId, userId);
    if (!order) {
      throw new AppError("Order not found or unauthorized access", 404, "ORDER_NOT_FOUND");
    }
    if (!order.shipment) {
      throw new AppError("Tracking details are not yet available for this order", 404, "TRACKING_UNAVAILABLE");
    }
    return order.shipment;
  },

  /**
   * Get paginated orders for Admin.
   */
  async getAdminOrders(params: OrderQueryParams) {
    return OrderRepository.findManyAdmin(params);
  },

  /**
   * Get order details for Admin.
   */
  async getAdminOrderDetails(orderId: string) {
    const order = await OrderRepository.findByIdAdmin(orderId);
    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }
    return order;
  },

  /**
   * Update order status with server-side validation.
   */
  async updateOrderStatus(id: string, nextStatus: OrderStatus, timelineDescription?: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    const currentStatus = order.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${nextStatus}`,
        400,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const defaultDescription = `Order status transitioned from ${currentStatus} to ${nextStatus}`;
    const description = timelineDescription || defaultDescription;

    const updatedOrder = await OrderRepository.updateStatus(id, nextStatus, description);

    // Dispatch status-specific notifications and emails asynchronously
    switch (nextStatus) {
      case OrderStatus.PAID:
        await NotificationService.notifyPaymentReceived(id);
        break;
      case OrderStatus.PROCESSING:
        await NotificationService.notifyOrderProcessing(id);
        break;
      case OrderStatus.PACKED:
        await NotificationService.notifyOrderPacked(id);
        break;
      case OrderStatus.SHIPPED:
        // Note: For SHIPPED, upsertShipment should be called with tracking info which triggers the notification.
        // But if transitioned directly, trigger general notification.
        break;
      case OrderStatus.DELIVERED:
        await NotificationService.notifyOrderDelivered(id);
        break;
      case OrderStatus.CANCELLED:
        await NotificationService.notifyOrderCancelled(id, description);
        break;
      case OrderStatus.RETURN_REQUESTED:
        await NotificationService.notifyReturnRequested(id, description);
        break;
      // REFUNDED and RETURNED notifications can be handled inside ReturnRequest state modifications.
      default:
        break;
    }

    return updatedOrder;
  },

  /**
   * Update shipment details and add tracking history event.
   */
  async updateShipment(
    orderId: string,
    shipmentDetails: {
      trackingNumber: string;
      carrier: string;
      trackingUrl: string;
      status: string;
      description: string;
      location?: string;
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    // 1. Create or update the shipment
    const shipment = await OrderRepository.upsertShipment(orderId, {
      trackingNumber: shipmentDetails.trackingNumber,
      carrier: shipmentDetails.carrier,
      trackingUrl: shipmentDetails.trackingUrl,
      status: shipmentDetails.status,
    });

    // 2. Add shipment tracking event
    await OrderRepository.addTrackingEvent(shipment.id, {
      status: shipmentDetails.status,
      description: shipmentDetails.description,
      location: shipmentDetails.location,
    });

    // 3. If order is not yet marked SHIPPED, transition status to SHIPPED
    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
      await this.updateOrderStatus(
        orderId,
        OrderStatus.SHIPPED,
        `Package shipped via ${shipmentDetails.carrier}. Tracking: ${shipmentDetails.trackingNumber}.`
      );

      // Trigger the shipped notification with full tracking details
      await NotificationService.notifyOrderShipped(
        orderId,
        shipmentDetails.carrier,
        shipmentDetails.trackingNumber,
        shipmentDetails.trackingUrl
      );
    }

    return shipment;
  },

  /**
   * Add a generic tracking event.
   */
  async addTrackingEvent(
    orderId: string,
    eventDetails: {
      status: string;
      description: string;
      location?: string;
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    if (!order.shipment) {
      throw new AppError("Shipment details do not exist for this order", 400, "SHIPMENT_NOT_FOUND");
    }

    // Add tracking event
    const event = await OrderRepository.addTrackingEvent(order.shipment.id, eventDetails);

    // Update shipment status flag
    await OrderRepository.upsertShipment(orderId, {
      status: eventDetails.status,
    });

    // If tracking event is DELIVERED, transition order status to DELIVERED
    if (eventDetails.status.toUpperCase() === "DELIVERED" && order.status !== OrderStatus.DELIVERED) {
      await this.updateOrderStatus(orderId, OrderStatus.DELIVERED, "Package delivered successfully.");
    }

    return event;
  },
};
