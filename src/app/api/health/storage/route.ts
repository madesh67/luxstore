import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isConfigured = !!(cloudName && apiKey && apiSecret);

    if (!isConfigured) {
      throw new Error("Cloudinary storage environment variables are missing");
    }

    return NextResponse.json({
      status: "healthy",
      service: "storage",
      provider: "Cloudinary",
      cloudName: cloudName,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error("Storage health check failed:", error as Error);
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "storage",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
