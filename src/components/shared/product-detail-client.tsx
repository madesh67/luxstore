"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ShieldAlert, ArrowLeft, Truck, Sparkles, ChevronDown } from "lucide-react";
import { Product, Category, Brand } from "@/types";
import { Container } from "./container";
import { formatPrice } from "@/lib/utils";
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
  const mainImage = images[activeImageIdx]?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800";
  const inStock = !!(product.inventory && product.inventory.quantity > 0);

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  return (
    <Container className="py-12 space-y-16">
      {/* Back to Shop Link */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-accent hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Shop Catalog
      </Link>

      {/* Two-Column Detail Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-secondary/10 border border-border/40 overflow-hidden rounded-sm">
            <AnimatePresence initial={false}>
              <motion.img
                key={activeImageIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                src={mainImage}
                alt={images[activeImageIdx]?.altText || product.name}
                className="object-cover h-full w-full absolute inset-0"
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
                  className={`relative h-20 w-20 shrink-0 border rounded-sm overflow-hidden bg-secondary/10 transition-all ${activeImageIdx === idx ? "border-accent ring-1 ring-accent" : "border-border/40 hover:border-accent/40"}`}
                  aria-label={`View thumbnail image ${idx + 1}`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.altText || `thumbnail ${idx}`}
                    className="object-cover h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Specs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] tracking-[0.2em] font-semibold text-accent uppercase">
              <span>{product.brand?.name || "LuxStore"}</span>
              <span>SKU: {product.sku}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-medium uppercase tracking-wider text-foreground">
              {product.name}
            </h1>
            
            {/* Star Rating summary */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(Number(product.ratingAverage)) ? "text-accent fill-accent" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-foreground font-semibold">
                {Number(product.ratingAverage).toFixed(1)} / 5.0
              </span>
              <span className="text-xs text-muted-foreground font-light">
                ({product.ratingCount} Customer Reviews)
              </span>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="border-t border-b border-border/40 py-4 flex items-baseline gap-4">
            <span className="text-2xl font-semibold text-foreground">
              {formatPrice(Number(product.price))}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through font-light">
                {formatPrice(Number(product.compareAtPrice))}
              </span>
            )}
            
            {/* Stock indicators */}
            <div className="ml-auto">
              {inStock ? (
                <span className="text-[10px] font-semibold tracking-wider text-green-600 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 uppercase rounded-sm border border-green-200/50">
                  In Stock ({product.inventory?.quantity} Available)
                </span>
              ) : (
                <span className="text-[10px] font-semibold tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 uppercase rounded-sm border border-amber-200/50">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Short Description */}
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Action buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {inStock && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Quantity:</span>
                  <QuantitySelector
                    quantity={quantity}
                    max={product.inventory?.quantity || 10}
                    onChange={setQuantity}
                  />
                </div>
              )}
              
              <div className="flex-grow flex gap-4">
                <AddToCartButton
                  productId={product.id}
                  quantity={quantity}
                  inStock={inStock}
                  _maxStock={product.inventory?.quantity || 10}
                  className="flex-1"
                />
                
                <WishlistButton
                  productId={product.id}
                  product={product}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/80 font-light text-center sm:text-left">
              🔒 Order completion and payments will unlock in Phase 5 checkout.
            </p>
          </div>

          {/* Accordion Specs */}
          <div className="border-t border-border/40 pt-4 space-y-4">
            {/* Specification detail accordion */}
            <div className="border-b border-border/40 pb-4">
              <button
                onClick={() => toggleAccordion("description")}
                className="w-full flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-foreground min-h-[44px] py-2"
              >
                Product Details <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${activeAccordion === "description" ? "rotate-180" : ""}`} />
              </button>
              {activeAccordion === "description" && (
                <p className="text-xs text-muted-foreground font-light leading-relaxed pt-2 animate-fade-in">
                  {product.description}
                </p>
              )}
            </div>

            {/* Delivery/Shipping details */}
            <div className="border-b border-border/40 pb-4">
              <button
                onClick={() => toggleAccordion("shipping")}
                className="w-full flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-foreground min-h-[44px] py-2"
              >
                Shipping & Returns <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${activeAccordion === "shipping" ? "rotate-180" : ""}`} />
              </button>
              {activeAccordion === "shipping" && (
                <div className="text-xs text-muted-foreground font-light leading-relaxed pt-2 space-y-2 animate-fade-in">
                  <p className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-accent" /> Complimentary worldwide shipping on all orders over ₹10,000.</p>
                  <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-accent" /> Delivered in premium plastic-free FSC-certified packaging cases.</p>
                  <p className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5 text-accent" /> Hassle-free returns within 14 days of delivery receipt.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-border/45 pt-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xs tracking-[0.22em] font-semibold text-accent uppercase">
              You May Also Like
            </h2>
            <h3 className="text-2xl font-display font-light uppercase tracking-wider text-foreground">
              Related Masterpieces
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {relatedProducts.map((rel) => {
              const relImage = rel.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800";
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
                    className="group border border-border/20 p-4 hover:border-accent/40 bg-card hover-lift rounded-sm flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="relative aspect-square w-full overflow-hidden bg-secondary/15 rounded-sm mb-3">
                        <img
                          src={relImage}
                          alt={rel.name}
                          className="object-cover h-full w-full transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="text-[8px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                        {rel.brand?.name}
                      </div>
                      <h4 className="text-xs font-display uppercase tracking-wider text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {rel.name}
                      </h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border/30 text-xs font-semibold text-foreground">
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
