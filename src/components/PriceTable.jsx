// Sortable comparison table. Click a column heading to sort by it.
import { useMemo, useState } from 'react';
import { useApp } from '../i18n.js';
import { formatDate, formatINR } from '../utils.js';
import Icon from './Icon.jsx';

const COLUMNS = [
  { key: 'market', label: 'market' },
  { key: 'district', label: 'district' },
  { key: 'min', label: 'minPrice', num: true },
  { key: 'max', label: 'maxPrice', num: true },
  { key: 'modal', label: 'modal', num: true },
  { key: 'date', label: 'date' },
];

export default function PriceTable({ rows, highlightId, title, tag }) {
  const { t, lang } = useApp();
  const [sort, setSort] = useState({ key: 'modal', dir: 'desc' });

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      const diff = typeof x === 'number' ? x - y : String(x).localeCompare(String(y));
      return sort.dir === 'asc' ? diff : -diff;
    });
  }, [rows, sort]);

  const toggleSort = (key, num) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: num ? 'desc' : 'asc' }));
  };

  return (
    <div className="table-wrap">
      {title && <div className="table-title"><h2>{title}</h2>{tag}</div>}
      <div className="table-scroll">
        <table className="table-ac">
          <caption className="visually-hidden">{t('compareTitle')}, {t('perQuintal')}</caption>
          <thead>
            <tr>
              {COLUMNS.map(({ key, label, num }) => {
                const active = sort.key === key;
                return (
                  <th key={key} scope="col" className={num ? 'num-col' : ''}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" className="sort-btn" onClick={() => toggleSort(key, num)}>
                      {t(label)}
                      <Icon name={active ? (sort.dir === 'asc' ? 'sortUp' : 'sortDown') : 'sort'} size={14} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const best = r.id === highlightId;
              return (
                <tr key={r.id} className={best ? 'is-best' : ''}>
                  <td className="fw-bold market-cell">
                    {r.market}
                    {best && <span className="tag tag-best ms-2">{t('highest')}</span>}
                  </td>
                  <td className="t-muted">{r.district}</td>
                  <td className="num-col">{formatINR(r.min)}</td>
                  <td className="num-col">{formatINR(r.max)}</td>
                  <td className="num-col fw-bold modal-cell">{formatINR(r.modal)}</td>
                  <td className="t-muted text-nowrap">{formatDate(r.date, lang)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
