// Development-only proxy for "npm start" (Create React App runs this file automatically).
// The browser cannot call api.data.gov.in directly (the API sends no CORS headers), so the
// development server makes the request instead and adds the key from .env. The key never
// reaches the browser. It answers /api/mandi?commodity=Onion with that crop's records.
//
// All crops are downloaded together (one request per day for the last 30 days) and kept for
// 30 minutes; "?refresh=1" (the site's Refresh button) downloads again.
const fs = require('fs');
const path = require('path');

const COMMODITIES = ['Onion', 'Tomato', 'Potato', 'Wheat', 'Rice', 'Soyabean'];
const TTL = 30 * 60 * 1000;

// Read DATA_GOV_API_KEY from .env (Create React App only exposes REACT_APP_ variables itself).
function readEnvKey() {
  if (process.env.DATA_GOV_API_KEY) return process.env.DATA_GOV_API_KEY.trim();
  try {
    const text = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const line = text.split(/\r?\n/).find((l) => /^\s*(DATA_GOV_API_KEY|VITE_DATA_GOV_API_KEY)\s*=/.test(l));
    return line ? line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '') : '';
  } catch {
    return '';
  }
}

module.exports = function setupProxy(app) {
  const apiKey = readEnvKey();
  let cache = null; // { at, promise }

  // scripts/agmarknet.mjs is an ES module, so it is loaded with import().
  const load = async (commodity, refresh) => {
    const fresh = cache && Date.now() - cache.at < TTL && !(refresh && Date.now() - cache.at > 15000);
    if (!fresh) {
      const promise = import('../scripts/agmarknet.mjs')
        .then(({ fetchAllCrops }) => fetchAllCrops(apiKey, { onProgress: (msg) => console.log(`[mandi proxy] ${msg}`) }));
      cache = { at: Date.now(), promise };
      promise.catch(() => { cache = null; }); // never cache a failure
    }
    return (await cache.promise)[commodity];
  };

  app.use('/api/mandi', async (req, res) => {
    const url = new URL(req.originalUrl, 'http://localhost');
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
  });
};
