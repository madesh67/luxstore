import { BrandRepository } from "@/repositories/brand.repository";
import { AppError } from "@/lib/error-handler";
import { AdminBrandCreateInput } from "@/schemas/catalog";
import { slugify } from "@/lib/utils";

export const BrandService = {
  async getBrands(onlyActive = true) {
    return BrandRepository.findMany(onlyActive);
  },

  async getBrandDetails(slug: string) {
    const brand = await BrandRepository.findBySlug(slug, true);
    if (!brand) {
      throw new AppError(`Brand with slug "${slug}" not found`, 404, "BRAND_NOT_FOUND");
    }
    return brand;
  },

  async createBrand(data: AdminBrandCreateInput) {
    const slug = data.slug || slugify(data.name);
    const existing = await BrandRepository.findBySlug(slug, false);
    if (existing) {
      throw new AppError("Brand slug already exists", 400, "DUPLICATE_SLUG");
    }
    return BrandRepository.create({ ...data, slug });
  },

  async updateBrand(id: string, data: Partial<AdminBrandCreateInput>) {
    const existing = await BrandRepository.findById(id);
    if (!existing) {
      throw new AppError("Brand not found", 404, "BRAND_NOT_FOUND");
    }
    if (data.slug) {
      const slugExisting = await BrandRepository.findBySlug(data.slug, false);
      if (slugExisting && slugExisting.id !== id) {
        throw new AppError("Brand slug already exists", 400, "DUPLICATE_SLUG");
      }
    }
    return BrandRepository.update(id, data);
  },

  async deleteBrand(id: string) {
    const existing = await BrandRepository.findById(id);
    if (!existing) {
      throw new AppError("Brand not found", 404, "BRAND_NOT_FOUND");
    }
    return BrandRepository.delete(id);
  },
};

