import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const body = await request.json();
    const { action, details } = body;

    if (!action) {
      return successResponse({ message: "Action is required" }, 400);
    }

    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // Write to audit log database table
    await prisma.auditLog.create({
      data: {
        userId: user?.userId || null,
        action: `SHOP_${action.toUpperCase()}`,
        details: JSON.stringify(details),
        ipAddress,
      },
    });

    return successResponse({ message: "Event tracked successfully" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
