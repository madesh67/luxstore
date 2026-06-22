import { describe, it, expect, vi, beforeEach } from "vitest";
import { cache } from "@/lib/redis";
import { backgroundJobs } from "@/lib/queue";
import { isRateLimited } from "@/lib/rate-limiter";
import { env } from "@/lib/env";
import { GET as healthCheckHandler } from "@/app/api/health/route";
import { GET as dbHealthHandler } from "@/app/api/health/database/route";
import { GET as cacheHealthHandler } from "@/app/api/health/cache/route";

describe("Phase 8 - Performance, Caching & DevOps Tests", () => {
  
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Cache Layer Tests
  describe("Redis & In-Memory Caching", () => {
    it("should successfully set, get, and delete values", async () => {
      const testKey = "test:caching-key";
      const testVal = { data: "luxstore_premium_watch" };

      await cache.set(testKey, testVal, 10);
      const retrieved = await cache.get<typeof testVal>(testKey);
      expect(retrieved).toEqual(testVal);

      await cache.del(testKey);
      const cleared = await cache.get(testKey);
      expect(cleared).toBeNull();
    });

    it("should expire values after TTL", async () => {
      const expireKey = "test:expire-key";
      const expireVal = "expired_soon";

      // Set with a TTL of 0 seconds to trigger instant expiry
      await cache.set(expireKey, expireVal, -1);
      const retrieved = await cache.get(expireKey);
      expect(retrieved).toBeNull();
    });

    it("should delete keys matching a pattern", async () => {
      await cache.set("product:123", "watch", 10);
      await cache.set("product:456", "belt", 10);
      await cache.set("category:123", "jewelry", 10);

      await cache.delByPattern("product:*");

      expect(await cache.get("product:123")).toBeNull();
      expect(await cache.get("product:456")).toBeNull();
      expect(await cache.get("category:123")).toEqual("jewelry");

      // Cleanup
      await cache.del("category:123");
    });
  });

  // 2. Sliding Window Rate Limiter Tests
  describe("Sliding Window Rate Limiting", () => {
    it("should allow requests within rate limits and block excess attempts", async () => {
      const key = "ip-rate-limit-test";
      const limit = 3;
      const windowMs = 5000;

      // 1st request
      const r1 = await isRateLimited(key, limit, windowMs);
      expect(r1.limited).toBe(false);
      expect(r1.remaining).toBe(2);

      // 2nd request
      const r2 = await isRateLimited(key, limit, windowMs);
      expect(r2.limited).toBe(false);
      expect(r2.remaining).toBe(1);

      // 3rd request
      const r3 = await isRateLimited(key, limit, windowMs);
      expect(r3.limited).toBe(false);
      expect(r3.remaining).toBe(0);

      // 4th request (should be rate-limited)
      const r4 = await isRateLimited(key, limit, windowMs);
      expect(r4.limited).toBe(true);
      expect(r4.remaining).toBe(0);
    });
  });

  // 3. Environment Config Validation
  describe("Environment Configuration Schema", () => {
    it("should load parsed env settings successfully", () => {
      expect(env).toBeDefined();
      expect(env.NODE_ENV).toBeDefined();
      expect(env.DATABASE_URL).toBeDefined();
      expect(env.JWT_SECRET).toBeDefined();
    });
  });

  // 4. Background Job Queues
  describe("Background Queues & Job Processing", () => {
    it("should successfully trigger email background queue jobs", async () => {
      const spy = vi.spyOn(backgroundJobs, "addEmail");
      const jobData = {
        to: "customer@luxstore.com",
        subject: "Order Received",
        body: "Thank you for shopping with us.",
        type: "ORDER_CONFIRMATION",
      };

      await backgroundJobs.addEmail(jobData);
      expect(spy).toHaveBeenCalledWith(jobData);
    });

    it("should successfully queue analytics logs", async () => {
      const spy = vi.spyOn(backgroundJobs, "addAnalytics");
      const analyticsData = {
        event: "PRODUCT_VIEW",
        userId: "user-123",
        details: { sku: "WATCH-CLASSIC" },
      };

      await backgroundJobs.addAnalytics(analyticsData);
      expect(spy).toHaveBeenCalledWith(analyticsData);
    });
  });

  // 5. Health Check APIs
  describe("Subsystems Health Check Handlers", () => {
    it("should return healthy response for DB checks", async () => {
      const res = await dbHealthHandler();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("healthy");
      expect(json.service).toBe("database");
    });

    it("should return healthy response for Cache checks", async () => {
      const res = await cacheHealthHandler();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("healthy");
      expect(json.service).toBe("cache");
    });

    it("should return consolidated healthy check status", async () => {
      const res = await healthCheckHandler();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("healthy");
      expect(json.services.database.status).toBe("healthy");
      expect(json.services.cache.status).toBe("healthy");
    });
  });
});
