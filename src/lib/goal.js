// L'objectif : en arrêtant une habitude qui coûte `habit_monthly` par mois, l'objet (`price`) est payé en N mois.

import { monthsBetween, todayKey } from './dates.js';
import { category } from './categories.js';

/** Habitudes proposées à l'inscription, avec un coût mensuel indicatif (centimes) */
export const HABITS = [
  { id: 'cafe', label: 'Le café du matin au comptoir', hint: '2 € × 22 jours', monthly: 4400 },
  { id: 'livraison', label: 'La livraison de repas', hint: '2 commandes de 25 € par semaine', monthly: 21600 },
  { id: 'cigarettes', label: 'Les cigarettes', hint: '1 paquet tous les 2 jours', monthly: 19500 },
  { id: 'streaming', label: 'Un abonnement de streaming', hint: 'une offre standard', monthly: 1349 },
  { id: 'sorties', label: 'Un verre en terrasse', hint: '2 sorties de 15 € par semaine', monthly: 12900 },
];

export const monthsNeeded = (price, monthly) => Math.ceil(price / monthly);

/** Où en est l'objectif : mois écoulés depuis sa création, somme mise de côté (théorique), mois restants */
export function progress(goal, today = todayKey()) {
  const start = goal.created.slice(0, 10);
  const elapsed = monthsBetween(start, today);
  const saved = Math.min(goal.price, elapsed * goal.habit_monthly);
  const remaining = goal.price - saved;
  return {
    elapsed,
    saved,
    ratio: saved / goal.price,
    remainingMonths: monthsNeeded(remaining, goal.habit_monthly),
    done: remaining <= 0,
  };
}

export const CUT = 0.3;

/**
 * Accélérateurs : réduire de 30 % une des 3 plus grosses catégories (moyennes mensuelles)
 * fait arriver l'objet plus tôt. Seuls ceux qui font gagner au moins un mois sont gardés.
 */
export function accelerators(goal, averages, today = todayKey()) {
  const { saved, remainingMonths, done } = progress(goal, today);
  if (done) return [];
  const remaining = goal.price - saved;
  return averages.slice(0, 3)
    .map(({ category: id, amount }) => {
      const extra = Math.round(amount * CUT);
      const months = monthsNeeded(remaining, goal.habit_monthly + extra);
      return { category: category(id), extra, months, gain: remainingMonths - months };
    })
    .filter((a) => a.extra > 0 && a.gain > 0);
}
