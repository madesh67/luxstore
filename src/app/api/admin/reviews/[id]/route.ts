import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminReviewService } from "@/services/admin-review.service";
import { adminReviewStatusSchema, adminReviewFlagSchema } from "@/schemas/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await verifyAdmin(request);
    const body = await request.json();

    let review;
    if (body.status !== undefined) {
      const { status } = adminReviewStatusSchema.parse(body);
      review = await AdminReviewService.updateReviewStatus(id, status, admin.userId);
    } else if (body.isFlagged !== undefined) {
      const { isFlagged } = adminReviewFlagSchema.parse(body);
      review = await AdminReviewService.updateReviewFlag(id, isFlagged, admin.userId);
    } else {
      return successResponse({ success: false, error: { message: "Invalid fields provided" } }, 400);
    }

    return successResponse({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await verifyAdmin(request);

    const review = await AdminReviewService.deleteReview(id, admin.userId);

    return successResponse({
      message: "Review deleted successfully",
      review,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
