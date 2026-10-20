import { useState } from 'react';
import ExpenseForm from '../components/ExpenseForm.jsx';
import GoalCard from '../components/GoalCard.jsx';
import BudgetBar from '../components/BudgetBar.jsx';
import { CategoryDonut, CumulLine, MonthlyBars } from '../components/Charts.jsx';
import { category } from '../lib/categories.js';
import { dayLabel, monthLabel, monthOf, shiftMonth } from '../lib/dates.js';
import { formatEuros } from '../lib/money.js';
import { byCategory, cumulative, inMonth, monthlyTotals, summary, total } from '../lib/stats.js';
import { questionOf, streak } from '../lib/challenge.js';

export function MonthPicker({ month, setMonth, max }) {
  return (
    <div className="month-picker">
      <button className="btn ghost small" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mois précédent">←</button>
      <strong>{monthLabel(month)}</strong>
      <button className="btn ghost small" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= max} aria-label="Mois suivant">→</button>
    </div>
  );
}

export default function Dashboard({ data, today, update, notify }) {
  const current = monthOf(today);
  const [month, setMonth] = useState(current);
  const s = summary(data.expenses, month, today);
  const list = inMonth(data.expenses, month);
  const upTo = month === current ? Number(today.slice(8, 10)) : undefined;
  const answered = data.answers.find((a) => a.day === today);
  const series = streak(data.answers.map((a) => a.day), today);

  return (
    <>
      <div className="page-head">
        <h1>Tableau de bord</h1>
        <MonthPicker month={month} setMonth={setMonth} max={current} />
      </div>

      <section className="card">
        <h2 className="sr-only">Ajouter une dépense</h2>
        <ExpenseForm data={data} today={today} update={update} notify={notify} />
      </section>

      <section className="kpis" aria-label="Chiffres du mois">
        <div className="card kpi">
          <span className="muted">Total du mois</span>
          <strong>{formatEuros(s.amount)}</strong>
          {s.percent !== null && (
            <span className={s.diff > 0 ? 'up' : 'down'}>
              {s.diff > 0 ? '▲' : '▼'} {formatEuros(Math.abs(s.diff), { round: true })} ({s.percent > 0 ? '+' : ''}{s.percent} %) vs {monthLabel(shiftMonth(month, -1)).split(' ')[0]}
            </span>
          )}
        </div>
        <div className="card kpi">
          <span className="muted">Moyenne par jour</span>
          <strong>{formatEuros(s.perDay)}</strong>
          <span className="muted small">{s.count} dépense{s.count > 1 ? 's' : ''}</span>
        </div>
        <div className="card kpi">
          <span className="muted">Plus grosse dépense</span>
          <strong>{s.biggest ? formatEuros(s.biggest.amount) : '—'}</strong>
          {s.biggest && <span className="muted small">{category(s.biggest.category).emoji} {s.biggest.note || category(s.biggest.category).label} · {dayLabel(s.biggest.date)}</span>}
        </div>
        <a className="card kpi challenge-kpi" href="#/defi">
          <span className="muted">Défi du jour</span>
          <strong>{answered ? (answered.correct ? '✅ Réussi' : '❌ Raté') : '❓ À jouer'}</strong>
          <span className="muted small">🔥 Série : {series} jour{series > 1 ? 's' : ''}{!answered && ` · « ${questionOf(today).q.slice(0, 38)}… »`}</span>
        </a>
      </section>

      <div className="grid-2">
        <GoalCard goal={data.goal} expenses={data.expenses} today={today} />
        <section className="card">
          <div className="card-head"><h2>Budgets</h2><a href="#/budgets" className="small">Gérer</a></div>
          {data.budgets.length === 0 ? (
            <p className="empty">Aucun budget. <a href="#/budgets">Fixer un plafond par catégorie</a>.</p>
          ) : (
            data.budgets.map((b) => (
              <BudgetBar key={b.id} cat={category(b.category)} limit={b.amount} spent={total(list.filter((e) => e.category === b.category))} />
            ))
          )}
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Par catégorie</h2>
          <CategoryDonut rows={byCategory(list)} total={s.amount} />
          {s.top.length > 0 && (
            <p className="muted small">Top 3 : {s.top.map((t) => `${category(t.category).emoji} ${category(t.category).label}`).join(' · ')}</p>
          )}
        </section>
        <section className="card">
          <h2>Cumul du mois</h2>
          <p className="muted small"><span className="swatch gold" /> {monthLabel(month)} <span className="swatch dashed" /> mois précédent</p>
          <CumulLine rows={cumulative(data.expenses, month, upTo)} />
        </section>
      </div>

      <section className="card">
        <h2>Les 6 derniers mois</h2>
        <MonthlyBars rows={monthlyTotals(data.expenses, month)} current={month} />
      </section>
    </>
  );
}
