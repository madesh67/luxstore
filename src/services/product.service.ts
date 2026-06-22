import { ProductRepository } from "@/repositories/product.repository";
import { AppError } from "@/lib/error-handler";
import { CatalogFilterInput, AdminProductCreateInput } from "@/schemas/catalog";
import { slugify } from "@/lib/utils";

export const ProductService = {
  async getProducts(filters: CatalogFilterInput) {
    const { products, total } = await ProductRepository.findManyAndCount(filters);
    const limit = filters.limit || 12;
    const page = filters.page || 1;
    
    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getProductDetails(slug: string) {
    const product = await ProductRepository.findBySlug(slug, true);
    if (!product) {
      throw new AppError(`Product with slug "${slug}" not found`, 404, "PRODUCT_NOT_FOUND");
    }
    return product;
  },

  async getRelatedProducts(productId: string, categoryId: string | null, brandId: string | null, limit = 4) {
    return ProductRepository.findRelated(productId, categoryId, brandId, limit);
  },

  async createProduct(data: AdminProductCreateInput) {
    // Generate slug from name + short random string
    const baseSlug = slugify(data.name);
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    
    const existing = await ProductRepository.findBySlug(uniqueSlug, false);
    if (existing) {
      throw new AppError("A product with this generated slug already exists", 400, "DUPLICATE_SLUG");
    }

    return ProductRepository.create({
      ...data,
      // Pass uniqueSlug inside model
    });
  },

  async updateProduct(id: string, data: Partial<AdminProductCreateInput>) {
    const existing = await ProductRepository.findById(id);
    if (!existing) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }
    return ProductRepository.update(id, data);
  },

  async deleteProduct(id: string) {
    const existing = await ProductRepository.findById(id);
    if (!existing) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }
    return ProductRepository.delete(id);
  },
};
