// In-memory fixed-window rate limiter, keyed by an arbitrary string (e.g.
// `${ip}:${route}`). Good enough for a single-instance/pilot deployment —
// it resets on redeploy and doesn't share state across serverless instances,
// so it's a friction layer against casual brute-forcing, not the sole
// defense. Supabase Auth applies its own server-side rate limiting to actual
// password verification, which is the real boundary.
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

// Best-effort client identifier from proxy headers (Vercel/most reverse
// proxies set x-forwarded-for). Never trust this for authorization — only
// for throttling.
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
