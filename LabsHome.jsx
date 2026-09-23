import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LABS, LAB_CATEGORIES } from './labs/registry.js'
import { useLabFavorites } from './labs/useLabFavorites.js'
import { useLabRecent } from './labs/useLabRecent.js'

const SORTS = [
  { id: 'az', label: 'A–Z' },
  { id: 'recent', label: 'Recently Used' },
  { id: 'favorites', label: 'Favorites' },
]

export default function LabsHome() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('az')
  const { toggle: toggleFavorite, isFavorite } = useLabFavorites('lab')
  const { items: recentIds } = useLabRecent('lab')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = LABS.filter((lab) => {
      if (category !== 'all' && lab.category !== category) return false
      if (!q) return true
      return (
        lab.title.toLowerCase().includes(q) ||
        lab.desc.toLowerCase().includes(q) ||
        lab.category.toLowerCase().includes(q)
      )
    })
    if (sort === 'az') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    } else if (sort === 'favorites') {
      list = [...list].sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)))
    } else if (sort === 'recent') {
      list = [...list].sort((a, b) => {
        const ai = recentIds.indexOf(a.id), bi = recentIds.indexOf(b.id)
        if (ai === -1 && bi === -1) return a.title.localeCompare(b.title)
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
    }
    return list
  }, [query, category, sort, recentIds, isFavorite])

  const availableCount = LABS.filter((l) => l.status === 'available').length

  return (
    <div>
      <h1 className="page-title">🧪 Design Labs</h1>
      <p className="page-sub">
        Експериментуй. Створюй. Перевіряй. Експортуй — прямо тут. Зараз повністю працює {availableCount} з {LABS.length} лабораторій, решта в розробці й буде додаватись поступово.
      </p>

      <div className="search-box lab-search">
        <input
          placeholder="Пошук: radius, палітра, grid, контраст…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Пошук Labs"
        />
      </div>

      <div className="lab-filter-row" role="group" aria-label="Категорії">
        <button className={'pf-filter-btn' + (category === 'all' ? ' active' : '')} onClick={() => setCategory('all')}>All</button>
        {LAB_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={'pf-filter-btn' + (category === c.id ? ' active' : '')}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="lab-sort-row" role="group" aria-label="Сортування">
        {SORTS.map((s) => (
          <button
            key={s.id}
            className={'harmony-btn' + (sort === s.id ? ' active' : '')}
            onClick={() => setSort(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">Нічого не знайдено за запитом «{query}».</div>
      ) : (
        <div className="lab-card-grid">
          {filtered.map((lab) => (
            <LabCard key={lab.id} lab={lab} favorite={isFavorite(lab.id)} onToggleFavorite={() => toggleFavorite(lab.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function LabCard({ lab, favorite, onToggleFavorite }) {
  const isAvailable = lab.status === 'available'
  const body = (
    <>
      <div className="lab-card-top">
        <span className="lab-card-icon" aria-hidden="true">{lab.icon}</span>
        {isAvailable ? (
          <button
            type="button"
            className="lab-card-fav"
            onClick={(e) => { e.preventDefault(); onToggleFavorite() }}
            aria-label={favorite ? 'Прибрати з обраного' : 'Додати в обране'}
            aria-pressed={favorite}
          >
            {favorite ? '★' : '☆'}
          </button>
        ) : (
          <span className="lab-card-badge">Незабаром</span>
        )}
      </div>
      <div className="lab-card-title">{lab.title}</div>
      <p className="lab-card-desc">{lab.desc}</p>
      <div className="lab-card-meta">{lab.tools}+ інструментів</div>
      {isAvailable && <span className="lab-card-open">Open Lab →</span>}
    </>
  )
  return isAvailable ? (
    <Link to={lab.route} className="lab-card lab-card--available">{body}</Link>
  ) : (
    <div className="lab-card lab-card--soon" aria-disabled="true">{body}</div>
  )
}
