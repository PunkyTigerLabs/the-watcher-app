// ============================================
// THE WATCHER — Rate Limiter & Retry Logic
// ============================================
// Generic rate limiting with exponential backoff

interface RateLimitEntry {
  calls: number;
  resetTime: number;
}

interface RateLimiterConfig {
  maxCalls: number;
  timeWindowMs: number;
  maxRetries?: number;
  initialDelayMs?: number;
}

const rateLimiters: Map<string, RateLimitEntry> = new Map();

/**
 * Create a rate limiter for a specific API.
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const {
    maxCalls,
    timeWindowMs,
    maxRetries = 3,
    initialDelayMs = 1000,
  } = config;

  /**
   * Check if a call is allowed within rate limits.
   */
  function isAllowed(apiName: string): boolean {
    const now = Date.now();
    const entry = rateLimiters.get(apiName);

    if (!entry || now >= entry.resetTime) {
      // Reset window
      rateLimiters.set(apiName, {
        calls: 1,
        resetTime: now + timeWindowMs,
      });
      return true;
    }

    if (entry.calls < maxCalls) {
      entry.calls++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining time until next allowed call.
   */
  function getWaitTime(apiName: string): number {
    const entry = rateLimiters.get(apiName);
    if (!entry) return 0;

    const now = Date.now();
    if (now >= entry.resetTime) return 0;

    return entry.resetTime - now;
  }

  /**
   * Execute a function with rate limiting and exponential backoff retry.
   */
  async function execute<T>(
    apiName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Wait if rate limited
      let attempts = 0;
      while (!isAllowed(apiName) && attempts < 60) {
        const waitTime = getWaitTime(apiName);
        if (waitTime > 0) {
          await sleep(Math.min(waitTime, 1000)); // Max 1s per check
        }
        attempts++;
      }

      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = initialDelayMs * Math.pow(2, attempt);
          await sleep(delayMs);
        }
      }
    }

    throw lastError || new Error(`Failed to execute ${apiName} after ${maxRetries} attempts`);
  }

  return { execute, isAllowed, getWaitTime };
}

/**
 * Helper function to sleep.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pre-configured limiters for common APIs.
 */
export const etherscanLimiter = createRateLimiter({
  maxCalls: 5,
  timeWindowMs: 1000,
  maxRetries: 3,
  initialDelayMs: 1000,
});

export const basescanLimiter = createRateLimiter({
  maxCalls: 5,
  timeWindowMs: 1000,
  maxRetries: 3,
  initialDelayMs: 1000,
});

export const trongridLimiter = createRateLimiter({
  maxCalls: 15,
  timeWindowMs: 1000,
  maxRetries: 3,
  initialDelayMs: 1000,
});

export const solscanLimiter = createRateLimiter({
  maxCalls: 10,
  timeWindowMs: 1000,
  maxRetries: 3,
  initialDelayMs: 1000,
});

export const newsLimiter = createRateLimiter({
  maxCalls: 10,
  timeWindowMs: 1000,
  maxRetries: 3,
  initialDelayMs: 1000,
});

export const feargreedLimiter = createRateLimiter({
  maxCalls: 5,
  timeWindowMs: 1000,
  maxRetries: 3,
  initialDelayMs: 1000,
});

export const coingeckoLimiter = createRateLimiter({
  maxCalls: 10,
  timeWindowMs: 1000,
  maxRetries: 3,
  initialDelayMs: 1000,
});

export const defillamaLimiter = createRateLimiter({
  maxCalls: 10,
  timeWindowMs: 1000,
  maxRetries: 3,
  initialDelayMs: 1000,
});

export const binanceLimiter = createRateLimiter({
  maxCalls: 1200,
  timeWindowMs: 60000, // Per minute
  maxRetries: 3,
  initialDelayMs: 1000,
});
