import catalogData from "./products-catalog.json";
import { Product, Category, Brand } from "@/types";
import { CatalogFilterInput } from "@/schemas/catalog";

export const CATALOG_CATEGORIES: Category[] = catalogData.categories as unknown as Category[];
export const CATALOG_BRANDS: Brand[] = catalogData.brands as unknown as Brand[];
export const CATALOG_PRODUCTS: Product[] = catalogData.products as unknown as Product[];

export function getCatalogCategories(): Category[] {
  return CATALOG_CATEGORIES;
}

export function getCatalogBrands(): Brand[] {
  return CATALOG_BRANDS;
}

export function getCatalogProducts(filters: CatalogFilterInput) {
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

  let filtered = [...CATALOG_PRODUCTS];

  // 1. Search in Name, SKU, Description
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }

  // 2. Category filter
  if (category) {
    const targetSlug = category === "leather" ? "leather-bags" : category;
    filtered = filtered.filter((p) => p.category?.slug === targetSlug);
  }

  // 3. Brand filter
  if (brand) {
    filtered = filtered.filter((p) => p.brand?.slug === brand);
  }

  // 4. Price filter
  if (minPrice !== undefined) {
    filtered = filtered.filter((p) => Number(p.price) >= minPrice);
  }
  if (maxPrice !== undefined) {
    filtered = filtered.filter((p) => Number(p.price) <= maxPrice);
  }

  // 5. Featured filter
  if (featured !== undefined) {
    filtered = filtered.filter((p) => p.featured === featured);
  }

  // 6. Stock filter
  if (inStock) {
    filtered = filtered.filter((p) => (p.inventory?.quantity ?? 0) > 0);
  }

  // 7. Rating filter
  if (rating !== undefined) {
    filtered = filtered.filter((p) => Number(p.ratingAverage) >= rating);
  }

  // 8. Sorting
  if (sortBy === "price_asc") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === "price_desc") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortBy === "highest_rated") {
    filtered.sort((a, b) => Number(b.ratingAverage) - Number(a.ratingAverage));
  } else if (sortBy === "featured") {
    filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    products: paginated,
    total,
  };
}

export function getCatalogProductBySlug(slug: string): Product | null {
  const prod = CATALOG_PRODUCTS.find((p) => p.slug === slug && p.active);
  return prod || null;
}

export function getCatalogRelatedProducts(
  productId: string,
  categoryId: string | null,
  brandId: string | null,
  limit = 4,
): Product[] {
  return CATALOG_PRODUCTS.filter(
    (p) => p.id !== productId && (p.categoryId === categoryId || p.brandId === brandId),
  ).slice(0, limit);
}
