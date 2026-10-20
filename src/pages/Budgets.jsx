import { useState } from 'react';
import { deleteBudget, errorMessage, saveBudget } from '../api.js';
import BudgetBar from '../components/BudgetBar.jsx';
import { CATEGORIES } from '../lib/categories.js';
import { monthOf } from '../lib/dates.js';
import { formatEuros, parseEuros, toInput } from '../lib/money.js';
import { inMonth, monthlyAverages, total } from '../lib/stats.js';

/** Un plafond mensuel par catégorie ; la moyenne des derniers mois aide à le fixer */
export default function Budgets({ data, today, update, notify }) {
  const month = monthOf(today);
  const spentThisMonth = (id) => total(inMonth(data.expenses, month).filter((e) => e.category === id));
  const averages = Object.fromEntries(monthlyAverages(data.expenses, month).map((a) => [a.category, a.amount]));
  const budgetOf = (id) => data.budgets.find((b) => b.category === id);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, budgetOf(c.id) ? toInput(budgetOf(c.id).amount) : ''])));

  async function save(id) {
    const budget = budgetOf(id);
    const text = drafts[id].trim();
    try {
      if (!text) {
        if (!budget) return;
        await deleteBudget(budget.id);
        update((d) => ({ budgets: d.budgets.filter((b) => b.id !== budget.id) }));
        return notify('Budget retiré.', 'ok');
      }
      const amount = parseEuros(text);
      if (!amount) return notify('Montant invalide (par exemple 200).', 'over');
      if (budget?.amount === amount) return;
      const saved = await saveBudget({ id: budget?.id, category: id, amount });
      update((d) => ({ budgets: [...d.budgets.filter((b) => b.category !== id), saved] }));
      notify(`Budget enregistré : ${formatEuros(amount, { round: true })} par mois.`, 'ok');
    } catch (err) {
      notify(errorMessage(err), 'over');
    }
  }

  return (
    <>
      <div className="page-head"><h1>Budgets</h1></div>
      <p className="lead">Un plafond par mois et par catégorie. La jauge passe à l'orange à 80 %, au rouge au-delà de 100 %, et Pécule vous prévient dès la dépense qui fait déborder.</p>
      <div className="budgets-grid">
        {CATEGORIES.map((c) => {
          const budget = budgetOf(c.id);
          return (
            <section key={c.id} className="card budget-card">
              {/* Entrée valide en quittant le champ : un seul enregistrement, même avec Entrée puis clic ailleurs */}
              <form onSubmit={(e) => { e.preventDefault(); e.currentTarget.querySelector('input').blur(); }}>
                <label>{c.emoji} {c.label}
                  <div className="input-euro">
                    <input inputMode="decimal" value={drafts[c.id]} onChange={(e) => setDrafts({ ...drafts, [c.id]: e.target.value })} onBlur={() => save(c.id)} placeholder="Pas de budget" />
                    <span>€/mois</span>
                  </div>
                </label>
              </form>
              {averages[c.id] > 0 && <p className="muted small">Moyenne récente : {formatEuros(averages[c.id], { round: true })}/mois</p>}
              {budget && <BudgetBar cat={c} limit={budget.amount} spent={spentThisMonth(c.id)} />}
            </section>
          );
        })}
      </div>
    </>
  );
}
