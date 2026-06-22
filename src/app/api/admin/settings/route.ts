import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { StoreSettingService } from "@/services/store-setting.service";
import { storeSettingsBulkUpdateSchema } from "@/schemas/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");

    let result;
    if (group) {
      result = await StoreSettingService.getSettingsByGroup(group);
    } else {
      result = await StoreSettingService.getAllSettings();
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const validatedData = storeSettingsBulkUpdateSchema.parse(body);

    const updated = await StoreSettingService.bulkUpdate(validatedData, admin.userId);

    return successResponse({
      message: "Store settings updated successfully",
      settings: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
