import { useState } from 'react';
import { errorMessage, saveAnswer } from '../api.js';
import { questionOf, streak } from '../lib/challenge.js';
import { dayLabel } from '../lib/dates.js';
import { QUESTIONS } from '../lib/questions.js';

const LETTERS = ['A', 'B', 'C', 'D'];

/** Le défi du jour : une question, une seule tentative, puis l'explication */
export default function Challenge({ data, today, update, notify }) {
  const question = questionOf(today);
  const answer = data.answers.find((a) => a.day === today);
  const [busy, setBusy] = useState(false);
  const series = streak(data.answers.map((a) => a.day), today);
  const rate = data.answers.length ? Math.round((data.answers.filter((a) => a.correct).length / data.answers.length) * 100) : null;
  const past = data.answers.filter((a) => a.day !== today).slice(0, 7);

  async function choose(choice) {
    if (answer || busy) return;
    setBusy(true);
    try {
      const saved = await saveAnswer({ day: today, question: question.id, choice, correct: choice === question.answer });
      update((d) => ({ answers: [saved, ...d.answers] }));
    } catch (err) {
      notify(errorMessage(err), 'over');
    }
    setBusy(false);
  }

  return (
    <>
      <div className="page-head">
        <h1>Défi du jour</h1>
        <p className="muted">{dayLabel(today)} · la même question pour tout le monde</p>
      </div>

      <section className="kpis three">
        <div className="card kpi"><span className="muted">Série</span><strong>🔥 {series}</strong><span className="muted small">jour{series > 1 ? 's' : ''} d'affilée</span></div>
        <div className="card kpi"><span className="muted">Bonnes réponses</span><strong>{rate === null ? '—' : `${rate} %`}</strong><span className="muted small">sur {data.answers.length} défi{data.answers.length > 1 ? 's' : ''}</span></div>
        <div className="card kpi"><span className="muted">Prochaine question</span><strong>Demain</strong><span className="muted small">à minuit, heure de Paris</span></div>
      </section>

      <section className="card challenge">
        <h2>{question.q}</h2>
        <div className="choices">
          {question.choices.map((choice, i) => {
            const state = !answer ? '' : i === question.answer ? 'right' : i === answer.choice ? 'wrong' : 'dim';
            return (
              <button key={choice} className={`choice ${state}`} onClick={() => choose(i)} disabled={!!answer || busy} aria-pressed={answer?.choice === i}>
                <span className="letter">{LETTERS[i]}</span>{choice}
              </button>
            );
          })}
        </div>
        {answer && (
          <div className={`verdict ${answer.correct ? 'right' : 'wrong'}`} role="status">
            <strong>{answer.correct ? '✅ Bonne réponse !' : `❌ Raté : c'était « ${question.choices[question.answer]} ».`}</strong>
            <p>{question.explain}</p>
            <p className="muted small">Revenez demain pour garder votre série.</p>
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="card">
          <h2>Vos derniers défis</h2>
          <ul className="history">
            {past.map((a) => (
              <li key={a.id}>
                <span>{a.correct ? '✅' : '❌'}</span>
                <span className="muted small">{dayLabel(a.day)}</span>
                <span>{QUESTIONS.find((q) => q.id === a.question)?.q ?? 'Question retirée'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
