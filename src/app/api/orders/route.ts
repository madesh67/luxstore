import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { OrderService } from "@/services/order.service";
import { OrderStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to view orders", 401, "UNAUTHORIZED");
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search") || undefined;
    const statusParam = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrderParam = searchParams.get("sortOrder");

    const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";
    
    let status: OrderStatus | undefined = undefined;
    if (statusParam) {
      if (Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
        status = statusParam as OrderStatus;
      } else {
        throw new AppError("Invalid status filter value", 400, "INVALID_STATUS");
      }
    }

    const result = await OrderService.getCustomerOrders(user.userId, {
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
