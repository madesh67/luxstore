import { NextResponse } from "next/server";
import { cache } from "@/lib/redis";
import { logger } from "@/lib/logger";

export async function GET() {
  const startTime = Date.now();
  try {
    // Perform a test write and read
    const testKey = "healthcheck:test-key";
    const testValue = { status: "active", time: Date.now() };

    await cache.set(testKey, testValue, 10);
    const retrieved = await cache.get<typeof testValue>(testKey);
    await cache.del(testKey);

    const latency = Date.now() - startTime;

    if (!retrieved || retrieved.status !== "active") {
      throw new Error("Cache retrieved value did not match set value");
    }

    return NextResponse.json({
      status: "healthy",
      service: "cache",
      latency: `${latency}ms`,
      redisConnected: !!process.env.REDIS_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error("Cache health check failed:", error as Error);
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "cache",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
