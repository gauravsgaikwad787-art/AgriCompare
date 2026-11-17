// About page: the project team and the project itself. All content comes from src/data/profile.js.
import { PROJECT, TEAM } from '../data/profile.js';
import Icon from '../components/Icon.jsx';
import { useT } from '../i18n.js';

const stripUrl = (u) => u.replace(/^https?:\/\/(www\.)?/, '');

function Member({ m }) {
  const t = useT();
  const links = [
    m.email && { icon: 'mail', href: `mailto:${m.email}`, label: m.email },
    m.github && { icon: 'link', href: m.github, label: stripUrl(m.github) },
    m.linkedin && { icon: 'link', href: m.linkedin, label: stripUrl(m.linkedin) },
  ].filter(Boolean);
  return (
    <article className="panel member-card">
      <div className="avatar" aria-hidden="true">{m.initials}</div>
      <div className="min-w-0">
        <h3>{m.name}</h3>
        <div className="member-roll">{t('rollNo')} <b>{m.rollNo}</b></div>
        {m.role && <div className="t-small t-muted mt-1">{m.role}</div>}
        {links.length > 0 && (
          <ul className="contact-list mt-2">
            {links.map((l) => (
              <li key={l.href}><Icon name={l.icon} size={15} /><a href={l.href} target="_blank" rel="noreferrer">{l.label}</a></li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function About() {
  const t = useT();
  const p = PROJECT;
  const details = [
    [t('course'), p.course], [t('college'), p.college], [t('department'), p.department],
    [t('classYear'), p.year], [t('guide'), p.guide],
  ].filter(([, v]) => v);

  return (
    <div className="container" style={{ maxWidth: 960 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('aboutEyebrow')}</div>
          <h1 className="t-page">{t('teamTitle')}</h1>
          <p>{t('teamSub')}</p>
        </div>
        <button type="button" className="btn btn-secondary-ac d-print-none" onClick={() => window.print()}>
          <Icon name="printer" size={16} />{t('printPdf')}
        </button>
      </header>

      <div className="page">
        <div className="row g-3 g-lg-4 mb-4">
          {TEAM.map((m) => <div className="col-md-6" key={m.rollNo}><Member m={m} /></div>)}
        </div>

        <section className="panel resume-section">
          <h2>{t('aboutProject')}</h2>
          <div className="resume-item">
            <h3>{p.name}</h3>
            <p>{p.summary}</p>
            {p.repo && <p className="mt-2"><a href={p.repo} target="_blank" rel="noreferrer">{stripUrl(p.repo)}</a></p>}
          </div>
        </section>

        <section className="panel resume-section">
          <h2>{t('projectDetails')}</h2>
          <dl className="detail-list">
            {details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>

        <section className="panel resume-section">
          <h2>{t('builtWith')}</h2>
          <ul className="skill-list">{p.tech.map((s) => <li key={s}>{s}</li>)}</ul>
          <p className="t-small t-muted mt-3 mb-0">{t('dataCredit')}</p>
        </section>
      </div>
    </div>
  );
}
