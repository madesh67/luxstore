import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminDashboardService } from "@/services/admin-dashboard.service";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    let dateRange = undefined;
    if (startDateStr && endDateStr) {
      dateRange = {
        start: new Date(startDateStr),
        end: new Date(endDateStr),
      };
    }

    const data = await AdminDashboardService.getAnalyticsData(dateRange);

    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
