import { useState } from 'react';
import { errorMessage, restartGoal, saveGoal } from '../api.js';
import { HABITS, habitsFromExpenses, monthsNeeded } from '../lib/goal.js';
import { category } from '../lib/categories.js';
import { monthLabel, shiftMonth, monthOf } from '../lib/dates.js';
import { PER_LABEL, monthlyCost, searchExamples } from '../lib/examples.js';
import { formatEuros, parseEuros, toInput } from '../lib/money.js';
import Logo from '../components/Logo.jsx';

export const DRAFT_KEY = 'pecule:objectif';

/** Objectif essayé dans le simulateur de l'accueil, avant l'inscription */
function draftGoal() {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null');
    return d && HABITS.some((h) => h.id === d.habitId) ? d : null;
  } catch {
    return null;
  }
}

/** Une habitude proposée : bouton qui remplit le nom et le coût mensuel */
function HabitOption({ active, title, detail, onPick }) {
  return (
    <button type="button" role="radio" aria-checked={active} className={`habit ${active ? 'active' : ''}`} onClick={onPick}>
      <strong>{title}</strong>
      <span className="muted">{detail}</span>
    </button>
  );
}

/**
 * L'objectif, en trois étapes : l'objet, l'habitude à arrêter, le résultat.
 * `firstTime` : juste après l'inscription, on peut ignorer l'objectif (retenu sur le compte).
 */
export default function Onboarding({ user, goal, expenses, today, firstTime, onDone, onCancel, onIgnore }) {
  const draft = goal ? null : draftGoal();
  const start = goal ?? (draft && { item: draft.item, price: draft.price, habit: HABITS.find((h) => h.id === draft.habitId).label, habit_monthly: draft.monthly });
  const [step, setStep] = useState(draft ? 3 : 1);
  const [item, setItem] = useState(start?.item ?? '');
  const [price, setPrice] = useState(start ? toInput(start.price) : '');
  const [habit, setHabit] = useState(start?.habit ?? '');
  const [monthly, setMonthly] = useState(start ? toInput(start.habit_monthly) : '');
  const [picked, setPicked] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const priceCents = parseEuros(price);
  const monthlyCents = parseEuros(monthly);
  const months = priceCents && monthlyCents ? monthsNeeded(priceCents, monthlyCents) : null;
  const mine = habitsFromExpenses(expenses, today);
  const found = query.trim() ? searchExamples(query, { habitsOnly: true, limit: 6 }) : [];

  function pick(key, label, cents) {
    setPicked(key);
    setHabit(label);
    setMonthly(toInput(cents));
    setError('');
  }

  function next(e) {
    e.preventDefault();
    setError('');
    if (step === 1 && (!item.trim() || !priceCents)) return setError('Indiquez l\'objet et son prix (par exemple 549 ou 549,99).');
    if (step === 2 && (!habit.trim() || !monthlyCents)) return setError('Choisissez une habitude (ou écrivez-la) et son coût par mois.');
    setStep(step + 1);
  }

  async function save() {
    setBusy(true);
    setError('');
    const data = { item: item.trim(), price: priceCents, habit: habit.trim(), habit_monthly: monthlyCents };
    try {
      // Un autre objet, c'est un nouvel objectif : la progression repart de zéro
      const saved = goal && goal.item !== data.item ? await restartGoal(goal, data) : await saveGoal(goal, data);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // stockage indisponible : rien à effacer
      }
      onDone(saved);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const lower = (text) => text.charAt(0).toLowerCase() + text.slice(1);

  return (
    <div className="onboarding">
      <header className="nav"><span className="brand"><Logo />Pécule</span></header>
      <main className="card wizard">
        <p className="eyebrow">Étape {step} sur 3</p>

        {step === 1 && (
          <form onSubmit={next} className="form">
            <h1>{goal ? 'Votre objectif' : `Bienvenue${user.name ? `, ${user.name}` : ''} !`}</h1>
            <p className="lead">Quel objet aimeriez-vous vous offrir ?</p>
            <label>L'objet
              <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Une console, un vélo, un week-end à Rome…" maxLength={80} autoFocus />
            </label>
            <label>Son prix
              <div className="input-euro"><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="549" /><span>€</span></div>
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="row">
              <button className="btn">Continuer</button>
              {firstTime && !goal
                ? <button type="button" className="btn ghost" onClick={onIgnore}>Ignorer l'objectif</button>
                : <button type="button" className="btn ghost" onClick={onCancel}>Annuler</button>}
            </div>
            {firstTime && !goal && <p className="muted small">Vous pourrez en choisir un plus tard depuis le tableau de bord.</p>}
          </form>
        )}

        {step === 2 && (
          <form onSubmit={next} className="form">
            <h1>Quelle dépense seriez-vous prêt à arrêter ?</h1>
            <p className="lead">Chaque mois, cet argent ira à « {item} ».</p>

            {mine.length > 0 && (
              <fieldset className="habit-group">
                <legend>Dans vos dépenses <span className="muted">(moyenne des 3 derniers mois)</span></legend>
                <div className="habits" role="radiogroup" aria-label="Vos dépenses">
                  {mine.map((h) => (
                    <HabitOption key={h.label} active={picked === `mine:${h.label}`} title={`${category(h.category).emoji} ${h.label}`}
                      detail={`${h.count} dépense${h.count > 1 ? 's' : ''} · ≈ ${formatEuros(h.monthly, { round: true })}/mois`}
                      onPick={() => pick(`mine:${h.label}`, h.label, h.monthly)} />
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="habit-group">
              <legend>Les idées les plus courantes</legend>
              <div className="habits" role="radiogroup" aria-label="Idées courantes">
                {HABITS.map((h) => (
                  <HabitOption key={h.id} active={picked === `idee:${h.id}`} title={h.label}
                    detail={`${h.hint} · ≈ ${formatEuros(h.monthly, { round: true })}/mois`}
                    onPick={() => pick(`idee:${h.id}`, h.label, h.monthly)} />
                ))}
              </div>
            </fieldset>

            <fieldset className="habit-group">
              <legend>Ou cherchez parmi les dépenses courantes</legend>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Netflix, forfait téléphone, taxi, paris sportifs…" aria-label="Chercher une dépense courante" />
              {found.length > 0 && (
                <div className="habits" role="radiogroup" aria-label="Résultats de la recherche">
                  {found.map((ex) => (
                    <HabitOption key={ex.label} active={picked === `ex:${ex.label}`} title={`${category(ex.category).emoji} ${ex.label}`}
                      detail={`${formatEuros(ex.amount)} ${PER_LABEL[ex.per]} · ≈ ${formatEuros(monthlyCost(ex), { round: true })}/mois`}
                      onPick={() => pick(`ex:${ex.label}`, ex.label, monthlyCost(ex))} />
                  ))}
                </div>
              )}
              {query.trim() && found.length === 0 && <p className="muted small">Aucun exemple : écrivez simplement votre habitude ci-dessous.</p>}
            </fieldset>

            <div className="habit-final">
              <label>L'habitude à arrêter
                <input value={habit} onChange={(e) => { setHabit(e.target.value); setPicked(''); }} placeholder="Choisissez ci-dessus ou écrivez-la" maxLength={80} />
              </label>
              <label>Ce qu'elle vous coûte par mois
                <div className="input-euro"><input inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="44" /><span>€</span></div>
              </label>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="row">
              <button className="btn">Voir le résultat</button>
              <button type="button" className="btn ghost" onClick={() => setStep(1)}>Retour</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="form result">
            <h1>
              {item} dans <span className="big">{months} mois</span>
            </h1>
            <p className="lead">
              En arrêtant <strong>{lower(habit.trim())}</strong> ({formatEuros(monthlyCents)} par mois),
              vous mettez de côté {formatEuros(priceCents)} d'ici <strong>{monthLabel(shiftMonth(monthOf(today), months))}</strong>.
            </p>
            {months > 12 && <p className="muted">Un peu long ? Sur le tableau de bord, Pécule vous montrera où gagner quelques mois, d'après vos vraies dépenses.</p>}
            {error && <p className="error" role="alert">{error}</p>}
            <div className="row">
              <button className="btn" onClick={save} disabled={busy}>{busy ? '…' : 'C\'est parti'}</button>
              <button type="button" className="btn ghost" onClick={() => setStep(2)}>Retour</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
