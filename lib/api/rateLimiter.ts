/**
 * Simple rate limiter to avoid 429 Too Many Requests errors
 * Uses a token bucket algorithm with configurable requests per interval
 */

interface RateLimiterConfig {
  maxRequests: number;      // Max requests per interval
  windowMs: number;         // Time window in milliseconds
}

interface RequestTracker {
  count: number;
  resetAt: number;
}

const defaultLimiters: Record<string, RequestTracker> = {};

/**
 * Creates a rate-limited version of any async function
 */
export function withRateLimit<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  config: RateLimiterConfig,
  limiterKey: string = 'default'
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const now = Date.now();

    // Initialize or reset tracker
    if (!defaultLimiters[limiterKey] || now >= defaultLimiters[limiterKey].resetAt) {
      defaultLimiters[limiterKey] = {
        count: 0,
        resetAt: now + config.windowMs,
      };
    }

    const tracker = defaultLimiters[limiterKey];

    // If at limit, wait until window resets
    if (tracker.count >= config.maxRequests) {
      const waitTime = tracker.resetAt - now;
      console.log(`[RateLimiter] ${limiterKey}: at limit, waiting ${waitTime}ms`);
      await sleep(waitTime);

      // Reset tracker after waiting
      tracker.count = 0;
      tracker.resetAt = Date.now() + config.windowMs;
    }

    // Increment counter
    tracker.count++;

    // Add small delay between requests to be respectful
    await sleep(100);

    return fn(...args);
  };
}

/**
 * Pre-configured limiter for Nvidia NIM API
 * Default: 30 requests per minute (conservative for most NIM endpoints)
 */
export function withNimRateLimit<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  requestsPerMinute: number = 30
): (...args: T) => Promise<R> {
  return withRateLimit(fn, {
    maxRequests: requestsPerMinute,
    windowMs: 60 * 1000, // 1 minute
  }, 'nvidia-nim');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch processor for multiple requests with rate limiting
 * Processes items sequentially with delay between each
 */
export async function processWithRateLimit<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    delayBetweenRequests?: number;  // ms between requests
    maxRetries?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const { delayBetweenRequests = 500, maxRetries = 3, onProgress } = options;
  const results: R[] = [];

  for (let i = 0; i < items.length; i++) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await processor(items[i]);
        results.push(result);
        lastError = null;
        break;
      } catch (error: any) {
        lastError = error;

        // If 429, wait and retry
        if (error?.status === 429 || error?.message?.includes('429')) {
          const retryAfter = error?.headers?.['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;

          console.log(`[RateLimiter] 429 received, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
          await sleep(waitTime);
        } else {
          // Non-rate-limit error, don't retry
          break;
        }
      }
    }

    if (lastError) {
      console.error(`[RateLimiter] Failed after ${maxRetries} retries:`, lastError);
      results.push(undefined as R); // Or throw
    }

    onProgress?.(i + 1, items.length);

    // Delay between successful requests (except for last one)
    if (i < items.length - 1) {
      await sleep(delayBetweenRequests);
    }
  }

  return results;
}