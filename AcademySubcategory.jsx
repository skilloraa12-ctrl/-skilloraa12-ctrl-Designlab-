import { Link, useParams } from 'react-router-dom'
import { getSubcategory } from './subcategories.js'
import { DIRECTIONS } from './directions.js'
import { MODULES } from './modules.js'
import ModuleCard from './ModuleCard.jsx'
import NotFound from './NotFound.jsx'

export default function AcademySubcategory() {
  const { direction: directionId, subcategory: subcategoryId } = useParams()
  const direction = DIRECTIONS.find((d) => d.id === directionId)
  const subcategory = getSubcategory(subcategoryId)

  if (!direction || !subcategory || subcategory.level !== direction.id) return <NotFound />

  const lessons = MODULES.filter((m) => m.subcategory === subcategory.id)

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/academy">Академія</Link> <span>→</span>{' '}
        <Link to={`/academy/${direction.id}`}>{direction.name}</Link> <span>→</span>{' '}
        <span>{subcategory.title}</span>
      </div>
      <h1 className="page-title">{subcategory.emoji} {subcategory.title}</h1>
      <p className="page-sub">{subcategory.desc}</p>

      <div className="dict-section-title">Уроки</div>
      {lessons.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: 14 }}>Повноцінні уроки цієї підкатегорії ще пишуться. Ось теми, які до неї увійдуть:</p>
          {subcategory.topics && subcategory.topics.length > 0 && (
            <ul className="topic-list" style={{ textAlign: 'left', maxWidth: 480, margin: '0 auto' }}>
              {subcategory.topics.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
        </div>
      ) : (
        <div className="guide-lesson-list">
          {lessons.map((m) => <ModuleCard key={m.id} module={m} />)}
        </div>
      )}
    </div>
  )
}
