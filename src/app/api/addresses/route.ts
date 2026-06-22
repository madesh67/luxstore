import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { AddressService } from "@/services/address.service";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to view addresses", 401, "UNAUTHORIZED");
    }

    const addresses = await AddressService.getAddresses(user.userId);
    return successResponse({ addresses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to create addresses", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const address = await AddressService.createAddress(user.userId, body);
    return successResponse({ address }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
