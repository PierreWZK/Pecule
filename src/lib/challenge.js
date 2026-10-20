// Le défi du jour : une question tirée d'après la date, la même pour tout le monde.

import { dayNumber, todayKey } from './dates.js';
import { QUESTIONS } from './questions.js';

/** Ordre fixe et mélangé des questions (mélange déterministe), parcouru jour après jour */
function order(n) {
  const list = Array.from({ length: n }, (_, i) => i);
  let seed = 7;
  for (let i = n - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const j = seed % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const ORDER = order(QUESTIONS.length);

export function questionOf(day = todayKey()) {
  return QUESTIONS[ORDER[dayNumber(day) % ORDER.length]];
}

/** Série : jours d'affilée avec une réponse, jusqu'à aujourd'hui (ou hier si on n'a pas encore joué) */
export function streak(days, today = todayKey()) {
  const played = new Set(days);
  let d = dayNumber(today);
  if (!played.has(today)) d -= 1;
  let count = 0;
  const key = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
  while (played.has(key(d))) {
    count += 1;
    d -= 1;
  }
  return count;
}
