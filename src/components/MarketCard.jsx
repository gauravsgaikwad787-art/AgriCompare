// One APMC market and the latest price of every crop it trades (the Explorer's card).
// Each crop row links to the Compare page for that crop.
import { useApp } from '../i18n.js';
import { ageLabel, daysAgo, formatDate, formatINR } from '../utils.js';
import Icon from './Icon.jsx';
import CropThumb from './CropThumb.jsx';

export default function MarketCard({ market, isFav, onToggleFav, focusCrop }) {
  const { t, lang } = useApp();
  const fresh = daysAgo(market.latest) <= 2;

  return (
    <article className="price-card market-card">
      <div className="pc-body">
        <div className="pc-top">
          <div className="min-w-0">
            <div className="pc-kicker"><Icon name="pin" size={13} />{market.district}</div>
            <h3 className="pc-title">{market.market}</h3>
          </div>
          <button type="button" className={`star-btn ${isFav ? 'on' : ''}`} onClick={() => onToggleFav(market.favId)} aria-pressed={isFav}
            aria-label={`${isFav ? t('removeFav') : t('addFav')}: ${market.market}`} title={isFav ? t('removeFav') : t('addFav')}>
            <Icon name="star" size={17} filled={isFav} />
          </button>
        </div>

        <ul className="crop-rows">
          {market.items.map((r) => (
            <li key={r.id} className={focusCrop === r.commodity ? 'is-focus' : ''}>
              <a href={`#/compare?crop=${encodeURIComponent(r.commodity)}`} title={t('compareCrop', { c: t(r.commodity) })}>
                <CropThumb commodity={r.commodity} size="xs" />
                <span className="cr-name">{t(r.commodity)}</span>
                <span className="cr-age">{ageLabel(r.date, t)}</span>
                <span className="cr-price">{formatINR(r.modal)}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="pc-foot">
        <span>{t('cropsTraded', { n: market.items.length })}</span>
        <span className={`dot-sep age ${fresh ? 'fresh' : daysAgo(market.latest) > 7 ? 'stale' : ''}`}>
          {t('reportedOn', { d: formatDate(market.latest, lang) })}
        </span>
        <span className="dot-sep">{market.source === 'live' ? 'AGMARKNET' : t('sampleData')}</span>
      </div>
    </article>
  );
}
