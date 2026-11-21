import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Serves api/rsvp.ts at /api/rsvp during `npm run dev` and `vite preview`,
 * so the real proxy code can be tested locally without the Vercel CLI.
 * When RSVP_SCRIPT_URL isn't set locally, a mock that always succeeds stands in
 * for Apps Script (dev only; production returns "not_configured").
 */
function rsvpApiDev(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['RSVP_SCRIPT_URL', 'RSVP_SHARED_SECRET', 'RSVP_MAX_GUESTS']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  const mock = !process.env.RSVP_SCRIPT_URL;

  async function readBody(req: IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString('utf8');
  }

  function attach(server: Pick<ViteDevServer, 'middlewares'>, load: () => Promise<Record<string, unknown>>) {
    server.middlewares.use('/api/rsvp', async (req: IncomingMessage, res: ServerResponse) => {
      try {
        if (mock && req.method === 'POST') {
          // Mock upstream: run the real proxy with a fake Apps Script.
          process.env.RSVP_SCRIPT_URL = 'mock://apps-script';
          process.env.RSVP_SHARED_SECRET = 'dev';
        }
        const mod = await load();
        const handler = (req.method === 'POST' ? mod.POST : mod.GET) as (r: Request) => Promise<Response>;
        const body = req.method === 'POST' ? await readBody(req) : undefined;
        const request = new Request(`http://localhost${req.url ?? ''}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body,
        });

        const realFetch = globalThis.fetch;
        if (mock) {
          globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
            if (String(input).startsWith('mock://')) {
              await new Promise((r) => setTimeout(r, 700));
              console.log('[rsvp mock] would save:', init?.body);
              return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
            }
            return realFetch(input, init);
          }) as typeof fetch;
        }
        let response: Response;
        try {
          response = await handler(request);
        } finally {
          globalThis.fetch = realFetch;
        }

        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await response.text());
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: 'dev_handler_error' }));
      }
    });
  }

  return {
    name: 'rsvp-api-dev',
    configureServer(server) {
      if (mock) console.log('\n  [rsvp] RSVP_SCRIPT_URL not set → using mock Apps Script (dev only)\n');
      attach(server, () => server.ssrLoadModule('/api/rsvp.ts'));
    },
  };
}

/**
 * Link previews (WhatsApp etc.) need absolute URLs. Uses SITE_URL if set,
 * otherwise Vercel's production domain (available automatically during Vercel builds).
 */
function siteUrl(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '');
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = (env.SITE_URL || process.env.SITE_URL || (vercel ? `https://${vercel}` : '')).replace(/\/$/, '');
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), rsvpApiDev(mode), siteUrl(mode)],
  server: { host: true },
}));
