import { prisma } from "@/lib/prisma";

export const BannerRepository = {
  /**
   * Find paginated banners.
   */
  async findMany(params: { page: number; limit: number; activeOnly?: boolean }) {
    const { page, limit, activeOnly = false } = params;
    const skip = (page - 1) * limit;

    const where = activeOnly
      ? {
          isActive: true,
          OR: [
            { startDate: null },
            { startDate: { lte: new Date() } },
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
              ],
            },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { order: "asc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.banner.count({ where }),
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
   * Find banner by ID.
   */
  async findById(id: string) {
    return prisma.banner.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new banner card.
   */
  async create(data: {
    title: string;
    subtitle?: string | null;
    imageUrl: string;
    linkUrl?: string | null;
    position?: string;
    isActive?: boolean;
    order?: number;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    return prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || null,
        position: data.position || "HERO",
        isActive: data.isActive !== undefined ? data.isActive : true,
        order: data.order !== undefined ? data.order : 0,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      },
    });
  },

  /**
   * Update an existing banner configuration.
   */
  async update(
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
    }
  ) {
    return prisma.banner.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        position: data.position,
        isActive: data.isActive,
        order: data.order,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  },

  /**
   * Delete a banner.
   */
  async delete(id: string) {
    return prisma.banner.delete({
      where: { id },
    });
  },

  /**
   * Fetch currently scheduled banners matching timeframe bounds.
   */
  async getActiveBanners(position = "HERO") {
    const now = new Date();
    return prisma.banner.findMany({
      where: {
        isActive: true,
        position,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: {
        order: "asc",
      },
    });
  },
};
