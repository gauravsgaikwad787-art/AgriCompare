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
| `npm start` | Development server with live reload (downloads the recent-days file first if it is old) |
| `npm run build` | Downloads the recent-days prices, then builds the website into `docs/` (for GitHub Pages) |
| `npm run fetch-prices` | Downloads the recent-days prices only |

## Load official prices

1. Register at https://data.gov.in and copy your API key (a long string of letters and numbers).
2. Copy `.env.example` to `.env` and put the key after the equals sign (no quotes, no spaces):
   ```
   REACT_APP_DATA_GOV_API_KEY=your_key_here
   ```
3. Restart `npm start`. The badge on Explorer, Compare and Analytics should say **Official AGMARKNET data**.
   Without a key the site still works, using clearly labelled sample data, and the badge says why.

Official prices come from two places, which are combined (`src/services/api.js`):

- **Today (live):** the browser loads *Current Daily Price of Various Commodities from Various Markets (Mandi)*
  straight from the data.gov.in REST API every time the site opens (saved for 30 minutes; the **Refresh**
  button on Analytics loads again).
- **The previous 7 days:** *Variety-wise Daily Market Prices Data of Commodity* does not allow browser requests
  (CORS), so `scripts/fetch-prices.mjs` downloads it into `public/data/prices.json` **automatically before every
  `npm run build`** (and before `npm start` if the file is missing or older than 6 hours). The file is published
  with the website. If the download fails, the build still finishes and keeps the previous file.

Each market keeps its most recent price (`summariseByMarket` in `utils.js`), so today's live price is used where it
exists and crops not reported today still show a recent price. Every card shows the reported date and its age.

**About the key:** Create React App builds `REACT_APP_` variables into the website, so anyone can see the key with
the browser tools. Use a free key that you can regenerate on data.gov.in if it is misused. `.env` itself is in
`.gitignore`, so it is not uploaded to GitHub.

### Where to sell

On the Compare page, the **Where to sell** panel (`components/WhereToSell.jsx`) ranks markets by their latest modal
price. Choose **your district** to see its best market and how much more per quintal the best market elsewhere is
reporting. Distance, transport and market fees are not in the data, so the panel reminds users to check them.

## Deploy to GitHub Pages (one branch: `main`)

GitHub Pages serves the built website from the `docs/` folder of the `main` branch.

**One-time setup on GitHub:** **Settings > Pages > Build and deployment > Source: Deploy from a branch**,
**Branch: `main`**, folder **`/docs`**, then **Save**.

**When you change the code or text, or want to refresh the previous days' prices** (today's prices load live by themselves):

```
npm run build
git add .
git commit -m "Update website"
git push
```

Make sure `.env` contains your key **before** `npm run build`, because the key is built into the website.

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
| REST API with Fetch | `src/services/api.js` (today's prices in the browser), `scripts/agmarknet.mjs` (previous days, before the build) |
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
