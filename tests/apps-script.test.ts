// Runs apps-script/Code.gs in a Node sandbox with fake Google services.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

const code = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const SECRET = 'top-secret-value';

function makeEnv() {
  const rows: unknown[][] = [];
  const cache = new Map<string, string>();
  const props: Record<string, string> = { SHARED_SECRET: SECRET };

  const sheet = {
    getLastRow: () => rows.length,
    appendRow: (r: unknown[]) => rows.push(r),
    setFrozenRows: () => {},
    getRange: (row: number, col: number, numRows = 1) => ({
      setFontWeight: () => {},
      createTextFinder: (text: string) => ({
        matchEntireCell: () => ({
          findNext: () =>
            rows.slice(row - 1, row - 1 + numRows).some((r) => r[col - 1] === text) ? {} : null,
        }),
      }),
    }),
  };

  const sandbox = {
    console,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => props[k] ?? null,
        setProperty: (k: string, v: string) => (props[k] = v),
      }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }),
      flush: () => {},
    },
    CacheService: {
      getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    Utilities: {
      formatDate: () => '2026-11-21 12:00:00',
      base64EncodeWebSafe: (s: string) => Buffer.from(s).toString('base64url'),
      getUuid: () => randomUUID(),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (s: string) => ({ setMimeType: () => ({ body: JSON.parse(s) }) }),
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const g = sandbox as unknown as {
    doPost: (e: unknown) => { body: Record<string, unknown> };
    doGet: () => { body: Record<string, unknown> };
  };
  const post = (payload: Record<string, unknown>) =>
    g.doPost({ postData: { contents: JSON.stringify(payload) } }).body;
  return { rows, cache, props, post, doPost: g.doPost, doGet: g.doGet };
}

const valid = () => ({
  secret: SECRET,
  name: 'Fathima Rahman',
  attendance: 'attending',
  guests: 3,
  message: 'Congratulations!',
  submissionId: randomUUID(),
});

describe('Apps Script backend', () => {
  let env: ReturnType<typeof makeEnv>;
  beforeEach(() => (env = makeEnv()));

  it('writes header + a row for a valid RSVP', () => {
    const p = valid();
    expect(env.post(p)).toEqual({ ok: true });
    expect(env.rows[0]).toEqual(['Submitted At', 'Name', 'Attendance', 'Guest Count', 'Message', 'Submission ID']);
    expect(env.rows[1]).toEqual(['2026-11-21 12:00:00', 'Fathima Rahman', 'Attending', 3, 'Congratulations!', p.submissionId]);
  });

  it('stores Not Attending with 0 guests', () => {
    env.post({ ...valid(), attendance: 'not_attending', guests: 5 });
    expect(env.rows[1][2]).toBe('Not Attending');
    expect(env.rows[1][3]).toBe(0);
  });

  it('rejects a wrong secret', () => {
    expect(env.post({ ...valid(), secret: 'nope' })).toEqual({ ok: false, error: 'unauthorized' });
    expect(env.rows).toHaveLength(0);
  });

  it('rejects invalid data', () => {
    const r = env.post({ ...valid(), attendance: 'maybe', guests: 50 });
    expect(r.error).toBe('invalid');
    expect(env.rows).toHaveLength(0);
  });

  it('treats a repeated submissionId as a duplicate without a new row', () => {
    const p = valid();
    env.post(p);
    expect(env.post(p)).toEqual({ ok: true, duplicate: true });
    expect(env.rows).toHaveLength(2);
  });

  it('throttles the same name sent again quickly', () => {
    env.post(valid());
    expect(env.post(valid())).toEqual({ ok: false, error: 'rate_limited' });
  });

  it('neutralises spreadsheet formulas', () => {
    env.post({ ...valid(), name: '=IMPORTXML("x")', message: '+cmd' });
    expect(env.rows[1][1]).toBe("'=IMPORTXML(\"x\")");
    expect(env.rows[1][4]).toBe("'+cmd");
  });

  it('handles malformed requests gracefully', () => {
    expect(env.doPost(undefined).body).toEqual({ ok: false, error: 'empty' });
    expect(env.doPost({ postData: { contents: '{not json' } }).body).toEqual({ ok: false, error: 'invalid_json' });
    expect(env.post({})).toEqual({ ok: false, error: 'unauthorized' });
    expect(env.rows).toHaveLength(0);
  });

  it('doGet never exposes records', () => {
    env.post(valid());
    expect(env.doGet().body).toEqual({ status: 'ok' });
  });
});
