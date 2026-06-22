import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminInventoryService } from "@/services/admin-inventory.service";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const inventoryId = searchParams.get("inventoryId") || undefined;

    const result = await AdminInventoryService.getInventoryHistory({
      page,
      limit,
      inventoryId,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
