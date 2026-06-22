import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { ReturnService } from "@/services/return.service";
import { z } from "zod";

const returnRequestSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  customerNotes: z.string().optional(),
  attachments: z.any().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to request a return", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = returnRequestSchema.parse(body);

    const returnRequest = await ReturnService.submitReturnRequest(
      id,
      user.userId,
      validatedData
    );

    return successResponse({ returnRequest }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new AppError("Authentication required to view returns", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const returnRequest = await ReturnService.getCustomerReturnRequest(id, user.userId);
    return successResponse({ returnRequest });
  } catch (error) {
    return handleApiError(error);
  }
}
