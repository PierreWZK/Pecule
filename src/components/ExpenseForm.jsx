import { useState } from 'react';
import { errorMessage, saveExpense } from '../api.js';
import { CATEGORIES, category } from '../lib/categories.js';
import { crossing } from '../lib/budgets.js';
import { monthOf } from '../lib/dates.js';
import { formatEuros, parseEuros, toInput } from '../lib/money.js';
import { inMonth, total } from '../lib/stats.js';

/** Catégorie la plus utilisée récemment (proposée par défaut) */
function usualCategory(expenses) {
  const counts = {};
  for (const e of expenses.slice(0, 30)) counts[e.category] = (counts[e.category] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'courses';
}

/** Ajout ou modification d'une dépense ; prévient si un budget est franchi */
export default function ExpenseForm({ data, today, update, notify, editing = null, onDone }) {
  const [amount, setAmount] = useState(editing ? toInput(editing.amount) : '');
  const [date, setDate] = useState(editing?.date ?? today);
  const [cat, setCat] = useState(editing?.category ?? usualCategory(data.expenses));
  const [note, setNote] = useState(editing?.note ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const cents = parseEuros(amount);
    if (!cents) return setError('Montant invalide (par exemple 12,50).');
    setError('');
    setBusy(true);
    try {
      const saved = await saveExpense({ id: editing?.id, amount: cents, date, category: cat, note: note.trim() });
      const others = data.expenses.filter((x) => x.id !== saved.id);
      update(() => ({ expenses: [saved, ...others].sort((a, b) => b.date.localeCompare(a.date)) }));
      checkBudget(others, saved);
      if (!editing) {
        setAmount('');
        setNote('');
      }
      onDone?.(saved);
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  function checkBudget(others, saved) {
    const budget = data.budgets.find((b) => b.category === saved.category);
    if (!budget) return notify(`${formatEuros(saved.amount)} ${editing ? 'modifiés' : 'ajoutés'} en ${category(saved.category).label}.`, 'ok');
    const month = monthOf(saved.date);
    const before = total(inMonth(others, month).filter((x) => x.category === saved.category));
    const after = before + saved.amount;
    const level = crossing(before, after, budget.amount);
    const label = category(saved.category).label;
    if (level === 'over') notify(`Budget ${label} dépassé : ${formatEuros(after)} sur ${formatEuros(budget.amount)}.`, 'over');
    else if (level === 'warn') notify(`Attention : ${Math.round((after / budget.amount) * 100)} % du budget ${label} utilisé.`, 'warn');
    else notify(`${formatEuros(saved.amount)} ${editing ? 'modifiés' : 'ajoutés'} en ${label}.`, 'ok');
  }

  return (
    <form className="expense-form" onSubmit={submit}>
      <label className="grow-1">Montant
        <div className="input-euro"><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="12,50" required autoFocus={!!editing} /><span>€</span></div>
      </label>
      <label className="grow-2">Catégorie
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </label>
      <label className="grow-1">Date
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="grow-2"><span>Note <span className="muted">(facultatif)</span></span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Boulangerie, plein d'essence…" />
      </label>
      <div className="form-actions">
        <button className="btn" disabled={busy}>{busy ? '…' : editing ? 'Enregistrer' : 'Ajouter'}</button>
        {editing && <button type="button" className="btn ghost" onClick={() => onDone?.()}>Annuler</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
