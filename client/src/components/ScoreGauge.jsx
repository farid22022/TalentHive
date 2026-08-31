import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const colorFor = (v) => (v >= 75 ? '#16a34a' : v >= 50 ? '#d97706' : '#dc2626');

/** Compact radial score gauge (0–100) built on Recharts. */
export function ScoreGauge({ value = 0, label, size = 140 }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const data = [{ name: label, value: v, fill: colorFor(v) }];
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <RadialBarChart
          width={size}
          height={size}
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={8} angleAxisId={0} />
        </RadialBarChart>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-2xl font-bold text-slate-900">{v}</span>
        </div>
      </div>
      {label && <span className="mt-1 text-sm font-medium text-slate-600">{label}</span>}
    </div>
  );
}
