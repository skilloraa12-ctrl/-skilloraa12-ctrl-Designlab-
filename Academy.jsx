import { Link } from 'react-router-dom'
import { DIRECTIONS } from './directions.js'
import { getSubcategoriesByLevel } from './subcategories.js'

export default function Academy() {
  return (
    <div>
      <h1 className="page-title">Академія</h1>
      <p className="page-sub">Навчання за напрямками дизайну — обери напрямок, щоб побачити його підкатегорії та уроки.</p>

      <div className="direction-grid">
        {DIRECTIONS.map((d) => {
          const hasContent = getSubcategoriesByLevel(d.id).length > 0
          return (
            <Link className="direction-card" key={d.id} to={`/academy/${d.id}`}>
              <span className="direction-emoji">{d.emoji}</span>
              <div>
                <div className="direction-name">{d.name}</div>
                <div className="direction-desc">{d.desc}</div>
                {!hasContent && <span className="lab-card-badge" style={{ marginTop: 6, display: 'inline-block' }}>У розробці</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
