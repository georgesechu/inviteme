/**
 * Simple in-memory rate limiter (per key) for low-volume use.
 * Not production-grade but prevents abuse on auth endpoints.
 */
import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  keyGenerator?: (req: Request) => string;
}

const buckets = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, limit, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key =
      keyGenerator?.(req) ||
      req.ip ||
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']?.toString()) ||
      'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.expiresAt < now) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (bucket.count >= limit) {
      const retryAfter = Math.max(0, Math.ceil((bucket.expiresAt - now) / 1000));
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
    }

    bucket.count += 1;
    buckets.set(key, bucket);
    return next();
  };
}

