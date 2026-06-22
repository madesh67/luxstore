import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { OrderService } from "@/services/order.service";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const statusTransitionSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  timelineDescription: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const { status, timelineDescription } = statusTransitionSchema.parse(body);

    const order = await OrderService.updateOrderStatus(id, status, timelineDescription);
    return successResponse({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
