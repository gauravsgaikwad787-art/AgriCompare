// Concepts: Chart.js with API data (+ refresh), a chart from user-entered data,
// and an illustrative line chart that is always labelled as sample data.
import { useEffect, useMemo, useState } from 'react';
import PriceChart from '../components/PriceChart.jsx';
import { SourceTag } from '../components/DataBadge.jsx';
import Icon from '../components/Icon.jsx';
import { COMMODITIES } from '../services/api.js';
import { sampleHistory } from '../data/samplePrices.js';
import { useApp } from '../i18n.js';
import { formatDate, formatINR } from '../utils.js';

const TOP = 10;

export default function Analytics({ data, go }) {
  const { t, lang } = useApp();

  // ----- A. Market price comparison (loaded data) -----
  const [commodity, setCommodity] = useState('Onion');
  // If the default crop has no recent report, start on the first crop that does.
  useEffect(() => {
    if (!data.loading && data.crops.size && !data.crops.has(commodity)) {
      setCommodity(COMMODITIES.find((c) => data.crops.has(c)));
    }
  }, [data.loading, data.rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const [showAll, setShowAll] = useState(false);
  const list = useMemo(
    () => data.rows.filter((r) => r.commodity === commodity).sort((a, b) => b.modal - a.modal),
    [data.rows, commodity]
  );
  const shown = showAll ? list : list.slice(0, TOP);
  const latest = list.reduce((d, r) => (r.date > d ? r.date : d), '');
  const spread = list.length > 1 ? list[0].modal - list[list.length - 1].modal : 0;

  // ----- B. User-entered data -----
  const [points, setPoints] = useState([]);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState({});
  const [chartType, setChartType] = useState('bar');

  const addPoint = (e) => {
    e.preventDefault();
    const n = Number(value);
    const found = {};
    if (!label.trim()) found.label = t('errMarket');
    if (value === '' || Number.isNaN(n) || n <= 0) found.value = t('errPrice');
    setErrors(found);
    if (Object.keys(found).length) return;
    setPoints([...points, { id: Date.now(), label: label.trim(), value: Math.round(n) }]);
    setLabel('');
    setValue('');
    document.getElementById('ud-label')?.focus();
  };

  // ----- C. Illustrative trend -----
  const history = sampleHistory(commodity);

  return (
    <div className="container">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('anEyebrow')}</div>
          <h1 className="t-page">{t('analyticsTitle')}</h1>
          <p>{t('analyticsSub')}</p>
        </div>
        <div className="d-flex gap-2 align-items-end">
          <div style={{ minWidth: 170 }}>
            <label htmlFor="an-c" className="form-label">{t('crop')}</label>
            <select id="an-c" className="form-select" value={commodity} onChange={(e) => { setCommodity(e.target.value); setShowAll(false); }}>
              {COMMODITIES.map((c) => <option key={c} value={c}>{t(c)}{data.crops.has(c) || data.loading ? '' : ` · ${t('noRecent')}`}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-secondary-ac" onClick={data.refresh} disabled={data.loading} title={t('refresh')}>
            <Icon name="refresh" size={16} className={data.loading ? 'spin' : ''} />
            <span className="d-none d-sm-inline">{t('refresh')}</span>
          </button>
        </div>
      </header>

      <div className="page">
        <div className="row g-3 g-lg-4 mb-3 mb-lg-4">
          {/* A. Modal price by market */}
          <div className="col-lg-8">
            <section className="panel panel-body h-100" aria-labelledby="chart-a">
              <div className="panel-head">
                <div>
                  <h2 id="chart-a">{t('chartTitle', { c: t(commodity) })}</h2>
                  <p>{t('chartSub', { d: latest ? formatDate(latest, lang) : '-' })}</p>
                </div>
                {!data.loading && <SourceTag source={data.source} />}
              </div>
              {data.loading ? (
                <div className="skeleton" style={{ height: 320 }} />
              ) : list.length === 0 ? (
                <div className="state"><Icon name="info" size={28} /><h3>{t('noCropTitle', { c: t(commodity) })}</h3><p className="mb-0">{t('noCropText', { c: t(commodity) })}</p></div>
              ) : (
                <>
                  <PriceChart type="bar" horizontal label={t('modal')}
                    labels={shown.map((r) => r.market)} values={shown.map((r) => r.modal)} highlight={0}
                    details={shown.map((r) => `${t('min')} ${formatINR(r.min)} · ${t('max')} ${formatINR(r.max)}`)} />
                  {list.length > TOP && (
                    <div className="d-flex flex-wrap align-items-center gap-2 mt-3 t-small t-muted">
                      {!showAll && <span>{t('topN', { n: TOP })}</span>}
                      <button type="button" className="btn btn-link btn-sm p-0 fw-bold" onClick={() => setShowAll(!showAll)}>
                        {showAll ? t('showTop', { n: TOP }) : t('showAll', { n: list.length })}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* Quick read */}
          <div className="col-lg-4">
            <aside className="panel-green quick-panel">
              <div className="eyebrow">{t('quickRead')}</div>
              {data.loading ? <div className="skeleton" style={{ height: 40, width: '60%', opacity: .3 }} /> : (
                <>
                  <div className="big">{formatINR(spread)}</div>
                  <p className="mt-2 mb-3">{t('spreadText')}</p>
                  {list.length > 0 && (
                    <div className="mb-4">
                      <div className="eyebrow mb-2">{t('topMarkets')}</div>
                      <ol className="list-unstyled mb-0">
                        {list.slice(0, 3).map((r, i) => (
                          <li key={r.id} className="d-flex justify-content-between py-2" style={{ borderTop: i ? '1px solid rgba(255,255,255,.14)' : 0 }}>
                            <span>{i + 1}. {r.market}</span><b className="text-white num">{formatINR(r.modal)}</b>
                          </li>
                        ))}
                      </ol>
                      {list.length > 1 && (
                        <div className="t-small muted-on-green mt-2">{t('min')}: {list[list.length - 1].market} · {formatINR(list[list.length - 1].modal)}</div>
                      )}
                    </div>
                  )}
                </>
              )}
              <a href="#/compare" className="btn btn-light-ac mt-auto align-self-start" onClick={(e) => { e.preventDefault(); go('compare'); }}>
                {t('compareBtn')} <Icon name="arrowRight" size={15} />
              </a>
            </aside>
          </div>
        </div>

        <div className="row g-3 g-lg-4">
          {/* B. Chart your own numbers */}
          <div className="col-lg-6">
            <section className="panel panel-body h-100" aria-labelledby="chart-b">
              <div className="panel-head">
                <div>
                  <h2 id="chart-b">{t('ownTitle')}</h2>
                  <p>{t('ownSub')}</p>
                </div>
                {points.length > 0 && (
                  <div className="segmented" role="group" aria-label="Chart type">
                    <button type="button" aria-pressed={chartType === 'bar'} onClick={() => setChartType('bar')}>Bar</button>
                    <button type="button" aria-pressed={chartType === 'line'} onClick={() => setChartType('line')}>Line</button>
                  </div>
                )}
              </div>
              <form onSubmit={addPoint} noValidate className="row g-2 align-items-start">
                <div className="col-sm-6">
                  <label htmlFor="ud-label" className="form-label">{t('market')}</label>
                  <input id="ud-label" className={`form-control ${errors.label ? 'is-invalid' : ''}`} value={label}
                    onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Manmad" maxLength={40}
                    aria-describedby={errors.label ? 'ud-label-err' : undefined} />
                  {errors.label && <div id="ud-label-err" className="invalid-feedback d-block">{errors.label}</div>}
                </div>
                <div className="col-sm-6">
                  <label htmlFor="ud-value" className="form-label">{t('qtlShort')}</label>
                  <input id="ud-value" className={`form-control ${errors.value ? 'is-invalid' : ''}`} inputMode="decimal" value={value}
                    onChange={(e) => setValue(e.target.value)} placeholder="e.g. 2140" aria-describedby={errors.value ? 'ud-value-err' : undefined} />
                  {errors.value && <div id="ud-value-err" className="invalid-feedback d-block">{errors.value}</div>}
                </div>
                <div className="col-12 d-flex flex-wrap gap-2 mt-3">
                  <button className="btn btn-primary" type="submit"><Icon name="plus" size={16} />{t('addPrice')}</button>
                  {points.length > 0 && <button type="button" className="btn btn-danger-ghost" onClick={() => setPoints([])}>{t('clearAll')}</button>}
                </div>
              </form>

              {points.length > 0 && (
                <>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {points.map((p) => (
                      <span key={p.id} className="tag tag-neutral" style={{ padding: '.3rem .3rem .3rem .65rem' }}>
                        {p.label} · {formatINR(p.value)}
                        <button type="button" className="btn btn-sm btn-ghost p-0" style={{ minHeight: 20, width: 20 }}
                          aria-label={`${t('delete')} ${p.label}`} onClick={() => setPoints(points.filter((x) => x.id !== p.id))}>
                          <Icon name="x" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3"><PriceChart type={chartType} label={t('price')} labels={points.map((p) => p.label)} values={points.map((p) => p.value)} small /></div>
                </>
              )}
              <div className="notice notice-mint mt-3"><Icon name="info" size={16} /><span>{t('ownNote')}</span></div>
            </section>
          </div>

          {/* C. Seven-day sample trend */}
          <div className="col-lg-6">
            <section className="panel panel-body h-100" aria-labelledby="chart-c">
              <div className="panel-head">
                <div>
                  <h2 id="chart-c">{t('trendTitle')}</h2>
                  <p>{t(commodity)} · {history.labels[0]} – {history.labels[history.labels.length - 1]}</p>
                </div>
                <span className="tag tag-sample">{t('trendBadge')}</span>
              </div>
              <PriceChart type="line" label={`${t(commodity)} (${t('sampleData')})`} labels={history.labels} values={history.values} small dashed />
              <p className="t-xs t-muted mt-3 mb-0">{t('trendSub')}</p>
            </section>
          </div>
        </div>

        <div className="notice notice-warn mt-4"><Icon name="info" size={16} /><span>{t('anFoot')}</span></div>
      </div>
    </div>
  );
}
