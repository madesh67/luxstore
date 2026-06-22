import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { AdminReviewService } from "@/services/admin-review.service";
import { ReviewStatus } from "@prisma/client";
import { adminReviewBulkStatusSchema, adminReviewBulkDeleteSchema } from "@/schemas/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as ReviewStatus) || undefined;
    const isFlaggedStr = searchParams.get("isFlagged");
    const isFlagged = isFlaggedStr !== null ? isFlaggedStr === "true" : undefined;

    const result = await AdminReviewService.getReviews({
      page,
      limit,
      search,
      status,
      isFlagged,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    const body = await request.json();
    const validatedData = adminReviewBulkStatusSchema.parse(body);

    const result = await AdminReviewService.bulkUpdateReviewStatus(
      validatedData.ids,
      validatedData.status,
      admin.userId
    );

    return successResponse({
      message: `Bulk updated ${validatedData.ids.length} reviews successfully`,
      result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    const body = await request.json();
    const validatedData = adminReviewBulkDeleteSchema.parse(body);

    const result = await AdminReviewService.bulkDeleteReviews(validatedData.ids, admin.userId);

    return successResponse({
      message: `Bulk deleted ${validatedData.ids.length} reviews successfully`,
      result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
