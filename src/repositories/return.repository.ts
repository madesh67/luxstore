import { prisma } from "@/lib/prisma";
import { ReturnStatus, Prisma } from "@prisma/client";

export const ReturnRepository = {
  /**
   * Submit a return request for an order.
   */
  async create(data: {
    orderId: string;
    userId: string;
    reason: string;
    customerNotes?: string;
    attachments?: Prisma.InputJsonValue;
  }) {
    return prisma.returnRequest.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        reason: data.reason,
        customerNotes: data.customerNotes || null,
        attachments: data.attachments || undefined,
        status: ReturnStatus.PENDING,
      },
    });
  },

  /**
   * Find a return request by order ID (and check ownership).
   */
  async findByOrderId(orderId: string, userId: string) {
    return prisma.returnRequest.findFirst({
      where: {
        orderId,
        userId,
      },
    });
  },

  /**
   * Find a return request by ID (for admin/ownership check).
   */
  async findById(id: string) {
    return prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: true,
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
   * Update return request status and admin notes (Admin).
   */
  async updateStatusAdmin(
    id: string,
    status: ReturnStatus,
    adminNotes?: string
  ) {
    return prisma.returnRequest.update({
      where: { id },
      data: {
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });
  },

  /**
   * List paginated return requests (Admin).
   */
  async findManyAdmin(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.returnRequest.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.returnRequest.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
