# AgriCompare

Agricultural commodity price comparison for Maharashtra APMC markets.
Built with **React (Create React App) + Bootstrap 5 + Chart.js**, published on GitHub Pages from the `main` branch.

## Run it

```
npm install
npm start          # opens http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm start` | Development server with live reload and the price proxy |
| `npm run fetch-prices` | Downloads the latest official prices into `public/data/prices.json` |
| `npm run build` | Builds the website into `docs/` |
| `npm run deploy` | `fetch-prices` + `build` (stops if no official prices could be downloaded) |

## Load official prices

1. Register at https://data.gov.in and copy your API key (a long string of letters and numbers).
2. Copy `.env.example` to `.env` and put the key after the equals sign (no quotes, no spaces):
   ```
   DATA_GOV_API_KEY=your_key_here
   ```
   (The older name `VITE_DATA_GOV_API_KEY` also still works.)
3. Restart `npm start`. The badge on Explorer, Compare and Analytics should say **Official AGMARKNET data**.
   Without a key the site still works, using clearly labelled sample data.

If the badge says **Sample data**, the text next to it gives the reason (no key, key rejected, data.gov.in
did not respond, no records). The terminal running `npm start` also prints `[mandi proxy]` messages.

Dataset used: *Current Daily Price of Various Commodities from Various Markets (Mandi)*
(resource id `9ef84268-d588-465a-a308-a864a43d0070`), filtered to Maharashtra and six commodities.
Sample data is illustrative, not official, and is always labelled. Official prices are updated periodically,
not in real time.

### Latest prices from the last 30 days

The "Current Daily Price" feed only holds the **latest day's** reports, and a market reports a crop only on days
it is actually traded. So AgriCompare also reads AGMARKNET's historical dataset *Variety-wise Daily Market
Prices Data of Commodity* (resource `35985678-0d79-46b4-9ed6-6f13308a1d24`) for the **last 30 days** and keeps
each market's **most recent** price (`summariseByMarket` in `utils.js`). Every card shows its reported date and
how old it is ("today", "3 days ago").

The development server caches the result for 30 minutes (the Refresh button
skips the cache), and the GitHub Pages site uses the price file downloaded by `npm run deploy`. Run that command to see
how many records each crop has: it prints one line per crop.

### Where to sell

On Compare, and on Explorer when a crop is chosen (or typed, e.g. "wheat"), the **Where to sell** panel
(`components/WhereToSell.jsx`) ranks markets by their latest modal price. Rankings default to the **last 7 days**
so an old price cannot beat a recent one; switch to 30 days if a crop is rarely reported. Choose **your district**
to see its best market and how much more per quintal the best market elsewhere is reporting. Distance, transport
and market fees are not in the data, so the panel reminds users to check them.

### Why prices go through a proxy (CORS)

The browser is not allowed to read responses from `api.data.gov.in` directly, because the API does not send
CORS headers. Calling it from the page fails with "Could not reach the API". So the request is made by Node
instead, where CORS does not apply:

| Where the site runs | Where prices come from |
|---|---|
| `npm start` | `/api/mandi`, a small proxy inside the development server (`src/setupProxy.js`) that calls data.gov.in with the key from `.env` |
| GitHub Pages (no server) | `public/data/prices.json`, official prices downloaded on your computer by `npm run deploy` just before it publishes |

A bonus: the API key stays on your computer and is never put into the website's JavaScript.
To refresh the prices on the deployed site, run `npm run deploy` again (for example once a day).

## Deploy to GitHub Pages (one branch: `main`)

GitHub Pages only hosts files, so it is given the **built** website, which lives in the `docs/` folder of the
`main` branch. GitHub Pages also cannot run the price proxy, so the official prices are downloaded **on your
computer** during `npm run deploy` and published with the website.

**One-time setup on GitHub:** **Settings > Pages > Build and deployment > Source: Deploy from a branch**,
**Branch: `main`**, folder **`/docs`**, then **Save**.

**Every time you want to publish (or refresh the prices):**

```
npm run deploy
git add .
git commit -m "Publish website"
git push
```

`npm run deploy` (1) downloads the latest official prices with your `.env` key, (2) builds the website and
(3) puts it in `docs/`. Pushing `main` publishes it; after a minute or two the site at
`https://<your-username>.github.io/<repository-name>/` shows the new prices.

If no official prices can be downloaded and there is no earlier price file, the deploy **stops** with a message,
so a website with only sample data is never published by mistake. If an earlier price file exists, it is reused.

## Pages

The site is one React app. Pages live in the URL hash (`#/explorer`, `#/compare`, ...), so the browser's
Back button, refresh and shared links all work, including on GitHub Pages.

| Page | What it does |
|------|--------------|
| Home | What AgriCompare is, who it is for, a mandi price board, a quiet price ticker, features, how it works, where the data comes from, SDGs. No charts or statistics. |
| Explorer | One card per APMC market with the latest price of every crop it trades; search, crop, district and "reported within" filters, favourite markets; each crop links to Compare |
| Compare | One crop across markets: summary strip, highest modal price highlighted, card or sortable table view, CSV export |
| Analytics | Modal price bar chart (sideways on phones), a chart from your own numbers, and an illustrative 7-day trend that is always labelled as sample |
| Alerts | Validated alert form (commodity, preferred market, threshold, above/below), saved alerts with status, edit and delete |
| About | Web resume read from `src/data/profile.js`, with Print / Save as PDF |

## Design system

All colours, type sizes, spacing, buttons, inputs, cards, badges, tables and charts are defined once in
`src/style.css` (tokens at the top, light and dark). Bootstrap 5 handles the grid and base components.
Theme: based on the **Solstice** WordPress theme by Automattic (GPLv2 or later), re-coloured with forest green in place of navy. The whole site is set in **Poppins** (Google Fonts, which also covers Hindi), with pill buttons, 30px rounded blocks, dark gradient sections and an ember-orange accent (#F26D12) for the best prices. Icons are small inline SVGs in `components/Icon.jsx`.

## Where each concept is used

| Concept | Where it is used |
|---------|------------------|
| REST API with Fetch | `src/services/api.js` (browser), `scripts/agmarknet.mjs` (server-side call to data.gov.in), `src/setupProxy.js` (development proxy) |
| AJAX live filtering | `pages/Explorer.jsx`, `components/SearchFilter.jsx`, `hooks.js` (useDebounce) |
| Bootstrap grid | `pages/Home.jsx`, `pages/Explorer.jsx`, `pages/Compare.jsx` (container / row / col-*) |
| Navbar and cards | `components/Navbar.jsx`, `components/CommodityCard.jsx` |
| React components, props, state, context | `App.jsx` and every component (`useState`, `useEffect`, `useMemo`, `AppContext` in `i18n.js`) |
| List state: add / update / delete | Favourites (`App.jsx` toggleFav), alerts (`pages/Alerts.jsx`), "Chart your own prices" (`pages/Analytics.jsx`) |
| Chart.js with user-entered data | `pages/Analytics.jsx`, `components/PriceChart.jsx` |
| Chart.js with API data + refresh | `pages/Analytics.jsx` (Modal price by market) |
| Form validation + localStorage | `pages/Alerts.jsx`, `hooks.js` (useLocalStorage) |
| Live clock (Date + DOM methods) | `components/LiveClock.jsx` (Home, "Where the prices come from") |
| Data source badge with fallback reason | `components/DataBadge.jsx`, `App.jsx` (loadLive) |
| Dark mode and English / Hindi | `App.jsx`, `i18n.js`, `style.css` |
| Web resume + GitHub Pages | `pages/About.jsx`, `data/profile.js`, deploy steps above |

## Team

AgriCompare is a two-member project by **Gaurav Gaikwad (Roll No. 69)** and **Deep Gada (Roll No. 70)**.
The About page reads `src/data/profile.js`: fill in the college, department, class and guide (marked with
[square brackets]), and optionally each member's email, GitHub and LinkedIn.

## Viva notes

- **Fetch once, filter live:** the data is fetched with `fetch()` (AJAX) without reloading the page; typing in
  the search box filters it in the browser after a 250 ms pause (debounce).
- **Why summarise by market:** a mandi reports several varieties per commodity. `summariseByMarket` in `utils.js`
  takes each market's latest date and averages the varieties, so one market equals one row.
- **Modal price:** the price at which most trades happened. "Highest modal price" is the market reporting the highest
  such price; it ignores transport cost and fees.
- **Hash routing:** `App.jsx` reads `window.location.hash` and listens for `hashchange`, so each page has its own link.
- **Why a ref in LiveClock:** `useRef` gives the real DOM node, and `textContent` is updated every second with
  `setInterval`, which is the DOM-method approach to updating the page.
- **Seven-day trend:** the government feed only has the latest day, so that chart is clearly labelled as illustrative.
- **Dark mode / Hindi:** `data-bs-theme` on `<html>` switches the colour tokens in `style.css`; every label is in the
  dictionary in `i18n.js`, read through React context (`useT()`). Searching in Hindi (e.g. प्याज़) also works.

## Credits

- Design system adapted from the **Solstice** theme, (C) 2026 Automattic, GPLv2 or later (https://themeshaper.com/solstice/).
- Font: **Poppins** (SIL Open Font License), loaded from Google Fonts.
- Price data: AGMARKNET via data.gov.in.
