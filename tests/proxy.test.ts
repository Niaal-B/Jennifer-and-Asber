import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../api/rsvp';

const ID = '3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6b';
let ipCounter = 0;

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/rsvp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++ipCounter}`, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const valid = {
  name: 'Fathima Rahman',
  attendance: 'attending',
  guests: 2,
  message: '=HYPERLINK("x")',
  submissionId: ID,
  website: '',
  startedAt: Date.now() - 10_000,
};

describe('/api/rsvp proxy', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.RSVP_SCRIPT_URL = 'https://script.google.com/macros/s/TEST/exec';
    process.env.RSVP_SHARED_SECRET = 's3cret';
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('forwards valid RSVPs with the secret and returns ok', async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: true }));
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, duplicate: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(process.env.RSVP_SCRIPT_URL);
    const sent = JSON.parse(init.body);
    expect(sent).toMatchObject({ secret: 's3cret', name: 'Fathima Rahman', guests: 2, submissionId: ID });
    expect(sent).not.toHaveProperty('website');
    expect(sent).not.toHaveProperty('startedAt');
  });

  it('passes through duplicate flag', async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: true, duplicate: true }));
    expect(await (await POST(req(valid))).json()).toEqual({ ok: true, duplicate: true });
  });

  it('rejects invalid data with 400 and field errors, without calling Apps Script', async () => {
    const res = await POST(req({ ...valid, guests: 99 }));
    expect(res.status).toBe(400);
    expect((await res.json()).errors.guests).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('silently drops honeypot submissions', async () => {
    const res = await POST(req({ ...valid, website: 'spam.example' }));
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('silently drops too-fast submissions', async () => {
    const res = await POST(req({ ...valid, startedAt: Date.now() }));
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rate limits a single IP', async () => {
    fetchMock.mockImplementation(async () => Response.json({ ok: true }));
    const headers = { 'x-forwarded-for': '192.168.1.50' };
    const statuses = [];
    for (let i = 0; i < 7; i++) statuses.push((await POST(req(valid, headers))).status);
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });

  it('rejects malformed JSON, wrong content type and huge bodies', async () => {
    expect((await POST(req('{nope'))).status).toBe(400);
    expect((await POST(req(valid, { 'content-type': 'text/plain' }))).status).toBe(415);
    expect((await POST(req({ ...valid, message: 'x'.repeat(5000) }))).status).toBe(413);
  });

  it('maps upstream failures to 5xx', async () => {
    fetchMock.mockResolvedValue(new Response('<html>error</html>', { status: 200 }));
    expect((await POST(req(valid))).status).toBe(502);
    fetchMock.mockResolvedValue(Response.json({ ok: false, error: 'unauthorized' }));
    expect((await POST(req(valid))).status).toBe(502);
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    expect((await POST(req(valid))).status).toBe(502);
    fetchMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    expect((await POST(req(valid))).status).toBe(504);
  });

  it('maps upstream rate limit to 429', async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: false, error: 'rate_limited' }));
    expect((await POST(req(valid))).status).toBe(429);
  });

  it('returns 500 when not configured', async () => {
    delete process.env.RSVP_SCRIPT_URL;
    expect((await POST(req(valid))).status).toBe(500);
  });

  it('refuses GET', async () => {
    expect(GET().status).toBe(405);
  });
});
