import { wedding } from '../config/wedding';
import type { FieldErrors, RsvpRequestBody } from '../lib/rsvpValidation';

export type SubmitResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; kind: 'validation'; errors: FieldErrors; message: string }
  | { ok: false; kind: 'rate_limited' | 'offline' | 'timeout' | 'server'; message: string };

const TIMEOUT_MS = 15000;

export async function submitRsvp(body: RsvpRequestBody): Promise<SubmitResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, kind: 'offline', message: "You seem to be offline. Please check your connection and try again." };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(wedding.rsvp.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      /* non-JSON response, handled below */
    }

    if (res.ok && data.ok === true) {
      return { ok: true, duplicate: data.duplicate === true };
    }
    if (res.status === 400 && data.errors) {
      return {
        ok: false,
        kind: 'validation',
        errors: data.errors as FieldErrors,
        message: 'Please check the highlighted fields.',
      };
    }
    if (res.status === 429) {
      return { ok: false, kind: 'rate_limited', message: 'Too many attempts. Please wait a minute and try again.' };
    }
    return {
      ok: false,
      kind: 'server',
      message: "Sorry, we couldn't save your response just now. Please try again in a moment.",
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { ok: false, kind: 'timeout', message: 'This is taking too long. Please try again.' };
    }
    return {
      ok: false,
      kind: 'offline',
      message: "We couldn't reach the server. Please check your connection and try again.",
    };
  } finally {
    window.clearTimeout(timer);
  }
}

// ---- Remember that this device has already responded ----

const STORAGE_KEY = 'rsvp:jennifer-asber:v1';

export interface StoredRsvp {
  name: string;
  attendance: 'attending' | 'not_attending';
  guests: number;
  submittedAt: number;
}

export function loadStoredRsvp(): StoredRsvp | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredRsvp) : null;
  } catch {
    return null;
  }
}

export function saveStoredRsvp(value: StoredRsvp) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode): nothing to do */
  }
}

export function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback for older in-app browsers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
