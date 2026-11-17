// Concept: a card showing one commodity price at one market (props in, events out).
import { useApp } from '../i18n.js';
import { ageLabel, daysAgo, formatDate, formatINR } from '../utils.js';
import Icon from './Icon.jsx';
import CropThumb from './CropThumb.jsx';

export default function CommodityCard({ row, isFav, onToggleFav, highlight, rank }) {
  const { t, lang } = useApp();

  return (
    <article className={`price-card ${highlight ? 'is-best' : ''}`}>
      <div className="pc-body">
        <div className="pc-top">
          <div className="min-w-0">
            <div className="pc-kicker">
              <CropThumb commodity={row.commodity} size="xs" />
              {t(row.commodity)} · {row.district}
            </div>
            <h3 className="pc-title">{row.market}</h3>
          </div>
          {highlight && <span className="tag tag-best">{t('highest')}</span>}
          {!highlight && rank && !onToggleFav && <span className="pc-rank">#{rank}</span>}
          {onToggleFav && !highlight && (
            <button type="button" className={`star-btn ${isFav ? 'on' : ''}`} onClick={() => onToggleFav(row.id)} aria-pressed={isFav}
              aria-label={`${isFav ? t('removeFav') : t('addFav')}: ${t(row.commodity)}, ${row.market}`} title={isFav ? t('removeFav') : t('addFav')}>
              <Icon name="star" size={17} filled={isFav} />
            </button>
          )}
        </div>

        <div className="pc-label">{t('modal')}</div>
        <div className="pc-modal">{formatINR(row.modal)}<small>{t('perQtlUnit')}</small></div>
        <PriceRange min={row.min} max={row.max} modal={row.modal} />
        <div className="pc-minmax">
          <span>{t('min')} <b>{formatINR(row.min)}</b></span>
          <span>{t('max')} <b>{formatINR(row.max)}</b></span>
        </div>
      </div>
      <div className="pc-foot">
        <span>{t('reportedOn', { d: formatDate(row.date, lang) })}</span>
        <span className={`dot-sep age ${daysAgo(row.date) <= 2 ? 'fresh' : daysAgo(row.date) > 7 ? 'stale' : ''}`}>{ageLabel(row.date, t)}</span>
        <span className="dot-sep">{row.source === 'live' ? 'AGMARKNET' : t('sampleData')}</span>
        {row.varieties > 1 && <span className="dot-sep">{t('varietiesAvg', { n: row.varieties })}</span>}
        {highlight && onToggleFav && (
          <button type="button" className={`star-btn ms-auto ${isFav ? 'on' : ''}`} style={{ width: 30, height: 30 }} onClick={() => onToggleFav(row.id)}
            aria-pressed={isFav} aria-label={`${isFav ? t('removeFav') : t('addFav')}: ${t(row.commodity)}, ${row.market}`}>
            <Icon name="star" size={15} filled={isFav} />
          </button>
        )}
      </div>
    </article>
  );
}

// A thin bar from minimum to maximum price, with a dot where the modal price sits.
export function PriceRange({ min, max, modal }) {
  const span = max - min;
  const pos = span > 0 ? Math.min(100, Math.max(0, ((modal - min) / span) * 100)) : 50;
  return (
    <div className="range" aria-hidden="true">
      <div className="range-track"><span className="range-fill" /><span className="range-dot" style={{ left: `${pos}%` }} /></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="price-card" aria-hidden="true">
      <div className="pc-body">
        <div className="skeleton mb-2" style={{ width: '40%', height: 12 }} />
        <div className="skeleton mb-4" style={{ width: '65%', height: 18 }} />
        <div className="skeleton mb-2" style={{ width: '30%', height: 10 }} />
        <div className="skeleton mb-3" style={{ width: '55%', height: 30 }} />
        <div className="skeleton" style={{ width: '100%', height: 6 }} />
      </div>
    </div>
  );
}
