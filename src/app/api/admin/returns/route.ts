import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { ReturnService } from "@/services/return.service";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));

    const result = await ReturnService.getAdminReturnRequests({ page, limit });
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
