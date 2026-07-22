import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from "@/lib/rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  resetAttempts("test:user");
  resetAttempts("test:user2");
  resetAttempts("test:user3");
});

describe("checkRateLimit", () => {
  it("allows first attempt with no prior failures", () => {
    const result = checkRateLimit("test:newuser");
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it("allows attempts before reaching max", () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt("test:user");
    }
    const result = checkRateLimit("test:user");
    expect(result.allowed).toBe(true);
  });

  it("blocks after 5 failed attempts", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("test:user");
    }
    const result = checkRateLimit("test:user");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(15 * 60 * 1000);
  });

  it("allows again after window expires", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("test:user");
    }
    expect(checkRateLimit("test:user").allowed).toBe(false);

    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(checkRateLimit("test:user").allowed).toBe(true);
  });

  it("returns 0 retryAfterMs when allowed", () => {
    recordFailedAttempt("test:user");
    recordFailedAttempt("test:user");
    const result = checkRateLimit("test:user");
    expect(result.retryAfterMs).toBe(0);
  });
});

describe("recordFailedAttempt", () => {
  it("creates entry on first failure", () => {
    recordFailedAttempt("test:user");
    const result = checkRateLimit("test:user");
    expect(result.allowed).toBe(true);
  });

  it("increments count on subsequent failures", () => {
    recordFailedAttempt("test:user");
    recordFailedAttempt("test:user");
    recordFailedAttempt("test:user");
    const result = checkRateLimit("test:user");
    expect(result.allowed).toBe(true);
  });

  it("blocks after 5 failures", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("test:user");
    }
    expect(checkRateLimit("test:user").allowed).toBe(false);
  });

  it("tracks different users independently", () => {
    recordFailedAttempt("test:user");
    recordFailedAttempt("test:user");
    recordFailedAttempt("test:user2");

    expect(checkRateLimit("test:user").allowed).toBe(true);
    expect(checkRateLimit("test:user2").allowed).toBe(true);
  });

  it("sets resetAt 15 minutes in the future on first failure", () => {
    const before = Date.now();
    recordFailedAttempt("test:user3");
    const result = checkRateLimit("test:user3");
    expect(result.allowed).toBe(true);
  });

  it("resets counter when window expires", () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt("test:user");
    }
    expect(checkRateLimit("test:user").allowed).toBe(true);

    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    recordFailedAttempt("test:user");
    expect(checkRateLimit("test:user").allowed).toBe(true);
  });
});

describe("resetAttempts", () => {
  it("clears the failure counter", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("test:user");
    }
    expect(checkRateLimit("test:user").allowed).toBe(false);

    resetAttempts("test:user");
    expect(checkRateLimit("test:user").allowed).toBe(true);
  });

  it("does not affect other users", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("test:user");
      recordFailedAttempt("test:user2");
    }

    resetAttempts("test:user");

    expect(checkRateLimit("test:user").allowed).toBe(true);
    expect(checkRateLimit("test:user2").allowed).toBe(false);
  });

  it("is safe to call on non-existent key", () => {
    expect(() => resetAttempts("nonexistent")).not.toThrow();
  });
});

describe("rate limit integration scenarios", () => {
  it("4 failures + success resets counter", () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt("test:user");
    }
    expect(checkRateLimit("test:user").allowed).toBe(true);

    resetAttempts("test:user");

    for (let i = 0; i < 4; i++) {
      recordFailedAttempt("test:user");
    }
    expect(checkRateLimit("test:user").allowed).toBe(true);
  });

  it("full block → wait → unblock flow", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("test:user");
    }
    expect(checkRateLimit("test:user").allowed).toBe(false);

    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(checkRateLimit("test:user").allowed).toBe(false);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(checkRateLimit("test:user").allowed).toBe(true);
  });

  it("partial failures do not block", () => {
    for (let i = 0; i < 3; i++) {
      recordFailedAttempt("test:user");
    }
    expect(checkRateLimit("test:user").allowed).toBe(true);
    resetAttempts("test:user");
    expect(checkRateLimit("test:user").allowed).toBe(true);
  });
});
