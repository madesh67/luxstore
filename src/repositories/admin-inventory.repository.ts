import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface InventoryQueryParams {
  page: number;
  limit: number;
  search?: string;
  lowStockOnly?: boolean;
}

export const AdminInventoryRepository = {
  /**
   * Find paginated inventory tracking details with product relation.
   */
  async findMany(params: InventoryQueryParams) {
    const { page, limit, search, lowStockOnly = false } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = {

      product: {
        deletedAt: null,
      },
    };

    if (lowStockOnly) {
      where.quantity = {
        lte: prisma.inventory.fields.lowStockThreshold,
      };
    }

    if (search) {
      where.product = {
        deletedAt: null,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              price: true,
            },
          },
        },
        orderBy: {
          quantity: "asc",
        },
      }),
      prisma.inventory.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Update stock thresholds or incoming flag.
   */
  async updateThreshold(id: string, data: { lowStockThreshold?: number; incoming?: number }) {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) throw new Error("Inventory record not found");

    const updated = await prisma.inventory.update({
      where: { id },
      data: {
        lowStockThreshold: data.lowStockThreshold !== undefined ? data.lowStockThreshold : undefined,
        incoming: data.incoming !== undefined ? data.incoming : undefined,
      },
    });

    // Re-sync available quantity
    await this.syncAvailable(id);

    return updated;
  },

  /**
   * Record transaction stock adjustments & logs.
   */
  async adjustStock(
    id: string,
    data: {
      quantityChange: number; // Positive (increment) or negative (decrement)
      action: string; // ADJUSTMENT, RESERVATION, DISPATCH, RECONCILIATION
      notes?: string;
      userId?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { id },
      });

      if (!inventory) throw new Error("Inventory record not found");

      const previousQty = inventory.quantity;
      const newQty = Math.max(0, previousQty + data.quantityChange);

      const updatedInventory = await tx.inventory.update({
        where: { id },
        data: {
          quantity: newQty,
          available: Math.max(0, newQty - inventory.reserved),
        },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryId: id,
          action: data.action,
          quantity: data.quantityChange,
          previousQty,
          newQty,
          notes: data.notes || null,
          userId: data.userId || null,
        },
      });

      return updatedInventory;
    });
  },

  /**
   * Handle stock reservations for carts/checkouts.
   */
  async adjustReservation(
    id: string,
    data: {
      reservationChange: number; // Positive (reserved) or negative (released)
      notes?: string;
      userId?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { id },
      });

      if (!inventory) throw new Error("Inventory record not found");

      const newReserved = Math.max(0, inventory.reserved + data.reservationChange);
      const newAvailable = Math.max(0, inventory.quantity - newReserved);

      const updatedInventory = await tx.inventory.update({
        where: { id },
        data: {
          reserved: newReserved,
          available: newAvailable,
        },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryId: id,
          action: "RESERVATION",
          quantity: data.reservationChange,
          previousQty: inventory.reserved,
          newQty: newReserved,
          notes: data.notes || null,
          userId: data.userId || null,
        },
      });

      return updatedInventory;
    });
  },

  /**
   * Internal helper to sync available stock.
   */
  async syncAvailable(id: string) {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });
    if (!inventory) return;

    await prisma.inventory.update({
      where: { id },
      data: {
        available: Math.max(0, inventory.quantity - inventory.reserved),
      },
    });
  },

  /**
   * Find audit log history for stock movements.
   */
  async findHistory(params: { page: number; limit: number; inventoryId?: string }) {
    const { page, limit, inventoryId } = params;
    const skip = (page - 1) * limit;

    const where = inventoryId ? { inventoryId } : {};

    const [data, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          inventory: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),
      prisma.inventoryLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
