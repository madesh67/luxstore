import Redis from "ioredis";
import { logger } from "./logger";

// Graceful fallback store for in-memory cache
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

declare global {
  var redisClient: Redis | undefined;
}

let redisClient: Redis | null = null;
const isRedisConfigured = !!process.env.REDIS_URL;

if (isRedisConfigured) {
  if (globalThis.redisClient) {
    redisClient = globalThis.redisClient;
  } else {
    try {
      redisClient = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        lazyConnect: true,
        retryStrategy(times) {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
      });

      redisClient.on("error", (err) => {
        logger.error("Redis Connection Error:", err);
      });

      redisClient.on("connect", () => {
        logger.info("Redis connected successfully.");
      });

      globalThis.redisClient = redisClient;
    } catch (error: unknown) {
      logger.error("Failed to initialize Redis client:", error as Error);
    }
  }
} else {
  logger.info("REDIS_URL is not set. Caching will fall back to in-memory store.");
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (redisClient) {
      try {
        const raw = await redisClient.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch (err: unknown) {
        logger.error(`Redis cache get error for key "${key}":`, err as Error);
      }
    }

    // In-memory fallback
    const item = memoryCache.get(key);
    if (item) {
      if (Date.now() < item.expiresAt) {
        return JSON.parse(item.value) as T;
      }
      memoryCache.delete(key);
    }
    return null;
  },

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    const raw = JSON.stringify(value);

    if (redisClient) {
      try {
        await redisClient.set(key, raw, "EX", ttlSeconds);
        return;
      } catch (err: unknown) {
        logger.error(`Redis cache set error for key "${key}":`, err as Error);
      }
    }

    // In-memory fallback
    memoryCache.set(key, {
      value: raw,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(key: string): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch (err: unknown) {
        logger.error(`Redis cache del error for key "${key}":`, err as Error);
      }
    }

    // In-memory fallback
    memoryCache.delete(key);
  },

  /**
   * Delete keys matching a pattern (e.g. "product:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    if (redisClient) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
        return;
      } catch (err: unknown) {
        logger.error(`Redis cache delByPattern error for pattern "${pattern}":`, err as Error);
      }
    }

    // In-memory fallback matching
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  },

  /**
   * Wrapper to cache any expensive async database query or call.
   */
  async wrap<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  },

  /**
   * Clears the entire cache.
   */
  async flush(): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.flushall();
        return;
      } catch (err: unknown) {
        logger.error("Redis flush error:", err as Error);
      }
    }
    memoryCache.clear();
  },
};

export { redisClient };
