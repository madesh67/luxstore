import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminInventoryService } from "@/services/admin-inventory.service";
import { adminInventoryThresholdSchema } from "@/schemas/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const validatedData = adminInventoryThresholdSchema.parse(body);

    const updated = await AdminInventoryService.updateThreshold(id, validatedData, admin.userId);

    return successResponse({
      message: "Inventory parameters updated successfully",
      inventory: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
