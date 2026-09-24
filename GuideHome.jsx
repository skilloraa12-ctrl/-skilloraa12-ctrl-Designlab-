import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GUIDE_CATEGORIES } from './data/guide/categories.js'
import { LESSONS, getLessonsByCategory, getLesson } from './data/guide/lessons.js'
import { useGuideProgress } from './guide/useGuideProgress.js'

export default function GuideHome() {
  const [query, setQuery] = useState('')
  const { completed, current } = useGuideProgress()

  const q = query.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (!q) return []
    return LESSONS.filter((l) => l.title.toLowerCase().includes(q) || l.category.toLowerCase().includes(q))
  }, [q])

  const currentLesson = current ? getLesson(current) : null

  return (
    <div>
      <h1 className="page-title">Довідник</h1>
      <p className="page-sub">Структуроване навчання дизайну — від основ до практики, з міні-тестами й прогресом. Як цьому навчитися?</p>

      <div className="search-box dict-search">
        <input
          placeholder="Що хочеш вивчити: колір, типографіка…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Пошук уроків"
        />
      </div>

      <div className="dict-quicklinks">
        <Link to="/dictionary" className="pf-filter-btn">Словник термінів →</Link>
      </div>

      {q ? (
        <>
          <div className="dict-section-title">Знайдено: {searchResults.length}</div>
          {searchResults.length === 0 && <div className="empty-state">Нічого не знайдено.</div>}
          <div className="guide-lesson-list">
            {searchResults.map((l) => (
              <Link key={l.id} to={`/guide/${l.category}/${l.id}`} className="guide-lesson-row">
                <span className={'guide-lesson-check' + (completed.includes(l.id) ? ' done' : '')}>{completed.includes(l.id) ? '✓' : ''}</span>
                <span className="guide-lesson-title">{l.title}</span>
                <span className="guide-lesson-arrow">→</span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {currentLesson && (
            <>
              <div className="dict-section-title">Продовжити навчання</div>
              <Link to={`/guide/${currentLesson.category}/${currentLesson.id}`} className="guide-continue-card">
                <div className="guide-continue-label">Останній урок</div>
                <div className="guide-continue-title">{currentLesson.title}</div>
              </Link>
            </>
          )}

          <div className="dict-section-title">Категорії</div>
          <div className="guide-cat-grid">
            {GUIDE_CATEGORIES.map((c) => {
              const lessons = getLessonsByCategory(c.id)
              const doneCount = lessons.filter((l) => completed.includes(l.id)).length
              const pct = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0
              return (
                <Link key={c.id} to={`/guide/${c.id}`} className="guide-cat-card">
                  <div className="guide-cat-title">{c.ua}</div>
                  <div className="guide-cat-en">{c.en}</div>
                  {lessons.length > 0 ? (
                    <>
                      <div className="guide-progress-bar"><div className="guide-progress-fill" style={{ width: `${pct}%` }} /></div>
                      <div className="guide-progress-label">{doneCount}/{lessons.length} уроків · {pct}%</div>
                    </>
                  ) : (
                    <span className="lab-card-badge">У розробці</span>
                  )}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
