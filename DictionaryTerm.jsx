import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCategory } from './data/dictionary/categories.js'
import { getTerm, LEVEL_LABELS, TYPE_LABELS } from './data/dictionary/terms.js'
import { useDictionaryFavorites } from './dictionary/useDictionaryFavorites.js'
import { useDictionaryRecent } from './dictionary/useDictionaryRecent.js'
import NotFound from './NotFound.jsx'

function Field({ label, value }) {
  if (!value) return null
  return (
    <div className="dict-field">
      <div className="dict-field-label">{label}</div>
      <p className="dict-field-value">{value}</p>
    </div>
  )
}

export default function DictionaryTerm() {
  const { category: categoryId, term: termId } = useParams()
  const term = getTerm(termId)
  const category = getCategory(categoryId)
  const { toggle: toggleFavorite, isFavorite } = useDictionaryFavorites()
  const { push: pushRecent } = useDictionaryRecent()

  useEffect(() => {
    if (term) pushRecent(term.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term?.id])

  if (!term || !category || term.category !== categoryId) return <NotFound />

  const related = (term.related || []).map((id) => getTerm(id)).filter(Boolean)
  const favorite = isFavorite(term.id)

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/dictionary">Словник</Link> <span>→</span>{' '}
        <Link to={`/dictionary/${category.id}`}>{category.ua}</Link>
        {term.subcategory && <> <span>→</span> <span>{term.subcategory}</span></>}
        {' '}<span>→</span> <span>{term.en}</span>
      </div>

      <div className="dict-term-head">
        <div>
          <h1 className="page-title dict-term-title">{term.en}</h1>
          <div className="dict-term-ua">{term.ua}</div>
        </div>
        <button
          type="button"
          className={'pf-add-btn' + (favorite ? ' active' : '')}
          onClick={() => toggleFavorite(term.id)}
          aria-pressed={favorite}
        >
          {favorite ? '♥ В обраному' : '♡ В обране'}
        </button>
      </div>

      <div className="dict-term-tags">
        <span className="dict-tag">{category.ua}</span>
        {term.subcategory && <span className="dict-tag">{term.subcategory}</span>}
        <span className="dict-tag dict-tag-level">{LEVEL_LABELS[term.level]}</span>
        <span className="dict-tag dict-tag-type">{TYPE_LABELS[term.type]}</span>
      </div>

      <p className="dict-term-shortdef">{term.shortDef}</p>

      <Field label="Що це" value={term.whatItIs} />
      <Field label="Що означає" value={term.whatItMeans} />
      <Field label="Для чого потрібно" value={term.whyNeeded} />
      <Field label="Де використовується" value={term.whereUsed} />
      <Field label="Хто використовує" value={term.whoUses} />
      <Field label="Коли використовувати" value={term.whenToUse} />
      <Field label="Як працює" value={term.howItWorks} />
      <Field label="Практичний приклад" value={term.example} />
      <Field label="Приклад у реальному дизайні" value={term.realExample} />
      <Field label="Не плутати з" value={term.notConfuseWith} />
      <Field label="Типові помилки" value={term.commonMistakes} />

      {related.length > 0 && (
        <div className="dict-field">
          <div className="dict-field-label">Пов'язані терміни</div>
          <div className="dict-related-row">
            {related.map((r) => (
              <Link key={r.id} to={`/dictionary/${r.category}/${r.id}`} className="dict-related-chip">
                {r.en} <span className="dict-related-ua">{r.ua}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
