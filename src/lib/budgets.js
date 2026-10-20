// Jauges de budget : vert jusqu'à 80 %, orange jusqu'à 100 %, rouge au-delà

export const WARN = 0.8;

export function level(spent, limit) {
  if (spent > limit) return 'over';
  if (spent >= limit * WARN) return 'warn';
  return 'ok';
}

/** Le seuil franchi par une nouvelle dépense (`before` → `after`), ou null */
export function crossing(before, after, limit) {
  const was = level(before, limit);
  const now = level(after, limit);
  if (now === was || now === 'ok') return null;
  return now;
}
