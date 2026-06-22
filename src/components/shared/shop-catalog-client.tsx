"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, RotateCcw, ChevronLeft, ChevronRight, Star, Tag } from "lucide-react";
import { useProducts } from "@/hooks/use-catalog";
import { Category, Brand } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "./container";
import { formatPrice } from "@/lib/utils";
import { WishlistButton } from "./wishlist-button";

interface ShopCatalogClientProps {
  initialCategories: Category[];
  initialBrands: Brand[];
}

export function ShopCatalogClient({ initialCategories, initialBrands }: ShopCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Local State synchronized with URL parameters
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [selectedCategory, setSelectedCategory] = React.useState(searchParams.get("category") || "");
  const [selectedBrand, setSelectedBrand] = React.useState(searchParams.get("brand") || "");
  const [minPrice, setMinPrice] = React.useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = React.useState(searchParams.get("maxPrice") || "");
  const [featured, setFeatured] = React.useState(searchParams.get("featured") === "true");
  const [inStock, setInStock] = React.useState(searchParams.get("inStock") === "true");
  const [rating, setRating] = React.useState(searchParams.get("rating") || "");
  const [sortBy, setSortBy] = React.useState(searchParams.get("sortBy") || "newest");
  const [page, setPage] = React.useState(parseInt(searchParams.get("page") || "1", 10));

  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // 2. Debounce search input changes (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on query modify
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // 3. Sync state changes back to URL history
  const updateUrl = React.useCallback(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (featured) params.set("featured", "true");
    if (inStock) params.set("inStock", "true");
    if (rating) params.set("rating", rating);
    if (sortBy !== "newest") params.set("sortBy", sortBy);
    if (page > 1) params.set("page", String(page));

    router.replace(`/shop?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, selectedCategory, selectedBrand, minPrice, maxPrice, featured, inStock, rating, sortBy, page, router]);

  React.useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Sync URL search params back to local state (handles back/forward, header links, and deep links)
  React.useEffect(() => {
    const searchVal = searchParams.get("search") || "";
    setSearch(searchVal);
    setDebouncedSearch(searchVal);
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedBrand(searchParams.get("brand") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setFeatured(searchParams.get("featured") === "true");
    setInStock(searchParams.get("inStock") === "true");
    setRating(searchParams.get("rating") || "");
    setSortBy(searchParams.get("sortBy") || "newest");
    setPage(parseInt(searchParams.get("page") || "1", 10));
  }, [searchParams]);

  // 4. Query data using custom hook
  const { data, isLoading, isError, error } = useProducts({
    search: debouncedSearch,
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
    setSelectedCategory("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setFeatured(false);
    setInStock(false);
    setRating("");
    setSortBy("newest");
    setPage(1);
    router.replace("/shop");
  };

  return (
    <Container className="py-12">
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h2 className="text-xs tracking-[0.2em] font-semibold uppercase text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </h2>
            <button
              onClick={handleResetFilters}
              className="text-[10px] tracking-widest font-semibold text-accent hover:underline flex items-center gap-1 uppercase"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          {/* Categories Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => { setSelectedCategory(""); setPage(1); }}
                className={`block text-xs uppercase tracking-wider font-light hover:text-accent transition-colors ${!selectedCategory ? "text-accent font-semibold" : "text-muted-foreground"}`}
              >
                All Categories
              </button>
              {initialCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                  className={`block text-xs uppercase tracking-wider font-light text-left hover:text-accent transition-colors ${selectedCategory === cat.slug ? "text-accent font-semibold" : "text-muted-foreground"}`}
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
                onClick={() => { setSelectedBrand(""); setPage(1); }}
                className={`block text-xs uppercase tracking-wider font-light hover:text-accent transition-colors ${!selectedBrand ? "text-accent font-semibold" : "text-muted-foreground"}`}
              >
                All Brands
              </button>
              {initialBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => { setSelectedBrand(brand.slug); setPage(1); }}
                  className={`block text-xs uppercase tracking-wider font-light text-left hover:text-accent transition-colors ${selectedBrand === brand.slug ? "text-accent font-semibold" : "text-muted-foreground"}`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range inputs */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Price (INR)</h3>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="MIN"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="h-9 uppercase text-[10px] tracking-widest bg-background/50 placeholder:text-muted-foreground/60"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                type="number"
                placeholder="MAX"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="h-9 uppercase text-[10px] tracking-widest bg-background/50 placeholder:text-muted-foreground/60"
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
                onChange={(e) => { setFeatured(e.target.checked); setPage(1); }}
                className="rounded border-border text-accent focus:ring-accent accent-accent"
              />
              <Label htmlFor="featured" className="cursor-pointer">Featured Pieces Only</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="inStock"
                type="checkbox"
                checked={inStock}
                onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                className="rounded border-border text-accent focus:ring-accent accent-accent"
              />
              <Label htmlFor="inStock" className="cursor-pointer">Available In Stock</Label>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Rating</h3>
            <div className="space-y-2">
              <button
                onClick={() => { setRating(""); setPage(1); }}
                className={`block text-xs uppercase tracking-wider font-light hover:text-accent transition-colors ${!rating ? "text-accent font-semibold" : "text-muted-foreground"}`}
              >
                Any Rating
              </button>
              {[4, 4.5].map((val) => (
                <button
                  key={val}
                  onClick={() => { setRating(String(val)); setPage(1); }}
                  className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-light hover:text-accent transition-colors ${rating === String(val) ? "text-accent font-semibold" : "text-muted-foreground"}`}
                >
                  <Star className="h-3 w-3 text-accent fill-accent" /> {val} & Above
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow space-y-8">
          {/* Header Controls (Search and Sort) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 border border-border rounded-sm">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="SEARCH CATALOG OR SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 uppercase text-[10px] tracking-[0.2em] bg-background/50"
              />
            </div>
            
            <div className="flex justify-between sm:justify-end items-center gap-4 w-full sm:w-auto">
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="lg:hidden flex items-center gap-2 uppercase tracking-widest text-[10px] font-semibold h-11"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="h-11 border border-input bg-background/50 px-3 uppercase text-[10px] tracking-widest focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm cursor-pointer"
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
            <div className="text-center py-16 border border-destructive/20 bg-destructive/5 rounded-sm">
              <h3 className="text-lg font-semibold text-destructive uppercase tracking-widest">Database Offline</h3>
              <p className="text-xs text-muted-foreground font-light max-w-sm mx-auto mt-2 leading-relaxed">
                {error?.message || "We encountered an issue checking our inventory. Please verify seed migration scripts."}
              </p>
              <Button onClick={() => router.refresh()} variant="outline" className="mt-4">Retry Query</Button>
            </div>
          ) : isLoading ? (
            /* Skeletons */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4 border border-border/30 p-4 rounded-sm animate-pulse">
                  <div className="bg-muted aspect-square w-full rounded-sm" />
                  <div className="h-4 bg-muted w-3/4 rounded-sm" />
                  <div className="h-3 bg-muted w-1/2 rounded-sm" />
                  <div className="h-4 bg-muted w-1/4 rounded-sm" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 border border-border/40 rounded-sm bg-card space-y-4">
              <Tag className="h-12 w-12 text-accent mx-auto animate-pulse" />
              <h3 className="text-lg uppercase tracking-widest text-foreground font-display font-medium">No Products Found</h3>
              <p className="text-xs text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
                We couldn&apos;t find any accessories matching your selected criteria. Try adjusting your search query or reset filters.
              </p>
              <Button onClick={handleResetFilters} variant="gold" className="text-xs uppercase tracking-widest">
                Clear All Filters
              </Button>
            </div>
          ) : (
            /* Products Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const primaryImage = product.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800";
                
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group border border-border/30 bg-card hover:border-accent/40 p-4 hover-lift rounded-sm relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Product image */}
                      <div className="relative aspect-square w-full overflow-hidden bg-secondary/20 rounded-sm mb-4">
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="object-cover h-full w-full transition-transform duration-500 group-hover:scale-105"
                        />
                        {product.featured && (
                          <span className="absolute top-2 left-2 text-[8px] font-bold tracking-widest text-white bg-accent px-2 py-0.5 uppercase rounded-sm">
                            Featured
                          </span>
                        )}
                        <div className="absolute top-2 right-2 z-10">
                          <WishlistButton productId={product.id} product={product} />
                        </div>
                      </div>

                      {/* Brand & Category details */}
                      <div className="flex justify-between items-center text-[9px] tracking-widest text-muted-foreground uppercase font-semibold mb-1">
                        <span>{product.brand?.name || "LuxStore"}</span>
                        <span>{product.category?.name}</span>
                      </div>

                      {/* Product Title */}
                      <h3 className="text-sm font-display font-medium uppercase tracking-wider text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      
                      {/* Star Rating */}
                      <div className="flex items-center gap-1 mt-1 mb-2">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span className="text-[10px] text-foreground font-semibold">{Number(product.ratingAverage).toFixed(1)}</span>
                        <span className="text-[9px] text-muted-foreground font-light">({product.ratingCount})</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(Number(product.price))}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-xs text-muted-foreground line-through font-light">
                          {formatPrice(Number(product.compareAtPrice))}
                        </span>
                      )}
                    </div>
                  </Link>
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
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || isLoading}
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs uppercase tracking-widest font-semibold px-4 text-muted-foreground">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
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
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden flex justify-end">
          <div className="w-80 bg-background h-full p-6 overflow-y-auto animate-fade-in flex flex-col space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[10px] font-semibold text-accent uppercase tracking-widest"
              >
                Close
              </button>
            </div>

            {/* Inlined Filters for Mobile */}
            <div className="space-y-6">
              {/* Category selector */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent">Categories</h3>
                <div className="space-y-1.5 flex flex-col items-start">
                  <button
                    onClick={() => { setSelectedCategory(""); setPage(1); }}
                    className={`text-xs uppercase tracking-wider ${!selectedCategory ? "text-accent font-semibold" : "text-muted-foreground"}`}
                  >
                    All Categories
                  </button>
                  {initialCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                      className={`text-xs uppercase tracking-wider ${selectedCategory === cat.slug ? "text-accent font-semibold" : "text-muted-foreground"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand selector */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent">Brands</h3>
                <div className="space-y-1.5 flex flex-col items-start">
                  <button
                    onClick={() => { setSelectedBrand(""); setPage(1); }}
                    className={`text-xs uppercase tracking-wider ${!selectedBrand ? "text-accent font-semibold" : "text-muted-foreground"}`}
                  >
                    All Brands
                  </button>
                  {initialBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => { setSelectedBrand(brand.slug); setPage(1); }}
                      className={`text-xs uppercase tracking-wider text-left ${selectedBrand === brand.slug ? "text-accent font-semibold" : "text-muted-foreground"}`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price inputs */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent">Price (INR)</h3>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="MIN"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    className="h-9 text-[10px]"
                  />
                  <Input
                    type="number"
                    placeholder="MAX"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    className="h-9 text-[10px]"
                  />
                </div>
              </div>

              {/* Reset action */}
              <Button onClick={handleResetFilters} variant="outline" className="w-full uppercase text-xs tracking-widest">
                Reset All Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
