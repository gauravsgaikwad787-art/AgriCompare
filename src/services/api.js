// Concept: REST API integration with the Fetch API.
// The browser loads the official AGMARKNET prices straight from the data.gov.in API:
//   - "Current Daily Price of Various Commodities from Various Markets (Mandi)": the latest day
//   - "Variety-wise Daily Market Prices Data of Commodity": the previous days (HISTORY_DAYS)
// One request per day brings every crop in Maharashtra; we keep our six crops.
// Results are saved in the browser for 30 minutes, so reloading the page is instant.
// If the prices cannot be loaded, App.jsx shows clearly labelled sample data.
//
// The key comes from .env (REACT_APP_DATA_GOV_API_KEY). Create React App builds it into the
// website, so anyone can see it with the browser tools: use a free key you can regenerate.
import { parseApiDate } from '../utils.js';

export const COMMODITIES = ['Onion', 'Tomato', 'Potato', 'Wheat', 'Rice', 'Soyabean'];

const API_KEY = (process.env.REACT_APP_DATA_GOV_API_KEY || '').trim();
// (The two *_URL variables are only for testing; normally the real data.gov.in addresses are used.)
const CURRENT_URL = process.env.REACT_APP_AGMARKNET_URL || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const HISTORY_URL = process.env.REACT_APP_AGMARKNET_HISTORY_URL || 'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24';
const STATE = 'Maharashtra';
export const HISTORY_DAYS = 7;
const PAGE = 1000; // rows per request; bigger days are fetched page by page
const PARALLEL = 4; // requests at the same time
const CACHE_KEY = 'agri_prices_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Tidy names from the feed: "APMC Pune " -> "Pune", "Chandrapur(Ganjwad)" -> "Chandrapur (Ganjwad)".
// Every market here is an APMC, so the prefix adds nothing.
export function cleanName(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)/g, ')')
    .replace(/\s+,/g, ',')
    .trim()
    .replace(/^APMC\s+/i, '')
    .replace(/\s+APMC$/i, '');
}

// Convert one raw API record into the shape the app uses. The two datasets spell their
// fields differently (arrival_date vs Arrival_Date), so field names are read case-insensitively.
const CROP_NAMES = new Map(COMMODITIES.map((c) => [c.toLowerCase(), c]));
function normalise(raw) {
  const r = {};
  Object.entries(raw).forEach(([k, v]) => { r[k.toLowerCase()] = v; });
  return {
    state: String(r.state || '').trim(),
    district: cleanName(r.district),
    market: cleanName(r.market),
    commodity: CROP_NAMES.get(String(r.commodity || '').trim().toLowerCase()),
    variety: r.variety,
    date: parseApiDate(r.arrival_date),
    min: Number(r.min_price ?? r.min_x0020_price),
    max: Number(r.max_price ?? r.max_x0020_price),
    modal: Number(r.modal_price ?? r.modal_x0020_price),
    source: 'live',
  };
}
const keep = (records) => records
  .map(normalise)
  .filter((r) => r.commodity && r.state.toLowerCase() === STATE.toLowerCase() && r.date && r.modal > 0);

// ----- network -----
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One GET request, with a 30-second limit and up to 3 tries if the server is busy.
async function request(url, filters, offset = 0) {
  const params = new URLSearchParams({ 'api-key': API_KEY, format: 'json', offset: String(offset), limit: String(PAGE) });
  Object.entries(filters).forEach(([k, v]) => params.set(k, v));
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${url}?${params}`, { signal: controller.signal });
      if (response.status === 401 || response.status === 403) {
        throw Object.assign(new Error('data.gov.in rejected the API key. Check REACT_APP_DATA_GOV_API_KEY in .env.'), { final: true });
      }
      if (!response.ok) throw new Error(`data.gov.in responded with status ${response.status}.`);
      const json = await response.json();
      return json.records || [];
    } catch (err) {
      if (err.final) throw err;
      lastError = err.name === 'AbortError' ? new Error('data.gov.in took too long to respond.') : err;
      if (attempt < 3) await sleep(2000 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  if (lastError instanceof TypeError) throw new Error('Could not reach data.gov.in. Check your internet connection.');
  throw lastError;
}

// Every page of one query.
async function requestAll(url, filters) {
  const all = [];
  for (let offset = 0; offset <= 20 * PAGE; offset += PAGE) {
    const rows = await request(url, filters, offset);
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

// Run jobs with at most `limit` at the same time.
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

// The previous days as DD/MM/YYYY (India time), the format the API uses.
function previousDays(days) {
  const out = [];
  for (let i = 1; i <= days; i++) {
    out.push(new Date(Date.now() - i * 86400000).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }));
  }
  return out;
}

// ----- browser cache -----
function readCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (saved && Date.now() - saved.at < CACHE_TTL && saved.records?.length) return saved;
  } catch { /* storage blocked or damaged: just download again */ }
  return null;
}
function writeCache(records) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), records })); } catch { /* storage full or blocked */ }
}

// ----- main -----
export async function loadOfficialPrices({ refresh = false } = {}) {
  if (!API_KEY) {
    throw new Error('No API key found. Add REACT_APP_DATA_GOV_API_KEY=your_key to the .env file, then restart "npm start" (or build again).');
  }
  if (!refresh) {
    const cached = readCache();
    if (cached) return { records: cached.records, fetchedAt: new Date(cached.at) };
  }

  // 1. Today's feed: one query for every crop in the state. Two spellings of the state filter exist.
  let today = await requestAll(CURRENT_URL, { 'filters[state.keyword]': STATE });
  if (today.length === 0) today = await requestAll(CURRENT_URL, { 'filters[state]': STATE });

  // 2. The previous days, one query per day. A day that fails is skipped; if the history
  //    dataset is unavailable altogether, today's feed is still used.
  let older = [];
  try {
    const perDay = await pool(previousDays(HISTORY_DAYS), PARALLEL, (date) =>
      requestAll(HISTORY_URL, { 'filters[State.keyword]': STATE, 'filters[Arrival_Date]': date }).catch((err) => {
        if (err.final) throw err;
        return [];
      }));
    older = perDay.flat();
  } catch (err) {
    console.warn('AgriCompare: earlier days could not be loaded, using the latest day only.', err.message);
  }

  const records = keep(today.concat(older));
  if (records.length === 0) throw new Error('data.gov.in returned no Maharashtra prices for these crops.');
  writeCache(records);
  return { records, fetchedAt: new Date() };
}
