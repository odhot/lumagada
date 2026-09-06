const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  return `${scope}:${forwarded || realIp || 'unknown'}`;
}

/**
 * Lightweight per-instance abuse guard for serverless handlers.
 * Supabase Auth provides its own distributed auth limits; this protects
 * Lumagada's application-specific write endpoints as a second layer.
 */
export function rateLimit(request: Request, scope: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  const key = clientKey(request, scope);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function rateLimitedResponse(retryAfter: number) {
  return new Response(JSON.stringify({ error: 'Terlalu banyak permintaan. Coba lagi sebentar.' }), {
    status: 429,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'retry-after': String(retryAfter),
      'cache-control': 'no-store',
    },
  });
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function boundedString(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max);
}
