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
    const search = searchParams.get("search") || undefined;
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";

    const result = await AdminInventoryService.getInventory({
      page,
      limit,
      search,
      lowStockOnly,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
