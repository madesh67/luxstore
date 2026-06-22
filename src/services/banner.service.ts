import { BannerRepository } from "@/repositories/banner.repository";
import { prisma } from "@/lib/prisma";

export const BannerService = {
  async getBanners(params: { page: number; limit: number; activeOnly?: boolean }) {
    return BannerRepository.findMany(params);
  },

  async getBannerById(id: string) {
    return BannerRepository.findById(id);
  },

  async createBanner(
    data: {
      title: string;
      subtitle?: string | null;
      imageUrl: string;
      linkUrl?: string | null;
      position?: string;
      isActive?: boolean;
      order?: number;
      startDate?: Date | null;
      endDate?: Date | null;
    },
    userId: string
  ) {
    const banner = await BannerRepository.create(data);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "BANNER_CREATE",
        details: `Created new banner: "${banner.title}" (ID: ${banner.id})`,
      },
    });

    return banner;
  },

  async updateBanner(
    id: string,
    data: {
      title?: string;
      subtitle?: string | null;
      imageUrl?: string;
      linkUrl?: string | null;
      position?: string;
      isActive?: boolean;
      order?: number;
      startDate?: Date | null;
      endDate?: Date | null;
    },
    userId: string
  ) {
    const banner = await BannerRepository.update(id, data);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "BANNER_UPDATE",
        details: `Updated banner ID: ${id}. Fields: ${Object.keys(data).join(", ")}`,
      },
    });

    return banner;
  },

  async deleteBanner(id: string, userId: string) {
    const banner = await BannerRepository.delete(id);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "BANNER_DELETE",
        details: `Deleted banner: "${banner.title}" (ID: ${id})`,
      },
    });

    return banner;
  },

  async getActiveBanners(position = "HERO") {
    return BannerRepository.getActiveBanners(position);
  },

  async sortBanners(orders: { id: string; order: number }[], userId: string) {
    return prisma.$transaction(async (tx) => {
      const updates = [];
      for (const item of orders) {
        const updated = await tx.banner.update({
          where: { id: item.id },
          data: { order: item.order },
        });
        updates.push(updated);
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "BANNER_SORT",
          details: `Re-sorted ${orders.length} banners`,
        },
      });

      return updates;
    });
  },
};
