import { useState } from 'react';
import { deleteExpense, errorMessage } from '../api.js';
import ExpenseForm from '../components/ExpenseForm.jsx';
import { MonthPicker } from './Dashboard.jsx';
import { CATEGORIES, category } from '../lib/categories.js';
import { dayLabel, monthOf } from '../lib/dates.js';
import { formatEuros } from '../lib/money.js';
import { inMonth, total } from '../lib/stats.js';

export default function Expenses({ data, today, update, notify }) {
  const [month, setMonth] = useState(monthOf(today));
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(null);
  const list = inMonth(data.expenses, month).filter((e) => !cat || e.category === cat);

  async function remove(expense) {
    if (!confirm(`Supprimer cette dépense de ${formatEuros(expense.amount)} ?`)) return;
    try {
      await deleteExpense(expense.id);
      update((d) => ({ expenses: d.expenses.filter((e) => e.id !== expense.id) }));
      notify('Dépense supprimée.', 'ok');
    } catch (err) {
      notify(errorMessage(err), 'over');
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Dépenses</h1>
        <MonthPicker month={month} setMonth={setMonth} max={monthOf(today)} />
      </div>

      <section className="card">
        <h2 className="sr-only">Ajouter une dépense</h2>
        <ExpenseForm data={data} today={today} update={update} notify={notify} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>{list.length} dépense{list.length > 1 ? 's' : ''} · {formatEuros(total(list))}</h2>
          <label className="inline">Catégorie
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Toutes</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </label>
        </div>

        {list.length === 0 ? (
          <p className="empty">Aucune dépense pour ce filtre.</p>
        ) : (
          <ul className="expenses">
            {list.map((e) => (
              <li key={e.id}>
                {editing === e.id ? (
                  <ExpenseForm data={data} today={today} update={update} notify={notify} editing={e} onDone={() => setEditing(null)} />
                ) : (
                  <div className="expense">
                    <span className="expense-cat" style={{ background: `${category(e.category).color}22`, color: category(e.category).color }} aria-hidden="true">{category(e.category).emoji}</span>
                    <div className="expense-main">
                      <strong>{e.note || category(e.category).label}</strong>
                      <span className="muted small">{category(e.category).label} · {dayLabel(e.date)}</span>
                    </div>
                    <strong className="expense-amount">{formatEuros(e.amount)}</strong>
                    <div className="expense-actions">
                      <button className="btn ghost small" onClick={() => setEditing(e.id)} aria-label={`Modifier la dépense de ${formatEuros(e.amount)}`}>✏️</button>
                      <button className="btn ghost small" onClick={() => remove(e)} aria-label={`Supprimer la dépense de ${formatEuros(e.amount)}`}>🗑️</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
