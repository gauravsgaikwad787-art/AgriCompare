// Concept: live-filter search bar + filters. The parent filters the list as the user types.
import { useApp } from '../i18n.js';
import { COMMODITIES } from '../services/api.js';
import Icon from './Icon.jsx';

export default function SearchFilter({ filters, setFilters, options }) {
  const { t } = useApp();
  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  return (
    <div className="panel filter-panel">
      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <label htmlFor="f-search" className="form-label">{t('searchLabel')}</label>
          <div className="search-field">
            <Icon name="search" size={17} />
            <input id="f-search" type="search" className="form-control" value={filters.q} onChange={set('q')}
              placeholder={t('searchMarketsPh')} autoComplete="off" />
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <label htmlFor="f-crop" className="form-label">{t('trades')}</label>
          <select id="f-crop" className="form-select" value={filters.crop} onChange={set('crop')}>
            <option value="">{t('allCrops')}</option>
            {COMMODITIES.map((c) => <option key={c} value={c}>{t(c)}{options.crops.has(c) ? '' : ` · ${t('noRecent')}`}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <label htmlFor="f-district" className="form-label">{t('district')}</label>
          <select id="f-district" className="form-select" value={filters.district} onChange={set('district')}>
            <option value="">{t('allDistricts')}</option>
            {options.districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-12 col-md-4 col-lg-2">
          <label htmlFor="f-within" className="form-label">{t('updatedWithin')}</label>
          <select id="f-within" className="form-select" value={filters.within} onChange={set('within')}>
            <option value="">{t('anyTime')}</option>
            <option value="2">{t('last2')}</option>
            <option value="7">{t('last7')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
