const LETTERS = ['A', 'B', 'C', 'D'];

/** La question du jour : 4 réponses, une seule tentative, puis l'explication. `answer` = { choice, correct } une fois répondu */
export default function ChallengeQuestion({ question, answer, onChoose, busy = false, children }) {
  return (
    <>
      <h2 className="question">{question.q}</h2>
      <div className="choices">
        {question.choices.map((choice, i) => {
          const state = !answer ? '' : i === question.answer ? 'right' : i === answer.choice ? 'wrong' : 'dim';
          return (
            <button key={choice} className={`choice ${state}`} onClick={() => onChoose(i)} disabled={!!answer || busy} aria-pressed={answer?.choice === i}>
              <span className="letter">{LETTERS[i]}</span>{choice}
            </button>
          );
        })}
      </div>
      {answer && (
        <div className={`verdict ${answer.correct ? 'right' : 'wrong'}`} role="status">
          <strong>{answer.correct ? '✅ Bonne réponse !' : `❌ Raté : c'était « ${question.choices[question.answer]} ».`}</strong>
          <p>{question.explain}</p>
          {children}
        </div>
      )}
    </>
  );
}
