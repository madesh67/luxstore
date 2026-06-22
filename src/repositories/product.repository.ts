import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CatalogFilterInput, AdminProductCreateInput } from "@/schemas/catalog";

export const ProductRepository = {
  async findManyAndCount(filters: CatalogFilterInput) {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      featured,
      inStock,
      rating,
      sortBy = "newest",
      page = 1,
      limit = 12,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      active: true,
    };

    // Text Search in Name, SKU, and descriptions
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category Filter
    if (category) {
      where.category = { slug: category, active: true, deletedAt: null };
    }

    // Brand Filter
    if (brand) {
      where.brand = { slug: brand, active: true, deletedAt: null };
    }

    // Price Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Featured Filter
    if (featured !== undefined) {
      where.featured = featured;
    }

    // Stock Filter
    if (inStock) {
      where.inventory = { quantity: { gt: 0 } };
    }

    // Rating Filter
    if (rating !== undefined) {
      where.ratingAverage = { gte: rating };
    }

    // Sorting configuration
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price_desc") {
      orderBy = { price: "desc" };
    } else if (sortBy === "highest_rated") {
      orderBy = { ratingAverage: "desc" };
    } else if (sortBy === "featured") {
      orderBy = { featured: "desc" };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { displayOrder: "asc" },
          },
          inventory: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  },

  async findBySlug(slug: string, onlyActive = true) {
    return prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(onlyActive ? { active: true } : {}),
      },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { displayOrder: "asc" },
        },
        inventory: true,
        reviews: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        inventory: true,
      },
    });
  },

  async findRelated(productId: string, categoryId: string | null, brandId: string | null, limit = 4) {
    const where: Prisma.ProductWhereInput = {
      id: { not: productId },
      deletedAt: null,
      active: true,
      OR: [],
    };

    if (categoryId && where.OR && Array.isArray(where.OR)) {
      where.OR.push({ categoryId });
    }
    if (brandId && where.OR && Array.isArray(where.OR)) {
      where.OR.push({ brandId });
    }

    // If no related criteria are present, fallback to general active products
    if (!categoryId && !brandId) {
      delete where.OR;
    }

    return prisma.product.findMany({
      where,
      take: limit,
      orderBy: { ratingAverage: "desc" },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  },

  async create(data: AdminProductCreateInput) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug: data.sku.toLowerCase() + "-" + Math.random().toString(36).substring(2, 7), // fallback slug
          shortDescription: data.shortDescription,
          description: data.description,
          sku: data.sku,
          categoryId: data.categoryId,
          brandId: data.brandId,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          featured: data.featured,
          active: data.active,
        },
      });

      // Create product image relations
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img) => ({
            productId: product.id,
            imageUrl: img.imageUrl,
            altText: img.altText || `${data.name} image`,
            displayOrder: img.displayOrder,
          })),
        });
      }

      // Initialize default inventory container
      await tx.inventory.create({
        data: {
          productId: product.id,
          quantity: 10, // Default opening inventory count
        },
      });

      return product;
    });
  },

  async update(id: string, data: Partial<AdminProductCreateInput>) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          shortDescription: data.shortDescription,
          description: data.description,
          sku: data.sku,
          categoryId: data.categoryId,
          brandId: data.brandId,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          featured: data.featured,
          active: data.active,
        },
      });

      if (data.images) {
        // Clear old images
        await tx.productImage.deleteMany({ where: { productId: id } });
        // Insert new images
        await tx.productImage.createMany({
          data: data.images.map((img) => ({
            productId: id,
            imageUrl: img.imageUrl,
            altText: img.altText || `${product.name} image`,
            displayOrder: img.displayOrder,
          })),
        });
      }

      return product;
    });
  },

  async delete(id: string) {
    return prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
  },
};
export type ProductRepositoryType = typeof ProductRepository;
export type BrandRepositoryType = typeof prisma.brand;
export type CategoryRepositoryType = typeof prisma.category;
export type ProductImageRepositoryType = typeof prisma.productImage;
