// Development only ("npm start"): serves /api/mandi on the local development server by running
// the same function that Vercel runs (api/mandi.js). Create React App runs this file itself.
// The key is read from .env (DATA_GOV_API_KEY) and never reaches the browser.
// Answers are kept for 30 minutes, like the Vercel CDN does on the live site.
const fs = require('fs');
const path = require('path');

function loadKeyFromDotEnv() {
  if (process.env.DATA_GOV_API_KEY) return;
  try {
    const text = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const line = text.split(/\r?\n/).find((l) => /^\s*DATA_GOV_API_KEY\s*=/.test(l));
    if (line) process.env.DATA_GOV_API_KEY = line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  } catch { /* no .env file */ }
}

module.exports = function setupProxy(app) {
  loadKeyFromDotEnv();
  const handler = require('../api/mandi.js');
  let cached = null; // { at, status, body }

  app.get('/api/mandi', async (req, res) => {
    if (cached && Date.now() - cached.at < 30 * 60 * 1000) {
      res.status(cached.status).json(cached.body);
      return;
    }
    // Capture the function's answer so it can be cached here.
    const capture = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.code = code; return this; },
      json(body) {
        if (this.code === 200) cached = { at: Date.now(), status: 200, body };
        res.status(this.code).json(body);
      },
    };
    await handler(req, capture);
  });
};
