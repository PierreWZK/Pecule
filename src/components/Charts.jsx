import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { category } from '../lib/categories.js';
import { monthShort } from '../lib/dates.js';
import { formatEuros } from '../lib/money.js';

const AXIS = { stroke: 'var(--muted)', fontSize: 12, tickLine: false, axisLine: false };
const TOOLTIP = { contentStyle: { background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10 }, labelStyle: { color: 'var(--ink)' } };
const euros = (cents) => formatEuros(cents, { round: true });

/** Répartition du mois par catégorie */
export function CategoryDonut({ rows, total }) {
  if (!rows.length) return <p className="empty">Aucune dépense ce mois-ci.</p>;
  return (
    <div className="donut">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={rows} dataKey="amount" nameKey="category" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
              {rows.map((r) => <Cell key={r.category} fill={category(r.category).color} />)}
            </Pie>
            <Tooltip {...TOOLTIP} formatter={(v, id) => [formatEuros(v), category(id).label]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><strong>{euros(total)}</strong><span className="muted">ce mois-ci</span></div>
      </div>
      <ul className="legend">
        {rows.map((r) => (
          <li key={r.category}>
            <span className="dot" style={{ background: category(r.category).color }} />
            {category(r.category).label}
            <span className="legend-value">{euros(r.amount)} · {Math.round((r.amount / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Total des 6 derniers mois */
export function MonthlyBars({ rows, current }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="month" tickFormatter={monthShort} {...AXIS} />
        <YAxis tickFormatter={euros} width={64} {...AXIS} />
        <Tooltip {...TOOLTIP} cursor={{ fill: 'rgba(255,255,255,.04)' }} labelFormatter={monthShort} formatter={(v) => [formatEuros(v), 'Total']} />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {rows.map((r) => <Cell key={r.month} fill={r.month === current ? 'var(--gold)' : 'var(--surface-3)'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Cumul jour par jour : ce mois-ci contre le mois précédent */
export function CumulLine({ rows }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="day" {...AXIS} interval={4} />
        <YAxis tickFormatter={euros} width={64} {...AXIS} />
        <Tooltip {...TOOLTIP} labelFormatter={(d) => `Jour ${d}`} formatter={(v, key) => [formatEuros(v), key === 'current' ? 'Ce mois-ci' : 'Mois précédent']} />
        <Line type="monotone" dataKey="previous" stroke="var(--muted)" strokeDasharray="4 4" dot={false} strokeWidth={2} connectNulls={false} />
        <Line type="monotone" dataKey="current" stroke="var(--gold)" dot={false} strokeWidth={3} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
