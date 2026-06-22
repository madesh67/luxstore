import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { CloudinaryService } from "@/services/cloudinary.service";

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || "luxstore";
    const widthStr = formData.get("width") as string;
    const heightStr = formData.get("height") as string;

    if (!file) {
      return successResponse({ success: false, error: { message: "No file provided" } }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const size = file.size;

    const width = widthStr ? parseInt(widthStr, 10) : undefined;
    const height = heightStr ? parseInt(heightStr, 10) : undefined;

    const uploadResult = await CloudinaryService.uploadImage(buffer, fileName, {
      folder,
      width,
      height,
      crop: "limit",
    });

    await CloudinaryService.logUploadActivity(
      admin.userId,
      "IMAGE_UPLOAD",
      `Uploaded file "${fileName}" (${(size / 1024).toFixed(2)} KB) to folder "${folder}"`
    );

    return successResponse({
      message: "Image uploaded and optimized successfully",
      ...uploadResult,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
