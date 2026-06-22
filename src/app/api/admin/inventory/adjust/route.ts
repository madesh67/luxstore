import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminInventoryService } from "@/services/admin-inventory.service";
import { adminInventoryAdjustmentSchema } from "@/schemas/admin";

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    
    // Support bulk or single adjustment
    if (body.adjustments && Array.isArray(body.adjustments)) {
      const results = await AdminInventoryService.bulkUpdateInventory(body.adjustments, admin.userId);
      return successResponse({
        message: "Bulk inventory stock adjustments logged successfully",
        results,
      });
    }

    const { id, ...adjustmentData } = body;
    if (!id) {
      return successResponse({ success: false, error: { message: "Inventory ID is required" } }, 400);
    }

    const validatedData = adminInventoryAdjustmentSchema.parse(adjustmentData);

    const updated = await AdminInventoryService.adjustStock(id, {
      ...validatedData,
      userId: admin.userId,
    });

    return successResponse({
      message: "Inventory stock adjusted successfully",
      inventory: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
