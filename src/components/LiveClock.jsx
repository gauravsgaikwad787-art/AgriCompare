// Concept: live clock using the JavaScript Date object + DOM methods.
// useRef gives direct access to the DOM node, and setInterval updates its
// textContent every second without re-rendering React.
import { useEffect, useRef } from 'react';
import { useApp } from '../i18n.js';
import Icon from './Icon.jsx';

export default function LiveClock() {
  const { t, lang } = useApp();
  const timeRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
    const tick = () => {
      const now = new Date();
      if (timeRef.current) {
        timeRef.current.textContent = now.toLocaleTimeString(locale, { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      }
      if (dateRef.current) {
        dateRef.current.textContent = now.toLocaleDateString(locale, {
          timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id); // stop the timer when the component unmounts
  }, [lang]);

  return (
    <div className="clock-line">
      <Icon name="calendar" size={15} />
      <span>{t('indiaTime')}:</span>
      <span className="clock-time" ref={timeRef} aria-live="off">--:--</span>
      <span ref={dateRef} />
    </div>
  );
}
