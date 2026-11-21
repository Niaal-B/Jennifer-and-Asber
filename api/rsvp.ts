// Vercel serverless function: POST /api/rsvp
//
// Browser → this proxy → Google Apps Script web app → Google Sheet.
// The proxy keeps the Apps Script URL and shared secret off the browser,
// avoids Apps Script's redirect/CORS quirks, and adds spam checks.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   RSVP_SCRIPT_URL     Apps Script web-app URL ending in /exec
//   RSVP_SHARED_SECRET  Same value as the SHARED_SECRET script property
//   RSVP_MAX_GUESTS     Optional, defaults to 10 (keep in sync with src/config/wedding.ts)

import { looksLikeBot, validateRsvp } from '../src/lib/rsvpValidation.js';

const MAX_BODY_BYTES = 4096;
const UPSTREAM_TIMEOUT_MS = 12000;
const RATE_LIMIT = { windowMs: 60_000, max: 5 };

// Per-instance only (instances are recycled), so this is a best-effort brake.
// Apps Script applies its own global throttle as well.
const hits = new Map<string, number[]>();

function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'unknown').trim();
}

export async function POST(request: Request): Promise<Response> {
  const scriptUrl = process.env.RSVP_SCRIPT_URL;
  const secret = process.env.RSVP_SHARED_SECRET;
  const maxGuests = Number(process.env.RSVP_MAX_GUESTS ?? 10);

  if (!scriptUrl || !secret) {
    console.error('RSVP proxy is missing RSVP_SCRIPT_URL or RSVP_SHARED_SECRET');
    return json({ ok: false, error: 'not_configured' }, 500);
  }

  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json({ ok: false, error: 'unsupported_media_type' }, 415);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ ok: false, error: 'too_large' }, 413);

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  if (rateLimited(clientIp(request))) return json({ ok: false, error: 'rate_limited' }, 429);

  // Bots get a fake success so they don't learn to adapt.
  if (looksLikeBot(raw)) return json({ ok: true });

  const result = validateRsvp(raw, maxGuests);
  if (!result.ok) return json({ ok: false, error: 'invalid', errors: result.errors }, 400);

  const { data } = result;
  // Apps Script re-validates and neutralises spreadsheet formulas before writing.
  const payload = { secret, ...data };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    // Apps Script answers POST with a 302 to googleusercontent.com; fetch follows it
    // (switching to GET, which is what that echo URL expects).
    const upstream = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });

    const body = (await upstream.json().catch(() => null)) as
      | { ok?: boolean; duplicate?: boolean; error?: string; errors?: Record<string, string> }
      | null;

    if (!body) {
      console.error('Apps Script returned a non-JSON response', upstream.status);
      return json({ ok: false, error: 'upstream_invalid' }, 502);
    }
    if (body.ok) return json({ ok: true, duplicate: body.duplicate === true });
    if (body.error === 'invalid') return json({ ok: false, error: 'invalid', errors: body.errors ?? {} }, 400);
    if (body.error === 'rate_limited') return json({ ok: false, error: 'rate_limited' }, 429);

    console.error('Apps Script rejected RSVP:', body.error);
    return json({ ok: false, error: 'upstream_error' }, 502);
  } catch (err) {
    const timedOut = (err as Error).name === 'AbortError';
    console.error('RSVP upstream failure:', timedOut ? 'timeout' : err);
    return json({ ok: false, error: timedOut ? 'upstream_timeout' : 'upstream_unreachable' }, timedOut ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}

export function GET(): Response {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
