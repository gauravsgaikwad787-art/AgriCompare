// A slow, quiet strip with the highest reported modal price for each commodity.
// It pauses on hover and stops moving for users who prefer reduced motion.
import { useT } from '../i18n.js';
import { formatINR } from '../utils.js';

export default function PriceTicker({ rows }) {
  const t = useT();
  const best = {};
  rows.forEach((r) => {
    if (!best[r.commodity] || r.modal > best[r.commodity].modal) best[r.commodity] = r;
  });
  const items = Object.values(best);
  if (items.length === 0) return null;

  const group = (suffix) => (
    <div className="ticker-group" key={suffix} aria-hidden={suffix === 'b' ? true : undefined}>
      {items.map((r) => (
        <span key={r.commodity + suffix}>
          <strong>{t(r.commodity)}</strong>
          <b>{formatINR(r.modal)}</b>{t('perQtl')} · {r.market}
        </span>
      ))}
    </div>
  );

  return (
    <div className="ticker" role="region" aria-label={t('boardTitle')}>
      <div className="ticker-track">
        {group('a')}
        {group('b')}
      </div>
    </div>
  );
}
