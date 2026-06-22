import { AdminReviewRepository, ReviewQueryParams } from "@/repositories/admin-review.repository";
import { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const AdminReviewService = {
  async getReviews(params: ReviewQueryParams) {
    return AdminReviewRepository.findMany(params);
  },

  async updateReviewStatus(id: string, status: ReviewStatus, userId: string) {
    const review = await AdminReviewRepository.updateStatus(id, status);

    // Update product rating counts/average since status changed
    await this.recalculateProductRating(review.productId);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "REVIEW_STATUS_UPDATE",
        details: `Updated review (ID: ${id}) status to ${status}`,
      },
    });

    return review;
  },

  async updateReviewFlag(id: string, isFlagged: boolean, userId: string) {
    const review = await AdminReviewRepository.updateFlag(id, isFlagged);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "REVIEW_FLAG_UPDATE",
        details: `${isFlagged ? "Flagged" : "Unflagged"} review (ID: ${id})`,
      },
    });

    return review;
  },

  async deleteReview(id: string, userId: string) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new Error("Review not found");

    await AdminReviewRepository.delete(id);

    // Recalculate average rating for product
    await this.recalculateProductRating(review.productId);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "REVIEW_DELETE",
        details: `Deleted review (ID: ${id}) written by User (ID: ${review.userId}) for Product (ID: ${review.productId})`,
      },
    });

    return review;
  },

  async bulkUpdateReviewStatus(ids: string[], status: ReviewStatus, userId: string) {
    const result = await AdminReviewRepository.bulkUpdateStatus(ids, status);

    // Recalculate product ratings for all affected products
    const reviews = await prisma.review.findMany({
      where: { id: { in: ids } },
      select: { productId: true },
    });
    const uniqueProductIds = Array.from(new Set(reviews.map((r) => r.productId)));
    for (const pId of uniqueProductIds) {
      await this.recalculateProductRating(pId);
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: "REVIEW_BULK_STATUS_UPDATE",
        details: `Bulk updated ${ids.length} reviews to status: ${status}`,
      },
    });

    return result;
  },

  async bulkDeleteReviews(ids: string[], userId: string) {
    const reviews = await prisma.review.findMany({
      where: { id: { in: ids } },
      select: { productId: true },
    });

    const result = await AdminReviewRepository.bulkDelete(ids);

    const uniqueProductIds = Array.from(new Set(reviews.map((r) => r.productId)));
    for (const pId of uniqueProductIds) {
      await this.recalculateProductRating(pId);
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: "REVIEW_BULK_DELETE",
        details: `Bulk deleted ${ids.length} reviews`,
      },
    });

    return result;
  },

  /**
   * Recalculate average rating and rating counts for a product.
   */
  async recalculateProductRating(productId: string) {
    const aggregates = await prisma.review.aggregate({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const newAvg = aggregates._avg.rating || 0;
    const newCount = aggregates._count.id || 0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: newAvg,
        ratingCount: newCount,
      },
    });
  },
};
