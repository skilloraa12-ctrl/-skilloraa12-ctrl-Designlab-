import { Link, useParams } from 'react-router-dom'
import { MODULES } from './modules.js'
import { DIRECTIONS } from './directions.js'
import { getSubcategoriesByLevel } from './subcategories.js'
import { useProgress } from './ProgressContext.jsx'
import NotFound from './NotFound.jsx'
import BrandingHome from './BrandingHome.jsx'
import MotionHome from './MotionHome.jsx'
import UXHome from './UXHome.jsx'
import GameArtHome from './GameArtHome.jsx'

export default function AcademyDirection() {
  const { direction: directionId } = useParams()
  const { completed } = useProgress()
  const direction = DIRECTIONS.find((d) => d.id === directionId)

  if (!direction) return <NotFound />

  const subcats = getSubcategoriesByLevel(direction.id)
  const allModsInDirection = MODULES.filter((m) => m.level === direction.id)
  const doneInDirection = allModsInDirection.filter((m) => completed[m.id]).length

  const lessonGrid = subcats.length === 0 ? (
    <div className="empty-state">Цей напрямок ще готується — скоро тут з'явиться повноцінна програма з підкатегоріями й уроками.</div>
  ) : (
    <div className="guide-cat-grid">
      {subcats.map((sc) => {
        const lessons = MODULES.filter((m) => m.subcategory === sc.id)
        const doneCount = lessons.filter((m) => completed[m.id]).length
        const pct = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0
        return (
          <Link key={sc.id} to={`/academy/${direction.id}/${sc.id}`} className="guide-cat-card">
            <div className="guide-cat-title">{sc.emoji} {sc.title}</div>
            <div className="guide-cat-en">{sc.desc}</div>
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
  )

  if (direction.id === 'branding') {
    return (
      <BrandingHome
        subcats={subcats}
        lessonGrid={lessonGrid}
        doneInDirection={doneInDirection}
        totalInDirection={allModsInDirection.length}
      />
    )
  }

  if (direction.id === 'motion-design') {
    return (
      <MotionHome
        subcats={subcats}
        lessonGrid={lessonGrid}
        doneInDirection={doneInDirection}
        totalInDirection={allModsInDirection.length}
      />
    )
  }

  if (direction.id === 'ux-design') {
    return (
      <UXHome
        subcats={subcats}
        lessonGrid={lessonGrid}
        doneInDirection={doneInDirection}
        totalInDirection={allModsInDirection.length}
      />
    )
  }

  if (direction.id === 'game-art') {
    return (
      <GameArtHome
        subcats={subcats}
        lessonGrid={lessonGrid}
        doneInDirection={doneInDirection}
        totalInDirection={allModsInDirection.length}
      />
    )
  }

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/academy">Академія</Link> <span>→</span> <span>{direction.name}</span>
      </div>
      <h1 className="page-title">{direction.emoji} {direction.name}</h1>
      <p className="page-sub">{direction.desc}</p>

      {subcats.length === 0 ? lessonGrid : (
        <>
          <p className="page-sub" style={{ marginTop: -8 }}>{doneInDirection}/{allModsInDirection.length} уроків пройдено</p>
          {lessonGrid}
        </>
      )}
    </div>
  )
}
