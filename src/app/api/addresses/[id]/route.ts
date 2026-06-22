import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { AddressService } from "@/services/address.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to update address", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const body = await request.json();
    const address = await AddressService.updateAddress(id, user.userId, body);
    return successResponse({ address });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to delete address", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const address = await AddressService.deleteAddress(id, user.userId);
    return successResponse({ address, message: "Address deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
