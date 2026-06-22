import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { OrderService } from "@/services/order.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to view order details", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const order = await OrderService.getCustomerOrderDetails(id, user.userId);
    return successResponse({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
