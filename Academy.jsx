import { MODULES } from '../data/modules.js'
import { LEVELS, LEVEL_ORDER } from '../data/levels.js'
import { useProgress } from '../context/ProgressContext.jsx'
import ModuleCard from '../components/ModuleCard.jsx'

export default function Academy() {
  const { completed } = useProgress()

  return (
    <div>
      <h1 className="page-title">Академія</h1>
      <p className="page-sub">Повна програма з 44 модулів, організована по 9 рівнях — від візуального сприйняття до кар'єри.</p>

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
