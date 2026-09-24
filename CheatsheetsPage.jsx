import { useMemo, useState } from 'react'
import { CHEATSHEETS } from './data/cheatsheets/cheatsheets.js'

const TAB_IDS = Object.keys(CHEATSHEETS)

export default function CheatsheetsPage() {
  const [tab, setTab] = useState(TAB_IDS[0])
  const [query, setQuery] = useState('')
  const sheet = CHEATSHEETS[tab]

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sheet.groups
    return sheet.groups
      .map((g) => ({ ...g, items: g.items.filter(([term, desc]) => term.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0)
  }, [sheet, query])

  return (
    <div>
      <h1 className="page-title">Шпаргалки</h1>
      <p className="page-sub">
        Щільні довідкові таблиці з дизайну — гарячі клавіші реальних інструментів, кольори, типографіка, формати й розміри. Все важливе на одному екрані.
      </p>

      <div className="cheat-tabs" role="tablist">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={'pf-filter-btn' + (tab === id ? ' active' : '')}
            onClick={() => { setTab(id); setQuery('') }}
          >
            {CHEATSHEETS[id].title}
          </button>
        ))}
      </div>

      <div className="search-box" style={{ maxWidth: 420, marginBottom: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Пошук у шпаргалці «${sheet.title}»...`}
          aria-label="Пошук у шпаргалці"
        />
      </div>

      <div className="cheat-sheet">
        {groups.map((g) => (
          <div className="cheat-group" key={g.cat}>
            <div className="cheat-group-title">{g.cat}</div>
            <div className="cheat-grid">
              {g.items.map(([term, desc]) => (
                <div className="cheat-item" key={term}>
                  <code className="cheat-term">{term}</code>
                  <span className="cheat-desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && <div className="empty-state">Нічого не знайдено за «{query}».</div>}
      </div>
    </div>
  )
}
