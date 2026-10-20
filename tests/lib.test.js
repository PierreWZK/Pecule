import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatEuros, parseEuros, toInput } from '../src/lib/money.js';
import { daysInMonth, monthsBetween, shiftMonth } from '../src/lib/dates.js';
import { byCategory, cumulative, monthlyAverages, monthlyTotals, summary } from '../src/lib/stats.js';
import { crossing, level } from '../src/lib/budgets.js';
import { accelerators, monthsNeeded, progress } from '../src/lib/goal.js';
import { questionOf, streak } from '../src/lib/challenge.js';
import { QUESTIONS } from '../src/lib/questions.js';

const e = (amount, date, category = 'courses') => ({ amount, date, category });

test('montants : saisie en centimes, refus des valeurs invalides', () => {
  assert.equal(parseEuros('12'), 1200);
  assert.equal(parseEuros('12,5'), 1250);
  assert.equal(parseEuros('1 234,56 €'), 123456);
  assert.equal(parseEuros('0,10'), 10);
  assert.equal(parseEuros('12.345'), null);
  assert.equal(parseEuros('-5'), null);
  assert.equal(parseEuros('0'), null);
  assert.equal(parseEuros('abc'), null);
  assert.equal(toInput(1250), '12,50');
  assert.match(formatEuros(123456), /1\s234,56\s€/);
});

test('dates : mois décalés, durée des mois, mois entiers écoulés', () => {
  assert.equal(shiftMonth('2026-11', 3), '2027-02');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(daysInMonth('2028-02'), 29);
  assert.equal(monthsBetween('2026-01-15', '2026-03-14'), 1);
  assert.equal(monthsBetween('2026-01-15', '2026-03-15'), 2);
});

test('stats : totaux par catégorie, par mois, résumé et cumul', () => {
  const list = [e(1000, '2026-10-02'), e(500, '2026-10-05', 'restaurants'), e(2500, '2026-10-20', 'restaurants'), e(2000, '2026-09-10')];
  assert.deepEqual(byCategory(list.slice(0, 3)), [{ category: 'restaurants', amount: 3000 }, { category: 'courses', amount: 1000 }]);
  assert.deepEqual(monthlyTotals(list, '2026-10', 2), [{ month: '2026-09', amount: 2000 }, { month: '2026-10', amount: 4000 }]);
  const s = summary(list, '2026-10', '2026-10-20');
  assert.equal(s.amount, 4000);
  assert.equal(s.diff, 2000);
  assert.equal(s.percent, 100);
  assert.equal(s.perDay, 200);
  assert.equal(s.biggest.amount, 2500);
  const rows = cumulative(list, '2026-10', 20);
  assert.equal(rows[4].current, 1500);
  assert.equal(rows[19].current, 4000);
  assert.equal(rows[20].current, null);
  assert.equal(rows[29].previous, 2000);
});

test('stats : moyennes mensuelles sur les mois complets précédents', () => {
  const list = [e(3000, '2026-08-01', 'restaurants'), e(1000, '2026-09-01', 'restaurants'), e(9900, '2026-10-01', 'restaurants')];
  assert.deepEqual(monthlyAverages(list, '2026-10'), [{ category: 'restaurants', amount: 2000 }]);
  assert.deepEqual(monthlyAverages([e(700, '2026-10-01')], '2026-10'), [{ category: 'courses', amount: 700 }]);
});

test('budgets : niveaux et seuil franchi', () => {
  assert.equal(level(7900, 10000), 'ok');
  assert.equal(level(8000, 10000), 'warn');
  assert.equal(level(10001, 10000), 'over');
  assert.equal(crossing(7000, 8500, 10000), 'warn');
  assert.equal(crossing(9000, 10500, 10000), 'over');
  assert.equal(crossing(8500, 9000, 10000), null);
});

test('objectif : 549 € à 44 €/mois = 13 mois, progression et accélérateurs', () => {
  assert.equal(monthsNeeded(54900, 4400), 13);
  const goal = { price: 54900, habit_monthly: 4400, created: '2026-07-20 10:00:00.000Z' };
  const p = progress(goal, '2026-10-20');
  assert.equal(p.elapsed, 3);
  assert.equal(p.saved, 13200);
  assert.equal(p.remainingMonths, 10);
  const acc = accelerators(goal, [{ category: 'restaurants', amount: 20000 }, { category: 'courses', amount: 100 }], '2026-10-20');
  assert.equal(acc.length, 1);
  assert.equal(acc[0].extra, 6000);
  assert.equal(acc[0].months, 5);
  assert.equal(acc[0].gain, 5);
  assert.equal(progress({ ...goal, created: '2025-01-01' }, '2026-10-20').done, true);
});

test('défi : questions valides, même question pour tous, série', () => {
  const ids = new Set();
  for (const q of QUESTIONS) {
    assert.equal(q.choices.length, 4, q.id);
    assert.ok(q.answer >= 0 && q.answer < 4, q.id);
    assert.ok(!ids.has(q.id), q.id);
    ids.add(q.id);
  }
  assert.equal(questionOf('2026-10-20').id, questionOf('2026-10-20').id);
  // 30 jours de suite : 30 questions différentes
  const month = Array.from({ length: QUESTIONS.length }, (_, i) => questionOf(new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10)).id);
  assert.equal(new Set(month).size, QUESTIONS.length);
  assert.equal(streak(['2026-10-18', '2026-10-19', '2026-10-20'], '2026-10-20'), 3);
  assert.equal(streak(['2026-10-18', '2026-10-19'], '2026-10-20'), 2);
  assert.equal(streak(['2026-10-17'], '2026-10-20'), 0);
});

test('exemples : JSON valide, coût mensuel, recherche sans accents', async () => {
  const { EXAMPLES, findExample, monthlyCost, searchExamples } = await import('../src/lib/examples.js');
  const { CATEGORIES } = await import('../src/lib/categories.js');
  const ids = new Set(CATEGORIES.map((c) => c.id));
  assert.ok(EXAMPLES.length >= 80);
  for (const e of EXAMPLES) {
    assert.ok(ids.has(e.category), e.label);
    assert.ok(Number.isInteger(e.amount) && e.amount > 0, e.label);
  }
  assert.equal(monthlyCost(findExample('netflix')), 1349);
  assert.equal(monthlyCost(findExample('Café au comptoir')), 4400);
  assert.equal(monthlyCost(findExample('Concert')), null);
  assert.equal(searchExamples('telephone')[0].label, 'Forfait téléphone');
  assert.ok(searchExamples('', { habitsOnly: true, limit: 200 }).every((e) => e.per !== 'achat'));
});

test('objectif : habitudes tirées des dépenses des 90 derniers jours', async () => {
  const { habitsFromExpenses } = await import('../src/lib/goal.js');
  const list = [
    { amount: 1349, date: '2026-10-01', category: 'abonnements', note: 'Netflix' },
    { amount: 1349, date: '2026-09-01', category: 'abonnements', note: 'netflix' },
    { amount: 1349, date: '2026-08-01', category: 'abonnements', note: 'Netflix ' },
    { amount: 9000, date: '2026-10-10', category: 'courses', note: '' },
    { amount: 99999, date: '2026-01-01', category: 'shopping', note: 'Trop vieux' },
  ];
  const habits = habitsFromExpenses(list, '2026-10-20');
  assert.deepEqual(habits.map((h) => [h.label, h.monthly, h.count]), [['Courses', 3000, 1], ['Netflix', 1349, 3]]);
});
