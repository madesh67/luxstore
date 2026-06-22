import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  const startTime = Date.now();
  try {
    // Run a simple query to verify database connection
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      service: "database",
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error("Database health check failed:", error as Error);
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "database",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
