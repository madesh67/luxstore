import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines tailwind classes safely using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to currency.
 */
export function formatPrice(
  price: number | string,
  options: {
    currency?: "USD" | "INR" | "EUR" | "GBP";
    notation?: Intl.NumberFormatOptions["notation"];
  } = {},
) {
  const { currency = "INR", notation = "standard" } = options;

  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    notation,
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

/**
 * Formats a Date object or ISO string to a human-readable format.
 */
export function formatDate(date: Date | string | number) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Converts a string into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

export const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  timepieces: "/images/products/timepieces/chronos-co-royal-chronograph.jpg",
  "leather-bags": "/images/products/leather-bags/atelier-v-tuscany-calfskin-duffel.jpg",
  "wallets-folios": "/images/products/wallets-folios/saffiano-bifold-leather-wallet.jpg",
  eyewear: "/images/products/eyewear/ocular-optics-polarized-tortoiseshell.jpg",
  belts: "/images/products/belts/atelier-v-reversible-calfskin-belt.jpg",
  "travel-cases": "/images/products/travel-cases/apex-design-polycarbonate-spinner.jpg",
  backpacks: "/images/products/backpacks/nordic-craft-commuter-leather-backpack.jpg",
  "tech-sleeves": "/images/products/tech-sleeves/velo-tech-padded-leather-laptop-sleeve.jpg",
  "fine-jewelry": "/images/products/fine-jewelry/sterling-co-18k-gold-signet-ring.jpg",
  cufflinks: "/images/products/cufflinks/sterling-co-mother-of-pearl-cufflinks.jpg",
};

/**
 * Returns a proper high-resolution product image, guaranteeing category accuracy.
 */
export function getProductImageUrl(
  product?: {
    slug?: string;
    images?: { imageUrl: string }[];
    category?: { slug?: string } | null;
  } | null,
  index = 0,
): string {
  if (product?.images && product.images.length > index && product.images[index]?.imageUrl) {
    return product.images[index].imageUrl;
  }
  if (product?.images && product.images.length > 0 && product.images[0]?.imageUrl) {
    return product.images[0].imageUrl;
  }
  const categorySlug = product?.category?.slug;
  if (categorySlug && CATEGORY_DEFAULT_IMAGES[categorySlug]) {
    return CATEGORY_DEFAULT_IMAGES[categorySlug];
  }
  return "/images/products/timepieces/chronos-co-royal-chronograph.jpg";
}

export function getCategoryFallbackImage(categorySlug?: string): string {
  if (categorySlug && CATEGORY_DEFAULT_IMAGES[categorySlug]) {
    return CATEGORY_DEFAULT_IMAGES[categorySlug];
  }
  return "/images/products/timepieces/chronos-co-royal-chronograph.jpg";
}
