import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { NotificationRepository } from "@/repositories/notification.repository";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to modify notification", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    await NotificationRepository.markAsRead(id, user.userId);
    return successResponse({ message: "Notification marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
