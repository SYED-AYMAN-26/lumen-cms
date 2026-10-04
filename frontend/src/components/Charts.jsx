export function LineChart({ data = [] }) {
  const width = 560;
  const height = 190;
  const pad = 28;
  const max = Math.max(1, ...data.map((d) => d.count));
  const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + i * step;
    const y = height - pad - (d.count / max) * (height - pad * 2);
    return [x, y, d];
  });
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = points.length ? `${line} L${points.at(-1)[0]},${height - pad} L${points[0][0]},${height - pad} Z` : '';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img" aria-label="Content created over time">
      <path d={area} fill="#9a3412" opacity="0.12" />
      <path d={line} fill="none" stroke="#9a3412" strokeWidth="2.4" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill="#9a3412" />)}
      {points.filter((_, i) => i % 2 === 0 || points.length < 8).map((p, i) => (
        <text key={i} x={p[0]} y={height - 8} textAnchor="middle" fontSize="10" fill="#78716c">{p[2].label}</text>
      ))}
    </svg>
  );
}

export function BarChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (!data.length) return <p className="text-sm text-stone-500">No categories yet.</p>;
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name}>
          <div className="mb-1 flex justify-between text-xs text-stone-600">
            <span>{item.name}</span>
            <span>{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-stone-100">
            <div className="h-2 rounded-full bg-copper" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Donut({ data = [] }) {
  const colors = { published: '#047857', draft: '#a8a29e', review: '#b45309', scheduled: '#0369a1', archived: '#57534e', trash: '#be123c' };
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
  let cursor = 0;
  const slices = data.filter((d) => d.count).map((item) => {
    const start = cursor;
    const angle = (item.count / total) * Math.PI * 2;
    cursor += angle;
    const large = angle > Math.PI ? 1 : 0;
    const x1 = 50 + 36 * Math.sin(start);
    const y1 = 50 - 36 * Math.cos(start);
    const x2 = 50 + 36 * Math.sin(start + angle);
    const y2 = 50 - 36 * Math.cos(start + angle);
    return { ...item, d: `M50,50 L${x1},${y1} A36,36 0 ${large} 1 ${x2},${y2} Z`, color: colors[item.status] || '#9a3412' };
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0" role="img" aria-label="Published versus other statuses">
        <circle cx="50" cy="50" r="36" fill="#f5f5f4" />
        {slices.map((slice) => <path key={slice.status} d={slice.d} fill={slice.color} />)}
        <circle cx="50" cy="50" r="20" fill="white" />
      </svg>
      <ul className="space-y-1 text-xs text-stone-600">
        {data.map((item) => (
          <li key={item.status} className="flex items-center gap-2 capitalize">
            <span className="h-2 w-2 rounded-full" style={{ background: colors[item.status] || '#9a3412' }} />
            {item.status} · {item.count}
          </li>
        ))}
      </ul>
    </div>
  );
}
