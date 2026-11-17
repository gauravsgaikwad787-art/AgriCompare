// Market Explorer: one card per APMC market, with the latest price of every crop it trades.
// It answers "what is this mandi paying?". The Compare page answers "where should I sell
// this one crop?", and every crop row here links to it.
// Concept: live filtering (AJAX). Data arrives once through fetch(); typing in the
// search box filters it in the browser, without reloading the page.
import { useEffect, useMemo, useState } from 'react';
import SearchFilter from '../components/SearchFilter.jsx';
import MarketCard from '../components/MarketCard.jsx';
import { CardSkeleton } from '../components/CommodityCard.jsx';
import DataBadge from '../components/DataBadge.jsx';
import Icon from '../components/Icon.jsx';
import { useDebounce } from '../hooks.js';
import { useApp } from '../i18n.js';
import { daysAgo, uniqueSorted } from '../utils.js';
import { COMMODITIES } from '../services/api.js';

const EMPTY = { q: '', crop: '', district: '', within: '', favOnly: false };
const PAGE_SIZE = 12;
const SORTS = {
  recent: (a, b) => b.latest.localeCompare(a.latest) || a.market.localeCompare(b.market),
  name: (a, b) => a.market.localeCompare(b.market),
  crops: (a, b) => b.items.length - a.items.length || a.market.localeCompare(b.market),
};

// Group the per-crop rows into one entry per market.
function groupByMarket(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const key = `${r.market}|${r.district}`;
    if (!map.has(key)) map.set(key, { favId: `market|${r.market}`, market: r.market, district: r.district, items: [], latest: '', source: r.source });
    const m = map.get(key);
    m.items.push(r);
    if (r.date > m.latest) m.latest = r.date;
  });
  map.forEach((m) => m.items.sort((a, b) => COMMODITIES.indexOf(a.commodity) - COMMODITIES.indexOf(b.commodity)));
  return [...map.values()];
}

export default function Explorer({ data }) {
  const { t } = useApp();
  const [filters, setFilters] = useState(EMPTY);
  const [sort, setSort] = useState('recent');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const query = useDebounce(filters.q, 250).trim().toLowerCase();

  const markets = useMemo(() => groupByMarket(data.rows), [data.rows]);
  const options = useMemo(() => ({
    districts: uniqueSorted(markets.map((m) => m.district)),
    crops: data.crops,
  }), [markets, data.crops]);

  // A search that names a crop ("wheat", "गेहूँ") works like choosing that crop.
  const searchedCrop = query.length >= 3
    ? COMMODITIES.find((c) => c.toLowerCase().startsWith(query) || t(c).toLowerCase().startsWith(query))
    : undefined;
  const focusCrop = filters.crop || searchedCrop;

  const filtered = useMemo(() => markets.filter((m) => (
    (!query || searchedCrop
      || m.market.toLowerCase().includes(query) || m.district.toLowerCase().includes(query)) &&
    (!focusCrop || m.items.some((r) => r.commodity === focusCrop)) &&
    (!filters.district || m.district === filters.district) &&
    (!filters.within || daysAgo(m.latest) <= Number(filters.within)) &&
    (!filters.favOnly || data.favs.includes(m.favId))
  )).sort(SORTS[sort]), [markets, data.favs, query, searchedCrop, focusCrop, filters, sort]);

  useEffect(() => setVisible(PAGE_SIZE), [query, filters, sort]);

  // Only count favourite markets that are in the data loaded now.
  const favCount = useMemo(() => markets.filter((m) => data.favs.includes(m.favId)).length, [markets, data.favs]);
  const missingCrop = focusCrop && !data.crops.has(focusCrop) ? focusCrop : null;
  const active = Object.entries(filters).some(([, v]) => v);
  const failed = !data.loading && data.source === 'sample' && data.reason && !data.reason.startsWith('No API key');
  const focusWord = focusCrop ? t(focusCrop) : '';

  return (
    <div className="container">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('exEyebrow')}</div>
          <h1 className="t-page">{t('explorerTitle')}</h1>
          <p>{t('explorerSub')}</p>
        </div>
        <DataBadge data={data} showRetry={false} showReason={!failed} />
      </header>

      <div className="page">
        {failed && (
          <div className="notice notice-warn mb-3" role="alert">
            <Icon name="alert" size={18} />
            <div className="flex-grow-1">
              <strong>{t('errorTitle')}.</strong> {t('errorText')}
              <div className="t-small t-muted">{data.reason}</div>
            </div>
            <button type="button" className="btn btn-sm btn-secondary-ac" onClick={data.refresh}>
              <Icon name="refresh" size={14} />{t('retry')}
            </button>
          </div>
        )}

        <SearchFilter filters={filters} setFilters={setFilters} options={options} />

        {/* Looking at one crop? Send the user to the Compare page for the ranking. */}
        {!data.loading && focusCrop && data.crops.has(focusCrop) && (
          <div className="compare-hint">
            <Icon name="scale" size={18} />
            <span>{t('compareHint', { c: focusWord })}</span>
            <a className="btn btn-sm btn-primary ms-auto" href={`#/compare?crop=${encodeURIComponent(focusCrop)}`}>
              {t('compareCrop', { c: focusWord })} <Icon name="arrowRight" size={14} />
            </a>
          </div>
        )}

        <div className="results-bar">
          <h2 role="status" aria-live="polite">
            {data.loading ? t('loadingData') : filtered.length === 1 ? t('marketFound') : t('marketsFound', { n: filtered.length })}
          </h2>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {active && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setFilters(EMPTY)}>
                <Icon name="x" size={14} />{t('clearFilters')}
              </button>
            )}
            <button type="button" className={`btn btn-sm ${filters.favOnly ? 'btn-primary' : 'btn-secondary-ac'}`} aria-pressed={filters.favOnly}
              onClick={() => setFilters({ ...filters, favOnly: !filters.favOnly })}>
              <Icon name="star" size={14} filled={filters.favOnly} />{t('favMarkets')}{favCount > 0 && <span className="num">({favCount})</span>}
            </button>
            <label className="sort-select">
              <span className="visually-hidden">{t('sort')}</span>
              <Icon name="sort" size={15} className="t-muted" />
              <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">{t('sortRecent')}</option>
                <option value="name">{t('sortName')}</option>
                <option value="crops">{t('sortCrops')}</option>
              </select>
            </label>
          </div>
        </div>

        {data.loading ? (
          <div className="row g-3 g-lg-4">
            {Array.from({ length: 6 }, (_, i) => <div className="col-12 col-md-6 col-lg-4" key={i}><CardSkeleton /></div>)}
          </div>
        ) : missingCrop && !filters.favOnly ? (
          <div className="state">
            <Icon name="info" size={28} />
            <h3>{t('noCropTitle', { c: t(missingCrop) })}</h3>
            <p>{t('noCropText', { c: t(missingCrop) })}</p>
            <button type="button" className="btn btn-secondary-ac" onClick={() => setFilters(EMPTY)}>{t('clearFilters')}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="state">
            <Icon name={filters.favOnly ? 'star' : 'search'} size={28} />
            <h3>{filters.favOnly && favCount === 0 ? t('emptyFavTitle') : t('emptyTitle')}</h3>
            <p>{filters.favOnly && favCount === 0 ? t('emptyFavText') : t('emptyText')}</p>
            <button type="button" className="btn btn-secondary-ac" onClick={() => setFilters(EMPTY)}>{t('clearFilters')}</button>
          </div>
        ) : (
          <div className="row g-3 g-lg-4">
            {filtered.slice(0, visible).map((m) => (
              <div className="col-12 col-md-6 col-lg-4" key={m.favId + m.district}>
                <MarketCard market={m} focusCrop={focusCrop} isFav={data.favs.includes(m.favId)} onToggleFav={data.toggleFav} />
              </div>
            ))}
          </div>
        )}

        {!data.loading && visible < filtered.length && (
          <div className="text-center mt-4">
            <button type="button" className="btn btn-secondary-ac" onClick={() => setVisible(visible + PAGE_SIZE)}>
              {t('showMore')} <span className="t-muted num">({filtered.length - visible})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
