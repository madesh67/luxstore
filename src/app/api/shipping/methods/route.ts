import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { ShippingService } from "@/services/shipping.service";

export async function GET(_request: NextRequest) {
  try {
    const methods = await ShippingService.getActiveMethods();
    return successResponse({ methods });
  } catch (error) {
    return handleApiError(error);
  }
}
