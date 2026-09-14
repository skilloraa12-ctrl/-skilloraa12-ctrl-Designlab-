import { LEVELS, LEVEL_ORDER } from '../data/levels.js'
import { MODULES } from '../data/modules.js'
import { useProgress } from '../context/ProgressContext.jsx'
import ProgressBar from '../components/ProgressBar.jsx'

export default function Progress() {
  const { completed, completedCount, total, xp, level, streak } = useProgress()

  return (
    <div>
      <h1 className="page-title">Прогрес</h1>
      <p className="page-sub">Реальний прогрес по всій програмі, збережений локально у вашому браузері.</p>

      <div className="grid-3">
        <div className="metric"><div className="num">{completedCount}/{total}</div><div className="lbl">Модулів пройдено</div></div>
        <div className="metric"><div className="num">{xp}</div><div className="lbl">XP · Рівень {level}</div></div>
        <div className="metric"><div className="num">{streak}</div><div className="lbl">Днів поспіль</div></div>
      </div>

      <div className="section-head"><h3>Прогрес по рівнях</h3></div>
      {LEVEL_ORDER.map((lv) => {
        const mods = MODULES.filter((m) => m.level === lv)
        if (mods.length === 0) return null
        const done = mods.filter((m) => completed[m.id]).length
        return <ProgressBar key={lv} label={`${lv} · ${LEVELS[lv].title}`} value={done} total={mods.length} />
      })}
    </div>
  )
}
