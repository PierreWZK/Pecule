// Accès à PocketBase : comptes et données de l'utilisateur connecté.
// Les règles d'accès côté serveur garantissent que chacun ne lit et n'écrit que ses données.

import PocketBase from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_PB_URL ?? 'https://pecule-api.projectp.fr');
pb.autoCancellation(false);

const me = () => pb.authStore.record?.id;
// PocketBase stocke une date complète : midi UTC évite tout décalage de jour
const toPbDate = (day) => `${day} 12:00:00.000Z`;
const fromExpense = (r) => ({ id: r.id, amount: r.amount, date: r.date.slice(0, 10), category: r.category, note: r.note });

export async function signUp({ email, password, name }) {
  await pb.collection('users').create({ email, password, passwordConfirm: password, name });
  return signIn({ email, password });
}

export const signIn = ({ email, password }) => pb.collection('users').authWithPassword(email, password);
export const signOut = () => pb.authStore.clear();

/** Tout ce dont l'application a besoin, en une fois */
export async function loadAll() {
  const [expenses, budgets, goals, answers] = await Promise.all([
    pb.collection('expenses').getFullList({ sort: '-date,-created' }),
    pb.collection('budgets').getFullList(),
    pb.collection('goals').getFullList(),
    pb.collection('challenge_answers').getFullList({ sort: '-day' }),
  ]);
  return {
    expenses: expenses.map(fromExpense),
    budgets: budgets.map((b) => ({ id: b.id, category: b.category, amount: b.amount })),
    goal: goals[0] ?? null,
    answers: answers.map((a) => ({ id: a.id, day: a.day, question: a.question, choice: a.choice, correct: a.correct })),
  };
}

export async function saveExpense({ id, amount, date, category, note }) {
  const data = { amount, date: toPbDate(date), category, note: note ?? '' };
  const record = id
    ? await pb.collection('expenses').update(id, data)
    : await pb.collection('expenses').create({ ...data, user: me() });
  return fromExpense(record);
}

export const deleteExpense = (id) => pb.collection('expenses').delete(id);

export async function saveBudget({ id, category, amount }) {
  const r = id
    ? await pb.collection('budgets').update(id, { amount })
    : await pb.collection('budgets').create({ category, amount, user: me() });
  return { id: r.id, category: r.category, amount: r.amount };
}

export const deleteBudget = (id) => pb.collection('budgets').delete(id);

export function saveGoal(goal, { item, price, habit, habit_monthly }) {
  const data = { item, price, habit, habit_monthly };
  return goal ? pb.collection('goals').update(goal.id, data) : pb.collection('goals').create({ ...data, user: me() });
}

/** « Ignorer l'objectif » : retenu sur le compte (le SDK met à jour la session avec le compte modifié) */
export const skipGoal = () => pb.collection('users').update(me(), { goal_skipped: true });

/** Un nouvel objectif repart de zéro : on remplace l'ancien */
export async function restartGoal(goal, data) {
  if (goal) await pb.collection('goals').delete(goal.id);
  return saveGoal(null, data);
}

export async function saveAnswer({ day, question, choice, correct }) {
  const a = await pb.collection('challenge_answers').create({ day, question, choice, correct, user: me() });
  return { id: a.id, day: a.day, question: a.question, choice: a.choice, correct: a.correct };
}

/** Message d'erreur en français à partir d'une erreur PocketBase */
export function errorMessage(error) {
  const fields = error?.response?.data ?? {};
  if (fields.email?.code === 'validation_not_unique') return 'Un compte existe déjà avec cette adresse e-mail.';
  if (fields.email) return 'Adresse e-mail invalide.';
  if (fields.password) return 'Le mot de passe doit faire au moins 8 caractères.';
  if (error?.status === 400 && error?.url?.includes('auth-with-password')) return 'E-mail ou mot de passe incorrect.';
  if (error?.status === 0) return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  if (error?.status === 429) return 'Trop de tentatives, réessayez dans un instant.';
  return 'Une erreur est survenue. Réessayez.';
}
