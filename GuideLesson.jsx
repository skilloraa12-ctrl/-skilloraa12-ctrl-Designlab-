import { useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getGuideCategory } from './data/guide/categories.js'
import { getLesson } from './data/guide/lessons.js'
import { getTerm } from './data/dictionary/terms.js'
import { useGuideProgress } from './guide/useGuideProgress.js'
import Quiz from './Quiz.jsx'
import NotFound from './NotFound.jsx'

function VisualExample({ visual }) {
  if (!visual) return null
  return (
    <div className="dict-field">
      <div className="dict-field-label">Візуальний приклад</div>
      <p className="dict-field-value">{visual.description}</p>
      {visual.swatches && (
        <div className="guide-swatch-row">
          {visual.swatches.map((hex, i) => (
            <div key={i} className="guide-swatch" style={{ background: hex }}>
              <span>{hex}</span>
            </div>
          ))}
        </div>
      )}
      {visual.typeSamples && (
        <div className="guide-type-samples">
          {visual.typeSamples.map((s, i) => (
            <div key={i} className="guide-type-sample">
              <div className="guide-type-sample-label">{s.label}</div>
              <div style={s.style}>{s.text || s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GuideLesson() {
  const { category: categoryId, lesson: lessonId } = useParams()
  const navigate = useNavigate()
  const category = getGuideCategory(categoryId)
  const lesson = getLesson(lessonId)
  const { completed, markComplete, isComplete, visitLesson } = useGuideProgress()

  useEffect(() => {
    if (lesson) visitLesson(lesson.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id])

  if (!category || !lesson || lesson.category !== categoryId) return <NotFound />

  const done = isComplete(lesson.id)
  const keyTerms = lesson.keyTerms.map((id) => getTerm(id)).filter(Boolean)
  const related = lesson.relatedLessons.map((id) => getLesson(id)).filter(Boolean)
  const nextLesson = lesson.next ? getLesson(lesson.next) : null

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/guide">Довідник</Link> <span>→</span>{' '}
        <Link to={`/guide/${category.id}`}>{category.ua}</Link> <span>→</span> <span>{lesson.title}</span>
      </div>

      <div className="dict-term-head">
        <h1 className="page-title dict-term-title">{lesson.title}</h1>
        <button
          type="button"
          className={'pf-add-btn' + (done ? ' active' : '')}
          onClick={() => markComplete(lesson.id)}
        >
          {done ? '✓ Вивчено' : '✓ Позначити як вивчене'}
        </button>
      </div>

      <div className="dict-field">
        <div className="dict-field-label">Що ти вивчиш</div>
        <ul className="guide-bullet-list">
          {lesson.whatYouWillLearn.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      </div>

      <div className="dict-field">
        <div className="dict-field-label">Пояснення</div>
        {lesson.explanation.map((p, i) => <p key={i} className="dict-field-value" style={{ marginBottom: 10 }}>{p}</p>)}
      </div>

      {keyTerms.length > 0 && (
        <div className="dict-field">
          <div className="dict-field-label">Основні терміни</div>
          <div className="dict-related-row">
            {keyTerms.map((t) => (
              <Link key={t.id} to={`/dictionary/${t.category}/${t.id}`} className="dict-related-chip">
                {t.en} <span className="dict-related-ua">{t.ua}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <VisualExample visual={lesson.visualExample} />

      <div className="dict-field">
        <div className="dict-field-label">Практичний приклад</div>
        <p className="dict-field-value">{lesson.practicalExample}</p>
      </div>

      <div className="dict-field">
        <div className="dict-field-label">Типові помилки</div>
        <ul className="guide-bullet-list">
          {lesson.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </div>

      <div className="practice-box">
        <p className="eyebrow">Практичне завдання</p>
        <p>{lesson.exercise}</p>
      </div>

      <div className="dict-section-title">Міні-тест</div>
      <Quiz key={lesson.id} questions={lesson.quiz} onComplete={() => markComplete(lesson.id)} />

      {related.length > 0 && (
        <div className="dict-field" style={{ marginTop: 30 }}>
          <div className="dict-field-label">Пов'язані теми</div>
          <div className="dict-related-row">
            {related.map((r) => (
              <Link key={r.id} to={`/guide/${r.category}/${r.id}`} className="dict-related-chip">{r.title}</Link>
            ))}
          </div>
        </div>
      )}

      {nextLesson && (
        <button type="button" className="save-btn" onClick={() => navigate(`/guide/${nextLesson.category}/${nextLesson.id}`)}>
          Перейти далі: {nextLesson.title} →
        </button>
      )}
    </div>
  )
}
