import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { NotificationRepository } from "@/repositories/notification.repository";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to modify notifications", 401, "UNAUTHORIZED");
    }

    await NotificationRepository.markAllAsRead(user.userId);
    return successResponse({ message: "All notifications marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
