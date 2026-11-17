// APMC price comparison: one commodity across markets, card or table view, CSV export.
import { useEffect, useMemo, useState } from 'react';
import CommodityCard, { CardSkeleton } from '../components/CommodityCard.jsx';
import PriceTable from '../components/PriceTable.jsx';
import DataBadge, { SourceTag } from '../components/DataBadge.jsx';
import Icon from '../components/Icon.jsx';
import { COMMODITIES } from '../services/api.js';
import { useApp } from '../i18n.js';
import { daysAgo, downloadCSV, formatDate, formatINR, todayISO } from '../utils.js';
import { useLocalStorage } from '../hooks.js';
import WhereToSell from '../components/WhereToSell.jsx';

export default function Compare({ data }) {
  const { t, lang } = useApp();
  const [commodity, setCommodity] = useState('Onion');
  // If the default crop has no recent report, start on the first crop that does.
  useEffect(() => {
    if (!data.loading && data.crops.size && !data.crops.has(commodity)) {
      setCommodity(COMMODITIES.find((c) => data.crops.has(c)));
    }
  }, [data.loading, data.rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const [view, setView] = useState('cards');
  const [allCards, setAllCards] = useState(false);

  // Each market's latest price for this crop (last 30 days), and the part inside the chosen window.
  const [within, setWithin] = useLocalStorage('agri_within', 7);
  const [district, setDistrict] = useLocalStorage('agri_district', '');
  const allForCrop = useMemo(
    () => data.rows.filter((r) => r.commodity === commodity).sort((a, b) => b.modal - a.modal),
    [data.rows, commodity]
  );
  const list = useMemo(() => allForCrop.filter((r) => daysAgo(r.date) <= within), [allForCrop, within]);
  const best = list[0];
  const lowest = list[list.length - 1];
  const latest = list.reduce((d, r) => (r.date > d ? r.date : d), '');
  const cropWord = lang === 'en' ? t(commodity).toLowerCase() : t(commodity);

  return (
    <div className="container">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('cmpEyebrow')}</div>
          <h1 className="t-page">{t('compareTitle', { c: cropWord })}</h1>
          <p>{t('compareSub')}</p>
        </div>
        <div className="d-flex flex-column align-items-lg-end gap-2">
          <div className="segmented" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')}><Icon name="grid" size={14} />{t('cardView')}</button>
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}><Icon name="list" size={14} />{t('tableView')}</button>
          </div>
        </div>
      </header>

      <div className="page">
        <div className="row g-3 g-lg-4 mb-4">
          {/* Controls */}
          <div className="col-lg-4">
            <div className="panel panel-body h-100 d-flex flex-column gap-3">
              <div>
                <label htmlFor="cmp-c" className="form-label">{t('crop')}</label>
                <select id="cmp-c" className="form-select" value={commodity} onChange={(e) => { setCommodity(e.target.value); setAllCards(false); }}>
                  {COMMODITIES.map((c) => <option key={c} value={c}>{t(c)}{data.crops.has(c) || data.loading ? '' : ` · ${t('noRecent')}`}</option>)}
                </select>
              </div>
              <div>
                <div className="form-label mb-0">{t('latestReport')}</div>
                <div className="fw-bold">{latest ? formatDate(latest, lang) : '-'}</div>
              </div>
              <DataBadge data={data} />
              <button type="button" className="btn btn-secondary-ac mt-auto" disabled={list.length === 0}
                onClick={() => downloadCSV(list, `agricompare_${commodity.toLowerCase()}_${todayISO()}.csv`)}>
                <Icon name="download" size={16} />{t('exportCsv')}
              </button>
            </div>
          </div>

          {/* Best modal price */}
          <div className="col-lg-8">
            {data.loading ? (
              <div className="skeleton h-100" style={{ minHeight: 200, borderRadius: 14 }} />
            ) : best ? (
              <div className="panel-sun best-panel" role="status">
                <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start">
                  <div>
                    <div className="eyebrow">{t('bestModal')}</div>
                    <div className="big">{formatINR(best.modal)} <small>{t('perQtlUnit')}</small></div>
                    <div className="where">{best.market} · {best.district}</div>
                  </div>
                  {list.length > 1 && (
                    <span className="best-chip"><Icon name="arrowRight" size={14} />{t('aboveLowest', { gap: formatINR(best.modal - lowest.modal) })}</span>
                  )}
                </div>
                <div className="best-stats">
                  <div><span>{t('marketsCompared')}</span><b>{list.length}</b></div>
                  <div><span>{t('minPrice')}</span><b>{formatINR(best.min)}</b></div>
                  <div><span>{t('maxPrice')}</span><b>{formatINR(best.max)}</b></div>
                </div>
              </div>
            ) : (
              allForCrop.length > 0 ? (
                <div className="state h-100"><Icon name="info" size={28} /><h3>{t('noFresh', { c: t(commodity) })}</h3>
                  <button type="button" className="btn btn-secondary-ac" onClick={() => setWithin(30)}>{t('showOlder')}</button></div>
              ) : (
                <div className="state h-100"><Icon name="info" size={28} /><h3>{t('noCropTitle', { c: t(commodity) })}</h3><p className="mb-0">{t('noCropText', { c: t(commodity) })}</p></div>
              )
            )}
          </div>
        </div>

        {!data.loading && allForCrop.length > 0 && (
          <div className="mb-4">
            <WhereToSell rows={list} allRows={allForCrop} commodity={commodity}
              district={district} setDistrict={setDistrict} within={within} setWithin={setWithin} />
          </div>
        )}

        {data.loading ? (
          <div className="row g-3 g-lg-4">
            {Array.from({ length: 3 }, (_, i) => <div className="col-12 col-md-6 col-lg-4" key={i}><CardSkeleton /></div>)}
          </div>
        ) : list.length > 0 && (view === 'cards' ? (
          <>
          <div className="row g-3 g-lg-4">
            {(allCards ? list : list.slice(0, 9)).map((r, i) => (
              <div className="col-12 col-md-6 col-lg-4" key={r.id}>
                <CommodityCard row={r} rank={i + 1} highlight={r.id === best.id}
                  isFav={data.favs.includes(r.id)} onToggleFav={data.toggleFav} />
              </div>
            ))}
          </div>
          {list.length > 9 && (
            <div className="text-center mt-4">
              <button type="button" className="btn btn-secondary-ac" onClick={() => setAllCards(!allCards)}>
                {allCards ? t('showTop', { n: 9 }) : t('showAllCards', { n: list.length })}
              </button>
            </div>
          )}
          </>
        ) : (
          <PriceTable rows={list} highlightId={best.id} title={t('priceTable')} tag={<SourceTag source={data.source} />} />
        ))}
      </div>
    </div>
  );
}
