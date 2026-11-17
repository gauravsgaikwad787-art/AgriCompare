import { useT } from '../i18n.js';
import { Logo } from './Icon.jsx';

const LINKS = [['home', 'home'], ['explorer', 'navExplore'], ['compare', 'navCompare'], ['analytics', 'analytics'], ['alerts', 'alerts'], ['about', 'about']];

export default function Footer({ go }) {
  const t = useT();
  const nav = (e, key) => { e.preventDefault(); go(key); };
  return (
    <footer className="footer d-print-none">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="brand mb-3"><Logo size={30} /><span className="brand-name">AgriCompare</span></div>
            <p className="t-muted mb-0" style={{ maxWidth: '26rem' }}>{t('footerText')}</p>
          </div>
          <div className="col-6 col-lg-3 offset-lg-1">
            <h2>{t('pages')}</h2>
            <ul>{LINKS.map(([k, l]) => <li key={k}><a href={`#/${k}`} onClick={(e) => nav(e, k)}>{t(l)}</a></li>)}</ul>
          </div>
          <div className="col-6 col-lg-3">
            <h2>{t('dataSources')}</h2>
            <ul>
              <li><a href="https://agmarknet.gov.in/" target="_blank" rel="noreferrer">AGMARKNET</a></li>
              <li><a href="https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi" target="_blank" rel="noreferrer">data.gov.in dataset</a></li>
              <li><a href="https://sdgs.un.org/goals/goal2" target="_blank" rel="noreferrer">SDG 2: Zero Hunger</a></li>
              <li><a href="https://sdgs.un.org/goals/goal8" target="_blank" rel="noreferrer">SDG 8: Decent Work</a></li>
            </ul>
          </div>
        </div>
        <div className="fine">
          <span>AgriCompare · {t('footTag')}</span>
          <span>{t('footerNote')}</span>
        </div>
      </div>
    </footer>
  );
}
