// Concept: REST API integration with the Fetch API.
// The website asks its own server function, /api/mandi (api/mandi.js, run by Vercel; by
// src/setupProxy.js during "npm start"), which loads today's prices plus the previous 7 days
// from the data.gov.in API using a secret key. The browser never sees the key and is not
// affected by CORS. The result is also kept in the browser for 30 minutes, so reloading is
// instant. If the prices cannot be loaded, App.jsx shows clearly labelled sample data.
import { parseApiDate } from '../utils.js';

export const COMMODITIES = ['Onion', 'Tomato', 'Potato', 'Wheat', 'Rice', 'Soyabean'];

const STATE = 'Maharashtra';
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
  if (!refresh) {
    const cached = readCache();
    if (cached) return { records: cached.records, fetchedAt: new Date(cached.at) };
  }

  let response;
  try {
    response = await fetch('/api/mandi');
  } catch {
    throw new Error('Could not reach the AgriCompare price server. Check your internet connection.');
  }
  const isJson = (response.headers.get('content-type') || '').includes('json');
  if (!isJson) throw new Error('No price server found: live prices work on the Vercel website (or with "npm start").');
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || `The price server responded with status ${response.status}.`);

  const records = keep(json.records || []);
  if (records.length === 0) throw new Error('data.gov.in returned no Maharashtra prices for these crops.');
  writeCache(records);
  return { records, fetchedAt: json.fetchedAt ? new Date(json.fetchedAt) : new Date() };
}
