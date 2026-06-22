import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Timepieces", slug: "timepieces", description: "Precision chronographs and minimalist wristwatches.", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800" },
  { name: "Leather Bags", slug: "leather-bags", description: "Full-grain leather briefcases, duffels, and everyday carries.", image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800" },
  { name: "Wallets & Folios", slug: "wallets-folios", description: "Sleek cardholders, bifold wallets, and document organizers.", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=800" },
  { name: "Eyewear", slug: "eyewear", description: "Handcrafted polarized sunglasses and optical frames.", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800" },
  { name: "Belts", slug: "belts", description: "Classic and contemporary belts in premium calfskin.", image: "https://images.unsplash.com/photo-1624222247344-550fb8ec5522?q=80&w=800" },
  { name: "Travel Cases", slug: "travel-cases", description: "Hard-shell luggage, passport covers, and wash bags.", image: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?q=80&w=800" },
  { name: "Backpacks", slug: "backpacks", description: "Premium utility backpacks designed for commutes and getaways.", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800" },
  { name: "Tech Sleeves", slug: "tech-sleeves", description: "Sleek protective covers for laptops, tablets, and phones.", image: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=800" },
  { name: "Fine Jewelry", slug: "fine-jewelry", description: "Minimalist bands, signet rings, and luxury bracelets.", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800" },
  { name: "Cufflinks", slug: "cufflinks", description: "Sterling silver, gold, and stone cufflinks for formal attire.", image: "https://images.unsplash.com/photo-1616854129598-6ff6c17cb058?q=80&w=800" },
];

const BRANDS = [
  { name: "Atelier V", slug: "atelier-v", logo: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=200", description: "Italian heritage atelier specializing in hand-stitched leathers." },
  { name: "Chronos & Co", slug: "chronos-co", logo: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=200", description: "Generational Swiss watchmaker focused on mechanical precision." },
  { name: "Nordic Craft", slug: "nordic-craft", logo: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?q=80&w=200", description: "Minimalist Scandinavian design highlighting organic forms." },
  { name: "Ocular Optics", slug: "ocular-optics", logo: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=200", description: "Polarized acetate eyewear handcrafted in Japan." },
  { name: "Saffiano", slug: "saffiano", logo: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=200", description: "Famous for textured cross-hatch calfskin accessories." },
  { name: "Apex Design", slug: "apex-design", logo: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=200", description: "Technical travel wear built with ballistic nylon and composites." },
  { name: "Solis", slug: "solis", logo: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=200", description: "Warm gold and precious metals curated for luxury styling." },
  { name: "Obsidian", slug: "obsidian", logo: "https://images.unsplash.com/photo-1535683511111-a8a2a2a2a2a2?q=80&w=200", description: "Matte black titanium and dark stone fine accessories." },
  { name: "Heritage Guild", slug: "heritage-guild", logo: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=200", description: "Celebrating hand-woven techniques and full-grain legacy leather." },
  { name: "Velo Tech", slug: "velo-tech", logo: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=200", description: "Smart sleeves and tech pouches for modern commuters." },
  { name: "Terra Leather", slug: "terra-leather", logo: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=200", description: "Vegetable-tanned organic hides developed sustainably." },
  { name: "Sterling & Co", slug: "sterling-co", logo: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=200", description: "Crafting fine jewelry and formal cufflinks since 1910." },
  { name: "Aero Eyewear", slug: "aero-eyewear", logo: "https://images.unsplash.com/photo-1508296695146-257a814070b4?q=80&w=200", description: "Ultralight titanium aviators and active shades." },
  { name: "Kensington", slug: "kensington", logo: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=200", description: "British style classic leather and umbrellas." },
  { name: "Zephyr", slug: "zephyr", logo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200", description: "Casual accessories styled for marine and active environments." },
];

const UNSPLASH_IMAGES: Record<string, string[]> = {
  timepieces: [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=800",
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800",
    "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=800",
  ],
  "leather-bags": [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800",
    "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800",
  ],
  "wallets-folios": [
    "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=800",
    "https://images.unsplash.com/photo-1589756823695-278bc923f962?q=80&w=800",
    "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=800",
  ],
  eyewear: [
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800",
    "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800",
    "https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=800",
  ],
  belts: [
    "https://images.unsplash.com/photo-1624222247344-550fb8ec5522?q=80&w=800",
    "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=800",
  ],
  "travel-cases": [
    "https://images.unsplash.com/photo-1553531384-cc64ac80f931?q=80&w=800",
    "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?q=80&w=800",
  ],
  backpacks: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800",
    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=800",
  ],
  "tech-sleeves": [
    "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=800",
    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=800",
  ],
  "fine-jewelry": [
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800",
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800",
  ],
  cufflinks: [
    "https://images.unsplash.com/photo-1616854129598-6ff6c17cb058?q=80&w=800",
    "https://images.unsplash.com/photo-1616854129598-6ff6c17cb058?q=80&w=800",
  ],
};

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
  
  const superAdmin = await prisma.user.create({
    data: {
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@luxstore.com",
      passwordHash,
      role: UserRole.SUPERADMIN,
      isEmailVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      firstName: "Jane",
      lastName: "Admin",
      email: "admin@luxstore.com",
      passwordHash,
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  const customer = await prisma.user.create({
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
  const categoriesDb = [];
  for (const cat of CATEGORIES) {
    const createdCat = await prisma.category.create({
      data: cat,
    });
    categoriesDb.push(createdCat);
  }

  // 4. Create Brands
  console.log("🏷️ Seeding 15 Brands...");
  const brandsDb = [];
  for (const b of BRANDS) {
    const createdBrand = await prisma.brand.create({
      data: b,
    });
    brandsDb.push(createdBrand);
  }

  // 5. Create 100 Products
  console.log("🛍️ Seeding 100 Products...");
  let skuCounter = 1000;
  
  // Generate 10 products per category
  for (let cIdx = 0; cIdx < categoriesDb.length; cIdx++) {
    const category = categoriesDb[cIdx];
    const catImages = UNSPLASH_IMAGES[category.slug] || ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800"];

    for (let pCount = 1; pCount <= 10; pCount++) {
      skuCounter++;
      // Rotate through brands
      const brand = brandsDb[(cIdx * 10 + pCount) % brandsDb.length];
      
      const productName = `${brand.name} ${category.name.substring(0, category.name.length - 1)} v${pCount}`;
      const productSlug = `${brand.slug}-${category.slug}-${pCount}`;
      const price = 2500 + pCount * 1200 + (cIdx * 800);
      const compareAtPrice = price + 1500;
      const featured = pCount % 4 === 0; // 25% featured
      
      const ratingAverage = 4.0 + (pCount % 10) * 0.1;
      const ratingCount = 5 + pCount * 12 + cIdx * 3;

      const product = await prisma.product.create({
        data: {
          name: productName,
          slug: productSlug,
          shortDescription: `Crafted by ${brand.name}, this premium ${category.name.toLowerCase()} piece represents functional minimalism.`,
          description: `This exquisite ${productName} is a testament to the partnership between ${brand.name} and LuxStore. Engineered for those who appreciate detailed craftsmanship, this accessory is manufactured using premium materials designed to resist wear while maintaining an elegant aesthetic. Ideal for both daily carries and evening wear.`,
          sku: `LUX-${category.slug.substring(0, 3).toUpperCase()}-${skuCounter}`,
          categoryId: category.id,
          brandId: brand.id,
          price,
          compareAtPrice,
          featured,
          active: true,
          ratingAverage,
          ratingCount,
        },
      });

      // Create multiple images per product
      for (let imgIdx = 0; imgIdx < catImages.length; imgIdx++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            imageUrl: catImages[imgIdx],
            altText: `${productName} view ${imgIdx + 1}`,
            displayOrder: imgIdx,
          },
        });
      }

      // Initialize default inventory
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: 20 + pCount * 2,
          lowStockThreshold: 5,
        },
      });
    }
  }

  console.log("🎉 Seeding database run completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding database run failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
