import { prisma } from "@/lib/prisma";

export const AddressRepository = {
  async findManyByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });
  },

  async findById(id: string) {
    return prisma.address.findFirst({
      where: { id, deletedAt: null },
    });
  },

  async create(userId: string, data: {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    title?: string;
    isDefault?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const isDefault = data.isDefault || false;

      if (isDefault) {
        // Clear previous default addresses
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // If this is the user's first address, force it to be default
      const count = await tx.address.count({
        where: { userId, deletedAt: null },
      });
      
      const shouldBeDefault = isDefault || count === 0;

      return tx.address.create({
        data: {
          userId,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country || "India",
          title: data.title || null,
          isDefault: shouldBeDefault,
        },
      });
    });
  },

  async update(id: string, userId: string, data: {
    fullName?: string;
    phoneNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    title?: string;
    isDefault?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const isDefault = data.isDefault || false;

      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          title: data.title,
          isDefault: isDefault ? true : undefined,
        },
      });
    });
  },

  async delete(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!address) return null;

      // Soft delete
      const deletedAddress = await tx.address.update({
        where: { id },
        data: { deletedAt: new Date(), isDefault: false },
      });

      // If we deleted the default address, set another active address as default
      if (address.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId, deletedAt: null },
          orderBy: { createdAt: "desc" },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }

      return deletedAddress;
    });
  },

  async setDefault(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Clear previous default markers
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      // 2. Set current default marker
      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  },
};
