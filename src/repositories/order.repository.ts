import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

export interface OrderQueryParams {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const OrderRepository = {
  /**
   * Find paginated list of orders for a specific user with search, filter, and sort options.
   */
  async findManyByUserId(userId: string, params: OrderQueryParams) {
    const { page, limit, search, status, sortBy = "createdAt", sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      userId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" } },
              {
                items: {
                  some: {
                    OR: [
                      { productName: { contains: search, mode: "insensitive" } },
                      { productSku: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          items: true,
          shipment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Find details for a specific order belonging to a user.
   */
  async findByIdAndUserId(id: string, userId: string) {
    return prisma.order.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        items: true,
        timeline: {
          orderBy: { createdAt: "desc" },
        },
        shipment: {
          include: {
            events: {
              orderBy: { timestamp: "desc" },
            },
          },
        },
        returnRequest: true,
      },
    });
  },

  /**
   * Admin: Find paginated list of all orders.
   */
  async findManyAdmin(params: OrderQueryParams) {
    const { page, limit, search, status, sortBy = "createdAt", sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              {
                items: {
                  some: {
                    OR: [
                      { productName: { contains: search, mode: "insensitive" } },
                      { productSku: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          items: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Admin: Find details for a specific order.
   */
  async findByIdAdmin(id: string) {
    return prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        items: true,
        timeline: {
          orderBy: { createdAt: "desc" },
        },
        shipment: {
          include: {
            events: {
              orderBy: { timestamp: "desc" },
            },
          },
        },
        returnRequest: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Update order status and append a timeline event.
   */
  async updateStatus(id: string, status: OrderStatus, timelineDescription: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: id,
          status,
          description: timelineDescription,
        },
      });

      return order;
    });
  },

  /**
   * Create or update order shipment details.
   */
  async upsertShipment(
    orderId: string,
    shipmentDetails: {
      trackingNumber?: string;
      carrier?: string;
      trackingUrl?: string;
      status?: string;
    }
  ) {
    return prisma.shipment.upsert({
      where: { orderId },
      update: {
        trackingNumber: shipmentDetails.trackingNumber,
        carrier: shipmentDetails.carrier,
        trackingUrl: shipmentDetails.trackingUrl,
        status: shipmentDetails.status || "SHIPPED",
      },
      create: {
        orderId,
        trackingNumber: shipmentDetails.trackingNumber,
        carrier: shipmentDetails.carrier,
        trackingUrl: shipmentDetails.trackingUrl,
        status: shipmentDetails.status || "SHIPPED",
      },
    });
  },

  /**
   * Add a shipment event.
   */
  async addTrackingEvent(
    shipmentId: string,
    eventDetails: {
      status: string;
      description: string;
      location?: string;
      timestamp?: Date;
    }
  ) {
    return prisma.trackingEvent.create({
      data: {
        shipmentId,
        status: eventDetails.status,
        description: eventDetails.description,
        location: eventDetails.location || null,
        timestamp: eventDetails.timestamp || new Date(),
      },
    });
  },
};
