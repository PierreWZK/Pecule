// Exemples de dépenses courantes (src/data/expense-examples.json) : suggestions de saisie et habitudes à arrêter

import data from '../data/expense-examples.json' with { type: 'json' };

export const EXAMPLES = data.examples;

// Nombre de fois par mois selon la fréquence
const PER_MONTH = { mois: 1, semaine: 52 / 12, jour: 30, ouvre: 22, an: 1 / 12 };
export const PER_LABEL = { mois: 'par mois', semaine: 'par semaine', jour: 'par jour', ouvre: 'par jour de travail', an: 'par an', achat: 'l\'achat' };

/** Coût mensuel d'un exemple (centimes), ou null pour une dépense ponctuelle */
export function monthlyCost(example) {
  const factor = PER_MONTH[example.per];
  return factor ? Math.round(example.amount * factor) : null;
}

export const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** L'exemple qui porte exactement ce nom (sans tenir compte des accents ni de la casse) */
export function findExample(label) {
  const key = normalize(label);
  return key ? EXAMPLES.find((e) => normalize(e.label) === key) ?? null : null;
}

/** Recherche dans les exemples ; `habitsOnly` écarte les achats ponctuels */
export function searchExamples(query, { limit = 8, habitsOnly = false } = {}) {
  const key = normalize(query);
  return EXAMPLES.filter((e) => (!habitsOnly || e.per !== 'achat') && (!key || normalize(e.label).includes(key))).slice(0, limit);
}
