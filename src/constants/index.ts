export const APP_NAME = "LuxStore";
export const APP_DESCRIPTION = "Premium accessories crafted with timeless elegance and modern luxury.";

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 12,
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;

export const COUPON_TYPES = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;

export const CATEGORIES_MOCK = [
  { name: "Leather Goods", slug: "leather-goods", description: "Bags, wallets, and premium leather essentials" },
  { name: "Timepieces", slug: "timepieces", description: "Precision crafted watches and chronographs" },
  { name: "Eyewear", slug: "eyewear", description: "Handcrafted sunglasses and designer opticals" },
  { name: "Jewelry & Cufflinks", slug: "jewelry-cufflinks", description: "Minimalist rings, bracelets, and luxury cufflinks" },
  { name: "Travel & Tech", slug: "travel-tech", description: "Sleek travel cases and protective tech sleeves" }
];

export const BRANDS_MOCK = [
  { name: "Atelier V", slug: "atelier-v" },
  { name: "Chronos", slug: "chronos" },
  { name: "Nordic Craft", slug: "nordic-craft" },
  { name: "Aero Eyewear", slug: "aero-eyewear" }
];
