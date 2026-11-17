import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { COMMODITIES, fetchAllCrops, readKey } from './scripts/agmarknet.mjs';

// A small server-side proxy at /api/mandi?commodity=Onion.
// The browser cannot call api.data.gov.in directly (no CORS headers), so the
// Vite server makes the request and adds the key from .env. Works for
// "npm run dev" and "npm run preview".
function mandiProxy(apiKey) {
  // Collecting 30 days takes many requests, so results are kept for 30 minutes.
  // "?refresh=1" (the site's Refresh button) skips the cache.
  // All crops are downloaded together (one request per day) and shared by the six
  // per-crop requests the page makes.
  let cache = null; // { at, promise }
  const TTL = 30 * 60 * 1000;
  const load = async (commodity, refresh) => {
    const fresh = cache && Date.now() - cache.at < TTL && !(refresh && Date.now() - cache.at > 15000);
    if (!fresh) {
      const promise = fetchAllCrops(apiKey, { onProgress: (msg) => console.log(`[mandi proxy] ${msg}`) });
      cache = { at: Date.now(), promise };
      promise.catch(() => { cache = null; }); // never cache a failure
    }
    return (await cache.promise)[commodity];
  };

  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const commodity = url.searchParams.get('commodity');
    res.setHeader('Content-Type', 'application/json');
    if (!COMMODITIES.includes(commodity)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Unknown commodity.' }));
      return;
    }
    try {
      const records = await load(commodity, url.searchParams.get('refresh') === '1');
      res.end(JSON.stringify({ records }));
    } catch (err) {
      console.warn(`[mandi proxy] ${commodity}: ${err.message}`);
      res.statusCode = err.status || 502;
      res.end(JSON.stringify({ error: err.message }));
    }
  };
  return {
    name: 'mandi-proxy',
    configureServer(server) { server.middlewares.use('/api/mandi', handler); },
    configurePreviewServer(server) { server.middlewares.use('/api/mandi', handler); },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // all variables, but only on the server
  return {
    plugins: [react(), mandiProxy(readKey(env))],
    base: './', // makes the built site work from any GitHub Pages sub-path
  };
});
