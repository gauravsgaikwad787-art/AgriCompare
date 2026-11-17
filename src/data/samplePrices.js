// SAMPLE / DEMONSTRATION DATA - NOT OFFICIAL.
// These numbers are illustrative so the app works without an API key.
// The UI always labels them "Sample data". Replace with a CSV of officially
// published AGMARKNET prices if you want an offline official dataset.
import { todayISO } from '../utils.js';

const MARKETS = [
  ['Lasalgaon', 'Nashik'], ['Pimpalgaon', 'Nashik'], ['Pune', 'Pune'],
  ['Vashi (Navi Mumbai)', 'Mumbai'], ['Nagpur', 'Nagpur'], ['Kolhapur', 'Kolhapur'],
  ['Solapur', 'Solapur'], ['Ahmednagar', 'Ahmednagar'], ['Latur', 'Latur'], ['Akola', 'Akola'],
];

// Illustrative base modal price in Rs per quintal
export const SAMPLE_BASE = { Onion: 1800, Tomato: 1500, Potato: 1700, Wheat: 2650, Rice: 3400, Soyabean: 4600 };

export function buildSamplePrices() {
  const date = todayISO();
  const records = [];
  Object.keys(SAMPLE_BASE).forEach((commodity, c) => {
    MARKETS.forEach(([market, district], m) => {
      const swing = (((m * 7 + c * 3) % 13) - 6) / 100; // fixed pattern between -6% and +6%
      const modal = Math.round((SAMPLE_BASE[commodity] * (1 + swing)) / 10) * 10;
      records.push({
        state: 'Maharashtra', district, market, commodity, variety: 'Sample', date,
        min: Math.round((modal * 0.88) / 10) * 10,
        max: Math.round((modal * 1.12) / 10) * 10,
        modal, source: 'sample',
      });
    });
  });
  return records;
}

// Illustrative 7-day trend used only on the Analytics page, always labelled as sample.
const PATTERN = [0.96, 0.97, 0.99, 1.0, 1.02, 1.01, 1.0];
export function sampleHistory(commodity) {
  const base = SAMPLE_BASE[commodity] || 1500;
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
  }
  return { labels, values: PATTERN.map((p) => Math.round(base * p)) };
}
