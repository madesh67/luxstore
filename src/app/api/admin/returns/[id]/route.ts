import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { verifyAdmin } from "@/lib/auth-guards";
import { ReturnService } from "@/services/return.service";
import { z } from "zod";
import { ReturnStatus } from "@prisma/client";

const processReturnSchema = z.object({
  status: z.nativeEnum(ReturnStatus),
  adminNotes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = processReturnSchema.parse(body);

    const returnRequest = await ReturnService.processReturnRequest(id, status, adminNotes);
    return successResponse({ returnRequest });
  } catch (error) {
    return handleApiError(error);
  }
}
