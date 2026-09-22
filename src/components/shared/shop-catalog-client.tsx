"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star,
  Tag,
} from "lucide-react";
import { useProducts } from "@/hooks/use-catalog";
import { Category, Brand } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "./container";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { WishlistButton } from "./wishlist-button";
import { motion } from "framer-motion";

interface ShopCatalogClientProps {
  initialCategories: Category[];
  initialBrands: Brand[];
}

export function ShopCatalogClient({ initialCategories, initialBrands }: ShopCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Read filter state directly from URL (Single Source of Truth)
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const selectedCategory = searchParams.get("category") || "";
  const selectedBrand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const featured = searchParams.get("featured") === "true";
  const inStock = searchParams.get("inStock") === "true";
  const rating = searchParams.get("rating") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Normalize category for display (maps 'leather' -> 'leather-bags' for UI highlight sync)
  const normalizedCategory = selectedCategory === "leather" ? "leather-bags" : selectedCategory;

  // 2. Helper function to update filters by modifying URL query string
  const updateFilter = React.useCallback(
    (updates: Record<string, string | null | boolean>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "" || value === false) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Reset page to 1 when filters change (unless page is explicitly updated)
      if (!("page" in updates)) {
        params.delete("page");
      }

      router.replace(`/shop?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  // 3. Debounce search input changes (300ms) to URL
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (search !== currentSearch) {
        updateFilter({ search });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [search, searchParams, updateFilter]);

  // Sync external URL changes to local search input state (e.g. back/forward, reset)
  React.useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  // 4. Query data using custom hook (automatically refetches when arguments change)
  const { data, isLoading, isError, error } = useProducts({
    search: searchParams.get("search") || "",
    category: selectedCategory,
    brand: selectedBrand,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    featured: featured || undefined,
    inStock: inStock || undefined,
    rating: rating ? parseFloat(rating) : undefined,
    sortBy: sortBy as "newest" | "price_asc" | "price_desc" | "highest_rated" | "featured",
    page,
    limit: 9, // Paginate by 9 for grid symmetry
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 9, pages: 1 };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearch("");
    router.replace("/shop");
  };

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-6 md:flex-row lg:gap-10">
        {/* Sidebar Filters (Desktop/Tablet) */}
        <aside className="hidden w-56 shrink-0 space-y-8 md:block lg:w-64">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </h2>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-accent hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          {/* Categories Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
              Categories
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => updateFilter({ category: "" })}
                className={`block text-xs font-light uppercase tracking-wider transition-colors hover:text-accent ${!normalizedCategory ? "font-semibold text-accent" : "text-muted-foreground"}`}
              >
                All Categories
              </button>
              {initialCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilter({ category: cat.slug })}
                  className={`block text-left text-xs font-light uppercase tracking-wider transition-colors hover:text-accent ${normalizedCategory === cat.slug ? "font-semibold text-accent" : "text-muted-foreground"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brands Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Brands</h3>
            <div className="space-y-2">
              <button
                onClick={() => updateFilter({ brand: "" })}
                className={`block text-xs font-light uppercase tracking-wider transition-colors hover:text-accent ${!selectedBrand ? "font-semibold text-accent" : "text-muted-foreground"}`}
              >
                All Brands
              </button>
              {initialBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => updateFilter({ brand: brand.slug })}
                  className={`block text-left text-xs font-light uppercase tracking-wider transition-colors hover:text-accent ${selectedBrand === brand.slug ? "font-semibold text-accent" : "text-muted-foreground"}`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range inputs */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
              Price (INR)
            </h3>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="MIN"
                value={minPrice}
                onChange={(e) => updateFilter({ minPrice: e.target.value })}
                className="h-9 bg-background/50 text-[10px] uppercase tracking-widest placeholder:text-muted-foreground/60"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                type="number"
                placeholder="MAX"
                value={maxPrice}
                onChange={(e) => updateFilter({ maxPrice: e.target.value })}
                className="h-9 bg-background/50 text-[10px] uppercase tracking-widest placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Extra Checkboxes (Featured, In Stock) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                id="featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => updateFilter({ featured: e.target.checked })}
                className="rounded border-border text-accent accent-accent focus:ring-accent"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured Pieces Only
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="inStock"
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateFilter({ inStock: e.target.checked })}
                className="rounded border-border text-accent accent-accent focus:ring-accent"
              />
              <Label htmlFor="inStock" className="cursor-pointer">
                Available In Stock
              </Label>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Rating</h3>
            <div className="space-y-2">
              <button
                onClick={() => updateFilter({ rating: "" })}
                className={`block text-xs font-light uppercase tracking-wider transition-colors hover:text-accent ${!rating ? "font-semibold text-accent" : "text-muted-foreground"}`}
              >
                Any Rating
              </button>
              {[4, 4.5].map((val) => (
                <button
                  key={val}
                  onClick={() => updateFilter({ rating: String(val) })}
                  className={`flex items-center gap-1.5 text-xs font-light uppercase tracking-wider transition-colors hover:text-accent ${rating === String(val) ? "font-semibold text-accent" : "text-muted-foreground"}`}
                >
                  <Star className="h-3 w-3 fill-accent text-accent" /> {val} & Above
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow space-y-8">
          {/* Header Controls (Search and Sort) */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-sm border border-border bg-card p-4 sm:flex-row">
            <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="SEARCH CATALOG OR SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 bg-background/50 pl-10 text-[10px] uppercase tracking-[0.2em]"
              />
            </div>

            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="flex h-11 items-center gap-2 text-[10px] font-semibold uppercase tracking-widest md:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </Button>

              <div className="flex items-center gap-2">
                <span className="hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:inline">
                  Sort By
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => updateFilter({ sortBy: e.target.value })}
                  className="h-11 cursor-pointer rounded-sm border border-input bg-background/50 px-3 text-[10px] uppercase tracking-widest focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="highest_rated">Highest Rated</option>
                  <option value="featured">Featured Items</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalog Listing States */}
          {isError ? (
            <div className="rounded-sm border border-destructive/20 bg-destructive/5 py-16 text-center">
              <h3 className="text-lg font-semibold uppercase tracking-widest text-destructive">
                Database Offline
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs font-light leading-relaxed text-muted-foreground">
                {error?.message ||
                  "We encountered an issue checking our inventory. Please verify seed migration scripts."}
              </p>
              <Button onClick={() => router.refresh()} variant="outline" className="mt-4">
                Retry Query
              </Button>
            </div>
          ) : isLoading ? (
            /* Skeletons */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse space-y-4 rounded-sm border border-border/30 p-4"
                >
                  <div className="aspect-square w-full rounded-sm bg-muted" />
                  <div className="h-4 w-3/4 rounded-sm bg-muted" />
                  <div className="h-3 w-1/2 rounded-sm bg-muted" />
                  <div className="h-4 w-1/4 rounded-sm bg-muted" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="space-y-4 rounded-sm border border-border/40 bg-card py-20 text-center">
              <Tag className="mx-auto h-12 w-12 animate-pulse text-accent" />
              <h3 className="font-display text-lg font-medium uppercase tracking-widest text-foreground">
                No Products Found
              </h3>
              <p className="mx-auto max-w-md text-xs font-light leading-relaxed text-muted-foreground">
                We couldn&apos;t find any accessories matching your selected criteria. Try adjusting
                your search query or reset filters.
              </p>
              <Button
                onClick={handleResetFilters}
                variant="gold"
                className="text-xs uppercase tracking-widest"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            /* Products Grid */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {products.map((product) => {
                const primaryImage = getProductImageUrl(product);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      className="hover-lift group relative flex h-full flex-col justify-between rounded-sm border border-border/30 bg-card p-4 hover:border-accent/40 md:p-6"
                    >
                      <div>
                        {/* Product image */}
                        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-sm bg-secondary/20 md:mb-6">
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {product.featured && (
                            <span className="absolute left-2 top-2 rounded-sm bg-accent px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-accent-foreground">
                              Featured
                            </span>
                          )}
                          <div className="absolute right-2 top-2 z-10">
                            <WishlistButton productId={product.id} product={product} />
                          </div>
                        </div>

                        {/* Brand & Category details */}
                        <div className="mb-1 flex items-center justify-between text-[9px] font-semibold uppercase tracking-widest text-muted-foreground md:mb-2 md:text-[10px]">
                          <span>{product.brand?.name || "LuxStore"}</span>
                          <span>{product.category?.name}</span>
                        </div>

                        {/* Product Title */}
                        <h3 className="line-clamp-1 font-display text-sm font-medium uppercase tracking-wider text-foreground transition-colors group-hover:text-accent md:text-base">
                          {product.name}
                        </h3>

                        {/* Star Rating */}
                        <div className="mb-2 mt-1 flex items-center gap-1 md:mb-3 md:mt-2">
                          <Star className="h-3 w-3 fill-accent text-accent" />
                          <span className="text-[10px] font-semibold text-foreground md:text-xs">
                            {Number(product.ratingAverage).toFixed(1)}
                          </span>
                          <span className="text-[9px] font-light text-muted-foreground md:text-[10px]">
                            ({product.ratingCount})
                          </span>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="mt-4 flex items-baseline gap-2 border-t border-border/40 pt-3 md:mt-6 md:pt-4">
                        <span className="text-sm font-semibold text-foreground md:text-base">
                          {formatPrice(Number(product.price))}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-xs font-light text-muted-foreground line-through md:text-sm">
                            {formatPrice(Number(product.compareAtPrice))}
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2 border-t border-border/40 pt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateFilter({ page: String(Math.max(page - 1, 1)) })}
                disabled={page === 1 || isLoading}
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateFilter({ page: String(Math.min(page + 1, pagination.pages)) })}
                disabled={page === pagination.pages || isLoading}
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Filters Modal */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            className="flex h-full w-80 animate-fade-in flex-col space-y-6 overflow-y-auto bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Filters
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex min-h-[44px] items-center justify-center px-2 text-[10px] font-semibold uppercase tracking-widest text-accent"
              >
                Close
              </button>
            </div>

            {/* Inlined Filters for Mobile */}
            <div className="space-y-6">
              {/* Category selector */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                  Categories
                </h3>
                <div className="flex flex-col items-start space-y-1.5">
                  <button
                    onClick={() => updateFilter({ category: "" })}
                    className={`text-xs uppercase tracking-wider ${!normalizedCategory ? "font-semibold text-accent" : "text-muted-foreground"}`}
                  >
                    All Categories
                  </button>
                  {initialCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilter({ category: cat.slug })}
                      className={`text-xs uppercase tracking-wider ${normalizedCategory === cat.slug ? "font-semibold text-accent" : "text-muted-foreground"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand selector */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                  Brands
                </h3>
                <div className="flex flex-col items-start space-y-1.5">
                  <button
                    onClick={() => updateFilter({ brand: "" })}
                    className={`text-xs uppercase tracking-wider ${!selectedBrand ? "font-semibold text-accent" : "text-muted-foreground"}`}
                  >
                    All Brands
                  </button>
                  {initialBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => updateFilter({ brand: brand.slug })}
                      className={`text-left text-xs uppercase tracking-wider ${selectedBrand === brand.slug ? "font-semibold text-accent" : "text-muted-foreground"}`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price inputs */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                  Price (INR)
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="MIN"
                    value={minPrice}
                    onChange={(e) => updateFilter({ minPrice: e.target.value })}
                    className="h-9 text-[10px]"
                  />
                  <Input
                    type="number"
                    placeholder="MAX"
                    value={maxPrice}
                    onChange={(e) => updateFilter({ maxPrice: e.target.value })}
                    className="h-9 text-[10px]"
                  />
                </div>
              </div>

              {/* Reset action */}
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="w-full text-xs uppercase tracking-widest"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
