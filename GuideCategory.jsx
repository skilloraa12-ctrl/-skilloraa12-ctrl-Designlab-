import { Link, useParams } from 'react-router-dom'
import { getGuideCategory } from './data/guide/categories.js'
import { getLessonsByCategory } from './data/guide/lessons.js'
import { useGuideProgress } from './guide/useGuideProgress.js'
import NotFound from './NotFound.jsx'

export default function GuideCategory() {
  const { category: categoryId } = useParams()
  const category = getGuideCategory(categoryId)
  const { completed } = useGuideProgress()

  if (!category) return <NotFound />

  const lessons = getLessonsByCategory(categoryId)

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/guide">Довідник</Link> <span>→</span> <span>{category.ua}</span>
      </div>
      <h1 className="page-title">{category.ua}</h1>
      <p className="page-sub">{category.en}</p>

      <div className="dict-section-title">Теми напрямку</div>
      <div className="guide-topics-row">
        {category.topics.map((t) => <span key={t} className="dict-tag">{t}</span>)}
      </div>

      <div className="dict-section-title">Уроки</div>
      {lessons.length === 0 ? (
        <div className="empty-state">Уроки цього напрямку ще готуються — скоро тут з'явиться повноцінна програма.</div>
      ) : (
        <div className="guide-lesson-list">
          {lessons.map((l, i) => {
            const done = completed.includes(l.id)
            return (
              <Link key={l.id} to={`/guide/${category.id}/${l.id}`} className="guide-lesson-row">
                <span className={'guide-lesson-check' + (done ? ' done' : '')}>{done ? '✓' : i + 1}</span>
                <span className="guide-lesson-title">{l.title}</span>
                <span className="guide-lesson-arrow">→</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
