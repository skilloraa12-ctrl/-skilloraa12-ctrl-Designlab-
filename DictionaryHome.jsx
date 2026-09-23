import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DICTIONARY_CATEGORIES } from './data/dictionary/categories.js'
import { TERMS, LEVELS, LEVEL_LABELS, TYPES, TYPE_LABELS, getTerm } from './data/dictionary/terms.js'
import { useDictionaryFavorites } from './dictionary/useDictionaryFavorites.js'
import { useDictionaryRecent } from './dictionary/useDictionaryRecent.js'
import TermCard from './dictionary/TermCard.jsx'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function matchesQuery(term, q) {
  return (
    term.en.toLowerCase().includes(q) ||
    term.ua.toLowerCase().includes(q) ||
    term.shortDef.toLowerCase().includes(q) ||
    term.category.toLowerCase().includes(q)
  )
}

export default function DictionaryHome() {
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState(null)
  const [level, setLevel] = useState(null)
  const [type, setType] = useState(null)
  const [panel, setPanel] = useState(null) // null | 'favorites' | 'recent'

  const { ids: favoriteIds, toggle: toggleFavorite, isFavorite } = useDictionaryFavorites()
  const { ids: recentIds } = useDictionaryRecent()

  const q = query.trim().toLowerCase()
  const browsing = q.length > 0 || letter || level || type || panel

  const results = useMemo(() => {
    if (panel === 'favorites') return favoriteIds.map(getTerm).filter(Boolean)
    if (panel === 'recent') return recentIds.map(getTerm).filter(Boolean)
    let list = TERMS
    if (q) list = list.filter((t) => matchesQuery(t, q))
    if (letter) list = list.filter((t) => t.en[0].toUpperCase() === letter)
    if (level) list = list.filter((t) => t.level === level)
    if (type) list = list.filter((t) => t.type === type)
    return [...list].sort((a, b) => a.en.localeCompare(b.en))
  }, [q, letter, level, type, panel, favoriteIds, recentIds])

  function resetFilters() {
    setQuery(''); setLetter(null); setLevel(null); setType(null); setPanel(null)
  }

  return (
    <div>
      <h1 className="page-title">📖 Словник</h1>
      <p className="page-sub">Повна енциклопедія професійних термінів дизайну — {TERMS.length} термінів у {DICTIONARY_CATEGORIES.length} категоріях. Що означає термін? Тут.</p>

      <div className="search-box dict-search">
        <input
          placeholder="Знайти термін: kerning, контраст, WCAG…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLetter(null); setPanel(null) }}
          aria-label="Пошук термінів"
        />
      </div>

      <div className="dict-quicklinks">
        <button type="button" className={'pf-filter-btn' + (panel === 'favorites' ? ' active' : '')} onClick={() => setPanel(panel === 'favorites' ? null : 'favorites')}>
          ♥ Мої терміни ({favoriteIds.length})
        </button>
        <button type="button" className={'pf-filter-btn' + (panel === 'recent' ? ' active' : '')} onClick={() => setPanel(panel === 'recent' ? null : 'recent')}>
          🕐 Нещодавні ({recentIds.length})
        </button>
        {browsing && <button type="button" className="pf-filter-btn" onClick={resetFilters}>✕ Скинути</button>}
      </div>

      {!panel && (
        <>
          <div className="dict-az-row" role="group" aria-label="Алфавітний покажчик">
            {ALPHABET.map((l) => (
              <button
                key={l}
                type="button"
                className={'dict-az-btn' + (letter === l ? ' active' : '')}
                onClick={() => setLetter(letter === l ? null : l)}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="dict-filter-row" role="group" aria-label="Рівень">
            <span className="dict-filter-label">Рівень:</span>
            {LEVELS.map((lv) => (
              <button key={lv} type="button" className={'pf-filter-btn' + (level === lv ? ' active' : '')} onClick={() => setLevel(level === lv ? null : lv)}>
                {LEVEL_LABELS[lv]}
              </button>
            ))}
          </div>
          <div className="dict-filter-row" role="group" aria-label="Тип">
            <span className="dict-filter-label">Тип:</span>
            {TYPES.map((ty) => (
              <button key={ty} type="button" className={'pf-filter-btn' + (type === ty ? ' active' : '')} onClick={() => setType(type === ty ? null : ty)}>
                {TYPE_LABELS[ty]}
              </button>
            ))}
          </div>
        </>
      )}

      {browsing ? (
        <>
          <div className="dict-section-title">
            {panel === 'favorites' ? 'Мої терміни' : panel === 'recent' ? 'Нещодавно переглянуті' : `Знайдено: ${results.length}`}
          </div>
          {results.length === 0 && <div className="empty-state">Нічого не знайдено.</div>}
          <div className="dict-card-grid">
            {results.map((t) => (
              <TermCard key={t.id} term={t} showCategory favorite={isFavorite(t.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="dict-section-title">Категорії</div>
          <div className="dict-cat-grid">
            {DICTIONARY_CATEGORIES.map((c) => {
              const count = TERMS.filter((t) => t.category === c.id).length
              return (
                <Link key={c.id} to={`/dictionary/${c.id}`} className="dict-cat-card">
                  <div className="dict-cat-title">{c.ua}</div>
                  <div className="dict-cat-en">{c.en}</div>
                  <div className="dict-cat-count">{count} {count === 1 ? 'термін' : 'термінів'}</div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
