// Downloads the official AGMARKNET prices of the last few days into public/data/prices.json.
// The browser loads TODAY's prices live, but the dataset with the previous days does not allow
// browser requests, so this script saves them as a file that is published with the website.
//
// It runs automatically:
//   - before "npm run build" (always tries to refresh the file), and
//   - before "npm start" with --if-old (only if the file is missing or older than 6 hours).
// It never stops the build: if the download fails, the previous file (if any) is kept.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { COMMODITIES, fetchAllCrops, readKey } from './agmarknet.mjs';

const IF_OLD = process.argv.includes('--if-old');
const out = new URL('../public/data/prices.json', import.meta.url);

// Minimal .env reader, so no extra package is needed.
async function loadDotEnv() {
  try {
    const text = await readFile(new URL('../.env', import.meta.url), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env file */ }
}

async function ageHours() {
  try { return (Date.now() - (await stat(out)).mtimeMs) / 3600000; } catch { return Infinity; }
}

if (IF_OLD && (await ageHours()) < 6) {
  console.log('Recent prices file is less than 6 hours old; not downloading again.');
  process.exit(0);
}

await loadDotEnv();
const key = readKey(process.env);
if (!key) {
  console.warn('No API key in .env (REACT_APP_DATA_GOV_API_KEY), so the recent prices file was not downloaded.');
  process.exit(0);
}

console.log('Downloading the official prices of the last 7 days (one request per day)...');
try {
  const started = Date.now();
  const byCrop = await fetchAllCrops(key, { onProgress: (msg) => console.log(`  ${msg}`) });
  const records = COMMODITIES.flatMap((c) => byCrop[c]);
  if (records.length === 0) throw new Error('data.gov.in returned no Maharashtra records for these crops.');
  await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
  await writeFile(out, JSON.stringify({ fetchedAt: new Date().toISOString(), records }));
  console.log(`Saved ${records.length} records in ${Math.round((Date.now() - started) / 1000)} s:`);
  COMMODITIES.forEach((c) => console.log(`  ${c}: ${byCrop[c].length}`));
} catch (err) {
  const hours = await ageHours();
  console.warn(`\nCould not download the recent prices: ${err.message}`);
  console.warn(hours === Infinity
    ? 'Continuing without the file: the website will show today\'s live prices only.'
    : `Continuing with the previous file (${Math.round(hours)} hours old).`);
}
