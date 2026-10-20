// Dates au format texte : jour « AAAA-MM-JJ », mois « AAAA-MM ». Le jour courant suit l'heure de Paris.

const PARIS_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
const MONTH_LABEL = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const MONTH_SHORT = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });
const DAY_LABEL = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export const todayKey = (date = new Date()) => PARIS_DAY.format(date);
export const monthOf = (day) => day.slice(0, 7);

const toUtc = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
};

/** « 2026-10 » + 3 → « 2027-01 » */
export function shiftMonth(month, n) {
  const d = toUtc(month);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

export function daysInMonth(month) {
  const d = toUtc(shiftMonth(month, 1));
  d.setUTCDate(0);
  return d.getUTCDate();
}

/** Nombre de mois entiers entre deux jours (« 2026-01-15 » → « 2026-03-14 » = 1) */
export function monthsBetween(fromDay, toDay) {
  const [y1, m1, d1] = fromDay.split('-').map(Number);
  const [y2, m2, d2] = toDay.split('-').map(Number);
  return Math.max(0, (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0));
}

export const monthLabel = (month) => MONTH_LABEL.format(toUtc(month));
export const monthShort = (month) => MONTH_SHORT.format(toUtc(month)).replace('.', '');
export const dayLabel = (day) => DAY_LABEL.format(new Date(`${day}T00:00:00Z`));

/** Nombre de jours depuis le 1er janvier 1970 (pour le tirage du défi) */
export const dayNumber = (day) => Math.round(Date.parse(`${day}T00:00:00Z`) / 86400000);
