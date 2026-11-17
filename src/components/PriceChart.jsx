// Concept: Chart.js data visualisation, wrapped for React by react-chartjs-2.
// One reusable chart for bar and line types. Colours come from the CSS tokens,
// so the chart follows light and dark mode.
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { useApp } from '../i18n.js';
import { formatINR } from '../utils.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

// true when the screen is phone-sized
function useNarrow() {
  const query = '(max-width: 575.98px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

// Prints each price at the end of its bar (used for the sideways ranking chart).
// It is defined once, outside the component, and reads the chart's CURRENT data and
// options every time it draws. (react-chartjs-2 registers plugins only when a chart is
// first created, so a plugin that captured values from one render would keep showing
// those old numbers after the crop or the data changed.)
const valueLabels = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts || !opts.show) return;
    const { ctx } = chart;
    const values = chart.data.datasets[0]?.data || [];
    ctx.save();
    ctx.font = '600 12px Poppins, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    chart.getDatasetMeta(0).data.forEach((bar, i) => {
      if (values[i] == null) return;
      ctx.fillStyle = i === opts.highlight ? opts.highlightColor : opts.color;
      ctx.fillText(formatINR(values[i]), bar.x + 6, bar.y);
    });
    ctx.restore();
  },
};

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * labels    : x-axis labels
 * values    : numbers (one series)
 * highlight : index of a bar to emphasise (e.g. the highest modal price)
 * details   : optional array of extra tooltip lines per point
 * label     : series name (shown in tooltip, and legend if showLegend)
 */
export default function PriceChart({ type = 'bar', labels, values, label, highlight = -1, details, yLabel, small = false, showLegend = false, dashed = false, horizontal = false }) {
  const { dark, t } = useApp(); // reading `dark` re-renders the chart when the theme changes
  const primary = css('--ac-primary') || '#237a45';
  const sun = css('--ac-sun') || '#c4682a';           // the highlighted (best) bar
  const primaryDark = sun;
  const soft = dark ? primary : (css('--ac-ink') || '#0d2419'); // Solstice: ink bars, ember highlight
  const text = css('--ac-muted') || '#687268';
  const ink = css('--ac-text') || '#202820';
  const grid = css('--ac-border') || '#e5eae4';
  const surface = css('--ac-surface') || '#fff';

  const narrow = useNarrow();
  const isBar = type === 'bar';
  // On phones, a bar chart with many markets turns sideways so every name stays readable.
  const sideways = isBar && (horizontal || (narrow && labels.length > 4));
  const cat = sideways ? 'y' : 'x';
  const val = sideways ? 'x' : 'y';
  const barColors = values.map((_, i) => (highlight === -1 ? primary : i === highlight ? primaryDark : soft));

  // Long market names wrap onto two lines instead of slanting.
  const wrap = (l) => {
    const words = String(l).split(' ');
    if (String(l).length <= 10 || words.length < 2) return l;
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  };

  const data = {
    labels: isBar && !sideways ? labels.map(wrap) : labels,
    datasets: [{
      label,
      data: values,
      backgroundColor: isBar ? barColors : (dark ? 'rgba(108,191,142,.12)' : 'rgba(31,107,71,.09)'),
      fill: !isBar,
      hoverBackgroundColor: isBar ? values.map((_, i) => (i === highlight ? sun : (css('--ac-primary-hover') || primary))) : undefined,
      borderColor: isBar ? 'transparent' : primary,
      borderWidth: isBar ? 0 : 2,
      borderDash: dashed ? [6, 4] : undefined,
      borderRadius: isBar ? (sideways ? { topRight: 4, bottomRight: 4 } : { topLeft: 4, topRight: 4 }) : 0,
      borderSkipped: sideways ? 'left' : 'bottom',
      maxBarThickness: sideways ? 24 : 44,
      categoryPercentage: 0.7,
      barPercentage: 0.9,
      pointRadius: isBar ? 0 : 4,
      pointHoverRadius: 6,
      pointBackgroundColor: primary,
      pointBorderColor: surface,
      pointBorderWidth: 2,
      tension: 0.35,
    }],
  };

  const options = {
    indexAxis: cat,
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 8, right: sideways ? 64 : 0 } },
    plugins: {
      valueLabels: { show: sideways, highlight, highlightColor: sun, color: text },
      legend: {
        display: showLegend,
        align: 'end',
        labels: { color: text, boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 3, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: '#0d2419',
        titleColor: '#fff',
        bodyColor: '#e4e9e3',
        padding: 10,
        cornerRadius: 12,
        displayColors: false,
        titleFont: { weight: '600' },
        callbacks: {
          title: (items) => (items[0] ? String(labels[items[0].dataIndex]) : ''),
          label: (ctx) => `${ctx.dataset.label}: ${formatINR(ctx.parsed[val])} ${t('perQuintal')}`,
          afterLabel: (ctx) => (details ? details[ctx.dataIndex] : ''),
        },
      },
    },
    scales: {
      [cat]: {
        ticks: { color: sideways ? ink : text, font: { size: sideways ? 13 : 12 }, maxRotation: isBar ? 50 : 0, autoSkip: !isBar },
        grid: { display: false },
        border: { color: grid },
      },
      [val]: {
        beginAtZero: isBar,
        ticks: { color: text, font: { size: 12 }, callback: (v) => formatINR(v), maxTicksLimit: 6 },
        grid: { color: grid, drawTicks: false },
        border: { display: false },
        title: { display: Boolean(yLabel), text: yLabel, color: text, font: { size: 12 } },
      },
    },
  };

  return (
    <div className={`chart-box ${small ? 'sm' : ''}`} style={{ color: ink, height: sideways ? Math.max(200, labels.length * 36 + 40) : undefined }}>
      {isBar ? <Bar data={data} options={options} plugins={[valueLabels]} /> : <Line data={data} options={options} />}
    </div>
  );
}
