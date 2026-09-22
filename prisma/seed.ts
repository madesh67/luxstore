/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SEED_PRODUCTS } from "./products-seed-data";

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: "Timepieces",
    slug: "timepieces",
    description: "Precision chronographs and minimalist wristwatches.",
    image: "/images/products/timepieces/chronos-co-royal-chronograph.jpg",
  },
  {
    name: "Leather Bags",
    slug: "leather-bags",
    description: "Full-grain leather briefcases, duffels, and everyday carries.",
    image: "/images/products/leather-bags/atelier-v-tuscany-calfskin-duffel.jpg",
  },
  {
    name: "Wallets & Folios",
    slug: "wallets-folios",
    description: "Sleek cardholders, bifold wallets, and document organizers.",
    image: "/images/products/wallets-folios/saffiano-bifold-leather-wallet.jpg",
  },
  {
    name: "Eyewear",
    slug: "eyewear",
    description: "Handcrafted polarized sunglasses and optical frames.",
    image: "/images/products/eyewear/ocular-optics-polarized-tortoiseshell.jpg",
  },
  {
    name: "Belts",
    slug: "belts",
    description: "Classic and contemporary belts in premium calfskin.",
    image: "/images/products/belts/atelier-v-reversible-calfskin-belt.jpg",
  },
  {
    name: "Travel Cases",
    slug: "travel-cases",
    description: "Hard-shell luggage, passport covers, and wash bags.",
    image: "/images/products/travel-cases/apex-design-polycarbonate-spinner.jpg",
  },
  {
    name: "Backpacks",
    slug: "backpacks",
    description: "Premium utility backpacks designed for commutes and getaways.",
    image: "/images/products/backpacks/nordic-craft-commuter-leather-backpack.jpg",
  },
  {
    name: "Tech Sleeves",
    slug: "tech-sleeves",
    description: "Sleek protective covers for laptops, tablets, and phones.",
    image: "/images/products/tech-sleeves/velo-tech-padded-leather-laptop-sleeve.jpg",
  },
  {
    name: "Fine Jewelry",
    slug: "fine-jewelry",
    description: "Minimalist bands, signet rings, and luxury bracelets.",
    image: "/images/products/fine-jewelry/sterling-co-18k-gold-signet-ring.jpg",
  },
  {
    name: "Cufflinks",
    slug: "cufflinks",
    description: "Sterling silver, gold, and stone cufflinks for formal attire.",
    image: "/images/products/cufflinks/sterling-co-mother-of-pearl-cufflinks.jpg",
  },
];

const BRANDS = [
  {
    name: "Atelier V",
    slug: "atelier-v",
    logo: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=200",
    description: "Italian heritage atelier specializing in hand-stitched leathers.",
  },
  {
    name: "Chronos & Co",
    slug: "chronos-co",
    logo: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=200",
    description: "Generational Swiss watchmaker focused on mechanical precision.",
  },
  {
    name: "Nordic Craft",
    slug: "nordic-craft",
    logo: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?q=80&w=200",
    description: "Minimalist Scandinavian design highlighting organic forms.",
  },
  {
    name: "Ocular Optics",
    slug: "ocular-optics",
    logo: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=200",
    description: "Polarized acetate eyewear handcrafted in Japan.",
  },
  {
    name: "Saffiano",
    slug: "saffiano",
    logo: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=200",
    description: "Famous for textured cross-hatch calfskin accessories.",
  },
  {
    name: "Apex Design",
    slug: "apex-design",
    logo: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=200",
    description: "Technical travel wear built with ballistic nylon and composites.",
  },
  {
    name: "Solis",
    slug: "solis",
    logo: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=200",
    description: "Warm gold and precious metals curated for luxury styling.",
  },
  {
    name: "Obsidian",
    slug: "obsidian",
    logo: "https://images.unsplash.com/photo-153568351111-a8a2a2a2a2a2?q=80&w=200",
    description: "Matte black titanium and dark stone fine accessories.",
  },
  {
    name: "Heritage Guild",
    slug: "heritage-guild",
    logo: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=200",
    description: "Celebrating hand-woven techniques and full-grain legacy leather.",
  },
  {
    name: "Velo Tech",
    slug: "velo-tech",
    logo: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=200",
    description: "Smart sleeves and tech pouches for modern commuters.",
  },
  {
    name: "Terra Leather",
    slug: "terra-leather",
    logo: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=200",
    description: "Vegetable-tanned organic hides developed sustainably.",
  },
  {
    name: "Sterling & Co",
    slug: "sterling-co",
    logo: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=200",
    description: "Crafting fine jewelry and formal cufflinks since 1910.",
  },
  {
    name: "Aero Eyewear",
    slug: "aero-eyewear",
    logo: "https://images.unsplash.com/photo-1508296695146-257a814070b4?q=80&w=200",
    description: "Ultralight titanium aviators and active shades.",
  },
  {
    name: "Kensington",
    slug: "kensington",
    logo: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=200",
    description: "British style classic leather and umbrellas.",
  },
  {
    name: "Zephyr",
    slug: "zephyr",
    logo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200",
    description: "Casual accessories styled for marine and active environments.",
  },
];

function getUnsplashId(url: string): string {
  const match = url.match(/photo-\d+-[a-zA-Z0-9]+/);
  return match ? match[0] : `asset-${Math.round(Math.random() * 100000)}`;
}

async function uploadToCloudinary(imageUrl: string, publicId: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return imageUrl;
  }

  // Only upload remote URLs to Cloudinary
  if (!imageUrl.startsWith("http")) {
    return imageUrl;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    public_id: publicId,
    timestamp: timestamp,
  };

  const sortedKeys = Object.keys(params).sort();
  const paramString =
    sortedKeys.map((k) => `${k}=${params[k as keyof typeof params]}`).join("&") + apiSecret;
  const signature = crypto.createHash("sha1").update(paramString).digest("hex");

  const formData = new URLSearchParams();
  formData.append("file", imageUrl);
  formData.append("public_id", publicId);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (result.error) {
      console.warn(`⚠️ Cloudinary upload skipped for ${imageUrl}:`, result.error.message);
      return imageUrl;
    }
    return result.secure_url;
  } catch (err: any) {
    console.warn(`⚠️ Cloudinary API error for ${imageUrl}:`, err.message);
    return imageUrl;
  }
}

async function main() {
  console.log("🌱 Starting seed database run...");

  // 1. Clear database
  console.log("🧼 Cleaning existing tables...");
  await prisma.productImage.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create users (Admin, SuperAdmin, Customer)
  console.log("👤 Creating seed users...");
  const passwordHash = await bcrypt.hash("Password123!", 10);

  await prisma.user.create({
    data: {
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@luxstore.com",
      passwordHash,
      role: UserRole.SUPERADMIN,
      isEmailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      firstName: "Jane",
      lastName: "Admin",
      email: "admin@luxstore.com",
      passwordHash,
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      firstName: "John",
      lastName: "Customer",
      email: "customer@luxstore.com",
      passwordHash,
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
    },
  });

  // 3. Create Categories
  console.log("📁 Seeding 10 Categories...");
  const categoriesDb: any[] = [];
  const categoryMap = new Map<string, any>();
  for (const cat of CATEGORIES) {
    let imageUrl = cat.image;
    if (imageUrl.startsWith("http")) {
      const unsplashId = getUnsplashId(imageUrl);
      imageUrl = await uploadToCloudinary(imageUrl, `categories/${unsplashId}`);
    }

    const createdCat = await prisma.category.create({
      data: {
        ...cat,
        image: imageUrl,
      },
    });
    categoriesDb.push(createdCat);
    categoryMap.set(cat.slug, createdCat);
  }

  // 4. Create Brands
  console.log("🏷️ Seeding 15 Brands...");
  const brandsDb: any[] = [];
  const brandMap = new Map<string, any>();
  for (const b of BRANDS) {
    let logoUrl = b.logo;
    if (logoUrl && logoUrl.startsWith("http")) {
      const unsplashId = getUnsplashId(logoUrl);
      logoUrl = await uploadToCloudinary(logoUrl, `brands/${unsplashId}`);
    }
    const createdBrand = await prisma.brand.create({
      data: {
        ...b,
        logo: logoUrl,
      },
    });
    brandsDb.push(createdBrand);
    brandMap.set(b.slug, createdBrand);
  }

  // 5. Create 100 Products with verified, category-accurate images and luxury names
  console.log("🛍️ Seeding 100 Products with verified, proper luxury images...");
  for (let i = 0; i < SEED_PRODUCTS.length; i++) {
    const p = SEED_PRODUCTS[i];
    const category = categoryMap.get(p.categorySlug);
    const brand = brandMap.get(p.brandSlug);

    if (!category || !brand) {
      console.warn(
        `Skipping ${p.name}: category ${p.categorySlug} or brand ${p.brandSlug} not found.`,
      );
      continue;
    }

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        sku: p.sku,
        categoryId: category.id,
        brandId: brand.id,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        featured: p.featured,
        active: true,
        ratingAverage: Number((4.3 + (i % 6) * 0.1).toFixed(1)),
        ratingCount: 12 + i * 5,
      },
    });

    // 1. Primary local image (served reliably from public/images/products/...)
    await prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl: p.localImage,
        altText: `${p.name} Studio View`,
        displayOrder: 0,
      },
    });

    // 2. Secondary high-resolution editorial angle image
    let secondaryUrl = p.unsplashUrl;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const unsplashId = getUnsplashId(secondaryUrl);
      secondaryUrl = await uploadToCloudinary(secondaryUrl, `products/${unsplashId}`);
    }

    await prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl: secondaryUrl,
        altText: `${p.name} Editorial Angle`,
        displayOrder: 1,
      },
    });

    // 3. Initialize inventory
    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: 20 + (i % 10) * 3,
        lowStockThreshold: 5,
      },
    });
  }

  console.log("🎉 Seeding database run completed successfully with proper product images!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding database run failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
