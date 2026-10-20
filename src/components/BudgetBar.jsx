import { level } from '../lib/budgets.js';
import { formatEuros } from '../lib/money.js';

const LABELS = { ok: 'Dans le budget', warn: 'Bientôt atteint', over: 'Dépassé' };

/** Jauge d'un budget : verte, orange au-delà de 80 %, rouge au-delà de 100 % */
export default function BudgetBar({ cat, spent, limit }) {
  const state = level(spent, limit);
  const pct = Math.round((spent / limit) * 100);
  return (
    <div className={`budget ${state}`}>
      <div className="budget-head">
        <span>{cat.emoji} {cat.label}</span>
        <span className="budget-figures">{formatEuros(spent, { round: true })} / {formatEuros(limit, { round: true })}</span>
      </div>
      <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct, 100)} aria-label={`Budget ${cat.label} : ${pct} %, ${LABELS[state]}`}>
        <span style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
      </div>
      <span className="budget-state">{pct} % · {LABELS[state]}</span>
    </div>
  );
}
