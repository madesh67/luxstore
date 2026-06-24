import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Timepieces", slug: "timepieces", description: "Precision chronographs and minimalist wristwatches.", image: "https://images.unsplash.com/photo-1600003014637-ff82a275e191?q=80&w=800" },
  { name: "Leather Bags", slug: "leather-bags", description: "Full-grain leather briefcases, duffels, and everyday carries.", image: "https://images.unsplash.com/photo-1571829604981-ea159f94e5ad?q=80&w=800" },
  { name: "Wallets & Folios", slug: "wallets-folios", description: "Sleek cardholders, bifold wallets, and document organizers.", image: "https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?q=80&w=800" },
  { name: "Eyewear", slug: "eyewear", description: "Handcrafted polarized sunglasses and optical frames.", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800" },
  { name: "Belts", slug: "belts", description: "Classic and contemporary belts in premium calfskin.", image: "https://images.unsplash.com/photo-1772987182473-41dfcbf013e4?q=80&w=800" },
  { name: "Travel Cases", slug: "travel-cases", description: "Hard-shell luggage, passport covers, and wash bags.", image: "https://images.unsplash.com/photo-1502301197179-65228ab57f78?q=80&w=800" },
  { name: "Backpacks", slug: "backpacks", description: "Premium utility backpacks designed for commutes and getaways.", image: "https://images.unsplash.com/photo-1622560481156-01fc7e1693e6?q=80&w=800" },
  { name: "Tech Sleeves", slug: "tech-sleeves", description: "Sleek protective covers for laptops, tablets, and phones.", image: "https://images.unsplash.com/photo-1689757855413-9e366c2011f1?q=80&w=800" },
  { name: "Fine Jewelry", slug: "fine-jewelry", description: "Minimalist bands, signet rings, and luxury bracelets.", image: "https://images.unsplash.com/photo-1633934542430-0905ccb5f050?q=80&w=800" },
  { name: "Cufflinks", slug: "cufflinks", description: "Sterling silver, gold, and stone cufflinks for formal attire.", image: "https://images.unsplash.com/photo-1685392024138-36e7aade79f7?q=80&w=800" },
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

const UNIQUE_UNSPLASH_IDS: Record<string, string[]> = {
  timepieces: [
    "photo-1670177257750-9b47927f68eb",
    "photo-1670404160620-a3a86428560e",
    "photo-1600003014637-ff82a275e191",
    "photo-1547996160-81dfa63595aa",
    "photo-1620625515032-6ed0c1790c75",
    "photo-1587925358603-c2eea5305bbc",
    "photo-1747995525955-92010650c3ae",
    "photo-1587865501868-36104829d7db",
    "photo-1704783308748-9e5396e0956d",
    "photo-1526743655626-e3d757b13d61"
  ],
  "leather-bags": [
    "photo-1781514041306-489a8d346265",
    "photo-1772506715023-7e1586e2f4aa",
    "photo-1761369333007-14045c7d2890",
    "photo-1721630175454-0ca4517bb530",
    "photo-1778546978267-b93e8c6ea099",
    "photo-1571829604981-ea159f94e5ad",
    "photo-1716295177956-420a647c83ac",
    "photo-1599568723850-14196ee0f991",
    "photo-1573227896778-8f378c4029d4",
    "photo-1541763029361-21b1788343db"
  ],
  "wallets-folios": [
    "photo-1628483211662-9bcc692c46dc",
    "photo-1620109176813-e91290f6c795",
    "photo-1637486069202-b1163268c240",
    "photo-1628483212179-49f29440423e",
    "photo-1614260937560-c749cc17da94",
    "photo-1637168943285-a8f9ea0dc3f5",
    "photo-1629958513881-a086d21383cd",
    "photo-1586579724969-2cb96841bcb8",
    "photo-1512414947060-048d53abb081",
    "photo-1620109177589-677c8d0ceba6"
  ],
  eyewear: [
    "photo-1572635196237-14b3f281503f",
    "photo-1584036553516-bf83210aa16c",
    "photo-1577803645773-f96470509666",
    "photo-1610136649349-0f646f318053",
    "photo-1611222777277-61319d63ca94",
    "photo-1608539733292-190446b22b83",
    "photo-1508296695146-257a814070b4",
    "photo-1566421966482-ad8076104d8e",
    "photo-1509695507497-903c140c43b0",
    "photo-1559070081-648fb00b2ed1"
  ],
  belts: [
    "photo-1772987182473-41dfcbf013e4",
    "photo-1759350075334-19e4854dd5c8",
    "photo-1760719465737-e329e18731d1",
    "photo-1780245771103-3b3dc03e34aa",
    "photo-1780545311196-f8b507b08b94",
    "photo-1721630175454-0ca4517bb530",
    "photo-1778546978267-b93e8c6ea099",
    "photo-1571829604981-ea159f94e5ad",
    "photo-1716295177956-420a647c83ac",
    "photo-1599568723850-14196ee0f991"
  ],
  cufflinks: [
    "photo-1685392024138-36e7aade79f7",
    "photo-1721630175454-0ca4517bb530",
    "photo-1780541027382-cf422369bdaa",
    "photo-1778546978267-b93e8c6ea099",
    "photo-1748840176432-4b2474189d52",
    "photo-1507141704767-f15ad6e1befd",
    "photo-1592593044691-f45c8db82a48",
    "photo-1490367532201-b9bc1dc483f6",
    "photo-1617960002868-099f4dea7567",
    "photo-1708551362497-c6c6a9b85d8f"
  ],
  "fine-jewelry": [
    "photo-1633934542430-0905ccb5f050",
    "photo-1620656798579-1984d9e87df7",
    "photo-1585960622850-ed33c41d6418",
    "photo-1608042314453-ae338d80c427",
    "photo-1673131158657-4404fd1f041a",
    "photo-1673131158656-84601f4d00ea",
    "photo-1511253819057-5408d4d70465",
    "photo-1631050165122-626a1377fbce",
    "photo-1682823544362-b751e260e33c",
    "photo-1558882268-15aa056d885f"
  ],
  "travel-cases": [
    "photo-1502301197179-65228ab57f78",
    "photo-1522199710521-72d69614c702",
    "photo-1648737967037-96967e9151b5",
    "photo-1631728370215-9440df2e29e3",
    "photo-1678667720699-5c0fc04ac166",
    "photo-1678667590014-4769c04fc921",
    "photo-1779364815233-84ec09c6d6d5",
    "photo-1732605549677-6763dc81549b",
    "photo-1591719539805-81516f58dabc",
    "photo-1706819399603-428b06afe3fc"
  ],
  "tech-sleeves": [
    "photo-1689757855413-9e366c2011f1",
    "photo-1708447135262-850979354fcf",
    "photo-1657603539862-5194b4ae171f",
    "photo-1657603530277-b18bea816a78",
    "photo-1508014938279-b7418e08350c",
    "photo-1702561667986-113f3a9e06bc",
    "photo-1611461527944-1a718332613b",
    "photo-1688296526377-4f64cfa7320b",
    "photo-1688296524835-363a81b93921",
    "photo-1702561667794-c24589d98f05"
  ],
  backpacks: [
    "photo-1622560481156-01fc7e1693e6",
    "photo-1642375352634-ad952121fdb3",
    "photo-1622560481979-f5b0174242a0",
    "photo-1642375352724-8b523c67b8be",
    "photo-1591098204373-9116f28a74bf",
    "photo-1562869319-a1368ba7fe75",
    "photo-1622560481336-b44c811b0958",
    "photo-1637851699902-846db7f0ec67",
    "photo-1665832102447-a853788f620c",
    "photo-1562869323-d3d7be3e88a6"
  ]
};

function getUnsplashId(url: string): string {
  const match = url.match(/photo-\d+-[a-zA-Z0-9]+/);
  return match ? match[0] : `random-${Math.round(Math.random() * 100000)}`;
}

async function uploadToCloudinary(imageUrl: string, publicId: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("⚠️ Cloudinary environment variables missing, using original URL.");
    return imageUrl;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    public_id: publicId,
    timestamp: timestamp,
  };

  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map(k => `${k}=${params[k as keyof typeof params]}`).join('&') + apiSecret;
  const signature = crypto.createHash('sha1').update(paramString).digest('hex');

  const formData = new URLSearchParams();
  formData.append('file', imageUrl);
  formData.append('public_id', publicId);
  formData.append('timestamp', String(timestamp));
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (result.error) {
      console.error(`❌ Cloudinary upload failed for ${imageUrl}:`, result.error.message);
      return imageUrl;
    }
    return result.secure_url;
  } catch (err: any) {
    console.error(`❌ Cloudinary API error for ${imageUrl}:`, err.message);
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

  // 3. Create Categories (uploading images to Cloudinary)
  console.log("📁 Seeding 10 Categories and uploading images...");
  const categoriesDb = [];
  for (const cat of CATEGORIES) {
    const unsplashId = getUnsplashId(cat.image);
    console.log(`Uploading category image for ${cat.name}...`);
    const cloudinaryUrl = await uploadToCloudinary(cat.image, `categories/${unsplashId}`);
    
    const createdCat = await prisma.category.create({
      data: {
        ...cat,
        image: cloudinaryUrl,
      },
    });
    categoriesDb.push(createdCat);
  }

  // 4. Create Brands (uploading logos to Cloudinary)
  console.log("🏷️ Seeding 15 Brands and uploading logos...");
  const brandsDb = [];
  for (const b of BRANDS) {
    let logoUrl = b.logo;
    if (logoUrl) {
      const unsplashId = getUnsplashId(logoUrl);
      console.log(`Uploading brand logo for ${b.name}...`);
      logoUrl = await uploadToCloudinary(logoUrl, `brands/${unsplashId}`);
    }
    const createdBrand = await prisma.brand.create({
      data: {
        ...b,
        logo: logoUrl,
      },
    });
    brandsDb.push(createdBrand);
  }

  // 5. Create 100 Products with unique, relevant images (uploading to Cloudinary)
  console.log("🛍️ Seeding 100 Products and uploading unique images...");
  let skuCounter = 1000;
  
  // Generate 10 products per category
  for (let cIdx = 0; cIdx < categoriesDb.length; cIdx++) {
    const category = categoriesDb[cIdx];
    const catImages = (UNIQUE_UNSPLASH_IDS[category.slug] || []).map(
      id => `https://images.unsplash.com/${id}?q=80&w=800`
    );

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

      // Assign exactly 1 unique primary image to the product
      const rawUrl = catImages[pCount - 1] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800";
      const unsplashId = getUnsplashId(rawUrl);
      console.log(`Uploading unique product image for ${productName} (${unsplashId})...`);
      const cloudinaryUrl = await uploadToCloudinary(rawUrl, `products/${unsplashId}`);

      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: cloudinaryUrl,
          altText: `${productName} view 1`,
          displayOrder: 0,
        },
      });

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
