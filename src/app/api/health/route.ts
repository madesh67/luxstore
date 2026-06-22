import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/redis";
import { logger } from "@/lib/logger";

export async function GET() {
  const systemStartTime = Date.now();
  
  // 1. Database Check
  let databaseStatus = "unhealthy";
  let databaseLatency = "0ms";
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    databaseLatency = `${Date.now() - dbStart}ms`;
    databaseStatus = "healthy";
  } catch (err: unknown) {
    logger.error("Healthcheck database failure:", err as Error);
  }

  // 2. Cache Check
  let cacheStatus = "unhealthy";
  let cacheLatency = "0ms";
  try {
    const cacheStart = Date.now();
    const testKey = "healthcheck:global-key";
    await cache.set(testKey, "OK", 5);
    const val = await cache.get<string>(testKey);
    await cache.del(testKey);
    cacheLatency = `${Date.now() - cacheStart}ms`;
    if (val === "OK") {
      cacheStatus = "healthy";
    }
  } catch (err: unknown) {
    logger.error("Healthcheck cache failure:", err as Error);
  }

  // 3. Storage Check
  let storageStatus = "unhealthy";
  try {
    const isConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    if (isConfigured) storageStatus = "healthy";
  } catch (err: unknown) {
    logger.error("Healthcheck storage config failure:", err as Error);
  }

  // 4. Payments Check
  let paymentsStatus = "unhealthy";
  try {
    const isConfigured = !!(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET
    );
    if (isConfigured) paymentsStatus = "healthy";
  } catch (err: unknown) {
    logger.error("Healthcheck payments config failure:", err as Error);
  }

  const isSystemHealthy =
    databaseStatus === "healthy" &&
    cacheStatus === "healthy" &&
    storageStatus === "healthy" &&
    paymentsStatus === "healthy";

  const responseBody = {
    status: isSystemHealthy ? "healthy" : "unhealthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    totalLatency: `${Date.now() - systemStartTime}ms`,
    services: {
      database: { status: databaseStatus, latency: databaseLatency },
      cache: { status: cacheStatus, latency: cacheLatency, redisConnected: !!process.env.REDIS_URL },
      storage: { status: storageStatus, provider: "Cloudinary" },
      payments: { status: paymentsStatus, provider: "Stripe" },
    },
  };

  return NextResponse.json(responseBody, {
    status: isSystemHealthy ? 200 : 500,
  });
}
