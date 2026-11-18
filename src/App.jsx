// The root React component. It owns the shared state (price data, language,
// theme, favourites, current page) and passes it down through props and context.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Explorer from './pages/Explorer.jsx';
import Compare from './pages/Compare.jsx';
import Analytics from './pages/Analytics.jsx';
import Alerts from './pages/Alerts.jsx';
import About from './pages/About.jsx';
import { loadOfficialPrices } from './services/api.js';
import { buildSamplePrices } from './data/samplePrices.js';
import { AppContext, translate } from './i18n.js';
import { useLocalStorage } from './hooks.js';
import { summariseAll } from './utils.js';

export const PAGES = ['home', 'explorer', 'compare', 'analytics', 'alerts', 'about'];

// Pages live in the URL hash (#/compare), so Back/Forward and refresh work,
// and the site works on any static host (Vercel, or a sub-folder).
const pageFromHash = () => {
  const key = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return PAGES.includes(key) ? key : 'home';
};

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [lang, setLang] = useLocalStorage('agri_lang', 'en');
  const [dark, setDark] = useLocalStorage('agri_dark', false);
  const [favs, setFavs] = useLocalStorage('agri_favs', []);

  const [raw, setRaw] = useState([]);
  const [source, setSource] = useState('sample'); // 'sample' or 'live'
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState(''); // why sample data is showing
  const [fetchedAt, setFetchedAt] = useState(null);

  const rows = useMemo(() => summariseAll(raw), [raw]);
  // Crops that have at least one reported price in the loaded data.
  const crops = useMemo(() => new Set(rows.map((r) => r.commodity)), [rows]);

  const loadLive = useCallback(async (refresh = false) => {
    setLoading(true);
    setReason('');
    try {
      const result = await loadOfficialPrices({ refresh });
      setRaw(result.records);
      setSource('live');
      setFetchedAt(result.fetchedAt);
    } catch (err) {
      console.warn('AgriCompare: could not load official prices.', err.message);
      setReason(err.message);
      setRaw(buildSamplePrices());
      setSource('sample');
      setFetchedAt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load official prices when the app opens. Also remove any key an older version saved in the browser.
  useEffect(() => {
    localStorage.removeItem('agri_apikey');
    loadLive();
  }, [loadLive]);

  // Follow the URL hash.
  useEffect(() => {
    const onHash = () => {
      setPage(pageFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Dark mode: Bootstrap 5.3 reads the data-bs-theme attribute. Language: the lang attribute.
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Page title for each page, e.g. "Compare · AgriCompare".
  useEffect(() => {
    document.title = page === 'home' ? 'AgriCompare - APMC Mandi Price Comparison' : `${translate(lang, page)} · AgriCompare`;
  }, [page, lang]);

  const go = (key) => {
    if (key === page) window.scrollTo({ top: 0 });
    window.location.hash = `/${key}`;
  };

  // Switch the theme attribute right away, so charts read the new colours on this render.
  const changeDark = (value) => {
    document.documentElement.setAttribute('data-bs-theme', value ? 'dark' : 'light');
    setDark(value);
  };

  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  const ctx = useMemo(() => ({ lang, t, dark }), [lang, t, dark]);

  const data = { rows, crops, source, loading, reason, fetchedAt, refresh: () => loadLive(true), favs, toggleFav };

  let content;
  if (page === 'explorer') content = <Explorer data={data} />;
  else if (page === 'compare') content = <Compare data={data} />;
  else if (page === 'analytics') content = <Analytics data={data} go={go} />;
  else if (page === 'alerts') content = <Alerts data={data} />;
  else if (page === 'about') content = <About />;
  else content = <Home data={data} go={go} />;

  return (
    <AppContext.Provider value={ctx}>
      <a href="#main" className="visually-hidden-focusable" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <Navbar page={page} go={go} lang={lang} setLang={setLang} dark={dark} setDark={changeDark} />
      <main id="main" tabIndex={-1} className="outline-0">{content}</main>
      <Footer go={go} />
    </AppContext.Provider>
  );
}
