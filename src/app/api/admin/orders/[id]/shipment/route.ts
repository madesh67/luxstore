import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { OrderService } from "@/services/order.service";
import { z } from "zod";

const shipmentSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  carrier: z.string().min(1, "Carrier is required"),
  trackingUrl: z.string().url("Tracking URL must be valid"),
  status: z.string().default("SHIPPED"),
  description: z.string().min(1, "Event description is required"),
  location: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const validatedData = shipmentSchema.parse(body);

    const shipment = await OrderService.updateShipment(id, validatedData);
    return successResponse({ shipment });
  } catch (error) {
    return handleApiError(error);
  }
}
