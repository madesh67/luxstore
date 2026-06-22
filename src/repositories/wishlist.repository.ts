import { prisma } from "@/lib/prisma";

export const WishlistRepository = {
  async findByUserId(userId: string) {
    return prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              include: {
                images: { orderBy: { displayOrder: "asc" } },
                category: true,
                brand: true,
                inventory: true,
              },
            },
          },
        },
      },
    });
  },

  async findOrCreate(userId: string) {
    let wishlist = await this.findByUserId(userId);
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
        include: {
          items: {
            orderBy: { createdAt: "desc" },
            include: {
              product: {
                include: {
                  images: { orderBy: { displayOrder: "asc" } },
                  category: true,
                  brand: true,
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }
    return wishlist;
  },

  async findWishlistItem(wishlistId: string, productId: string) {
    return prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId,
        },
      },
    });
  },

  async addWishlistItem(wishlistId: string, productId: string) {
    return prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId,
      },
      include: {
        product: {
          include: {
            images: { orderBy: { displayOrder: "asc" } },
            category: true,
            brand: true,
            inventory: true,
          },
        },
      },
    });
  },

  async deleteWishlistItem(wishlistItemId: string) {
    return prisma.wishlistItem.delete({
      where: { id: wishlistItemId },
    });
  },

  async deleteWishlistItemByProduct(wishlistId: string, productId: string) {
    return prisma.wishlistItem.delete({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId,
        },
      },
    });
  },
};
