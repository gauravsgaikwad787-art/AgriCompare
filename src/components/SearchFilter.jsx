// Concept: live-filter search bar + filters. The parent filters the list as the user types.
import { useApp } from '../i18n.js';
import { COMMODITIES } from '../services/api.js';
import { formatDate } from '../utils.js';
import Icon from './Icon.jsx';

export default function SearchFilter({ filters, setFilters, options }) {
  const { t, lang } = useApp();
  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  return (
    <div className="panel filter-panel">
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <label htmlFor="f-search" className="form-label">{t('searchLabel')}</label>
          <div className="search-field">
            <Icon name="search" size={17} />
            <input id="f-search" type="search" className="form-control" value={filters.q} onChange={set('q')}
              placeholder={t('searchPh')} autoComplete="off" />
          </div>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <label htmlFor="f-crop" className="form-label">{t('crop')}</label>
          <select id="f-crop" className="form-select" value={filters.crop} onChange={set('crop')}>
            <option value="">{t('allCrops')}</option>
            {COMMODITIES.map((c) => <option key={c} value={c}>{t(c)}{options.crops.has(c) ? '' : ` · ${t('noRecent')}`}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <label htmlFor="f-district" className="form-label">{t('district')}</label>
          <select id="f-district" className="form-select" value={filters.district} onChange={set('district')}>
            <option value="">{t('allDistricts')}</option>
            {options.districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <label htmlFor="f-market" className="form-label">{t('market')}</label>
          <select id="f-market" className="form-select" value={filters.market} onChange={set('market')}>
            <option value="">{t('allMarkets')}</option>
            {options.markets.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <label htmlFor="f-date" className="form-label">{t('reportedDate')}</label>
          <select id="f-date" className="form-select" value={filters.date} onChange={set('date')}>
            <option value="">{t('allDates')}</option>
            {options.dates.map((d) => <option key={d} value={d}>{formatDate(d, lang)}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
