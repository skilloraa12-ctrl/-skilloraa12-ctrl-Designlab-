import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getModule, MODULES } from './modules.js'
import { LEVELS } from './levels.js'
import { useProgress } from './ProgressContext.jsx'
import Quiz from './Quiz.jsx'
import SketchPad from './SketchPad.jsx'
import AudioNarration from './AudioNarration.jsx'
import PresentationMode from './PresentationMode.jsx'

export default function Module() {
  const { id } = useParams()
  const module = getModule(id)
  const { completed, toggleModule, quizPassed, passQuiz, addPortfolioItem } = useProgress()
  const [sketchOpen, setSketchOpen] = useState(false)
  const [presentationOpen, setPresentationOpen] = useState(false)

  if (!module) return <Navigate to="/academy" replace />

  const done = !!completed[module.id]
  const testDone = !!quizPassed[module.id]
  const idx = MODULES.findIndex((m) => m.id === module.id)
  const prev = MODULES[idx - 1]
  const next = MODULES[idx + 1]

  return (
    <div>
      <Link to="/academy" className="back-link">← Уся академія</Link>
      <p className="eyebrow">{LEVELS[module.level].title} · Модуль {String(module.id).padStart(2, '0')}</p>

      <div className="module-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>{module.title}</h1>
        <button
          className={'complete-btn' + (done ? ' done' : '')}
          onClick={() => toggleModule(module.id)}
        >
          {done ? '✓ Пройдено' : 'Позначити пройденим'}
        </button>
      </div>

      {module.theory && <p className="module-theory">{module.theory}</p>}

      {module.theory && (
        <div className="module-media-row">
          <button className="harmony-btn" onClick={() => setPresentationOpen(true)}>
            🎬 Режим презентації (відео-урок)
          </button>
          <AudioNarration
            key={module.id}
            text={`${module.title}. ${module.theory} ${(module.keyPoints || []).join('. ')}`}
          />
          <a
            className="harmony-btn"
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(module.title + ' дизайн урок')}`}
            target="_blank"
            rel="noreferrer"
          >
            🎥 Знайти відео на YouTube
          </a>
        </div>
      )}

      {presentationOpen && (
        <PresentationMode module={module} onClose={() => setPresentationOpen(false)} />
      )}

      {module.keyPoints && module.keyPoints.length > 0 && (
        <div className="callout callout--points">
          <p className="eyebrow">КЛЮЧОВІ ПРИНЦИПИ</p>
          <ul className="callout-list">
            {module.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {module.mistakes && module.mistakes.length > 0 && (
        <div className="callout callout--mistakes">
          <p className="eyebrow" style={{ color: 'var(--coral)' }}>ТИПОВІ ПОМИЛКИ</p>
          <ul className="callout-list">
            {module.mistakes.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      <p className="eyebrow" style={{ marginTop: 28 }}>ТЕМИ МОДУЛЯ</p>
      <ul className="topic-list">
        {module.topics.map((t, i) => <li key={i}>{t}</li>)}
      </ul>

      {module.practice && (
        <div className="practice-box">
          <p className="eyebrow">ПРАКТИКА</p>
          <p>{module.practice}</p>

          {module.example && (
            <div className="example-block">
              <p className="eyebrow" style={{ marginTop: 16 }}>ПРИКЛАД ВИКОНАННЯ</p>
              <p className="example-text">{module.example}</p>
            </div>
          )}

          {module.tools && (module.tools.free.length > 0 || module.tools.paid.length > 0) && (
            <div className="tools-block">
              <p className="eyebrow" style={{ marginTop: 16 }}>ДЕ ВИКОНАТИ ЗАВДАННЯ</p>
              <div className="tools-row">
                {module.tools.free.map((t, i) => (
                  t.url
                    ? <a key={'f' + i} href={t.url} target="_blank" rel="noreferrer" className="tool-badge tool-badge--free">{t.name} · безкоштовно</a>
                    : <span key={'f' + i} className="tool-badge tool-badge--free">{t.name} · безкоштовно</span>
                ))}
                {module.tools.paid.map((t, i) => (
                  <a key={'p' + i} href={t.url} target="_blank" rel="noreferrer" className="tool-badge tool-badge--paid">{t.name} · платно</a>
                ))}
              </div>
            </div>
          )}

          {module.selfCheck && module.selfCheck.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 16 }}>ЯК ЗРОЗУМІТИ, ЩО ГОТОВО</p>
              <ul className="callout-list">
                {module.selfCheck.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="complete-btn" onClick={() => setSketchOpen(true)}>
              🖊 Створити ескіз у застосунку
            </button>
            <Link
              to="/portfolio"
              state={{ prefillTitle: module.title, prefillTags: [module.title] }}
              className="complete-btn"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              Додати виконану роботу в портфоліо →
            </Link>
          </div>

          {sketchOpen && (
            <SketchPad
              onClose={() => setSketchOpen(false)}
              onSave={(dataUrl) => {
                addPortfolioItem({
                  title: module.title + ' — ескіз',
                  desc: 'Створено у вбудованому Sketch Pad для практичного завдання цього модуля.',
                  tags: [module.title, 'sketch'],
                  image: dataUrl,
                })
                setSketchOpen(false)
              }}
            />
          )}
        </div>
      )}

      {module.quiz && (
        <>
          {testDone && (
            <p className="quiz-passed-note">✓ Тест уже пройдено — +20 XP нараховано.</p>
          )}
          <Quiz
            key={module.id}
            questions={module.quiz}
            onComplete={() => passQuiz(module.id)}
          />
        </>
      )}

      <div className="module-nav">
        {prev ? <Link to={`/module/${prev.id}`} className="link">← {prev.title}</Link> : <span />}
        {next ? <Link to={`/module/${next.id}`} className="link">{next.title} →</Link> : <span />}
      </div>
    </div>
  )
}
