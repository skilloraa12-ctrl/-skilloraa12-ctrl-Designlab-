import { useState, useEffect } from 'react'

export default function Quiz({ questions, onComplete }) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState(null)
  const [finished, setFinished] = useState(false)
  const [totalMistakes, setTotalMistakes] = useState(0)

  // Скидаємо весь стан тесту щоразу, коли змінюється набір питань
  // (тобто коли користувач перейшов на інший модуль).
  useEffect(() => {
    setStep(0)
    setSelected(null)
    setFinished(false)
    setTotalMistakes(0)
  }, [questions])

  if (!questions || questions.length === 0) return null

  const question = questions[step]
  const isCorrect = selected !== null && selected === question.correctAnswer
  const isLast = step === questions.length - 1

  function choose(optIndex) {
    if (isCorrect) return // після правильної відповіді вибір заблокований до кнопки "Далі"
    setSelected(optIndex)
    if (optIndex !== question.correctAnswer) {
      setTotalMistakes((n) => n + 1)
    }
  }

  function next() {
    if (isLast) {
      setFinished(true)
      if (onComplete) onComplete({ total: questions.length, mistakes: totalMistakes })
      return
    }
    setStep((s) => s + 1)
    setSelected(null)
  }

  function restart() {
    setStep(0)
    setSelected(null)
    setFinished(false)
    setTotalMistakes(0)
  }

  if (finished) {
    return (
      <div className="quiz">
        <p className="eyebrow" style={{ color: 'var(--coral)' }}>МІНІ-ТЕСТ</p>
        <div className="quiz-result">
          <div className="quiz-result__score">{questions.length}/{questions.length}</div>
          <p className="quiz-result__label">
            Тест пройдено{totalMistakes === 0 ? ' без жодної помилки' : ` (з ${totalMistakes} повторними спробами)`}.
          </p>
          <button className="complete-btn" onClick={restart}>Пройти ще раз</button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="quiz-head">
        <p className="eyebrow" style={{ color: 'var(--coral)', margin: 0 }}>МІНІ-ТЕСТ</p>
        <span className="quiz-progress">{step + 1} / {questions.length}</span>
      </div>

      <div className="quiz-question">
        <p className="quiz-question__text">{question.question}</p>
        <div className="quiz-options">
          {question.options.map((opt, oi) => {
            let cls = 'quiz-option'
            if (selected === oi && oi === question.correctAnswer) cls += ' quiz-option--correct'
            else if (selected === oi) cls += ' quiz-option--wrong'
            return (
              <button
                key={oi}
                className={cls}
                onClick={() => choose(oi)}
                disabled={isCorrect}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {selected !== null && !isCorrect && (
          <p className="quiz-hint">Не зовсім — спробуйте ще раз.</p>
        )}
      </div>

      <button className="pf-add-btn" onClick={next} disabled={!isCorrect}>
        {isLast ? 'Завершити тест' : 'Далі'}
      </button>
    </div>
  )
}
