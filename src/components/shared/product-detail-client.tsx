"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ShieldAlert, ArrowLeft, Truck, Sparkles, ChevronDown } from "lucide-react";
import { Product, Category, Brand } from "@/types";
import { Container } from "./container";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";
import { QuantitySelector } from "./quantity-selector";
import { motion, AnimatePresence } from "framer-motion";

interface ProductDetailClientProps {
  product: Product & {
    images: { imageUrl: string; altText: string | null; displayOrder: number }[];
    category: Category | null;
    brand: Brand | null;
    inventory: { quantity: number } | null;
    reviews: unknown[];
  };
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const [activeImageIdx, setActiveImageIdx] = React.useState(0);
  const [activeAccordion, setActiveAccordion] = React.useState<string | null>("description");
  const [quantity, setQuantity] = React.useState(1);

  const images = product.images || [];
  const mainImage = images[activeImageIdx]?.imageUrl || getProductImageUrl(product, activeImageIdx);
  const inStock = !!(product.inventory && product.inventory.quantity > 0);

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  return (
    <Container className="space-y-16 py-12">
      {/* Back to Shop Link */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Shop Catalog
      </Link>

      {/* Two-Column Detail Layout */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-border/40 bg-secondary/10">
            <AnimatePresence initial={false}>
              <motion.img
                key={activeImageIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                src={mainImage}
                alt={images[activeImageIdx]?.altText || product.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>

          {/* Thumbnails slider */}
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border bg-secondary/10 transition-all ${activeImageIdx === idx ? "border-accent ring-1 ring-accent" : "border-border/40 hover:border-accent/40"}`}
                  aria-label={`View thumbnail image ${idx + 1}`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.altText || `thumbnail ${idx}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Specs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              <span>{product.brand?.name || "LuxStore"}</span>
              <span>SKU: {product.sku}</span>
            </div>
            <h1 className="font-display text-3xl font-medium uppercase tracking-wider text-foreground sm:text-4xl">
              {product.name}
            </h1>

            {/* Star Rating summary */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(Number(product.ratingAverage)) ? "fill-accent text-accent" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-foreground">
                {Number(product.ratingAverage).toFixed(1)} / 5.0
              </span>
              <span className="text-xs font-light text-muted-foreground">
                ({product.ratingCount} Customer Reviews)
              </span>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="flex items-baseline gap-4 border-b border-t border-border/40 py-4">
            <span className="text-2xl font-semibold text-foreground">
              {formatPrice(Number(product.price))}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm font-light text-muted-foreground line-through">
                {formatPrice(Number(product.compareAtPrice))}
              </span>
            )}

            {/* Stock indicators */}
            <div className="ml-auto">
              {inStock ? (
                <span className="rounded-sm border border-green-200/50 bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:bg-green-950/20">
                  In Stock ({product.inventory?.quantity} Available)
                </span>
              ) : (
                <span className="rounded-sm border border-amber-200/50 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:bg-amber-950/20">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Short Description */}
          <p className="text-sm font-light leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>

          {/* Action buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              {inStock && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Quantity:
                  </span>
                  <QuantitySelector
                    quantity={quantity}
                    max={product.inventory?.quantity || 10}
                    onChange={setQuantity}
                  />
                </div>
              )}

              <div className="flex flex-grow gap-4">
                <AddToCartButton
                  productId={product.id}
                  quantity={quantity}
                  inStock={inStock}
                  _maxStock={product.inventory?.quantity || 10}
                  className="flex-1"
                />

                <WishlistButton productId={product.id} product={product} />
              </div>
            </div>
            <p className="text-center text-[10px] font-light text-muted-foreground/80 sm:text-left">
              🔒 Order completion and payments will unlock in Phase 5 checkout.
            </p>
          </div>

          {/* Accordion Specs */}
          <div className="space-y-4 border-t border-border/40 pt-4">
            {/* Specification detail accordion */}
            <div className="border-b border-border/40 pb-4">
              <button
                onClick={() => toggleAccordion("description")}
                className="flex min-h-[44px] w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-widest text-foreground"
              >
                Product Details{" "}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeAccordion === "description" ? "rotate-180" : ""}`}
                />
              </button>
              {activeAccordion === "description" && (
                <p className="animate-fade-in pt-2 text-xs font-light leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>

            {/* Delivery/Shipping details */}
            <div className="border-b border-border/40 pb-4">
              <button
                onClick={() => toggleAccordion("shipping")}
                className="flex min-h-[44px] w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-widest text-foreground"
              >
                Shipping & Returns{" "}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeAccordion === "shipping" ? "rotate-180" : ""}`}
                />
              </button>
              {activeAccordion === "shipping" && (
                <div className="animate-fade-in space-y-2 pt-2 text-xs font-light leading-relaxed text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-accent" /> Complimentary worldwide shipping
                    on all orders over ₹10,000.
                  </p>
                  <p className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-accent" /> Delivered in premium
                    plastic-free FSC-certified packaging cases.
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-accent" /> Hassle-free returns within
                    14 days of delivery receipt.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-8 border-t border-border/45 pt-16">
          <div className="space-y-2 text-center">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              You May Also Like
            </h2>
            <h3 className="font-display text-2xl font-light uppercase tracking-wider text-foreground">
              Related Masterpieces
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
            {relatedProducts.map((rel) => {
              const relImage = getProductImageUrl(rel);
              return (
                <motion.div
                  key={rel.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Link
                    href={`/products/${rel.slug}`}
                    className="hover-lift group flex h-full flex-col justify-between rounded-sm border border-border/20 bg-card p-4 hover:border-accent/40"
                  >
                    <div>
                      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-sm bg-secondary/15">
                        <img
                          src={relImage}
                          alt={rel.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="mb-1 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {rel.brand?.name}
                      </div>
                      <h4 className="line-clamp-1 font-display text-xs uppercase tracking-wider text-foreground transition-colors group-hover:text-accent">
                        {rel.name}
                      </h4>
                    </div>
                    <div className="mt-3 border-t border-border/30 pt-2 text-xs font-semibold text-foreground">
                      {formatPrice(Number(rel.price))}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </Container>
  );
}
