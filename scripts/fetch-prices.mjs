// Saves the latest official AGMARKNET prices to public/data/prices.json.
// GitHub Pages has no server to call data.gov.in, so the published site reads this
// file instead. It runs automatically before "npm run deploy"; you can also run it
// yourself with "npm run fetch-prices".
//
// With "--require" (used by npm run deploy) it refuses to continue if there are no
// official prices at all, so a site with only sample data is never published by mistake.
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { COMMODITIES, fetchAllCrops, readKey } from './agmarknet.mjs';

const REQUIRE = process.argv.includes('--require');
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


async function previousSnapshot() {
  try {
    await access(out);
    const json = JSON.parse(await readFile(out, 'utf8'));
    return json.records?.length ? json : null;
  } catch { return null; }
}

await loadDotEnv();
const key = readKey(process.env);
console.log('Downloading official AGMARKNET prices for the last 30 days (one request per day)...');

try {
  // One request per day for all crops (about 32 requests in total), with progress lines.
  const started = Date.now();
  const byCrop = await fetchAllCrops(key, { onProgress: (msg) => console.log(`  ${msg}`) });
  console.log(`\nDone in ${Math.round((Date.now() - started) / 1000)} s:`);
  COMMODITIES.forEach((c) => console.log(`  ${c}: ${byCrop[c].length} records`));
  const records = COMMODITIES.flatMap((c) => byCrop[c]);
  if (records.length === 0) throw new Error('data.gov.in returned no Maharashtra records for these crops.');
  await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
  await writeFile(out, JSON.stringify({ fetchedAt: new Date().toISOString(), records }));
  console.log(`Saved ${records.length} official records to public/data/prices.json`);
} catch (err) {
  console.warn(`\nCould not download official prices: ${err.message}`);
  const old = await previousSnapshot();
  if (old) {
    console.warn(`Using the previous price file from ${new Date(old.fetchedAt).toLocaleString('en-IN')} instead.`);
  } else if (REQUIRE) {
    console.error('\nDeploy stopped: there is no official price file, so the published site would only show sample data.');
    console.error('Check that .env contains DATA_GOV_API_KEY=your_key and that https://api.data.gov.in opens on this computer,');
    console.error('then run "npm run deploy" again.');
    process.exit(1);
  } else {
    console.warn('The site will show clearly labelled sample data.');
  }
}
