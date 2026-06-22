import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { OrderService } from "@/services/order.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);

    const { id } = await params;
    const order = await OrderService.getAdminOrderDetails(id);
    return successResponse({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
