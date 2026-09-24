import { Link } from 'react-router-dom'
import { MODULES } from './modules.js'
import { LEVELS, LEVEL_ORDER } from './levels.js'
import { getSubcategoriesByLevel } from './subcategories.js'
import { useProgress } from './ProgressContext.jsx'

export default function Academy() {
  const { completed } = useProgress()

  if (LEVEL_ORDER.length === 0) {
    return (
      <div>
        <h1 className="page-title">Академія</h1>
        <p className="page-sub">Уроки за напрямками дизайну (Web Design, UI Design, Game Design та інші) готуються — скоро тут з'явиться нова програма.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Академія</h1>
      <p className="page-sub">Навчання за напрямками дизайну — Web Design уже доступний, інші напрямки (UI Design, UX Design, Game Design та інші) додаються далі.</p>

      {LEVEL_ORDER.map((lv) => {
        const subcats = getSubcategoriesByLevel(lv)
        if (subcats.length === 0) return null
        const allModsInLevel = MODULES.filter((m) => m.level === lv)
        const doneInLevel = allModsInLevel.filter((m) => completed[m.id]).length
        return (
          <div className="level-group" key={lv}>
            <div className="level-title">
              {LEVELS[lv].title} · {LEVELS[lv].ua} · {doneInLevel}/{allModsInLevel.length} уроків пройдено
            </div>
            <div className="guide-cat-grid">
              {subcats.map((sc) => {
                const lessons = MODULES.filter((m) => m.subcategory === sc.id)
                const doneCount = lessons.filter((m) => completed[m.id]).length
                const pct = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0
                return (
                  <Link key={sc.id} to={`/academy/${sc.id}`} className="guide-cat-card">
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
          </div>
        )
      })}
    </div>
  )
}
