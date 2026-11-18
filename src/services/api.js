// Concept: REST API integration with the Fetch API.
// Dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)",
// published by AGMARKNET on data.gov.in.
//
// The browser cannot call api.data.gov.in directly (the API sends no CORS headers),
// so prices are loaded from one of two places, both on our own site:
//   1. /api/mandi   - a proxy in the development server (npm start, see src/setupProxy.js)
//                     that calls data.gov.in with the key from .env
//   2. data/prices.json - official prices downloaded by "npm run deploy" just before it
//                     publishes the site; this is what the GitHub Pages site reads
// If neither works, App.jsx shows clearly labelled sample data.
import { parseApiDate } from '../utils.js';

export const COMMODITIES = ['Onion', 'Tomato', 'Potato', 'Wheat', 'Rice', 'Soyabean'];

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

// Convert one raw API record into the shape the app uses.
function normalise(r) {
  return {
    state: r.state,
    district: cleanName(r.district),
    market: cleanName(r.market),
    commodity: String(r.commodity || '').trim(),
    variety: r.variety,
    date: parseApiDate(r.arrival_date),
    min: Number(r.min_price),
    max: Number(r.max_price),
    modal: Number(r.modal_price),
    source: 'live',
  };
}

const clean = (records) => records
  .map(normalise)
  .filter((r) => COMMODITIES.includes(r.commodity) && r.date && !Number.isNaN(r.modal) && r.modal > 0);

// 1. Through the development-server proxy (src/setupProxy.js): one request per commodity, in parallel.
async function fromProxy(refresh) {
  const results = await Promise.allSettled(COMMODITIES.map(async (c) => {
    let response;
    try {
      response = await fetch(`./api/mandi?commodity=${encodeURIComponent(c)}${refresh ? '&refresh=1' : ''}`);
    } catch {
      throw new Error('Could not reach the AgriCompare server.');
    }
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('No price server here (this is normal on GitHub Pages).');
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || `The price server responded with status ${response.status}.`);
    return json.records || [];
  }));
  // One commodity failing should not hide the others.
  const records = clean(results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value));
  if (records.length === 0) {
    const firstError = results.find((r) => r.status === 'rejected');
    throw firstError ? firstError.reason : new Error('data.gov.in returned no Maharashtra records for these commodities.');
  }
  return { records, fetchedAt: new Date() };
}

// 2. From the saved snapshot.
async function fromSnapshot() {
  let response;
  try {
    response = await fetch('./data/prices.json', { cache: 'no-cache' });
  } catch {
    throw new Error('Could not load the saved price file.');
  }
  if (!response.ok) throw new Error('No official price file was published with this site. Publish it again with "npm run deploy".');
  const json = await response.json();
  const records = clean(json.records || []);
  if (records.length === 0) throw new Error('The saved price file is empty.');
  return { records, fetchedAt: json.fetchedAt ? new Date(json.fetchedAt) : null };
}

// While developing, ask the live proxy first; on the deployed site, read the snapshot first.
export async function loadOfficialPrices({ refresh = false } = {}) {
  const order = process.env.NODE_ENV === 'development' ? [fromProxy, fromSnapshot] : [fromSnapshot, fromProxy];
  const reasons = [];
  for (const attempt of order) {
    try {
      return await attempt(refresh);
    } catch (err) {
      reasons.push(err.message);
    }
  }
  // The first reason is the most useful one (e.g. "data.gov.in rejected the API key").
  throw new Error(reasons[0]);
}
