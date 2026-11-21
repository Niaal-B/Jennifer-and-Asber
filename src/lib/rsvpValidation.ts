// Shared RSVP validation, used by the browser form and by the /api/rsvp proxy.
// Must stay dependency-free (no imports) so the serverless function can bundle it.
// apps-script/Code.gs repeats the same rules, because Apps Script can't import this file.

export const ATTENDANCE_VALUES = ['attending', 'not_attending'] as const;
export type Attendance = (typeof ATTENDANCE_VALUES)[number];

export const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  messageMax: 500,
  minGuests: 1,
  /** Fill-time below this is treated as a bot. */
  minFillMs: 3000,
} as const;

export interface RsvpPayload {
  name: string;
  attendance: Attendance;
  /** 0 when not attending. */
  guests: number;
  message: string;
  submissionId: string;
}

/** Raw shape the browser sends: payload plus anti-spam fields. */
export interface RsvpRequestBody extends RsvpPayload {
  /** Honeypot. Real users never fill this in. */
  website?: string;
  /** Epoch ms when the form was opened. */
  startedAt?: number;
}

export type FieldErrors = Partial<Record<'name' | 'attendance' | 'guests' | 'message' | 'submissionId', string>>;

export type ValidationResult =
  | { ok: true; data: RsvpPayload }
  | { ok: false; errors: FieldErrors };

// eslint-disable-next-line no-control-regex -- intentionally strips control characters
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Trim, drop control characters, collapse runs of spaces. Keeps newlines when multiline. */
export function cleanText(value: unknown, multiline = false): string {
  if (typeof value !== 'string') return '';
  let s = value.replace(CONTROL_CHARS, '');
  s = multiline
    ? s.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
    : s.replace(/\s+/g, ' ');
  return s.trim();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateRsvp(raw: unknown, maxGuests: number): ValidationResult {
  const errors: FieldErrors = {};
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const name = cleanText(body.name);
  if (name.length < LIMITS.nameMin) errors.name = 'Please enter your name.';
  else if (name.length > LIMITS.nameMax) errors.name = `Please keep your name under ${LIMITS.nameMax} characters.`;

  const attendance = body.attendance;
  const validAttendance = ATTENDANCE_VALUES.includes(attendance as Attendance);
  if (!validAttendance) errors.attendance = 'Please let us know if you can attend.';

  let guests = 0;
  if (attendance === 'attending') {
    const n = typeof body.guests === 'string' ? Number(body.guests) : body.guests;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < LIMITS.minGuests || n > maxGuests) {
      errors.guests = `Number of guests must be between ${LIMITS.minGuests} and ${maxGuests}.`;
    } else {
      guests = n;
    }
  }

  const message = cleanText(body.message, true);
  if (message.length > LIMITS.messageMax) {
    errors.message = `Please keep your message under ${LIMITS.messageMax} characters.`;
  }

  const submissionId = typeof body.submissionId === 'string' ? body.submissionId.trim() : '';
  if (!UUID_RE.test(submissionId)) errors.submissionId = 'Invalid submission.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: { name, attendance: attendance as Attendance, guests, message, submissionId },
  };
}

/** True when the request looks automated (honeypot filled or form filled too fast). */
export function looksLikeBot(raw: unknown, now = Date.now()): boolean {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (typeof body.website === 'string' && body.website.trim() !== '') return true;
  if (typeof body.startedAt === 'number' && now - body.startedAt < LIMITS.minFillMs) return true;
  return false;
}
