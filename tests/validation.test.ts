import { describe, expect, it } from 'vitest';
import { cleanText, looksLikeBot, validateRsvp } from '../src/lib/rsvpValidation';

const ID = '3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6b';
const base = { name: 'Fathima Rahman', attendance: 'attending', guests: 2, message: '', submissionId: ID };

describe('validateRsvp', () => {
  it('accepts a valid attending RSVP', () => {
    const r = validateRsvp(base, 10);
    expect(r).toEqual({ ok: true, data: { ...base, attendance: 'attending' } });
  });

  it('forces guests to 0 when not attending', () => {
    const r = validateRsvp({ ...base, attendance: 'not_attending', guests: 7 }, 10);
    expect(r.ok && r.data.guests).toBe(0);
  });

  it('rejects unknown attendance values', () => {
    const r = validateRsvp({ ...base, attendance: 'maybe' }, 10);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors.attendance).toBeTruthy();
  });

  it.each([0, -1, 11, 2.5, NaN, '3x', null])('rejects guest count %s', (guests) => {
    const r = validateRsvp({ ...base, guests }, 10);
    expect(!r.ok && r.errors.guests).toBeTruthy();
  });

  it('accepts a numeric string guest count', () => {
    const r = validateRsvp({ ...base, guests: '4' }, 10);
    expect(r.ok && r.data.guests).toBe(4);
  });

  it('requires a name of at least 2 characters after trimming', () => {
    expect(validateRsvp({ ...base, name: '  A  ' }, 10).ok).toBe(false);
    expect(validateRsvp({ ...base, name: 'x'.repeat(81) }, 10).ok).toBe(false);
  });

  it('limits message length', () => {
    expect(validateRsvp({ ...base, message: 'a'.repeat(500) }, 10).ok).toBe(true);
    expect(validateRsvp({ ...base, message: 'a'.repeat(501) }, 10).ok).toBe(false);
  });

  it('requires a UUID submission id', () => {
    expect(validateRsvp({ ...base, submissionId: 'abc' }, 10).ok).toBe(false);
  });

  it('handles junk input without throwing', () => {
    expect(validateRsvp(null, 10).ok).toBe(false);
    expect(validateRsvp('hello', 10).ok).toBe(false);
  });
});

describe('cleanText', () => {
  it('strips control characters and collapses whitespace', () => {
    expect(cleanText('  Dr\u0007 \t  Jennifer \n')).toBe('Dr Jennifer');
  });
  it('keeps single newlines in multiline mode', () => {
    expect(cleanText('Congrats!\r\n\r\n\r\n\r\nLove', true)).toBe('Congrats!\n\nLove');
  });
  it('returns empty string for non-strings', () => {
    expect(cleanText(42)).toBe('');
  });
});

describe('looksLikeBot', () => {
  it('flags a filled honeypot', () => {
    expect(looksLikeBot({ website: 'http://spam' })).toBe(true);
  });
  it('flags forms submitted too quickly', () => {
    expect(looksLikeBot({ startedAt: 1000 }, 2000)).toBe(true);
    expect(looksLikeBot({ startedAt: 1000 }, 9000)).toBe(false);
  });
});
