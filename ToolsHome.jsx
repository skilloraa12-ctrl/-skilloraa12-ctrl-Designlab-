import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TOOLS_CATEGORIES } from './data/tools/categories.js'
import { TOOLS, getTool } from './data/tools/tools.js'
import { useToolsFavorites } from './tools/useToolsFavorites.js'
import { useToolsRecent } from './tools/useToolsRecent.js'
import ToolCard, { PRICING_LABELS } from './tools/ToolCard.jsx'

const PRICING_TYPES = ['free', 'open-source', 'freemium', 'paid', 'one-time']
const PLATFORMS = ['web', 'windows', 'macos', 'ios', 'android']
const PLATFORM_LABELS = { web: 'Web', windows: 'Windows', macos: 'macOS', ios: 'iOS', android: 'Android' }

function matchesQuery(tool, q) {
  return (
    tool.name.toLowerCase().includes(q) ||
    tool.type.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.purpose.toLowerCase().includes(q)
  )
}

export default function ToolsHome() {
  const [query, setQuery] = useState('')
  const [pricing, setPricing] = useState(null)
  const [platform, setPlatform] = useState(null)
  const [aiOnly, setAiOnly] = useState(false)
  const [panel, setPanel] = useState(null) // null | 'favorites' | 'recent'

  const { ids: favoriteIds, toggle: toggleFavorite, isFavorite } = useToolsFavorites()
  const { ids: recentIds } = useToolsRecent()

  const q = query.trim().toLowerCase()
  const browsing = q.length > 0 || pricing || platform || aiOnly || panel

  const results = useMemo(() => {
    if (panel === 'favorites') return favoriteIds.map(getTool).filter(Boolean)
    if (panel === 'recent') return recentIds.map(getTool).filter(Boolean)
    let list = TOOLS
    if (q) list = list.filter((t) => matchesQuery(t, q))
    if (pricing) list = list.filter((t) => t.pricing === pricing)
    if (platform) list = list.filter((t) => t.platforms.includes(platform))
    if (aiOnly) list = list.filter((t) => t.ai)
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [q, pricing, platform, aiOnly, panel, favoriteIds, recentIds])

  function resetFilters() {
    setQuery(''); setPricing(null); setPlatform(null); setAiOnly(false); setPanel(null)
  }

  return (
    <div>
      <h1 className="page-title">Інструменти</h1>
      <p className="page-sub">Каталог реальних сервісів і програм, якими можна виконати роботу — {TOOLS.length} інструментів у {TOOLS_CATEGORIES.length} напрямках. Чим це зробити?</p>

      <div className="search-box dict-search">
        <input
          placeholder="Знайти інструмент: Figma, безкоштовний логотип, 3D…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPanel(null) }}
          aria-label="Пошук інструментів"
        />
      </div>

      <div className="dict-quicklinks">
        <button type="button" className={'pf-filter-btn' + (panel === 'favorites' ? ' active' : '')} onClick={() => setPanel(panel === 'favorites' ? null : 'favorites')}>
          ♥ Мої інструменти ({favoriteIds.length})
        </button>
        <button type="button" className={'pf-filter-btn' + (panel === 'recent' ? ' active' : '')} onClick={() => setPanel(panel === 'recent' ? null : 'recent')}>
          🕐 Нещодавні ({recentIds.length})
        </button>
        {browsing && <button type="button" className="pf-filter-btn" onClick={resetFilters}>✕ Скинути</button>}
      </div>

      {!panel && (
        <>
          <div className="dict-filter-row" role="group" aria-label="Ціна">
            <span className="dict-filter-label">Ціна:</span>
            {PRICING_TYPES.map((p) => (
              <button key={p} type="button" className={'pf-filter-btn' + (pricing === p ? ' active' : '')} onClick={() => setPricing(pricing === p ? null : p)}>
                {PRICING_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="dict-filter-row" role="group" aria-label="Платформа">
            <span className="dict-filter-label">Платформа:</span>
            {PLATFORMS.map((p) => (
              <button key={p} type="button" className={'pf-filter-btn' + (platform === p ? ' active' : '')} onClick={() => setPlatform(platform === p ? null : p)}>
                {PLATFORM_LABELS[p]}
              </button>
            ))}
            <button type="button" className={'pf-filter-btn' + (aiOnly ? ' active' : '')} onClick={() => setAiOnly(!aiOnly)}>
              AI
            </button>
          </div>
        </>
      )}

      {browsing ? (
        <>
          <div className="dict-section-title">
            {panel === 'favorites' ? 'Мої інструменти' : panel === 'recent' ? 'Нещодавно переглянуті' : `Знайдено: ${results.length}`}
          </div>
          {results.length === 0 && <div className="empty-state">Нічого не знайдено.</div>}
          <div className="dict-card-grid">
            {results.map((t) => (
              <ToolCard key={t.id} tool={t} showCategory favorite={isFavorite(t.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="dict-section-title">Напрямки</div>
          <div className="dict-cat-grid">
            {TOOLS_CATEGORIES.map((c) => {
              const count = TOOLS.filter((t) => t.category === c.id).length
              return (
                <Link key={c.id} to={`/tools/${c.id}`} className="dict-cat-card">
                  <div className="dict-cat-title">{c.ua}</div>
                  <div className="dict-cat-en">{c.desc}</div>
                  <div className="dict-cat-count">{count} {count === 1 ? 'інструмент' : 'інструментів'}</div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
