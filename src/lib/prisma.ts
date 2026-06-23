import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const basePrisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = basePrisma;
}

export const prisma = basePrisma.$extends({
  result: {
    productImage: {
      imageUrl: {
        needs: { imageUrl: true },
        compute(img: { imageUrl: string }) {
          const url = img.imageUrl;
          if (url && url.includes("cloudinary.com") && url.includes("photo-")) {
            const match = url.match(/photo-\d+-[a-zA-Z0-9]{12}/);
            if (match) {
              return `https://images.unsplash.com/${match[0]}?q=80&w=800`;
            }
          }
          return url;
        }
      }
    }
  }
}) as unknown as PrismaClient;
