import { Link } from 'react-router-dom'
import { LEVEL_LABELS, TYPE_LABELS } from '../data/dictionary/terms.js'
import { getCategory } from '../data/dictionary/categories.js'

// Compact term card reused on DictionaryHome (search/browse results) and
// DictionaryCategory (term list within a category).
export default function TermCard({ term, showCategory = false, favorite, onToggleFavorite }) {
  const category = showCategory ? getCategory(term.category) : null
  return (
    <Link to={`/dictionary/${term.category}/${term.id}`} className="dict-card">
      <div className="dict-card-top">
        <span className="dict-card-en">{term.en}</span>
        <span className="dict-card-ua">{term.ua}</span>
        {onToggleFavorite && (
          <button
            type="button"
            className="dict-card-fav"
            onClick={(e) => { e.preventDefault(); onToggleFavorite(term.id) }}
            aria-label={favorite ? 'Прибрати з обраного' : 'Додати в обране'}
            aria-pressed={favorite}
          >
            {favorite ? '♥' : '♡'}
          </button>
        )}
      </div>
      <p className="dict-card-def">{term.shortDef}</p>
      <div className="dict-card-meta">
        {category && <span className="dict-tag">{category.ua}</span>}
        <span className="dict-tag dict-tag-level">{LEVEL_LABELS[term.level]}</span>
        <span className="dict-tag dict-tag-type">{TYPE_LABELS[term.type]}</span>
      </div>
    </Link>
  )
}
