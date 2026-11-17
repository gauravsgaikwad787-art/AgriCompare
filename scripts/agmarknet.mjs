// Server-side (Node) access to the AGMARKNET dataset on data.gov.in.
// The browser cannot call api.data.gov.in directly because the API does not send
// CORS headers, so Node makes the request instead: the Vite dev/preview proxy
// (vite.config.js) and the snapshot script (scripts/fetch-prices.mjs) both use this file.
// The API key stays on your computer and is never put into the website's JavaScript.

export const RESOURCE_URL = process.env.AGMARKNET_URL || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'; // AGMARKNET_URL is only for testing

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

// Fetch one commodity's Maharashtra records for the last HISTORY_DAYS days, in the
// current-feed shape. The site keeps each market's most recent report (see utils.js), and
// every record keeps its real arrival date, so the site always shows how old a price is.
export async function fetchCommodity(apiKey, commodity, options = {}) {
  const state = options.state || 'Maharashtra';
  const sameState = (r) => String(r.state).trim().toLowerCase() === state.toLowerCase();

  // 1. Today's feed. data.gov.in has used two spellings for the state filter, so try both.
  let today = await request(RESOURCE_URL, apiKey, { 'filters[state.keyword]': state, 'filters[commodity]': commodity }, options);
  if (today.length === 0) today = await request(RESOURCE_URL, apiKey, { 'filters[state]': state, 'filters[commodity]': commodity }, options);
  if (options.history === false) return today.filter(sameState);

  // 2. The last HISTORY_DAYS days. A failure here is not fatal: today's feed is still shown.
  let older = [];
  try {
    older = await fetchHistory(apiKey, commodity, state, options.days || HISTORY_DAYS);
    console.log(`[agmarknet] ${commodity}: ${today.length} records today, ${older.length} from the last ${options.days || HISTORY_DAYS} days`);
  } catch (err) {
    console.warn(`[agmarknet] ${commodity}: historical lookup failed (${err.message})`);
  }
  return today.concat(older).filter(sameState);
}

// Dates for today and the previous days, in India time, as DD/MM/YYYY (the API's format).
function recentDates(days) {
  const out = [];
  for (let i = 0; i <= days; i++) {
    out.push(new Date(Date.now() - i * 86400000).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }));
  }
  return out;
}
const toTime = (ddmmyyyy) => {
  const [d, m, y] = String(ddmmyyyy || '').split('/').map(Number);
  return y ? Date.UTC(y, m - 1, d) : 0;
};

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

async function fetchHistory(apiKey, commodity, state, days) {
  const dates = recentDates(days);
  const oldest = toTime(dates[dates.length - 1]);

  // Fast path: one request sorted newest-first. Used only if the API really returns recent rows.
  try {
    const sorted = await request(HISTORY_URL, apiKey, {
      'filters[State.keyword]': state, 'filters[Commodity]': commodity, 'sort[Arrival_Date]': 'desc',
    }, { limit: 2000, timeoutMs: 30000 });
    const shaped = sorted.map(toCurrentShape);
    const recent = shaped.filter((r) => toTime(r.arrival_date) >= oldest);
    if (recent.length > 0 && toTime(shaped[0].arrival_date) >= oldest) return recent;
  } catch { /* fall through to the day-by-day search */ }

  // Reliable path: one request per day, a few at a time.
  for (const stateKey of ['filters[State.keyword]', 'filters[State]']) {
    const perDay = await pool(dates, 6, (date) => request(HISTORY_URL, apiKey, {
      [stateKey]: state, 'filters[Commodity]': commodity, 'filters[Arrival_Date]': date,
    }, { timeoutMs: 15000 }).catch(() => []));
    const all = perDay.flat();
    if (all.length > 0) return all.map(toCurrentShape);
  }
  return [];
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

async function request(url, apiKey, filters, { limit = 500, timeoutMs = 25000 } = {}) {
  if (!apiKey) {
    const err = new Error('No API key found. Add DATA_GOV_API_KEY to the .env file and restart the server.');
    err.status = 500;
    throw err;
  }
  const params = new URLSearchParams({ 'api-key': apiKey, format: 'json', offset: '0', limit: String(limit) });
  Object.entries(filters).forEach(([k, v]) => params.set(k, v));

  let response;
  try {
    response = await fetch(`${url}?${params}`, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (cause) {
    const timedOut = cause?.name === 'TimeoutError';
    const err = new Error(timedOut
      ? 'data.gov.in took too long to respond. Try again in a minute.'
      : `Could not reach data.gov.in (${cause?.cause?.code || cause?.message || 'network error'}).`);
    err.status = 502;
    throw err;
  }
  if (response.status === 401 || response.status === 403) {
    const err = new Error('data.gov.in rejected the API key. Check that it is correct.');
    err.status = response.status;
    throw err;
  }
  if (!response.ok) {
    const err = new Error(`data.gov.in responded with status ${response.status}.`);
    err.status = 502;
    throw err;
  }
  const json = await response.json();
  return json.records || [];
}
