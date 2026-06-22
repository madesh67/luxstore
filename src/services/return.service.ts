import { ReturnRepository } from "@/repositories/return.repository";
import { OrderRepository } from "@/repositories/order.repository";
import { NotificationService } from "./notification.service";
import { ReturnStatus, OrderStatus, Prisma } from "@prisma/client";
import { AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";

const RETURN_WINDOW_DAYS = 30;

export const ReturnService = {
  /**
   * Submit a return request for an order.
   */
  async submitReturnRequest(
    orderId: string,
    userId: string,
    data: { reason: string; customerNotes?: string; attachments?: unknown }
  ) {
    const order = await OrderRepository.findByIdAndUserId(orderId, userId);
    if (!order) {
      throw new AppError("Order not found or unauthorized access", 404, "ORDER_NOT_FOUND");
    }

    // 1. Must be DELIVERED to request a return
    if (order.status !== OrderStatus.DELIVERED) {
      throw new AppError(
        "Only delivered orders can be eligible for returns",
        400,
        "INVALID_ORDER_STATUS"
      );
    }

    // 2. Check return window (30 days since order was created/delivered)
    const returnDeadline = new Date(order.updatedAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (new Date() > returnDeadline) {
      throw new AppError(
        `The return window of ${RETURN_WINDOW_DAYS} days has expired for this order.`,
        400,
        "RETURN_WINDOW_EXPIRED"
      );
    }

    // 3. Prevent duplicate return requests
    if (order.returnRequest) {
      throw new AppError(
        "A return request has already been filed for this order",
        400,
        "RETURN_ALREADY_REQUESTED"
      );
    }

    return prisma.$transaction(async (tx) => {
      // Create return request
      const returnRequest = await tx.returnRequest.create({
        data: {
          orderId,
          userId,
          reason: data.reason,
          customerNotes: data.customerNotes || null,
          attachments: (data.attachments as Prisma.InputJsonValue) || undefined,
          status: ReturnStatus.PENDING,
        },
      });

      // Update Order Status to RETURN_REQUESTED and create order timeline event
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.RETURN_REQUESTED },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: OrderStatus.RETURN_REQUESTED,
          description: `Return requested. Reason: ${data.reason}`,
        },
      });

      // Trigger notification
      await NotificationService.notifyReturnRequested(orderId, data.reason);

      return returnRequest;
    });
  },

  /**
   * Get return requests for a customer order.
   */
  async getCustomerReturnRequest(orderId: string, userId: string) {
    const order = await OrderRepository.findByIdAndUserId(orderId, userId);
    if (!order) {
      throw new AppError("Order not found or unauthorized access", 404, "ORDER_NOT_FOUND");
    }
    return order.returnRequest;
  },

  /**
   * Admin: List return requests.
   */
  async getAdminReturnRequests(params: { page: number; limit: number }) {
    return ReturnRepository.findManyAdmin(params);
  },

  /**
   * Admin: Get return request details.
   */
  async getAdminReturnRequestDetails(id: string) {
    const returnRequest = await ReturnRepository.findById(id);
    if (!returnRequest) {
      throw new AppError("Return request not found", 404, "RETURN_REQUEST_NOT_FOUND");
    }
    return returnRequest;
  },

  /**
   * Admin: Update return request status (Approve / Reject).
   */
  async processReturnRequest(
    id: string,
    status: ReturnStatus,
    adminNotes?: string
  ) {
    const returnRequest = await ReturnRepository.findById(id);
    if (!returnRequest) {
      throw new AppError("Return request not found", 404, "RETURN_REQUEST_NOT_FOUND");
    }

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new AppError(
        "Only pending return requests can be processed",
        400,
        "RETURN_ALREADY_PROCESSED"
      );
    }

    const orderId = returnRequest.orderId;

    return prisma.$transaction(async (tx) => {
      // 1. Update Return Request status
      const updatedRequest = await tx.returnRequest.update({
        where: { id },
        data: {
          status,
          adminNotes: adminNotes || null,
        },
      });

      // 2. Transition Order Status and add Timeline entry based on status
      if (status === ReturnStatus.APPROVED) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.RETURNED },
        });

        await tx.orderTimeline.create({
          data: {
            orderId,
            status: OrderStatus.RETURNED,
            description: `Return approved by administrator. Notes: ${adminNotes || "None"}`,
          },
        });

        // Trigger notification
        await NotificationService.notifyReturnApproved(orderId, adminNotes);
      } else if (status === ReturnStatus.REJECTED) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.DELIVERED }, // Revert status to Delivered
        });

        await tx.orderTimeline.create({
          data: {
            orderId,
            status: OrderStatus.DELIVERED,
            description: `Return request rejected by administrator. Reason: ${adminNotes || "None"}`,
          },
        });

        // Trigger notification
        await NotificationService.notifyReturnRejected(orderId, adminNotes);
      }

      return updatedRequest;
    });
  },
};
