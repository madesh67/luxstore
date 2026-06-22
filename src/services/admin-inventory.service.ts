import { AdminInventoryRepository, InventoryQueryParams } from "@/repositories/admin-inventory.repository";
import { prisma } from "@/lib/prisma";

export const AdminInventoryService = {
  async getInventory(params: InventoryQueryParams) {
    return AdminInventoryRepository.findMany(params);
  },

  async updateThreshold(id: string, data: { lowStockThreshold?: number; incoming?: number }, userId: string) {
    const updated = await AdminInventoryRepository.updateThreshold(id, data);

    await prisma.auditLog.create({
      data: {
        userId,
        action: "INVENTORY_THRESHOLD_UPDATE",
        details: `Updated inventory threshold/incoming on ID: ${id}. Low threshold: ${data.lowStockThreshold}, Incoming: ${data.incoming}`,
      },
    });

    // Check low stock and dispatch notification if below threshold
    await this.checkAndCreateAlerts(id);

    return updated;
  },

  async adjustStock(
    id: string,
    data: {
      quantityChange: number;
      action: string;
      notes?: string;
      userId: string;
    }
  ) {
    const updated = await AdminInventoryRepository.adjustStock(id, {
      quantityChange: data.quantityChange,
      action: data.action,
      notes: data.notes,
      userId: data.userId,
    });

    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: `INVENTORY_${data.action}`,
        details: `Adjusted inventory stock on ID: ${id} by ${data.quantityChange}. New quantity: ${updated.quantity}. Notes: ${data.notes || "none"}`,
      },
    });

    // Trigger low stock notifications
    await this.checkAndCreateAlerts(id);

    return updated;
  },

  async getInventoryHistory(params: { page: number; limit: number; inventoryId?: string }) {
    return AdminInventoryRepository.findHistory(params);
  },

  /**
   * Bulk updates stock parameters for multiple items.
   */
  async bulkUpdateInventory(
    adjustments: { id: string; quantityChange: number; notes?: string }[],
    userId: string
  ) {
    const results = [];
    for (const adj of adjustments) {
      const updated = await this.adjustStock(adj.id, {
        quantityChange: adj.quantityChange,
        action: "ADJUSTMENT",
        notes: adj.notes || "Bulk Stock Adjustment",
        userId,
      });
      results.push(updated);
    }
    return results;
  },

  /**
   * Evaluates if inventory has crossed below threshold and logs notification alerts for admins.
   */
  async checkAndCreateAlerts(inventoryId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });

    if (!inventory) return;

    if (inventory.quantity <= 0) {
      // Find all Admins and SuperAdmins to notify
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "SUPERADMIN"] },
        },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "Out of Stock Alert",
            message: `Product "${inventory.product.name}" (${inventory.product.sku}) is completely out of stock!`,
          },
        });
      }
    } else if (inventory.quantity <= inventory.lowStockThreshold) {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "SUPERADMIN"] },
        },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "Low Stock Alert",
            message: `Product "${inventory.product.name}" (${inventory.product.sku}) stock has dropped to ${inventory.quantity} units (Threshold: ${inventory.lowStockThreshold}).`,
          },
        });
      }
    }
  },
};
