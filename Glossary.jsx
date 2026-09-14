import { useState, useMemo } from 'react'
import { GLOSSARY } from './glossary.js'

export default function Glossary() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GLOSSARY
    return GLOSSARY.filter(
      (d) => d.en.toLowerCase().includes(q) || d.ua.toLowerCase().includes(q) || d.simple.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <div>
      <h1 className="page-title">Словник дизайнера</h1>
      <p className="page-sub">Базові терміни графічного дизайну українською та англійською.</p>

      <div className="search-box" style={{ marginBottom: 24 }}>
        <input placeholder="Шукати термін…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {results.map((d) => (
        <div className="dict-item" key={d.slug}>
          <div className="dict-head">
            <span className="dict-en">{d.en}</span>
            <span className="dict-ua">{d.ua}</span>
          </div>
          <div className="dict-def">{d.simple}</div>
        </div>
      ))}
      {results.length === 0 && <div className="empty-state">Нічого не знайдено.</div>}
    </div>
  )
}
