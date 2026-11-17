// Concept: responsive navigation bar. Below 992px the links collapse into a menu
// controlled by React state (no Bootstrap JavaScript needed).
import { useEffect, useState } from 'react';
import { useT } from '../i18n.js';
import Icon, { Logo } from './Icon.jsx';

const ITEMS = [['explorer', 'navExplore'], ['compare', 'navCompare'], ['analytics', 'analytics'], ['alerts', 'alerts'], ['about', 'about']];

export default function Navbar({ page, go, lang, setLang, dark, setDark }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [page]);

  const onNav = (e, key) => {
    e.preventDefault();
    setOpen(false);
    go(key);
  };

  return (
    <nav className={`nav-ac ${open ? 'open' : ''} ${page === 'home' ? 'on-dark' : ''}`} aria-label="Main">
      <div className="container bar">
        <a href="#/home" className="brand" onClick={(e) => onNav(e, 'home')} aria-current={page === 'home' ? 'page' : undefined}>
          <Logo size={34} />
          <span>
            <span className="brand-name">AgriCompare</span>
            <span className="brand-tag">{t('tagline')}</span>
          </span>
        </a>

        <ul className="nav-links" id="nav-links">
          {ITEMS.map(([key, label]) => (
            <li key={key}>
              <a href={`#/${key}`} className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined}
                onClick={(e) => onNav(e, key)}>
                {t(label)}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-tools">
          <button type="button" className="lang-btn" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            lang={lang === 'en' ? 'hi' : 'en'} aria-label={lang === 'en' ? 'हिंदी में देखें' : 'View in English'}>
            {lang === 'en' ? 'हिंदी' : 'EN'}
          </button>
          <button type="button" className="icon-square theme-btn" onClick={() => setDark(!dark)}
            aria-label={dark ? t('lightMode') : t('darkMode')} title={dark ? t('lightMode') : t('darkMode')}>
            <Icon name={dark ? 'sun' : 'moon'} size={17} />
          </button>
          <button type="button" className="icon-square nav-toggle" aria-label={t('menu')} aria-expanded={open}
            aria-controls="nav-links" onClick={() => setOpen(!open)}>
            <Icon name={open ? 'x' : 'menu'} size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
