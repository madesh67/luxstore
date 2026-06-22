import { prisma } from "@/lib/prisma";
import { AdminCategoryCreateInput } from "@/schemas/catalog";

export const CategoryRepository = {
  async findMany(onlyActive = true) {
    return prisma.category.findMany({
      where: {
        deletedAt: null,
        ...(onlyActive ? { active: true } : {}),
      },
      include: {
        parent: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async findBySlug(slug: string, onlyActive = true) {
    return prisma.category.findFirst({
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
  },

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    });
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

