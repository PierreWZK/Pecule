// Montants : toujours des entiers en centimes, convertis seulement à la saisie et à l'affichage.

const EUROS = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const EUROS_ROUND = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** « 12 », « 12,5 », « 1 234,56 € », « 12.50 » → centimes ; null si la saisie n'est pas un montant positif */
export function parseEuros(input) {
  const text = String(input ?? '').replace(/[\s  €]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const cents = Math.round(Number(text) * 100);
  return cents > 0 ? cents : null;
}

/** 123456 → « 1 234,56 € » ; `round` retire les centimes */
export function formatEuros(cents, { round = false } = {}) {
  return (round ? EUROS_ROUND : EUROS).format(cents / 100);
}

/** Centimes → valeur d'un champ de saisie : 1250 → « 12,50 » */
export function toInput(cents) {
  return (cents / 100).toFixed(2).replace('.', ',');
}
