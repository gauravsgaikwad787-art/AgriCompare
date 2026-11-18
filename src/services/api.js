// Concept: REST API integration with the Fetch API.
// Official AGMARKNET prices come from two places, which are combined:
//   1. LIVE: the browser loads today's prices straight from the data.gov.in API
//      ("Current Daily Price of Various Commodities from Various Markets (Mandi)").
//   2. RECENT DAYS: data/prices.json, the previous 7 days, downloaded by
//      scripts/fetch-prices.mjs before every build (that dataset does not allow browser requests).
// Each market keeps its most recent price (utils.js), so today's live price wins where it exists,
// and crops not reported today still have a recent price. The result is saved in the browser
// for 30 minutes. If neither source works, App.jsx shows clearly labelled sample data.
//
// The key comes from .env (REACT_APP_DATA_GOV_API_KEY). Create React App builds it into the
// website, so anyone can see it with the browser tools: use a free key you can regenerate.
import { parseApiDate } from '../utils.js';

export const COMMODITIES = ['Onion', 'Tomato', 'Potato', 'Wheat', 'Rice', 'Soyabean'];

const API_KEY = (process.env.REACT_APP_DATA_GOV_API_KEY || '').trim();
// (REACT_APP_AGMARKNET_URL is only for testing; normally the real data.gov.in address is used.)
const CURRENT_URL = process.env.REACT_APP_AGMARKNET_URL || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const STATE = 'Maharashtra';
const PAGE = 1000; // rows per request; bigger days are fetched page by page
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

// ----- the two sources -----
async function liveToday() {
  if (!API_KEY) throw new Error('No API key found. Add REACT_APP_DATA_GOV_API_KEY=your_key to the .env file, then restart "npm start" (or build again).');
  // Two spellings of the state filter exist.
  let rows = await requestAll(CURRENT_URL, { 'filters[state.keyword]': STATE });
  if (rows.length === 0) rows = await requestAll(CURRENT_URL, { 'filters[state]': STATE });
  return rows;
}

async function recentFile() {
  let response;
  try {
    response = await fetch('./data/prices.json', { cache: 'no-cache' });
  } catch {
    throw new Error('Could not load the recent prices file.');
  }
  if (!response.ok || !(response.headers.get('content-type') || '').includes('json')) {
    throw new Error('No recent prices file (it is downloaded when the website is built).');
  }
  const json = await response.json();
  return json.records || [];
}

// ----- main -----
export async function loadOfficialPrices({ refresh = false } = {}) {
  if (!refresh) {
    const cached = readCache();
    if (cached) return { records: cached.records, fetchedAt: new Date(cached.at) };
  }

  const [live, recent] = await Promise.allSettled([liveToday(), recentFile()]);
  if (live.status === 'rejected') console.warn('AgriCompare: live prices not loaded:', live.reason.message);
  if (recent.status === 'rejected') console.warn('AgriCompare: recent prices file not loaded:', recent.reason.message);

  const rows = [
    ...(live.status === 'fulfilled' ? live.value : []),
    ...(recent.status === 'fulfilled' ? recent.value : []),
  ];
  const records = keep(rows);
  if (records.length === 0) {
    // Explain the most useful reason (e.g. a missing or rejected key).
    const reason = live.status === 'rejected' ? live.reason.message
      : recent.status === 'rejected' ? `No Maharashtra prices reported today yet, and ${recent.reason.message.charAt(0).toLowerCase()}${recent.reason.message.slice(1)}`
        : 'data.gov.in returned no Maharashtra prices for these crops.';
    throw new Error(reason);
  }
  writeCache(records);
  return { records, fetchedAt: new Date() };
}
