import { logger } from "./logger";
import { redisClient } from "./redis";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store for rate limits (with automatic pruning)
const limitStore = new Map<string, RateLimitRecord>();

// Periodic memory pruning routine (Runs only in environments supporting setInterval)
if (typeof globalThis !== "undefined") {
  const pruneInterval = 60 * 1000;
  
  if (!(globalThis as { rateLimitPrunerInitialized?: boolean }).rateLimitPrunerInitialized) {
    (globalThis as { rateLimitPrunerInitialized?: boolean }).rateLimitPrunerInitialized = true;
    
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of limitStore.entries()) {
        record.timestamps = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
        if (record.timestamps.length === 0) {
          limitStore.delete(key);
        }
      }
    }, pruneInterval);
    
    if (interval && typeof interval.unref === "function") {
      interval.unref();
    }
  }
}

/**
 * Validates request count for a given IP/key within a sliding window.
 * Uses Redis sliding window if active, falling back to in-memory.
 */
export async function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const fullKey = `ratelimit:${key}`;

  // 1. Redis Sliding Window Rate Limiter
  if (redisClient) {
    try {
      const clearBefore = now - windowMs;
      
      // We use a transaction (multi) to ensure atomic sliding window operations
      const multi = redisClient.multi();
      multi.zremrangebyscore(fullKey, 0, clearBefore);
      multi.zcard(fullKey);
      multi.zadd(fullKey, now, now.toString());
      multi.expire(fullKey, Math.ceil(windowMs / 1000));
      
      const results = await multi.exec();
      if (results && results[1]) {
        const count = results[1][1] as number;
        
        if (count >= limit) {
          // Fetch oldest request to calculate exact reset time
          const oldest = await redisClient.zrange(fullKey, 0, 0, "WITHSCORES");
          const oldestTime = oldest && oldest[1] ? parseInt(oldest[1]) : now;
          const resetTime = oldestTime + windowMs;
          
          logger.warn(`Redis Rate limit triggered for: ${key}. Next request allowed in ${Math.round((resetTime - now) / 1000)}s`);
          return {
            limited: true,
            remaining: 0,
            resetTime,
          };
        }
        
        return {
          limited: false,
          remaining: limit - (count + 1),
          resetTime: now + windowMs,
        };
      }
    } catch (err: unknown) {
      logger.error("Redis rate limiter failed, falling back to memory:", err as Error);
    }
  }

  // 2. In-Memory Fallback Sliding Window Rate Limiter
  const record = limitStore.get(key) || { timestamps: [] };
  const activeTimestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (activeTimestamps.length >= limit) {
    const oldestTimestamp = activeTimestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    logger.warn(`Memory Rate limit triggered for: ${key}. Next request allowed in ${Math.round((resetTime - now) / 1000)}s`);

    return {
      limited: true,
      remaining: 0,
      resetTime,
    };
  }

  activeTimestamps.push(now);
  limitStore.set(key, { timestamps: activeTimestamps });

  const oldestTimestamp = activeTimestamps[0];
  return {
    limited: false,
    remaining: limit - activeTimestamps.length,
    resetTime: oldestTimestamp + windowMs,
  };
}
