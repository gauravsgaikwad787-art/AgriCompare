// Small helper functions shared by many components.

export const todayISO = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

export const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN');

// "2026-11-15" -> "15 Nov 2026" (or Hindi month names when lang is 'hi')
export function formatDate(iso, lang = 'en') {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// The API sends dates as "DD/MM/YYYY" (sometimes "YYYY-MM-DD"); we store ISO so dates sort correctly.
export function parseApiDate(s) {
  if (!s) return '';
  const text = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const [d, m, y] = text.split('/');
  if (!y) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export const uniqueSorted = (arr) => [...new Set(arr)].filter(Boolean).sort();

// One mandi can report several varieties of the same commodity.
// For comparison we keep each market's LATEST date and average its varieties.
export function summariseByMarket(records) {
  const latest = {};
  records.forEach((r) => {
    if (!latest[r.market] || r.date > latest[r.market]) latest[r.market] = r.date;
  });
  const groups = {};
  records
    .filter((r) => r.date === latest[r.market])
    .forEach((r) => {
      if (!groups[r.market]) groups[r.market] = [];
      groups[r.market].push(r);
    });
  return Object.values(groups).map((g) => {
    const avg = (k) => Math.round(g.reduce((sum, r) => sum + r[k], 0) / g.length);
    return {
      id: `${g[0].commodity}|${g[0].market}`,
      commodity: g[0].commodity,
      market: g[0].market,
      district: g[0].district,
      date: g[0].date,
      min: avg('min'),
      max: avg('max'),
      modal: avg('modal'),
      varieties: g.length,
      source: g[0].source,
    };
  });
}

// Same summary, done separately for every commodity.
export function summariseAll(records) {
  const byCommodity = {};
  records.forEach((r) => {
    if (!byCommodity[r.commodity]) byCommodity[r.commodity] = [];
    byCommodity[r.commodity].push(r);
  });
  return Object.values(byCommodity).flatMap(summariseByMarket);
}

// Build a CSV text and trigger a download.
export function downloadCSV(rows, filename) {
  const headers = ['Commodity', 'Market', 'District', 'Date', 'Min (Rs/quintal)', 'Max (Rs/quintal)', 'Modal (Rs/quintal)', 'Data type'];
  const lines = [
    headers,
    ...rows.map((r) => [
      r.commodity, r.market, r.district, r.date, r.min, r.max, r.modal,
      r.source === 'live' ? 'AGMARKNET via data.gov.in' : 'Sample data',
    ]),
  ];
  const csv = lines.map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Whole days between a reported date (YYYY-MM-DD) and today.
export function daysAgo(iso) {
  if (!iso) return Infinity;
  const [y, m, d] = iso.split('-').map(Number);
  const [ty, tm, td] = todayISO().split('-').map(Number);
  return Math.max(0, Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000));
}

// "today", "yesterday" or "3 days ago", using the translate function t.
export function ageLabel(iso, t) {
  const n = daysAgo(iso);
  if (n === 0) return t('today');
  if (n === 1) return t('yesterday');
  return t('daysAgo', { n });
}
