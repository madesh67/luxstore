import { describe, it, expect, beforeEach, vi } from "vitest";
import { isRateLimited } from "../lib/rate-limiter";

describe("Sliding Window Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should permit requests below the set limit", async () => {
    const key = "ip-test-allow";
    const limit = 3;
    const windowMs = 1000;

    const res1 = await isRateLimited(key, limit, windowMs);
    expect(res1.limited).toBe(false);
    expect(res1.remaining).toBe(2);

    const res2 = await isRateLimited(key, limit, windowMs);
    expect(res2.limited).toBe(false);
    expect(res2.remaining).toBe(1);

    const res3 = await isRateLimited(key, limit, windowMs);
    expect(res3.limited).toBe(false);
    expect(res3.remaining).toBe(0);
  });

  it("should trigger rate-limiting when the request count exceeds the limit", async () => {
    const key = "ip-test-block";
    const limit = 2;
    const windowMs = 5000;

    // First two requests should pass
    await isRateLimited(key, limit, windowMs);
    await isRateLimited(key, limit, windowMs);

    // Third request should be blocked
    const resBlocked = await isRateLimited(key, limit, windowMs);
    expect(resBlocked.limited).toBe(true);
    expect(resBlocked.remaining).toBe(0);
    expect(resBlocked.resetTime).toBeGreaterThan(Date.now());
  });

  it("should reset limits after the sliding window time elapsed", async () => {
    const key = "ip-test-reset";
    const limit = 1;
    const windowMs = 1000;

    const res1 = await isRateLimited(key, limit, windowMs);
    expect(res1.limited).toBe(false);

    // Fast-forward time past the window threshold (1001ms)
    vi.advanceTimersByTime(1001);

    const res2 = await isRateLimited(key, limit, windowMs);
    expect(res2.limited).toBe(false); // Should succeed since window cleared
  });

  it("should track requests independently for different keys", async () => {
    const keyA = "client-A";
    const keyB = "client-B";
    const limit = 1;
    const windowMs = 5000;

    const resA = await isRateLimited(keyA, limit, windowMs);
    expect(resA.limited).toBe(false);

    // Client A is now limited, but Client B should still be allowed
    const resB = await isRateLimited(keyB, limit, windowMs);
    expect(resB.limited).toBe(false);
  });
});
