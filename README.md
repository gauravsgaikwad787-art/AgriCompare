# AgriCompare

Agricultural commodity price comparison for Maharashtra APMC markets.
Built with **React (Create React App) + Bootstrap 5 + Chart.js**, hosted on **Vercel** with a small server function for live prices.

## Run it

```
npm install
npm start          # opens http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm start` | Development server; `/api/mandi` runs locally through `src/setupProxy.js` |
| `npm run build` | Production build into `build/` (Vercel runs this itself) |

## Official prices (live)

1. Register at https://data.gov.in and copy your API key (a long string of letters and numbers).
2. **For `npm start`:** copy `.env.example` to `.env` and put the key after the equals sign:
   ```
   DATA_GOV_API_KEY=your_key_here
   ```
3. **For the live website:** add the same variable in Vercel (see below).

How it works:

- The website asks its own server function, **`/api/mandi`** (`api/mandi.js`). Vercel runs it on its server in
  **Mumbai** (`vercel.json`).
- The function loads **today's prices** (*Current Daily Price of Various Commodities from Various Markets (Mandi)*)
  and the **previous 7 days** (*Variety-wise Daily Market Prices Data of Commodity*) from the data.gov.in REST API,
  one request per day for all Maharashtra crops, and keeps the six project crops (`scripts/agmarknet.mjs`).
- Because it runs on a server, browser CORS rules do not apply, and the **API key stays secret**: it is never
  sent to the browser.
- Vercel keeps each answer for **30 minutes**, so visitors get it instantly and data.gov.in is asked at most about
  twice an hour. The browser also keeps a copy for 30 minutes.
- Each market keeps its most recent price (`summariseByMarket` in `utils.js`); every card shows the reported date
  and its age. If prices cannot be loaded, clearly labelled sample data is shown with the reason.
- A time budget makes sure the function always answers within Vercel's limit, even if data.gov.in is slow.

### Where to sell

On the Compare page, the **Where to sell** panel (`components/WhereToSell.jsx`) ranks markets by their latest modal
price. Choose **your district** to see its best market and how much more per quintal the best market elsewhere is
reporting. Distance, transport and market fees are not in the data, so the panel reminds users to check them.

## Deploy on Vercel

**One-time setup**

1. Sign in at https://vercel.com with your GitHub account.
2. **Add New > Project**, choose this repository, then **Import**. Vercel detects Create React App; keep the
   suggested settings (build command `npm run build`, output directory `build`).
3. Before deploying, open **Environment Variables** and add `DATA_GOV_API_KEY` = your key.
4. Click **Deploy**. The site is published at `https://<project-name>.vercel.app`.

**Every change after that:** commit and push to `main`. Vercel builds and publishes automatically, usually within a
minute. Today's prices refresh by themselves; nothing needs to be rebuilt for new prices.

## Pages

The site is one React app. Pages live in the URL hash (`#/explorer`, `#/compare`, ...), so the browser's
Back button, refresh and shared links all work on any static host.

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
| REST API with Fetch | `src/services/api.js` (browser asks `/api/mandi`), `api/mandi.js` + `scripts/agmarknet.mjs` (server calls data.gov.in) |
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
| About page + hosting | `pages/About.jsx`, `data/profile.js`, Vercel steps above |

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
