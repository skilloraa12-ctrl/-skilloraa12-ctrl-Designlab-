import { Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { MODULES } from './modules.js'
import ModuleCard from './ModuleCard.jsx'

export default function Home() {
  const { completed, completedCount, total, xp, level, portfolio } = useProgress()
  const nextModule = MODULES.find((m) => !completed[m.id]) || MODULES[0]
  const upNext = MODULES.filter((m) => !completed[m.id]).slice(0, 4)

  return (
    <div>
      <h1 className="page-title">Головна</h1>
      <p className="page-sub">Ласкаво просимо до вашої академії. Продовжуйте з того місця, де зупинились.</p>

      <div className="hero">
        <div>
          <p className="eyebrow" style={{ color: 'var(--accent)' }}>ПРОДОВЖИТИ НАВЧАННЯ</p>
          <h2>{nextModule.title}</h2>
          <p>{nextModule.topics.slice(0, 3).join(' · ')}</p>
        </div>
        <Link to={`/module/${nextModule.id}`} className="hero-cta">Відкрити модуль</Link>
      </div>

      <div className="grid-3">
        <div className="metric"><div className="num">{completedCount}/{total}</div><div className="lbl">Модулів пройдено</div></div>
        <div className="metric"><div className="num">{xp}</div><div className="lbl">XP · Рівень {level}</div></div>
        <div className="metric"><div className="num">{portfolio.length}</div><div className="lbl">Проєктів у портфоліо</div></div>
      </div>

      <div className="section-head">
        <h3>Рекомендовані модулі</h3>
        <Link to="/academy" className="link">Уся академія →</Link>
      </div>
      {upNext.map((m) => <ModuleCard key={m.id} module={m} />)}
    </div>
  )
}
