import { prisma } from "@/lib/prisma";

export const CartRepository = {
  async findByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
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

  async findByGuestToken(guestToken: string) {
    return prisma.cart.findUnique({
      where: { guestToken },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
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

  async findOrCreateForUser(userId: string) {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
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
    return cart;
  },

  async findOrCreateForGuest(guestToken: string) {
    let cart = await this.findByGuestToken(guestToken);
    if (!cart) {
      cart = await prisma.cart.create({
        data: { guestToken },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
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
    return cart;
  },

  async findCartItem(cartId: string, productId: string) {
    return prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });
  },

  async addCartItem(cartId: string, productId: string, quantity: number) {
    return prisma.cartItem.create({
      data: {
        cartId,
        productId,
        quantity,
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

  async updateCartItem(cartItemId: string, quantity: number) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
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

  async deleteCartItem(cartItemId: string) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  },

  async clearCart(cartId: string) {
    return prisma.cartItem.deleteMany({
      where: { cartId },
    });
  },

  async deleteCart(cartId: string) {
    return prisma.cart.delete({
      where: { id: cartId },
    });
  },

  async mergeGuestCart(userId: string, guestToken: string, maxQuantityLimit: number) {
    return prisma.$transaction(async (tx) => {
      // 1. Get user cart and guest cart
      const userCart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      const guestCart = await tx.cart.findUnique({
        where: { guestToken },
        include: { items: true },
      });

      if (!guestCart || guestCart.items.length === 0) {
        return userCart || tx.cart.create({ data: { userId } });
      }

      // Ensure user cart exists
      let activeUserCart = userCart;
      if (!activeUserCart) {
        activeUserCart = await tx.cart.create({
          data: { userId },
          include: { items: true },
        });
      }

      // 2. Merge guest items into user cart
      for (const guestItem of guestCart.items) {
        const existingUserItem = activeUserCart.items.find(
          (item) => item.productId === guestItem.productId
        );

        if (existingUserItem) {
          // Combine quantities, enforcing upper limit
          const combinedQuantity = Math.min(
            existingUserItem.quantity + guestItem.quantity,
            maxQuantityLimit
          );
          await tx.cartItem.update({
            where: { id: existingUserItem.id },
            data: { quantity: combinedQuantity },
          });
        } else {
          // Re-associate item with user's cart
          await tx.cartItem.create({
            data: {
              cartId: activeUserCart.id,
              productId: guestItem.productId,
              quantity: guestItem.quantity,
            },
          });
        }
      }

      // 3. Clear guest cart items and delete guest cart
      await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      await tx.cart.delete({ where: { id: guestCart.id } });

      // Return fully updated user cart
      return tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
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
    });
  },
};
