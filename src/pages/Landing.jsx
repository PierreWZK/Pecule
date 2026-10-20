import { useState } from 'react';
import { errorMessage, signIn, signUp } from '../api.js';
import Logo from '../components/Logo.jsx';

const FEATURES = [
  ['🎯', 'Un objectif qui motive', 'Dites ce que vous voulez vous offrir et l\'habitude que vous êtes prêt à lâcher : Pécule calcule quand l\'objet est à vous.'],
  ['📊', 'Où part l\'argent', 'Répartition par catégorie, évolution sur six mois, comparaison avec le mois dernier.'],
  ['🚦', 'Des budgets qui préviennent', 'Une jauge par catégorie, une alerte dès que ça déborde.'],
  ['🔥', 'Le défi du jour', 'Une question de finances perso par jour, la même pour tout le monde. Gardez votre série.'],
];

export default function Landing() {
  const [mode, setMode] = useState('signup');
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
    <div className="landing">
      <header className="nav">
        <span className="brand"><Logo />Pécule</span>
      </header>
      <main className="hero">
        <section className="hero-text">
          <p className="eyebrow">Dépenses · Budgets · Objectif</p>
          <h1>Où passe votre argent, <em>en un coup d'œil.</em></h1>
          <p className="lead">
            Notez vos dépenses, fixez vos budgets, et voyez en combien de mois l'objet dont vous rêvez est payé,
            rien qu'en arrêtant une petite habitude.
          </p>
          <ul className="features">
            {FEATURES.map(([emoji, title, text]) => (
              <li key={title}>
                <span className="feature-emoji" aria-hidden="true">{emoji}</span>
                <div><strong>{title}</strong><p>{text}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card auth" aria-labelledby="auth-title">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={signup} className={signup ? 'active' : ''} onClick={() => setMode('signup')}>Créer un compte</button>
            <button role="tab" aria-selected={!signup} className={!signup ? 'active' : ''} onClick={() => setMode('signin')}>Se connecter</button>
          </div>
          <h2 id="auth-title" className="sr-only">{signup ? 'Créer un compte' : 'Se connecter'}</h2>
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
          <p className="muted small">Vos données restent privées : vous seul y avez accès. Aucune connexion bancaire.</p>
        </section>
      </main>
      <footer className="footer">
        Pécule · jour 07 du défi <a href="https://projectp.fr/">30 jours, 30 projets</a> ·{' '}
        <a href="https://github.com/PierreWZK/Pecule">code source</a>
      </footer>
    </div>
  );
}
