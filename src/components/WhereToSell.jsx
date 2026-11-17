// "Where to sell": for one crop, the markets with the highest latest modal price,
// and how the user's own district compares. Only reported prices are used:
// distance, transport and market fees are not known, and the note says so.
import { useMemo } from 'react';
import { useApp } from '../i18n.js';
import { ageLabel, formatDate, formatINR, uniqueSorted } from '../utils.js';
import Icon from './Icon.jsx';

const TOP = 5;

/**
 * rows      : summarised rows for ONE crop (latest price per market), already limited to the time window
 * allRows   : the same crop over the whole 30 days (to fill the district list)
 * commodity : crop name
 * district / setDistrict : the user's district (remembered by the parent)
 * within / setWithin     : 7 or 30 days
 */
export default function WhereToSell({ rows, allRows, commodity, district, setDistrict, within, setWithin }) {
  const { t, lang } = useApp();
  const ranked = useMemo(() => [...rows].sort((a, b) => b.modal - a.modal), [rows]);
  const districts = useMemo(() => uniqueSorted(allRows.map((r) => r.district)), [allRows]);
  const best = ranked[0];
  const local = district ? ranked.find((r) => r.district === district) : null;
  const crop = t(commodity);

  return (
    <section className="panel sell-panel" aria-labelledby="sell-title">
      <div className="sell-head">
        <div>
          <div className="eyebrow">{t('sellEyebrow')}</div>
          <h2 id="sell-title">{t('sellTitle', { c: lang === 'en' ? crop.toLowerCase() : crop })}</h2>
          <p>{t('sellSub')}</p>
        </div>
        <div className="sell-controls">
          <div>
            <label htmlFor="sell-district" className="form-label">{t('yourDistrict')}</label>
            <select id="sell-district" className="form-select" value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">{t('anyDistrict')}</option>
              {districts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <span className="form-label d-block">{t('within')}</span>
            <div className="segmented" role="group" aria-label={t('within')}>
              <button type="button" aria-pressed={within === 7} onClick={() => setWithin(7)}>{t('last7')}</button>
              <button type="button" aria-pressed={within === 30} onClick={() => setWithin(30)}>{t('last30')}</button>
            </div>
          </div>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="sell-empty">
          <p className="mb-2">{t('noFresh', { c: crop })}</p>
          {within === 7 && <button type="button" className="btn btn-sm btn-secondary-ac" onClick={() => setWithin(30)}>{t('showOlder')}</button>}
        </div>
      ) : (
        <>
          {/* Advice for the user's district */}
          {district && (
            <div className={`sell-advice ${local && local.id !== best.id ? 'gain' : ''}`} role="status">
              <Icon name={local && local.id === best.id ? 'check' : 'pin'} size={18} />
              <div>
                {!local && <span>{t('noDistrictPrice', { c: crop, d: district })} </span>}
                {local && local.id === best.id && <span>{t('sellHere', { m: local.market })}</span>}
                {local && local.id !== best.id && (
                  <>
                    <span>{t('bestInDistrict', { d: district, m: local.market, p: formatINR(local.modal) })} </span>
                    <strong>{t('sellGain', { m: best.market, d: best.district, gap: formatINR(best.modal - local.modal) })}</strong>
                  </>
                )}
                {!local && <strong>{t('sellBestOverall', { m: best.market, d: best.district, p: formatINR(best.modal) })}</strong>}
              </div>
            </div>
          )}

          {/* Ranked list */}
          <ol className="sell-list">
            {ranked.slice(0, TOP).map((r, i) => (
              <li key={r.id} className={`${i === 0 ? 'is-top' : ''} ${district && r.district === district ? 'is-mine' : ''}`}>
                <span className="sell-rank">{i + 1}</span>
                <div className="sell-market">
                  <strong>{r.market}</strong>
                  <span>{r.district} · {formatDate(r.date, lang)} · {ageLabel(r.date, t)}</span>
                </div>
                <div className="sell-price">
                  {formatINR(r.modal)}
                  {i > 0 && <span>−{formatINR(best.modal - r.modal)}</span>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="sell-note"><Icon name="info" size={14} />{t('sellNote')}</p>
    </section>
  );
}
