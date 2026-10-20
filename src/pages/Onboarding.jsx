import { useState } from 'react';
import { errorMessage, restartGoal, saveGoal } from '../api.js';
import { HABITS, monthsNeeded } from '../lib/goal.js';
import { monthLabel, shiftMonth, todayKey, monthOf } from '../lib/dates.js';
import { formatEuros, parseEuros, toInput } from '../lib/money.js';
import Logo from '../components/Logo.jsx';

/** L'objectif, en trois étapes : l'objet, l'habitude à arrêter, le résultat */
export default function Onboarding({ user, goal, onDone, onSkip }) {
  const custom = goal && !HABITS.some((h) => h.label === goal.habit);
  const [step, setStep] = useState(1);
  const [item, setItem] = useState(goal?.item ?? '');
  const [price, setPrice] = useState(goal ? toInput(goal.price) : '');
  const [habitId, setHabitId] = useState(goal ? (custom ? 'autre' : HABITS.find((h) => h.label === goal.habit).id) : '');
  const [customLabel, setCustomLabel] = useState(custom ? goal.habit : '');
  const [monthly, setMonthly] = useState(goal ? toInput(goal.habit_monthly) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const priceCents = parseEuros(price);
  const monthlyCents = parseEuros(monthly);
  const habit = habitId === 'autre' ? customLabel.trim() : HABITS.find((h) => h.id === habitId)?.label;
  const months = priceCents && monthlyCents ? monthsNeeded(priceCents, monthlyCents) : null;

  function pickHabit(h) {
    setHabitId(h.id);
    if (h.monthly) setMonthly(toInput(h.monthly));
  }

  function next(e) {
    e.preventDefault();
    setError('');
    if (step === 1 && (!item.trim() || !priceCents)) return setError('Indiquez l\'objet et son prix (par exemple 549 ou 549,99).');
    if (step === 2 && (!habit || !monthlyCents)) return setError('Choisissez une habitude et son coût par mois.');
    setStep(step + 1);
  }

  async function save() {
    setBusy(true);
    setError('');
    const data = { item: item.trim(), price: priceCents, habit, habit_monthly: monthlyCents };
    try {
      // Un autre objet, c'est un nouvel objectif : la progression repart de zéro
      const saved = goal && goal.item !== data.item ? await restartGoal(goal, data) : await saveGoal(goal, data);
      onDone(saved);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

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
              <button type="button" className="btn ghost" onClick={onSkip}>{goal ? 'Annuler' : 'Plus tard'}</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={next} className="form">
            <h1>Quelle dépense seriez-vous prêt à arrêter ?</h1>
            <p className="lead">Chaque mois, cet argent ira à « {item} ».</p>
            <div className="habits" role="radiogroup" aria-label="Habitude à arrêter">
              {HABITS.map((h) => (
                <button type="button" role="radio" aria-checked={habitId === h.id} key={h.id} className={`habit ${habitId === h.id ? 'active' : ''}`} onClick={() => pickHabit(h)}>
                  <strong>{h.label}</strong>
                  <span className="muted">{h.hint} · ≈ {formatEuros(h.monthly, { round: true })}/mois</span>
                </button>
              ))}
              <button type="button" role="radio" aria-checked={habitId === 'autre'} className={`habit ${habitId === 'autre' ? 'active' : ''}`} onClick={() => setHabitId('autre')}>
                <strong>Autre chose</strong><span className="muted">À vous de dire</span>
              </button>
            </div>
            {habitId === 'autre' && (
              <label>L'habitude
                <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Les jeux mobiles, le taxi…" maxLength={80} autoFocus />
              </label>
            )}
            {habitId && (
              <label>Ce qu'elle vous coûte par mois
                <div className="input-euro"><input inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="44" /><span>€</span></div>
              </label>
            )}
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
              En arrêtant <strong>{habit.charAt(0).toLowerCase() + habit.slice(1)}</strong> ({formatEuros(monthlyCents)} par mois),
              vous mettez de côté {formatEuros(priceCents)} d'ici <strong>{monthLabel(shiftMonth(monthOf(todayKey()), months))}</strong>.
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
