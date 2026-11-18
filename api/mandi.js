// Vercel serverless function: GET /api/mandi
// Runs on Vercel's server (Mumbai region, see vercel.json), so it can call both data.gov.in
// datasets directly (browser CORS rules do not apply) and the API key stays secret: it is read
// from the DATA_GOV_API_KEY environment variable set in the Vercel project settings.
//
// It returns today's prices plus the previous 7 days for six crops in Maharashtra:
//   { fetchedAt: "...", records: [ ...raw AGMARKNET records... ] }
// Vercel's CDN keeps each answer for 30 minutes (Cache-Control below), so data.gov.in is asked
// at most about twice an hour, and visitors get the answer instantly.
//
// src/setupProxy.js uses this same function for "npm start".

// Time budget: after BUDGET_MS no new day is started, and each request is limited, so even with a
// very slow data.gov.in the function answers in about 45 s (Vercel allows 60 s, see vercel.json).
const BUDGET_MS = 30000;

module.exports = async function handler(req, res) {
  const { fetchAllCrops, readKey, COMMODITIES } = await import('../scripts/agmarknet.mjs');
  try {
    const byCrop = await fetchAllCrops(readKey(process.env), {
      net: { timeoutMs: 15000, retries: 2 },        // today's prices: up to 2 tries
      historyNet: { timeoutMs: 12000, retries: 1 }, // each previous day: 1 try
      deadline: Date.now() + BUDGET_MS,
    });
    const records = COMMODITIES.flatMap((c) => byCrop[c]);
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json({ fetchedAt: new Date().toISOString(), records });
  } catch (err) {
    console.error('[api/mandi]', err.message);
    res.setHeader('Cache-Control', 'no-store');
    res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({ error: err.message });
  }
};
