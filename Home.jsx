import { useProgress } from './ProgressContext.jsx'
import { DIRECTIONS } from './directions.js'

export default function Home() {
  const { xp, unlocked, completedCount } = useProgress()

  return (
    <div>
      <div className="home-logo">DESIGNLAB UA</div>
      <h1 className="page-title" style={{ marginBottom: 8 }}>Від першої лінії — до дизайну.</h1>
      <p className="page-sub">
        Українська навчальна платформа дизайну: теорія, приклади, практичні завдання — і власний темп навчання.
      </p>

      <div className="home-stats">
        <span>🔥 {xp} XP</span>
        <span>⭐ {unlocked.length} досягнень</span>
        <span>✅ {completedCount} модулів пройдено</span>
      </div>

      <div className="section-head">
        <h3>Напрямки дизайну</h3>
      </div>
      <div className="direction-grid">
        {DIRECTIONS.map((d) => (
          <div className="direction-card" key={d.name}>
            <span className="direction-emoji">{d.emoji}</span>
            <div>
              <div className="direction-name">{d.name}</div>
              <div className="direction-desc">{d.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
