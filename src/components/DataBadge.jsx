// Shows whether the prices on screen are official or sample data, and why.
import { useT } from '../i18n.js';
import Icon from './Icon.jsx';

// The small pill used on cards, tables and panels.
export function SourceTag({ source, short = false }) {
  const t = useT();
  if (source === 'live') {
    return <span className="tag tag-official"><Icon name="check" size={12} />{short ? 'AGMARKNET' : t('liveData')}</span>;
  }
  return <span className="tag tag-sample" title={t('sampleNote')}>{t('sampleData')}</span>;
}

// The status note shown at the top right of data pages.
export default function DataBadge({ data, showRetry = true, showReason = true }) {
  const t = useT();

  if (data.loading) {
    return (
      <div className="data-note" role="status">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ width: 13, height: 13, borderWidth: 2 }} />
        {t('loadingData')}
      </div>
    );
  }
  if (data.source === 'live') {
    return (
      <div className="data-note is-live" role="status">
        <b>{t('liveData')}</b>
        {data.fetchedAt && <span>· {t('liveNote', { time: data.fetchedAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</span>}
      </div>
    );
  }
  return (
    <div className="data-note is-sample" role="status">
      <b>{t('sampleData')}</b>
      <span>· {t('sampleNote')}</span>
      {showReason && data.reason && <span className="t-xs t-muted w-100">{data.reason}</span>}
      {showRetry && data.reason && !data.reason.startsWith('No API key') && (
        <button type="button" className="btn btn-link" onClick={data.refresh}>{t('retry')}</button>
      )}
    </div>
  );
}
