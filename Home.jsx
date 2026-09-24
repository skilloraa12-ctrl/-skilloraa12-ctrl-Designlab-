import { Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { DIRECTIONS } from './directions.js'

const HUB = [
  { to: '/dictionary', title: 'Словник', desc: 'Що означає термін?' },
  { to: '/guide', title: 'Довідник', desc: 'Як навчитися / як це працює?' },
  { to: '/cheatsheets', title: 'Шпаргалки', desc: 'Як швидко згадати потрібне?' },
  { to: '/tools', title: 'Інструменти', desc: 'Чим це зробити?' },
  { to: '/portfolio', title: 'Портфоліо', desc: 'Що я створила?' },
]

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
        <h3>Довідка</h3>
      </div>
      <div className="guide-cat-grid" style={{ marginBottom: 30 }}>
        {HUB.map((h) =>
          h.soon ? (
            <div key={h.title} className="guide-cat-card" style={{ cursor: 'default' }}>
              <div className="guide-cat-title">{h.title}</div>
              <div className="guide-cat-en">{h.desc}</div>
              <span className="lab-card-badge">У розробці</span>
            </div>
          ) : (
            <Link key={h.title} to={h.to} className="guide-cat-card">
              <div className="guide-cat-title">{h.title}</div>
              <div className="guide-cat-en">{h.desc}</div>
            </Link>
          )
        )}
      </div>

      <div className="section-head">
        <h3>Напрямки дизайну</h3>
      </div>
      <div className="direction-grid">
        {DIRECTIONS.map((d) =>
          d.id === 'web-design' ? (
            <Link className="direction-card" key={d.id} to="/academy/web-design">
              <span className="direction-emoji">{d.emoji}</span>
              <div>
                <div className="direction-name">{d.name}</div>
                <div className="direction-desc">{d.desc}</div>
              </div>
            </Link>
          ) : (
            <div className="direction-card" key={d.id} style={{ cursor: 'default' }}>
              <span className="direction-emoji">{d.emoji}</span>
              <div>
                <div className="direction-name">{d.name}</div>
                <div className="direction-desc">{d.desc}</div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
