// Saves the latest official AGMARKNET prices to public/data/prices.json.
// GitHub Pages has no server to call data.gov.in, so the deployed site reads this
// snapshot instead. It runs automatically before "npm run deploy"; run it yourself
// with "npm run fetch-prices" to refresh the data, then deploy again.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { COMMODITIES, fetchCommodity, readKey } from './agmarknet.mjs';

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

await loadDotEnv();
const key = readKey(process.env);
const out = new URL('../public/data/prices.json', import.meta.url);

try {
  const results = await Promise.allSettled(COMMODITIES.map((c) => fetchCommodity(key, c)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.warn(`  ${COMMODITIES[i]}: ${r.reason.message}`);
    else console.log(`  ${COMMODITIES[i]}: ${r.value.length} records`);
  });
  const records = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
  if (records.length === 0) {
    const firstError = results.find((r) => r.status === 'rejected');
    throw new Error(firstError ? firstError.reason.message : 'data.gov.in returned no Maharashtra records for these commodities.');
  }
  await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
  await writeFile(out, JSON.stringify({ fetchedAt: new Date().toISOString(), records }));
  console.log(`Saved ${records.length} official records to public/data/prices.json`);
} catch (err) {
  // Do not stop the deploy: the site falls back to the previous snapshot, or to labelled sample data.
  console.warn(`Could not refresh official prices: ${err.message}`);
  console.warn('The site will use the previous snapshot if there is one, otherwise labelled sample data.');
}
