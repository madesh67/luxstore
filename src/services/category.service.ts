import { CategoryRepository } from "@/repositories/category.repository";
import { AppError } from "@/lib/error-handler";
import { AdminCategoryCreateInput } from "@/schemas/catalog";
import { slugify } from "@/lib/utils";

export const CategoryService = {
  async getCategories(onlyActive = true) {
    return CategoryRepository.findMany(onlyActive);
  },

  async getCategoryDetails(slug: string) {
    const category = await CategoryRepository.findBySlug(slug, true);
    if (!category) {
      throw new AppError(`Category with slug "${slug}" not found`, 404, "CATEGORY_NOT_FOUND");
    }
    return category;
  },

  async createCategory(data: AdminCategoryCreateInput) {
    const slug = data.slug || slugify(data.name);
    const existing = await CategoryRepository.findBySlug(slug, false);
    if (existing) {
      throw new AppError("Category slug already exists", 400, "DUPLICATE_SLUG");
    }
    return CategoryRepository.create({ ...data, slug });
  },

  async updateCategory(id: string, data: Partial<AdminCategoryCreateInput>) {
    const existing = await CategoryRepository.findById(id);
    if (!existing) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }
    if (data.slug) {
      const slugExisting = await CategoryRepository.findBySlug(data.slug, false);
      if (slugExisting && slugExisting.id !== id) {
        throw new AppError("Category slug already exists", 400, "DUPLICATE_SLUG");
      }
    }
    return CategoryRepository.update(id, data);
  },

  async deleteCategory(id: string) {
    const existing = await CategoryRepository.findById(id);
    if (!existing) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }
    return CategoryRepository.delete(id);
  },
};

