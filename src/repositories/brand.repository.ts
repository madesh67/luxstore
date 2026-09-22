import { prisma } from "@/lib/prisma";
import { AdminBrandCreateInput } from "@/schemas/catalog";
import { getCatalogBrands } from "@/data/catalog";

export const BrandRepository = {
  async findMany(onlyActive = true) {
    try {
      const brands = await prisma.brand.findMany({
        where: {
          deletedAt: null,
          ...(onlyActive ? { active: true } : {}),
        },
        orderBy: { name: "asc" },
      });
      if (brands && brands.length > 0) return brands;
      return getCatalogBrands();
    } catch {
      return getCatalogBrands();
    }
  },

  async findBySlug(slug: string, onlyActive = true) {
    try {
      const brand = await prisma.brand.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(onlyActive ? { active: true } : {}),
        },
      });
      if (brand) return brand;
      return getCatalogBrands().find((b) => b.slug === slug) || null;
    } catch {
      return getCatalogBrands().find((b) => b.slug === slug) || null;
    }
  },

  async findById(id: string) {
    try {
      const brand = await prisma.brand.findUnique({
        where: { id },
      });
      if (brand) return brand;
      return getCatalogBrands().find((b) => b.id === id) || null;
    } catch {
      return getCatalogBrands().find((b) => b.id === id) || null;
    }
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
