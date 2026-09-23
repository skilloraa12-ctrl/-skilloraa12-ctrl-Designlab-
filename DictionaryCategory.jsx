import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCategory } from './data/dictionary/categories.js'
import { getTermsByCategory } from './data/dictionary/terms.js'
import { useDictionaryFavorites } from './dictionary/useDictionaryFavorites.js'
import TermCard from './dictionary/TermCard.jsx'
import NotFound from './NotFound.jsx'

export default function DictionaryCategory() {
  const { category: categoryId } = useParams()
  const category = getCategory(categoryId)
  const [subcategory, setSubcategory] = useState(null)
  const { toggle: toggleFavorite, isFavorite } = useDictionaryFavorites()

  const terms = useMemo(() => getTermsByCategory(categoryId), [categoryId])
  const filtered = subcategory ? terms.filter((t) => t.subcategory === subcategory) : terms

  if (!category) return <NotFound />

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/dictionary">Словник</Link> <span>→</span> <span>{category.ua}</span>
      </div>
      <h1 className="page-title">{category.ua}</h1>
      <p className="page-sub">{category.en} — {terms.length} {terms.length === 1 ? 'термін' : 'термінів'} у цій категорії.</p>

      {category.subcategories.length > 0 && (
        <div className="dict-filter-row" role="group" aria-label="Підкатегорія">
          <button type="button" className={'pf-filter-btn' + (!subcategory ? ' active' : '')} onClick={() => setSubcategory(null)}>Усі</button>
          {category.subcategories.map((s) => (
            <button key={s} type="button" className={'pf-filter-btn' + (subcategory === s ? ' active' : '')} onClick={() => setSubcategory(subcategory === s ? null : s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">У цій {subcategory ? 'підкатегорії' : 'категорії'} поки немає термінів.</div>
      ) : (
        <div className="dict-card-grid">
          {filtered.map((t) => (
            <TermCard key={t.id} term={t} favorite={isFavorite(t.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  )
}
