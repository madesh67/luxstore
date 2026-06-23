import type { Metadata } from "next";
import { CategoryService } from "@/services/category.service";
import { BrandService } from "@/services/brand.service";
import { ShopCatalogClient } from "@/components/shared/shop-catalog-client";
import { PageWrapper } from "@/components/layouts/page-wrapper";

import type { Category, Brand } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Catalog | LuxStore Accessories",
  description: "Browse the curated collection of premium leather bags, watches, sunglasses, and travel accessories at LuxStore.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    title: "Atelier Accessories Shop | LuxStore",
    description: "Browse the curated collection of premium leather bags, watches, sunglasses, and travel accessories at LuxStore.",
    type: "website",
  },
};

export default async function ShopPage() {
  let categories: Category[] = [];
  let brands: Brand[] = [];

  try {
    // Pre-fetch categories and brands server-side for initial SEO rendering
    const [fetchedCategories, fetchedBrands] = await Promise.all([
      CategoryService.getCategories(),
      BrandService.getBrands(),
    ]);
    categories = fetchedCategories;
    brands = fetchedBrands;
  } catch (error) {
    console.error("⚠️ Failed to pre-fetch categories/brands server-side (Database may be offline):", error);
  }

  // Clean raw objects for serialization across the RSC network boundary
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedBrands = JSON.parse(JSON.stringify(brands));

  return (
    <PageWrapper>
      <div className="bg-secondary/10 border-b border-border/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-2 animate-fade-in">
          <span className="text-[10px] tracking-[0.3em] font-semibold text-accent uppercase">
            Storefront
          </span>
          <h1 className="text-3xl font-display font-light uppercase tracking-wider text-foreground">
            The Atelier Catalog
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-light">
            Refined Silhouettes / Premium Materials
          </p>
        </div>
      </div>

      <ShopCatalogClient 
        initialCategories={serializedCategories} 
        initialBrands={serializedBrands} 
      />
    </PageWrapper>
  );
}
