import { DIRECTIONS } from './directions.js'

export default function Home() {
  return (
    <div>
      <h1 className="page-title">Головна</h1>
      <p className="page-sub">Обери напрямок дизайну, який тебе цікавить.</p>

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
