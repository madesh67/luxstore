import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://luxstore.com";

  // 1. Fetch active products
  const products = await prisma.product.findMany({
    where: { active: true, deletedAt: null },
    select: { slug: true, updatedAt: true },
  });

  // 2. Fetch active categories
  const categories = await prisma.category.findMany({
    where: { active: true, deletedAt: null },
    select: { slug: true, updatedAt: true },
  });

  // 3. Fetch active brands
  const brands = await prisma.brand.findMany({
    where: { active: true, deletedAt: null },
    select: { slug: true, updatedAt: true },
  });

  // 4. Standard static pages
  const staticPaths = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/cart`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${baseUrl}/wishlist`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  // Map products
  const productPaths = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Map categories
  const categoryPaths = categories.map((c) => ({
    url: `${baseUrl}/shop?category=${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Map brands
  const brandPaths = brands.map((b) => ({
    url: `${baseUrl}/shop?brand=${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPaths, ...productPaths, ...categoryPaths, ...brandPaths];
}
