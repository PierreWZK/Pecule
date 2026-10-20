import { useState } from 'react';
import { errorMessage, signIn, signUp } from '../api.js';
import Logo from '../components/Logo.jsx';
import Footer from '../components/Footer.jsx';
import ChallengeQuestion from '../components/ChallengeQuestion.jsx';
import GoalCard from '../components/GoalCard.jsx';
import BudgetBar from '../components/BudgetBar.jsx';
import { CategoryDonut } from '../components/Charts.jsx';
import { DRAFT_KEY } from './Onboarding.jsx';
import { category } from '../lib/categories.js';
import { questionOf, streak } from '../lib/challenge.js';
import { dayLabel, monthLabel, monthOf, shiftMonth, todayKey } from '../lib/dates.js';
import { HABITS, monthsNeeded } from '../lib/goal.js';
import { localAnswers, saveLocalAnswer } from '../lib/localChallenge.js';
import { formatEuros, parseEuros } from '../lib/money.js';
import { byCategory, inMonth, total } from '../lib/stats.js';

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const STEPS = [
  ['🎯', 'Choisissez un objectif', 'L\'objet dont vous rêvez, et l\'habitude que vous êtes prêt à lâcher pour l\'avoir. Pécule calcule quand il est payé.'],
  ['✍️', 'Notez vos dépenses', 'Trois secondes par dépense : un montant, une catégorie. Fixez un plafond par catégorie si vous voulez.'],
  ['📈', 'Voyez où part l\'argent', 'Graphiques du mois, comparaison avec le mois dernier, alertes de budget, et des pistes pour arriver plus vite à votre objectif.'],
];

const FAQ = [
  ['C\'est gratuit ?', 'Oui. Pécule est un projet du défi « 30 jours, 30 projets » : pas d\'abonnement, pas de publicité.'],
  ['Faut-il connecter sa banque ?', 'Non, et ce n\'est pas possible : vous notez vous-même vos dépenses. Pécule ne connaît ni votre banque ni vos numéros de compte.'],
  ['Qui voit mes données ?', 'Vous seul. Chaque dépense, budget ou objectif est lié à votre compte, et le serveur refuse toute lecture par quelqu\'un d\'autre.'],
  ['Et le défi du jour, sans compte ?', 'Il se joue librement : votre réponse est gardée sur cet appareil. Si vous créez un compte ensuite, vos défis le rejoignent et votre série continue.'],
];

/** Données d'exemple pour l'aperçu du tableau de bord, calées sur le mois en cours */
function sample(today) {
  const month = monthOf(today);
  const day = (m, d) => `${shiftMonth(month, m)}-${String(d).padStart(2, '0')}`;
  const expenses = [];
  for (const m of [-3, -2, -1, 0]) {
    expenses.push(
      { amount: 32000, date: day(m, 3), category: 'courses' },
      { amount: 18000, date: day(m, 8), category: 'restaurants' },
      { amount: 9000, date: day(m, 12), category: 'transport' },
      { amount: 6500, date: day(m, 15), category: 'loisirs' },
      { amount: 2800, date: day(m, 2), category: 'abonnements' },
    );
  }
  const goal = { item: 'Un vélo électrique', price: 129900, habit: 'La livraison de repas', habit_monthly: 21600, created: `${day(-2, 1)} 10:00:00.000Z` };
  const current = inMonth(expenses, month);
  return { expenses, goal, current };
}

/** Simulateur : l'objet, son prix, l'habitude à arrêter → le nombre de mois */
function Simulator({ onCreate }) {
  const [item, setItem] = useState('Une console de jeux');
  const [price, setPrice] = useState('549');
  const [habitId, setHabitId] = useState('cafe');
  const habit = HABITS.find((h) => h.id === habitId);
  const cents = parseEuros(price);
  const months = cents ? monthsNeeded(cents, habit.monthly) : null;
  const today = todayKey();

  function create() {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ item: item.trim() || 'Mon objectif', price: cents, habitId, monthly: habit.monthly }));
    } catch {
      // stockage indisponible : l'objectif se resaisira après l'inscription
    }
    onCreate();
  }

  return (
    <section className="card simulator" aria-labelledby="simu-title">
      <p className="eyebrow">Essayez, sans compte</p>
      <h2 id="simu-title">Quand pourrez-vous vous l'offrir ?</h2>
      <div className="simu-fields">
        <label>Je veux m'offrir
          <input value={item} onChange={(e) => setItem(e.target.value)} maxLength={80} />
        </label>
        <label>qui coûte
          <div className="input-euro"><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /><span>€</span></div>
        </label>
      </div>
      <p className="simu-label">en arrêtant…</p>
      <div className="chips" role="radiogroup" aria-label="Habitude à arrêter">
        {HABITS.map((h) => (
          <button key={h.id} type="button" role="radio" aria-checked={h.id === habitId} className={`chip ${h.id === habitId ? 'active' : ''}`} onClick={() => setHabitId(h.id)}>
            {h.label.replace(/^(Le |La |Les |Un )/, '')}
          </button>
        ))}
      </div>
      <div className="simu-result" aria-live="polite">
        {months ? (
          <>
            <span className="muted">soit {formatEuros(habit.monthly, { round: true })} de côté par mois ({habit.hint})</span>
            <strong>dans <em>{months} mois</em></strong>
            <span>en {monthLabel(shiftMonth(monthOf(today), months))}</span>
          </>
        ) : (
          <span className="muted">Indiquez un prix, par exemple 549.</span>
        )}
      </div>
      <button className="btn wide" onClick={create} disabled={!months}>Créer mon compte avec cet objectif</button>
    </section>
  );
}

/** Le défi du jour, jouable sans compte : la réponse est gardée sur l'appareil */
function GuestChallenge({ onSignup }) {
  const today = todayKey();
  const question = questionOf(today);
  const [answers, setAnswers] = useState(localAnswers);
  const answer = answers.find((a) => a.day === today);
  const series = streak(answers.map((a) => a.day), today);

  function choose(choice) {
    if (answer) return;
    setAnswers(saveLocalAnswer({ day: today, question: question.id, choice, correct: choice === question.answer }));
  }

  return (
    <div className="card challenge">
      <div className="challenge-meta">
        <span className="muted small">{dayLabel(today)} · la même question pour tout le monde</span>
        {series > 0 && <span className="streak">🔥 {series} jour{series > 1 ? 's' : ''}</span>}
      </div>
      <ChallengeQuestion question={question} answer={answer} onChoose={choose}>
        <p className="small">
          Nouvelle question demain à minuit.{' '}
          <button className="link" onClick={onSignup}>Créez un compte</button> pour garder votre série sur tous vos appareils.
        </p>
      </ChallengeQuestion>
    </div>
  );
}

function AuthCard({ mode, setMode }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await (signup ? signUp(form) : signIn(form));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="card auth">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={signup} className={signup ? 'active' : ''} onClick={() => setMode('signup')}>Créer un compte</button>
        <button role="tab" aria-selected={!signup} className={!signup ? 'active' : ''} onClick={() => setMode('signin')}>Se connecter</button>
      </div>
      <form onSubmit={submit} className="form">
        {signup && (
          <label><span>Prénom <span className="muted">(facultatif)</span></span>
            <input value={form.name} onChange={set('name')} autoComplete="given-name" maxLength={60} />
          </label>
        )}
        <label>Adresse e-mail
          <input type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </label>
        <label><span>Mot de passe {signup && <span className="muted">(8 caractères minimum)</span>}</span>
          <input type="password" required minLength={8} value={form.password} onChange={set('password')} autoComplete={signup ? 'new-password' : 'current-password'} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? '…' : signup ? 'Créer mon pécule' : 'Me connecter'}</button>
      </form>
    </div>
  );
}

export default function Landing() {
  const [mode, setMode] = useState('signup');
  const today = todayKey();
  const demo = sample(today);
  const openAuth = (m) => {
    setMode(m);
    scrollTo('compte');
  };

  return (
    <div className="landing">
      <header className="nav">
        <span className="brand"><Logo />Pécule</span>
        <nav className="landing-links" aria-label="Sections">
          <button onClick={() => scrollTo('comment')}>Comment ça marche</button>
          <button onClick={() => scrollTo('defi')}>Défi du jour</button>
          <button onClick={() => scrollTo('apercu')}>Aperçu</button>
        </nav>
        <div className="nav-user">
          <button className="btn ghost small" onClick={() => openAuth('signin')}>Se connecter</button>
          <button className="btn small" onClick={() => openAuth('signup')}>Créer un compte</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-text">
            <p className="eyebrow">Dépenses · Budgets · Objectif</p>
            <h1>Où passe votre argent, <em>en un coup d'œil.</em></h1>
            <p className="lead">
              Pécule est un carnet de dépenses qui vous donne une raison de tenir : dites ce que vous voulez vous offrir,
              l'habitude que vous êtes prêt à lâcher, et regardez l'objet se rapprocher mois après mois.
            </p>
            <div className="row">
              <button className="btn" onClick={() => openAuth('signup')}>Créer mon pécule</button>
              <button className="btn ghost" onClick={() => scrollTo('defi')}>🔥 Jouer au défi du jour</button>
            </div>
            <ul className="trust">
              <li>✓ Gratuit</li>
              <li>✓ Sans connexion bancaire</li>
              <li>✓ Vos données restent privées</li>
            </ul>
          </div>
          <Simulator onCreate={() => openAuth('signup')} />
        </section>

        <section className="band" id="comment">
          <div className="section-head">
            <p className="eyebrow">Comment ça marche</p>
            <h2>Trois étapes, deux minutes par jour</h2>
          </div>
          <ol className="steps">
            {STEPS.map(([emoji, title, text], i) => (
              <li key={title} className="card step">
                <span className="step-num">{i + 1}</span>
                <span className="step-emoji" aria-hidden="true">{emoji}</span>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="band split" id="defi">
          <div className="section-head">
            <p className="eyebrow">Défi du jour</p>
            <h2>Une question de finances perso par jour</h2>
            <p className="lead">
              Intérêts composés, soldes, abonnements : une question courte, la même pour tout le monde, une seule tentative.
              Répondez chaque jour pour faire grimper votre série 🔥.
            </p>
            <p className="muted">Pas besoin de compte pour jouer : votre réponse reste sur cet appareil, et rejoint votre compte si vous en créez un.</p>
          </div>
          <GuestChallenge onSignup={() => openAuth('signup')} />
        </section>

        <section className="band" id="apercu">
          <div className="section-head">
            <p className="eyebrow">Aperçu</p>
            <h2>Votre tableau de bord</h2>
            <p className="muted">Un exemple avec des données fictives : un vélo électrique financé en arrêtant la livraison de repas.</p>
          </div>
          <div className="preview" aria-label="Exemple de tableau de bord avec des données fictives">
            <div className="preview-tag">Exemple</div>
            <div className="grid-2">
              <GoalCard goal={demo.goal} expenses={demo.expenses} today={today} />
              <section className="card">
                <h2>Par catégorie</h2>
                <CategoryDonut rows={byCategory(demo.current)} total={total(demo.current)} />
              </section>
            </div>
            <section className="card">
              <h2>Budgets du mois</h2>
              <div className="preview-budgets">
                <BudgetBar cat={category('courses')} spent={32000} limit={35000} />
                <BudgetBar cat={category('restaurants')} spent={18000} limit={15000} />
                <BudgetBar cat={category('loisirs')} spent={6500} limit={12000} />
              </div>
            </section>
          </div>
        </section>

        <section className="band split" id="compte">
          <div className="section-head">
            <p className="eyebrow">C'est parti</p>
            <h2>{mode === 'signup' ? 'Créez votre pécule' : 'Bon retour !'}</h2>
            <ul className="benefits">
              <li>🎯 Votre objectif et sa date d'arrivée, recalculés chaque mois</li>
              <li>📊 Vos dépenses par catégorie, sur six mois</li>
              <li>🚦 Une alerte dès qu'un budget déborde</li>
              <li>🔥 Votre série du défi du jour, sur tous vos appareils</li>
            </ul>
          </div>
          <AuthCard mode={mode} setMode={setMode} />
        </section>

        <section className="band faq" aria-labelledby="faq-title">
          <h2 id="faq-title">Questions fréquentes</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} className="card">
              <summary>{q}</summary>
              <p className="muted">{a}</p>
            </details>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
