import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { AddressService } from "@/services/address.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to set default address", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const address = await AddressService.setDefaultAddress(id, user.userId);
    return successResponse({ address, message: "Default address updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
