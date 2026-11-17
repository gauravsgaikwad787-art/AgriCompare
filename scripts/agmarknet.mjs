// Server-side (Node) access to the AGMARKNET dataset on data.gov.in.
// The browser cannot call api.data.gov.in directly because the API does not send
// CORS headers, so Node makes the request instead: the Vite dev/preview proxy
// (vite.config.js) and the snapshot script (scripts/fetch-prices.mjs) both use this file.
// The API key stays on your computer and is never put into the website's JavaScript.

export const RESOURCE_URL = process.env.AGMARKNET_URL || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'; // AGMARKNET_URL is only for testing

import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';

// Prefer IPv4 addresses (IPv6 hangs on many home networks).
dns.setDefaultResultOrder('ipv4first');

// Names must match AGMARKNET spelling exactly (it uses "Soyabean").
export const COMMODITIES = ['Onion', 'Tomato', 'Potato', 'Wheat', 'Rice', 'Soyabean'];

// Read the key from .env. DATA_GOV_API_KEY is preferred; the older VITE_ name still works.
export function readKey(env) {
  return (env.DATA_GOV_API_KEY || env.VITE_DATA_GOV_API_KEY || '').trim();
}

// Historical dataset: "Variety-wise Daily Market Prices Data of Commodity" (also AGMARKNET).
// The current feed only holds the latest day, so the last HISTORY_DAYS days are read from here
// to give every market its most recent price.
export const HISTORY_URL = process.env.AGMARKNET_HISTORY_URL || 'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24';
export const HISTORY_DAYS = 30;
const PAGE = 2000; // rows per request; more rows are fetched page by page

// Download the latest prices for ALL our crops in Maharashtra.
// Speed: data.gov.in answers slowly, so the number of requests matters most. Instead of
// asking once per crop per day (6 x 31 = ~190 requests), this asks once per DAY for every
// crop in the state and keeps our six crops locally (~32 requests).
// Returns { Onion: [...records], Tomato: [...], ... } in the current-feed shape. Every record
// keeps its real arrival date; the site keeps each market's most recent one (utils.js).
// onProgress(message) is called as days complete (used by fetch-prices to print progress).
export async function fetchAllCrops(apiKey, { state = 'Maharashtra', days = HISTORY_DAYS, history = true, onProgress } = {}) {
  const sameState = (r) => String(r.state).trim().toLowerCase() === state.toLowerCase();

  // 1. Today's feed, all crops at once. data.gov.in has used two spellings for the state filter.
  let today = await requestAll(RESOURCE_URL, apiKey, { 'filters[state.keyword]': state });
  if (today.length === 0) today = await requestAll(RESOURCE_URL, apiKey, { 'filters[state]': state });
  onProgress?.(`Today's feed: ${keepOurCrops(today).length} records`);

  // 2. The last `days` days, one request per day for all crops, a few days at a time.
  //    A failed day is skipped (today's feed and the other days are still used).
  let older = [];
  if (history) {
    const dates = recentDates(days);
    let refused = false; // the historical dataset refused the key: use today's feed only
    for (const stateKey of ['filters[State.keyword]', 'filters[State]']) {
      let done = 0;
      let failedDays = 0;
      const perDay = await pool(dates, 3, async (date) => {
        if (refused) return [];
        let rows = [];
        try {
          rows = (await requestAll(HISTORY_URL, apiKey, { [stateKey]: state, 'filters[Arrival_Date]': date })).map(toCurrentShape);
        } catch (err) {
          if (err.status === 401 || err.status === 403) refused = true;
          failedDays++;
        }
        done++;
        onProgress?.(`Day ${done} of ${dates.length} (${date}): ${keepOurCrops(rows).length} records`);
        return rows;
      });
      older = perDay.flat();
      if (refused) { onProgress?.('The historical dataset refused the key, so only today\'s feed is used.'); break; }
      if (failedDays) onProgress?.(`${failedDays} day(s) could not be downloaded and were skipped.`);
      if (older.length > 0) break; // the first spelling worked; no need to try the other
    }
  }

  const all = keepOurCrops(today.concat(older)).filter(sameState);
  const byCrop = Object.fromEntries(COMMODITIES.map((c) => [c, []]));
  all.forEach((r) => byCrop[r.commodity].push(r));
  return byCrop;
}

// Keep only our six crops, with the commodity name normalised to our spelling.
function keepOurCrops(rows) {
  const names = new Map(COMMODITIES.map((c) => [c.toLowerCase(), c]));
  return rows
    .map((r) => ({ ...r, commodity: names.get(String(r.commodity || '').trim().toLowerCase()) }))
    .filter((r) => r.commodity);
}

// Fetch every page of a query (data.gov.in returns at most PAGE rows per request).
async function requestAll(url, apiKey, filters) {
  const all = [];
  for (let offset = 0; ; offset += PAGE) {
    const rows = await request(url, apiKey, filters, { limit: PAGE, offset });
    all.push(...rows);
    if (rows.length < PAGE || offset >= 20 * PAGE) return all; // last page (or a safety stop)
  }
}

// Dates for today and the previous days, in India time, as DD/MM/YYYY (the API's format).
function recentDates(days) {
  const out = [];
  for (let i = 0; i <= days; i++) {
    out.push(new Date(Date.now() - i * 86400000).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }));
  }
  return out;
}

// Run async jobs with at most `limit` in flight, so data.gov.in is not flooded.
async function pool(items, limit, job) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await job(items[i]);
    }
  }));
  return results;
}

// The historical dataset uses capitalised field names (State, Modal_Price, ...).
function toCurrentShape(record) {
  const r = {};
  Object.entries(record).forEach(([k, v]) => { r[k.toLowerCase()] = v; });
  return {
    state: r.state, district: r.district, market: r.market, commodity: r.commodity, variety: r.variety,
    arrival_date: r.arrival_date, min_price: r.min_price ?? r.min_x0020_price, max_price: r.max_price ?? r.max_x0020_price,
    modal_price: r.modal_price ?? r.modal_x0020_price,
  };
}

// ---------------------------------------------------------------------------
// Network layer.
// Node's built-in fetch gives up if a connection takes more than 10 seconds and may
// try IPv6 first, which hangs on many home networks (UND_ERR_CONNECT_TIMEOUT).
// So requests use Node's https module over IPv4 with a longer limit, at most
// MAX_PARALLEL at a time (data.gov.in stalls when one computer opens many
// connections), and are retried with a growing wait.
// ---------------------------------------------------------------------------
const MAX_PARALLEL = 4;
const RETRIES = 3;
let running = 0;
const waiting = [];
async function slot(job) {
  if (running >= MAX_PARALLEL) await new Promise((resolve) => waiting.push(resolve));
  running++;
  try { return await job(); } finally {
    running--;
    waiting.shift()?.();
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GET a URL and parse JSON. Resolves { status, json }.
function getJSON(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, { family: 4, timeout: timeoutMs, headers: { Accept: 'application/json' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch { /* not JSON (error page) */ }
        resolve({ status: res.statusCode, json });
      });
    });
    req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })));
    req.on('error', reject);
  });
}

async function request(url, apiKey, filters, { limit = 500, offset = 0, timeoutMs = 45000 } = {}) {
  if (!apiKey) {
    const err = new Error('No API key found. Add DATA_GOV_API_KEY to the .env file and restart the server.');
    err.status = 500;
    throw err;
  }
  const params = new URLSearchParams({ 'api-key': apiKey, format: 'json', offset: String(offset), limit: String(limit) });
  Object.entries(filters).forEach(([k, v]) => params.set(k, v));
  const full = `${url}?${params}`;

  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const { status, json } = await slot(() => getJSON(full, timeoutMs));
      if (status === 401 || status === 403) {
        const err = new Error('data.gov.in rejected the API key. Check that it is correct.');
        err.status = status;
        err.final = true; // retrying will not help
        throw err;
      }
      if (status >= 500 || status === 429) throw Object.assign(new Error(`data.gov.in responded with status ${status}.`), { status: 502 });
      if (status !== 200 || !json) {
        throw Object.assign(new Error(`data.gov.in responded with status ${status}.`), { status: 502, final: true });
      }
      return json.records || [];
    } catch (cause) {
      if (cause.final) throw cause;
      lastError = cause;
      if (attempt < RETRIES) await sleep(3000 * attempt); // 3 s, then 6 s
    }
  }
  const timedOut = lastError?.code === 'TIMEOUT' || lastError?.code === 'ETIMEDOUT';
  const err = new Error(timedOut
    ? 'data.gov.in took too long to respond. Try again in a few minutes.'
    : lastError?.status ? lastError.message : `Could not reach data.gov.in (${lastError?.code || lastError?.message || 'network error'}).`);
  err.status = 502;
  throw err;
}
