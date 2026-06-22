import { prisma } from "@/lib/prisma";
import { AdminBrandCreateInput } from "@/schemas/catalog";

export const BrandRepository = {
  async findMany(onlyActive = true) {
    return prisma.brand.findMany({
      where: {
        deletedAt: null,
        ...(onlyActive ? { active: true } : {}),
      },
      orderBy: { name: "asc" },
    });
  },

  async findBySlug(slug: string, onlyActive = true) {
    return prisma.brand.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(onlyActive ? { active: true } : {}),
      },
    });
  },

  async findById(id: string) {
    return prisma.brand.findUnique({
      where: { id },
    });
  },

  async create(data: AdminBrandCreateInput) {
    return prisma.brand.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        description: data.description,
        active: data.active,
      },
    });
  },

  async update(id: string, data: Partial<AdminBrandCreateInput>) {
    return prisma.brand.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        description: data.description,
        active: data.active,
      },
    });
  },

  async delete(id: string) {
    return prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
  },
};

