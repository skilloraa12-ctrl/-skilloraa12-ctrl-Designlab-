import { MODULES } from './modules.js'
import { LEVELS, LEVEL_ORDER } from './levels.js'
import { useProgress } from './ProgressContext.jsx'
import ModuleCard from './ModuleCard.jsx'

export default function Academy() {
  const { completed } = useProgress()

  if (MODULES.length === 0) {
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
        const mods = MODULES.filter((m) => m.level === lv)
        if (mods.length === 0) return null
        const doneInLevel = mods.filter((m) => completed[m.id]).length
        return (
          <div className="level-group" key={lv}>
            <div className="level-title">
              <span className="n">{lv}</span>
              {LEVELS[lv].title} · {LEVELS[lv].ua} · {doneInLevel}/{mods.length}
            </div>
            {mods.map((m) => <ModuleCard key={m.id} module={m} />)}
          </div>
        )
      })}
    </div>
  )
}
