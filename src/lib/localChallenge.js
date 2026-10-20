// Réponses au défi du jour sans compte : gardées dans le navigateur, puis reprises sur le compte à l'inscription.
// Le stockage peut être indisponible (navigation privée) : on joue quand même, sans mémoire.

const KEY = 'pecule:defi';

export function localAnswers() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLocalAnswer(answer) {
  const list = [answer, ...localAnswers().filter((a) => a.day !== answer.day)].slice(0, 60);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // stockage plein ou bloqué : la réponse reste affichée jusqu'au rechargement
  }
  return list;
}

export function clearLocalAnswers() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // rien à effacer
  }
}
