import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminDashboardService } from "@/services/admin-dashboard.service";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const summary = await AdminDashboardService.getDashboardSummary();

    return successResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
