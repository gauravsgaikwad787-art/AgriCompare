// Concept: live filtering (AJAX). Data arrives once through fetch(); typing in the
// search box filters it in the browser, without reloading the page.
import { useEffect, useMemo, useState } from 'react';
import SearchFilter from '../components/SearchFilter.jsx';
import CommodityCard, { CardSkeleton } from '../components/CommodityCard.jsx';
import DataBadge from '../components/DataBadge.jsx';
import Icon from '../components/Icon.jsx';
import { useDebounce, useLocalStorage } from '../hooks.js';
import WhereToSell from '../components/WhereToSell.jsx';
import { useApp } from '../i18n.js';
import { daysAgo, uniqueSorted } from '../utils.js';
import { COMMODITIES } from '../services/api.js';

const EMPTY = { q: '', crop: '', district: '', market: '', date: '', favOnly: false };
const PAGE_SIZE = 12;
const SORTS = {
  high: (a, b) => b.modal - a.modal,
  low: (a, b) => a.modal - b.modal,
  name: (a, b) => a.market.localeCompare(b.market) || a.commodity.localeCompare(b.commodity),
};

export default function Explorer({ data }) {
  const { t } = useApp();
  const [filters, setFilters] = useState(EMPTY);
  const [sort, setSort] = useState('high');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const query = useDebounce(filters.q, 250).trim().toLowerCase();

  // District and market lists narrow to the chosen crop and district.
  const options = useMemo(() => {
    const byCrop = data.rows.filter((r) => !filters.crop || r.commodity === filters.crop);
    return {
      districts: uniqueSorted(byCrop.map((r) => r.district)),
      markets: uniqueSorted(byCrop.filter((r) => !filters.district || r.district === filters.district).map((r) => r.market)),
      dates: uniqueSorted(byCrop.map((r) => r.date)).reverse(),
      crops: data.crops,
    };
  }, [data.rows, data.crops, filters.crop, filters.district]);

  const filtered = useMemo(() => data.rows.filter((r) => (
    (!query
      || r.commodity.toLowerCase().includes(query)
      || t(r.commodity).toLowerCase().includes(query)
      || r.market.toLowerCase().includes(query)
      || r.district.toLowerCase().includes(query)) &&
    (!filters.crop || r.commodity === filters.crop) &&
    (!filters.district || r.district === filters.district) &&
    (!filters.market || r.market === filters.market) &&
    (!filters.date || r.date === filters.date) &&
    (!filters.favOnly || data.favs.includes(r.id))
  )).sort(SORTS[sort]), [data.rows, data.favs, query, filters, sort, t]);

  useEffect(() => setVisible(PAGE_SIZE), [query, filters, sort]);

  // Keep the market filter valid when the crop or district changes.
  const setF = (next) => {
    if (next.market) {
      const ok = data.rows.some((r) => r.market === next.market
        && (!next.district || r.district === next.district) && (!next.crop || r.commodity === next.crop));
      if (!ok) next = { ...next, market: '' };
    }
    setFilters(next);
  };

  // Only count favourites that have a price in the data loaded now.
  const favCount = useMemo(() => data.rows.filter((r) => data.favs.includes(r.id)).length, [data.rows, data.favs]);
  const missingCrop = filters.crop && !data.crops.has(filters.crop)
    ? filters.crop
    : COMMODITIES.find((c) => query && !data.crops.has(c) && (c.toLowerCase().startsWith(query) || t(c).toLowerCase().startsWith(query)));
  // The crop being looked at: the Crop filter, or a search that names a crop ("wheat", "गेहूँ").
  const activeCrop = filters.crop || COMMODITIES.find((c) => query.length >= 3
    && (c.toLowerCase().startsWith(query) || t(c).toLowerCase().startsWith(query)));
  const [within, setWithin] = useLocalStorage('agri_within', 7);
  const [district, setDistrict] = useLocalStorage('agri_district', '');
  const cropRows = useMemo(() => (activeCrop ? data.rows.filter((r) => r.commodity === activeCrop) : []), [data.rows, activeCrop]);
  const freshCropRows = useMemo(() => cropRows.filter((r) => daysAgo(r.date) <= within), [cropRows, within]);

  const active = Object.entries(filters).some(([, v]) => v);
  const failed = !data.loading && data.source === 'sample' && data.reason && !data.reason.startsWith('No API key');

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

        <SearchFilter filters={filters} setFilters={setF} options={options} />

        {!data.loading && activeCrop && cropRows.length > 0 && (
          <div className="mt-4">
            <WhereToSell rows={freshCropRows} allRows={cropRows} commodity={activeCrop}
              district={district} setDistrict={setDistrict} within={within} setWithin={setWithin} />
          </div>
        )}

        <div className="results-bar">
          <h2 role="status" aria-live="polite">
            {data.loading ? t('loadingData') : filtered.length === 1 ? t('reportedPrice') : t('reportedPrices', { n: filtered.length })}
          </h2>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {active && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setFilters(EMPTY)}>
                <Icon name="x" size={14} />{t('clearFilters')}
              </button>
            )}
            <button type="button" className={`btn btn-sm ${filters.favOnly ? 'btn-primary' : 'btn-secondary-ac'}`} aria-pressed={filters.favOnly}
              onClick={() => setFilters({ ...filters, favOnly: !filters.favOnly })}>
              <Icon name="star" size={14} filled={filters.favOnly} />{t('favourites')}{favCount > 0 && <span className="num">({favCount})</span>}
            </button>
            <label className="sort-select">
              <span className="visually-hidden">{t('sort')}</span>
              <Icon name="sort" size={15} className="t-muted" />
              <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="high">{t('sortHigh')}</option>
                <option value="low">{t('sortLow')}</option>
                <option value="name">{t('sortName')}</option>
              </select>
            </label>
          </div>
        </div>

        {data.loading ? (
          <div className="row g-3 g-lg-4">
            {Array.from({ length: 6 }, (_, i) => <div className="col-12 col-md-6 col-lg-4" key={i}><CardSkeleton /></div>)}
          </div>
        ) : filtered.length === 0 && missingCrop && !filters.favOnly ? (
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
            {filtered.slice(0, visible).map((r) => (
              <div className="col-12 col-md-6 col-lg-4" key={r.id}>
                <CommodityCard row={r} isFav={data.favs.includes(r.id)} onToggleFav={data.toggleFav} />
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
