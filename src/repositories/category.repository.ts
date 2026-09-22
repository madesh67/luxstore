import { prisma } from "@/lib/prisma";
import { AdminCategoryCreateInput } from "@/schemas/catalog";
import { getCatalogCategories } from "@/data/catalog";

export const CategoryRepository = {
  async findMany(onlyActive = true) {
    try {
      const categories = await prisma.category.findMany({
        where: {
          deletedAt: null,
          ...(onlyActive ? { active: true } : {}),
        },
        include: {
          parent: true,
        },
        orderBy: { name: "asc" },
      });
      if (categories && categories.length > 0) return categories;
      return getCatalogCategories();
    } catch {
      return getCatalogCategories();
    }
  },

  async findBySlug(slug: string, onlyActive = true) {
    try {
      const category = await prisma.category.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(onlyActive ? { active: true } : {}),
        },
        include: {
          children: {
            where: { deletedAt: null, ...(onlyActive ? { active: true } : {}) },
          },
        },
      });
      if (category) return category;
      return getCatalogCategories().find((c) => c.slug === slug) || null;
    } catch {
      return getCatalogCategories().find((c) => c.slug === slug) || null;
    }
  },

  async findById(id: string) {
    try {
      const cat = await prisma.category.findUnique({
        where: { id },
      });
      if (cat) return cat;
      return getCatalogCategories().find((c) => c.id === id) || null;
    } catch {
      return getCatalogCategories().find((c) => c.id === id) || null;
    }
  },

  async create(data: AdminCategoryCreateInput) {
    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        active: data.active,
        parentId: data.parentId,
      },
    });
  },

  async update(id: string, data: Partial<AdminCategoryCreateInput>) {
    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        active: data.active,
        parentId: data.parentId,
      },
    });
  },

  async delete(id: string) {
    return prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
  },
};
