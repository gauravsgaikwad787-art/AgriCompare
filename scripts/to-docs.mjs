// Runs after "react-scripts build": moves the finished website from build/ to docs/,
// because GitHub Pages serves the docs/ folder of the main branch.
// (.nojekyll tells GitHub Pages to serve the files exactly as they are.)
import { existsSync, renameSync, rmSync, writeFileSync } from 'node:fs';

const build = new URL('../build/', import.meta.url);
const docs = new URL('../docs/', import.meta.url);

if (!existsSync(build)) {
  console.error('No build/ folder found. Run "npm run build".');
  process.exit(1);
}
rmSync(docs, { recursive: true, force: true });
renameSync(build, docs);
writeFileSync(new URL('.nojekyll', docs), '');
console.log('Website ready in docs/. Commit and push it to main to publish.');
