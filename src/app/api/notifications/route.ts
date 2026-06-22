import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { NotificationRepository } from "@/repositories/notification.repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to view notifications", 401, "UNAUTHORIZED");
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await NotificationRepository.findManyByUserId(user.userId, {
      page,
      limit,
      unreadOnly,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
