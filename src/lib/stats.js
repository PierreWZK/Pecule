// Statistiques sur les dépenses { amount (centimes), date (« AAAA-MM-JJ »), category }

import { daysInMonth, monthOf, shiftMonth } from './dates.js';

export const total = (list) => list.reduce((sum, e) => sum + e.amount, 0);
export const inMonth = (list, month) => list.filter((e) => monthOf(e.date) === month);

/** Totaux par catégorie, du plus gros au plus petit */
export function byCategory(list) {
  const sums = new Map();
  for (const e of list) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
  return [...sums].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

/** Total de chacun des `count` mois qui finissent à `lastMonth` */
export function monthlyTotals(list, lastMonth, count = 6) {
  return Array.from({ length: count }, (_, i) => {
    const month = shiftMonth(lastMonth, i - count + 1);
    return { month, amount: total(inMonth(list, month)) };
  });
}

/** Cumul jour par jour du mois et du mois précédent : [{ day: 1, current, previous }] ; `upToDay` coupe le mois en cours */
export function cumulative(list, month, upToDay = daysInMonth(month)) {
  const perDay = (m) => {
    const days = new Array(31).fill(0);
    for (const e of inMonth(list, m)) days[Number(e.date.slice(8, 10)) - 1] += e.amount;
    return days;
  };
  const cur = perDay(month);
  const prev = perDay(shiftMonth(month, -1));
  const prevDays = daysInMonth(shiftMonth(month, -1));
  const rows = [];
  let a = 0;
  let b = 0;
  for (let d = 1; d <= Math.max(daysInMonth(month), prevDays); d++) {
    a += cur[d - 1];
    b += prev[d - 1];
    rows.push({ day: d, current: d <= upToDay && d <= daysInMonth(month) ? a : null, previous: d <= prevDays ? b : null });
  }
  return rows;
}

/** Résumé d'un mois : total, écart avec le mois précédent, moyenne par jour, plus grosse dépense, top 3 */
export function summary(list, month, today) {
  const current = inMonth(list, month);
  const amount = total(current);
  const previous = total(inMonth(list, shiftMonth(month, -1)));
  const elapsed = monthOf(today) === month ? Number(today.slice(8, 10)) : daysInMonth(month);
  return {
    amount,
    previous,
    diff: amount - previous,
    percent: previous ? Math.round(((amount - previous) / previous) * 100) : null,
    perDay: Math.round(amount / elapsed),
    biggest: current.reduce((max, e) => (!max || e.amount > max.amount ? e : max), null),
    top: byCategory(current).slice(0, 3),
    count: current.length,
  };
}

/**
 * Dépense mensuelle moyenne par catégorie, sur les 3 mois complets avant `month`
 * (ceux qui ont des dépenses) ; à défaut, le mois en cours.
 */
export function monthlyAverages(list, month) {
  const months = [1, 2, 3].map((i) => shiftMonth(month, -i)).filter((m) => inMonth(list, m).length);
  if (!months.length) return byCategory(inMonth(list, month));
  return byCategory(list.filter((e) => months.includes(monthOf(e.date))))
    .map(({ category, amount }) => ({ category, amount: Math.round(amount / months.length) }));
}
