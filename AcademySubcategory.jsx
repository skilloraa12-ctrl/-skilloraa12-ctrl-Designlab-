import { Link, useParams } from 'react-router-dom'
import { getSubcategory } from './subcategories.js'
import { MODULES } from './modules.js'
import ModuleCard from './ModuleCard.jsx'
import NotFound from './NotFound.jsx'

export default function AcademySubcategory() {
  const { subcategory: subcategoryId } = useParams()
  const subcategory = getSubcategory(subcategoryId)

  if (!subcategory) return <NotFound />

  const lessons = MODULES.filter((m) => m.subcategory === subcategory.id)

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/academy">Академія</Link> <span>→</span> <span>{subcategory.title}</span>
      </div>
      <h1 className="page-title">{subcategory.emoji} {subcategory.title}</h1>
      <p className="page-sub">{subcategory.desc}</p>

      <div className="dict-section-title">Уроки</div>
      {lessons.length === 0 ? (
        <div className="empty-state">Уроки цього модуля ще готуються — скоро тут з'явиться повноцінна програма.</div>
      ) : (
        <div className="guide-lesson-list">
          {lessons.map((m) => <ModuleCard key={m.id} module={m} />)}
        </div>
      )}
    </div>
  )
}
