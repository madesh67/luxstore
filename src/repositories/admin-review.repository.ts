import { prisma } from "@/lib/prisma";
import { ReviewStatus, Prisma } from "@prisma/client";

export interface ReviewQueryParams {
  page: number;
  limit: number;
  search?: string;
  status?: ReviewStatus;
  isFlagged?: boolean;
}

export const AdminReviewRepository = {
  /**
   * Find paginated reviews list with product and user details.
   */
  async findMany(params: ReviewQueryParams) {
    const { page, limit, search, status, isFlagged } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {

      ...(status ? { status } : {}),
      ...(isFlagged !== undefined ? { isFlagged } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { comment: { contains: search, mode: "insensitive" } },
              { product: { name: { contains: search, mode: "insensitive" } } },
              { user: { firstName: { contains: search, mode: "insensitive" } } },
              { user: { lastName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
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
      prisma.review.count({ where }),
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
   * Update a review's moderation status.
   */
  async updateStatus(id: string, status: ReviewStatus) {
    return prisma.review.update({
      where: { id },
      data: { status },
    });
  },

  /**
   * Flag/unflag a review.
   */
  async updateFlag(id: string, isFlagged: boolean) {
    return prisma.review.update({
      where: { id },
      data: { isFlagged },
    });
  },

  /**
   * Delete a review.
   */
  async delete(id: string) {
    return prisma.review.delete({
      where: { id },
    });
  },

  /**
   * Bulk update status for multiple reviews.
   */
  async bulkUpdateStatus(ids: string[], status: ReviewStatus) {
    return prisma.review.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  },

  /**
   * Bulk delete reviews.
   */
  async bulkDelete(ids: string[]) {
    return prisma.review.deleteMany({
      where: { id: { in: ids } },
    });
  },
};
