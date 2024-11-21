// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number; // Duration in milliseconds
  uniqueTokenPerInterval?: number; // Maximum number of unique tokens per interval
}

export function rateLimit({ interval, uniqueTokenPerInterval = 500 }: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: uniqueTokenPerInterval,
    ttl: interval
  });

  return {
    check: async (req: Request, limit: number) => {
      const ip = req.headers.get('x-forwarded-for') || 'anonymous';
      const tokenCount = (tokenCache.get(ip) as number[]) || [0];
      
      if (tokenCount[0] === 0) {
        tokenCache.set(ip, tokenCount);
      }
      
      tokenCount[0] += 1;

      if (tokenCount[0] > limit) {
        throw new Error('Rate limit exceeded');
      }
    }
  };
}