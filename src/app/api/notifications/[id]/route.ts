import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { NotificationRepository } from "@/repositories/notification.repository";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to delete notification", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    await NotificationRepository.delete(id, user.userId);
    return successResponse({ message: "Notification deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
