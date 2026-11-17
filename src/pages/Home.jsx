// Landing page: what AgriCompare is, who it is for, how it works and where the data comes from.
// Laid out like the Solstice front page: dark rounded hero, a grid of white cards,
// a dark "facts" block and a peach call-out. No charts or statistics here.
import PriceTicker from '../components/PriceTicker.jsx';
import LiveClock from '../components/LiveClock.jsx';
import CropThumb from '../components/CropThumb.jsx';
import Icon from '../components/Icon.jsx';
import { SourceTag } from '../components/DataBadge.jsx';
import { COMMODITIES } from '../services/api.js';
import { useApp } from '../i18n.js';
import { ageLabel, daysAgo, formatDate, formatINR } from '../utils.js';

const STEPS = [['st1', 'st1t'], ['st2', 'st2t'], ['st3', 'st3t']];
const FEATURES = [
  { icon: 'search', title: 'f1Title', text: 'f1Text', page: 'explorer', label: 'navExplore' },
  { icon: 'scale', title: 'f2Title', text: 'f2Text', page: 'compare', label: 'navCompare' },
  { icon: 'chart', title: 'f3Title', text: 'f3Text', page: 'analytics', label: 'analytics' },
  { icon: 'bell', title: 'f4Title', text: 'f4Text', page: 'alerts', label: 'alerts' },
];

export default function Home({ data, go }) {
  const { t, lang } = useApp();
  const link = (page) => (e) => { e.preventDefault(); go(page); };
  const latest = data.rows.reduce((d, r) => (r.date > d ? r.date : d), '');

  // Price board: for each crop, the market with the highest latest modal price,
  // preferring reports from the last 7 days over older ones.
  const board = COMMODITIES.map((c) => {
    const list = data.rows.filter((r) => r.commodity === c);
    const fresh = list.filter((r) => daysAgo(r.date) <= 7);
    return (fresh.length ? fresh : list).sort((a, b) => b.modal - a.modal)[0];
  }).filter(Boolean);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="pill"><Icon name="info" size={14} />{t('unitPill')}</span>
          <h1 className="t-display">{t('heroTitle')}</h1>
          <p className="t-lead">{t('heroSub')}</p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <a href="#/explorer" className="btn btn-primary btn-lg" onClick={link('explorer')}>
              {t('ctaExplore')} <Icon name="arrowRight" size={17} />
            </a>
            <a href="#/compare" className="btn btn-outline-light-ac btn-lg" onClick={link('compare')}>{t('ctaCompare')}</a>
          </div>
          {latest && (
            <div className="hero-meta">
              <Icon name="calendar" size={14} />
              <span>{t('reportedLabel')}</span>
              <b>{formatDate(latest, lang)}</b>
              <span>· {t('maharashtra')}</span>
              {data.source === 'sample' && <span>({t('sampleData')})</span>}
            </div>
          )}
        </div>
      </section>

      {/* Price board */}
      <section className="board-section" aria-labelledby="board-title">
        <div className="container">
          <div className="board-headline">
            <div>
              <div className="eyebrow">{t('boardEyebrow')}</div>
              <h2 id="board-title" className="t-section mb-0">{t('boardTitle')}</h2>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-3">
              {!data.loading && <SourceTag source={data.source} />}
              <a href="#/explorer" className="link-arrow" onClick={link('explorer')}>{t('boardLink')} <Icon name="arrowRight" size={15} /></a>
            </div>
          </div>
          <div className="mini-grid">
            {data.loading
              ? COMMODITIES.map((c) => <div className="mini" key={c} aria-hidden="true"><div className="skeleton" style={{ width: 48, height: 48, borderRadius: 99 }} /><div className="flex-grow-1"><div className="skeleton mb-2" style={{ height: 12, width: '60%' }} /><div className="skeleton" style={{ height: 10, width: '40%' }} /></div></div>)
              : board.map((r) => (
                <div className="mini" key={r.id}>
                  <CropThumb commodity={r.commodity} />
                  <div className="min-w-0">
                    <div className="k">{t(r.commodity)}</div>
                    <div className="w">{r.market} · {formatDate(r.date, lang)} · {ageLabel(r.date, t)}</div>
                  </div>
                  <div className="v">{formatINR(r.modal)}<span className="u">{t('modalPerQtl')}</span></div>
                </div>
              ))}
          </div>
          <p className="t-xs t-muted mt-3 mb-0">
            {data.source === 'sample' && !data.loading ? `${t('sampleNote')} ` : ''}{t('feesNote')}
            {!data.loading && board.length < COMMODITIES.length && (
              <> {t('missingLine', { list: COMMODITIES.filter((c) => !data.crops.has(c)).map((c) => t(c)).join(', ') })}</>
            )}
          </p>
        </div>
      </section>

      {!data.loading && <div className="container"><PriceTicker rows={data.rows} /></div>}

      {/* How it works */}
      <section className="section pt-4">
        <div className="container">
          <div className="eyebrow">{t('stepsTitle')}</div>
          <ol className="row g-4 g-lg-5 list-unstyled mb-0 mt-2">
            {STEPS.map(([title, text], i) => (
              <li className="col-md-4 step" key={title}>
                <span className="step-num" aria-hidden="true">0{i + 1}</span>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Purpose: why it exists and who it is for */}
      <section className="pb-5">
        <div className="container">
          <div className="row g-4 g-lg-5 align-items-start">
            <div className="col-lg-6">
              <div className="eyebrow">AgriCompare</div>
              <h2 className="t-section">{t('whyTitle')}</h2>
              <p>{t('whyP1')}</p>
              <p className="mb-0">{t('whyP2')}</p>
            </div>
            <div className="col-lg-5 offset-lg-1">
              <div className="panel panel-body">
                <h3 className="mb-2">{t('whoTitle')}</h3>
                <ul className="who-list">
                  {['who1', 'who2', 'who3'].map((k) => <li key={k}><Icon name="check" size={17} /><span>{t(k)}</span></li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section pt-4">
        <div className="container">
          <div className="text-center mb-4 mb-lg-5">
            <div className="eyebrow">AgriCompare</div>
            <h2 className="t-section">{t('featuresTitle')}</h2>
          </div>
          <div className="row g-3 g-lg-4">
            {FEATURES.map((f) => (
              <div className="col-sm-6 col-lg-3" key={f.title}>
                <div className="panel feature-card">
                  <span className="f-icon"><Icon name={f.icon} size={21} /></span>
                  <h3>{t(f.title)}</h3>
                  <p>{t(f.text)}</p>
                  <a href={`#/${f.page}`} className="link-arrow t-small" onClick={link(f.page)}>{t(f.label)} <Icon name="arrowRight" size={14} /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data transparency: dark block in the style of the Solstice stats section */}
      <section className="pb-5">
        <div className="container">
          <div className="panel-ink stats-band">
            <div className="row g-4 g-lg-5 align-items-center">
              <div className="col-lg-6">
                <div className="eyebrow">{t('transSub')}</div>
                <h2 className="t-section">{t('transTitle')}</h2>
                <p>{t('transText')}</p>
                <p className="mb-3">{t('modalExplain')}</p>
                <LiveClock />
              </div>
              <div className="col-lg-5 offset-lg-1">
                <div className="row g-4">
                  <div className="col-6"><div className="stat-label mb-2">{t('crop')}</div><div className="stat-big">6</div></div>
                  <div className="col-6"><div className="stat-label mb-2">{t('perQuintal')}</div><div className="stat-big">₹</div></div>
                  <div className="col-12"><div className="stat-label mb-2">{t('dataSources')}</div><div className="stat-big" style={{ fontSize: 'clamp(2rem, 1.4rem + 2vw, 3rem)' }}>AGMARKNET</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project and SDGs: peach call-out */}
      <section className="pb-5 mb-4">
        <div className="container">
          <div className="panel-peach panel-body text-center py-5">
            <div className="eyebrow">{t('projEyebrow')}</div>
            <h2 className="t-section mx-auto" style={{ maxWidth: '22ch' }}>{t('projTitle')}</h2>
            <p className="mx-auto mb-4" style={{ maxWidth: '40rem' }}>{t('sdgIntro')}</p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <span className="chip"><i style={{ background: '#DDA63A' }} />{t('sdg2chip')}</span>
              <span className="chip"><i style={{ background: '#A21942' }} />{t('sdg8chip')}</span>
            </div>
            <p className="t-xs t-muted mt-4 mb-0 mx-auto" style={{ maxWidth: '40rem' }}>{t('sdg2Text')} {t('sdg8Text')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
