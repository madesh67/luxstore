import { prisma } from "@/lib/prisma";

export interface NotificationQueryParams {
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

export const NotificationRepository = {
  /**
   * Find paginated notifications for a specific user.
   */
  async findManyByUserId(userId: string, params: NotificationQueryParams) {
    const { page, limit, unreadOnly = false } = params;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Create an in-app notification.
   */
  async create(userId: string, title: string, message: string) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        isRead: false,
      },
    });
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  /**
   * Delete a notification.
   */
  async delete(id: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id, userId },
    });
  },
};
