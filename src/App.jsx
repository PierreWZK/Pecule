import { useCallback, useEffect, useState } from 'react';
import { loadAll, pb, saveAnswer, signOut } from './api.js';
import { clearLocalAnswers, localAnswers } from './lib/localChallenge.js';
import { todayKey } from './lib/dates.js';
import Nav from './components/Nav.jsx';
import Toast from './components/Toast.jsx';
import Footer from './components/Footer.jsx';
import Landing from './pages/Landing.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Expenses from './pages/Expenses.jsx';
import Budgets from './pages/Budgets.jsx';
import Challenge from './pages/Challenge.jsx';

const PAGES = { '': Dashboard, depenses: Expenses, budgets: Budgets, defi: Challenge };

/** Les défis joués sans compte rejoignent le compte (sauf les jours déjà joués dessus) : la série continue */
async function importLocalAnswers(data) {
  const known = new Set(data.answers.map((a) => a.day));
  const added = [];
  for (const a of localAnswers().filter((a) => !known.has(a.day))) {
    try {
      added.push(await saveAnswer(a));
    } catch {
      // réponse refusée (déjà enregistrée ailleurs) : on l'ignore
    }
  }
  clearLocalAnswers();
  return added.length ? { ...data, answers: [...added, ...data.answers].sort((a, b) => b.day.localeCompare(a.day)) } : data;
}

// Navigation par l'ancre de l'adresse : #/, #/depenses, #/budgets, #/defi, #/objectif
function useRoute() {
  const read = () => location.hash.replace(/^#\/?/, '');
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onHash = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export default function App() {
  const route = useRoute();
  const [user, setUser] = useState(pb.authStore.isValid ? pb.authStore.record : null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [skipGoal, setSkipGoal] = useState(false);
  const today = todayKey();

  useEffect(() => pb.authStore.onChange((_, record) => setUser(pb.authStore.isValid ? record : null)), []);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setData(await importLocalAnswers(await loadAll()));
    } catch (e) {
      // Session expirée ou révoquée : retour à l'accueil
      if (e?.status === 401 || e?.status === 403) signOut();
      else setError('Impossible de charger vos données. Vérifiez votre connexion.');
    }
  }, []);

  useEffect(() => {
    setData(null);
    if (user) reload();
  }, [user?.id, reload]);

  const notify = useCallback((message, tone = 'info') => setToast({ message, tone, key: Date.now() }), []);
  const closeToast = useCallback(() => setToast(null), []);
  const update = useCallback((fn) => setData((d) => ({ ...d, ...fn(d) })), []);

  if (!user) return <Landing />;

  if (error) {
    return (
      <main className="center">
        <p>{error}</p>
        <button className="btn" onClick={reload}>Réessayer</button>
      </main>
    );
  }
  if (!data) return <main className="center"><p className="muted">Chargement de votre pécule…</p></main>;

  const editingGoal = route === 'objectif';
  if ((!data.goal && !skipGoal) || editingGoal) {
    return (
      <Onboarding
        user={user}
        goal={data.goal}
        onDone={(goal) => {
          update(() => ({ goal }));
          setSkipGoal(true);
          if (editingGoal) location.hash = '#/';
        }}
        onSkip={() => {
          setSkipGoal(true);
          if (editingGoal) location.hash = '#/';
        }}
      />
    );
  }

  const Page = PAGES[route] ?? Dashboard;
  return (
    <>
      <Nav route={route} user={user} />
      <main className="page">
        <Page data={data} today={today} update={update} notify={notify} />
      </main>
      <Footer />
      {toast && <Toast key={toast.key} {...toast} onClose={closeToast} />}
    </>
  );
}
