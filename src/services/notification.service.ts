import { NotificationRepository } from "@/repositories/notification.repository";
import { OrderRepository } from "@/repositories/order.repository";
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendReturnRequestedEmail,
  sendReturnApprovedEmail,
  sendReturnRejectedEmail,
} from "@/lib/email";
import { logger } from "@/lib/logger";

export const NotificationService = {
  /**
   * Send notification when order is created/placed.
   */
  async notifyOrderCreated(orderId: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Order Placed";
      const message = `Your order ${order.orderNumber} has been successfully created. We are waiting for payment confirmation.`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }

      // Order confirmation email is dispatched at checkout, but we could also send it here if needed.
    } catch (error) {
      logger.error("Failed to process notifyOrderCreated:", error as Error);
    }
  },

  /**
   * Send notification when payment is received.
   */
  async notifyPaymentReceived(orderId: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Payment Received";
      const message = `Payment for order ${order.orderNumber} has been verified. We are preparing your order.`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }

      const emailItems = order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
      }));

      await sendOrderConfirmationEmail(
        order.email,
        order.orderNumber,
        {
          subtotal: Number(order.subtotal),
          shippingCost: Number(order.shippingCost),
          taxCost: Number(order.taxCost),
          total: Number(order.total),
        },
        emailItems
      );
    } catch (error) {
      logger.error("Failed to process notifyPaymentReceived:", error as Error);
    }
  },

  /**
   * Send notification when order is processing.
   */
  async notifyOrderProcessing(orderId: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Order Processing";
      const message = `Your order ${order.orderNumber} is now being processed by our curation team.`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }
    } catch (error) {
      logger.error("Failed to process notifyOrderProcessing:", error as Error);
    }
  },

  /**
   * Send notification when order is packed.
   */
  async notifyOrderPacked(orderId: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Order Packed";
      const message = `Your order ${order.orderNumber} has been packed and is ready for dispatch.`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }
    } catch (error) {
      logger.error("Failed to process notifyOrderPacked:", error as Error);
    }
  },

  /**
   * Send notification when order is shipped.
   */
  async notifyOrderShipped(
    orderId: string,
    carrier: string,
    trackingNumber: string,
    trackingUrl: string
  ) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Order Shipped";
      const message = `Your order ${order.orderNumber} has been handed over to ${carrier}. Tracking: ${trackingNumber}.`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }

      await sendOrderShippedEmail(order.email, order.orderNumber, carrier, trackingNumber, trackingUrl);
    } catch (error) {
      logger.error("Failed to process notifyOrderShipped:", error as Error);
    }
  },

  /**
   * Send notification when order is delivered.
   */
  async notifyOrderDelivered(orderId: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Order Delivered";
      const message = `Your package for order ${order.orderNumber} has been successfully delivered.`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }

      await sendOrderDeliveredEmail(order.email, order.orderNumber);
    } catch (error) {
      logger.error("Failed to process notifyOrderDelivered:", error as Error);
    }
  },

  /**
   * Send notification when order is cancelled.
   */
  async notifyOrderCancelled(orderId: string, reason?: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Order Cancelled";
      const message = `Your order ${order.orderNumber} has been cancelled. ${reason ? `Reason: ${reason}` : ""}`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }

      await sendOrderCancelledEmail(order.email, order.orderNumber, reason);
    } catch (error) {
      logger.error("Failed to process notifyOrderCancelled:", error as Error);
    }
  },

  /**
   * Send notification when return is requested.
   */
  async notifyReturnRequested(orderId: string, reason: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Return Requested";
      const message = `We have received your return request for order ${order.orderNumber}.`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }

      await sendReturnRequestedEmail(order.email, order.orderNumber, reason);
    } catch (error) {
      logger.error("Failed to process notifyReturnRequested:", error as Error);
    }
  },

  /**
   * Send notification when return is approved.
   */
  async notifyReturnApproved(orderId: string, instructions?: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Return Approved";
      const message = `Your return request for order ${order.orderNumber} has been approved. Please follow the instructions sent to your email.`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }

      await sendReturnApprovedEmail(order.email, order.orderNumber, instructions);
    } catch (error) {
      logger.error("Failed to process notifyReturnApproved:", error as Error);
    }
  },

  /**
   * Send notification when return is rejected.
   */
  async notifyReturnRejected(orderId: string, reason?: string) {
    try {
      const order = await OrderRepository.findByIdAdmin(orderId);
      if (!order) return;

      const title = "Return Declined";
      const message = `Your return request for order ${order.orderNumber} was declined. ${reason ? `Reason: ${reason}` : ""}`;

      if (order.userId) {
        await NotificationRepository.create(order.userId, title, message);
      }

      await sendReturnRejectedEmail(order.email, order.orderNumber, reason);
    } catch (error) {
      logger.error("Failed to process notifyReturnRejected:", error as Error);
    }
  },
};
