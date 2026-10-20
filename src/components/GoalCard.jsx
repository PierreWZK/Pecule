import { accelerators, progress } from '../lib/goal.js';
import { monthLabel, monthOf, shiftMonth } from '../lib/dates.js';
import { formatEuros } from '../lib/money.js';
import { monthlyAverages } from '../lib/stats.js';

export default function GoalCard({ goal, expenses, today }) {
  if (!goal) {
    return (
      <section className="card goal">
        <h2>🎯 Un objectif ?</h2>
        <p className="muted">Dites ce que vous voulez vous offrir : Pécule calcule quand il sera payé.</p>
        <a className="btn" href="#/objectif">Choisir mon objectif</a>
      </section>
    );
  }
  const p = progress(goal, today);
  const boosts = accelerators(goal, monthlyAverages(expenses, monthOf(today)), today);
  const arrival = monthLabel(shiftMonth(monthOf(today), p.remainingMonths));

  return (
    <section className="card goal">
      <div className="goal-head">
        <h2>🎯 {goal.item}</h2>
        <a href="#/objectif" className="small">Modifier</a>
      </div>
      {p.done ? (
        <p className="goal-done">🎉 C'est payé ! Les {formatEuros(goal.price, { round: true })} sont de côté. <a href="#/objectif">Un nouvel objectif ?</a></p>
      ) : (
        <p>
          <span className="big">{p.remainingMonths} mois</span> encore, en arrêtant {goal.habit.charAt(0).toLowerCase() + goal.habit.slice(1)} ({formatEuros(goal.habit_monthly, { round: true })}/mois) : <strong>{arrival}</strong>.
        </p>
      )}
      <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.ratio * 100)} aria-label="Progression de l'objectif">
        <span style={{ width: `${Math.max(2, p.ratio * 100)}%` }} />
      </div>
      <p className="muted small">{formatEuros(p.saved, { round: true })} mis de côté sur {formatEuros(goal.price, { round: true })} ({p.elapsed} mois depuis le début)</p>

      {boosts.length > 0 && (
        <div className="boosts">
          <h3>⚡ Pour aller plus vite</h3>
          <ul>
            {boosts.map((b) => (
              <li key={b.category.id}>
                En réduisant <strong>{b.category.emoji} {b.category.label}</strong> de 30 % (+{formatEuros(b.extra, { round: true })}/mois) :{' '}
                <strong className="gain">{b.gain} mois plus tôt</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
