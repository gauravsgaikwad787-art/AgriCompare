// Concept: a form with JavaScript validation, saved in localStorage.
// Alerts are checked against the prices currently loaded; they are not push notifications.
import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { COMMODITIES } from '../services/api.js';
import { useLocalStorage } from '../hooks.js';
import { useApp } from '../i18n.js';
import { formatDate, formatINR, uniqueSorted } from '../utils.js';

const EMPTY_FORM = { commodity: '', market: '', condition: 'above', threshold: '' };

function validate(form) {
  const errors = {};
  if (!form.commodity) errors.commodity = 'errCommodity';
  if (form.commodity && !form.market) errors.market = 'errChooseMarket';
  const n = Number(form.threshold);
  if (String(form.threshold).trim() === '') errors.threshold = 'errThreshold';
  else if (Number.isNaN(n) || n <= 0) errors.threshold = 'errPositive';
  else if (n > 100000) errors.threshold = 'errTooHigh';
  return errors;
}

export default function Alerts({ data }) {
  const { t, lang } = useApp();
  const [alerts, setAlerts] = useLocalStorage('agri_alerts', []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  // Only offer markets that report the chosen commodity.
  const markets = useMemo(
    () => uniqueSorted(data.rows.filter((r) => r.commodity === form.commodity).map((r) => r.market)),
    [data.rows, form.commodity]
  );

  const setField = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    if (key === 'commodity') next.market = '';
    setForm(next);
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`al-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const alert = { ...form, threshold: Math.round(Number(form.threshold)) };
    if (editingId) {
      setAlerts(alerts.map((a) => (a.id === editingId ? { ...alert, id: editingId } : a)));
      setMsg(t('updatedMsg'));
    } else {
      setAlerts([{ ...alert, id: Date.now() }, ...alerts]);
      setMsg(t('savedMsg'));
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (a) => {
    setForm({ commodity: a.commodity, market: a.market, condition: a.condition, threshold: String(a.threshold) });
    setEditingId(a.id);
    setErrors({});
    setMsg('');
    document.getElementById('al-commodity')?.focus();
  };
  const cancelEdit = () => { setForm(EMPTY_FORM); setEditingId(null); setErrors({}); };
  const remove = (id) => {
    setAlerts(alerts.filter((x) => x.id !== id));
    if (editingId === id) cancelEdit();
    setMsg(t('deletedMsg'));
  };

  const statusOf = (a) => {
    const row = data.rows.find((r) => r.commodity === a.commodity && r.market === a.market);
    if (!row) return { key: 'none', label: t('statusNone') };
    const hit = a.condition === 'above' ? row.modal >= a.threshold : row.modal <= a.threshold;
    return { key: hit ? 'met' : 'wait', label: hit ? t('triggered') : t('watching'), row };
  };

  const err = (key) => errors[key] && <div id={`al-${key}-err`} className="invalid-feedback d-block">{t(errors[key])}</div>;
  const described = (key) => (errors[key] ? `al-${key}-err` : undefined);

  return (
    <div className="container">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('alEyebrow')}</div>
          <h1 className="t-page">{t('alertsTitle')}</h1>
          <p>{t('alertsSub')}</p>
        </div>
      </header>

      <div className="page">
        <div className="row g-3 g-lg-4">
          <div className="col-lg-7 col-xl-8">
            {/* Alert form */}
            <section className="panel panel-body" aria-labelledby="form-title">
              <h2 id="form-title" className="h5 fw-bold mb-3">{editingId ? t('editAlert') : t('createAlert')}</h2>
              <form onSubmit={submit} noValidate className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label" htmlFor="al-commodity">{t('crop')}</label>
                  <select id="al-commodity" className={`form-select ${errors.commodity ? 'is-invalid' : ''}`}
                    value={form.commodity} onChange={setField('commodity')} aria-describedby={described('commodity')}>
                    <option value="">{t('choose')}</option>
                    {COMMODITIES.map((c) => <option key={c} value={c}>{t(c)}{data.crops.has(c) || data.loading ? '' : ` · ${t('noRecent')}`}</option>)}
                  </select>
                  {err('commodity')}
                </div>
                <div className="col-sm-6">
                  <label className="form-label" htmlFor="al-market">{t('market')}</label>
                  <select id="al-market" className={`form-select ${errors.market ? 'is-invalid' : ''}`}
                    value={form.market} onChange={setField('market')} disabled={!form.commodity} aria-describedby={described('market')}>
                    <option value="">{form.commodity ? t('choose') : t('chooseCommodityFirst')}</option>
                    {markets.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  {err('market')}
                </div>
                <div className="col-sm-6">
                  <label className="form-label" htmlFor="al-condition">{t('alertWhen')}</label>
                  <select id="al-condition" className="form-select" value={form.condition} onChange={setField('condition')}>
                    <option value="above">{t('condAbove')}</option>
                    <option value="below">{t('condBelow')}</option>
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label" htmlFor="al-threshold">{t('target')}</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input id="al-threshold" inputMode="numeric" className={`form-control ${errors.threshold ? 'is-invalid' : ''}`}
                      value={form.threshold} onChange={setField('threshold')} placeholder="2000" aria-describedby={described('threshold')} />
                  </div>
                  {err('threshold')}
                </div>
                <div className="col-12 d-flex flex-wrap gap-2 align-items-center">
                  <button className="btn btn-primary" type="submit">
                    <Icon name={editingId ? 'check' : 'bell'} size={16} />{editingId ? t('updateAlert') : t('saveTarget')}
                  </button>
                  {editingId && <button className="btn btn-secondary-ac" type="button" onClick={cancelEdit}>{t('cancel')}</button>}
                  {msg && <span className="t-small fw-bold d-inline-flex align-items-center gap-1" style={{ color: 'var(--ac-primary)' }} role="status"><Icon name="check" size={14} />{msg}</span>}
                </div>
              </form>
            </section>

            {/* Saved alerts */}
            <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
              <h2 className="h5 fw-bold mb-0">{t('savedAlerts')}</h2>
              {alerts.length > 0 && <span className="t-small t-muted fw-bold">{t('nActive', { n: alerts.length })}</span>}
            </div>
            {alerts.length === 0 ? (
              <div className="state"><Icon name="bell" size={28} /><p className="mb-0">{t('noAlerts')}</p></div>
            ) : alerts.map((a) => {
              const s = statusOf(a);
              const title = t(a.condition === 'above' ? 'alertAbove' : 'alertBelow', { c: t(a.commodity), m: a.market, p: formatINR(a.threshold) });
              return (
                <div key={a.id} className={`panel alert-item ${editingId === a.id ? 'editing' : ''}`}>
                  <span className={`ai-icon ${s.key === 'met' ? 'met' : ''}`}><Icon name={s.key === 'met' ? 'check' : 'bell'} size={17} /></span>
                  <div className="ai-main">
                    <div className="ai-title">{title}</div>
                    <div className="ai-meta">
                      {s.row
                        ? <>{t('latestModal', { p: formatINR(s.row.modal), d: formatDate(s.row.date, lang) })}{s.row.source === 'sample' && ` · ${t('sampleData')}`}</>
                        : t('statusNone')}
                    </div>
                  </div>
                  <span className={`status status-${s.key}`}>{s.label}</span>
                  <div className="ai-actions d-flex gap-1">
                    <button type="button" className="icon-square" onClick={() => startEdit(a)} aria-label={`${t('edit')}: ${title}`} title={t('edit')}>
                      <Icon name="edit" size={15} />
                    </button>
                    <button type="button" className="icon-square" style={{ color: 'var(--ac-danger)' }} onClick={() => remove(a.id)} aria-label={`${t('delete')}: ${title}`} title={t('delete')}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* How alerts work */}
          <div className="col-lg-5 col-xl-4">
            <aside className="panel-amber how-card">
              <span className="how-icon"><Icon name="info" size={19} /></span>
              <h2>{t('howTitle')}</h2>
              <ol className="how-list">
                {['how1', 'how2', 'how3'].map((k, i) => <li key={k}><b>0{i + 1}</b><span>{t(k)}</span></li>)}
              </ol>
              <div className="how-note">{t('howNote')}</div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
