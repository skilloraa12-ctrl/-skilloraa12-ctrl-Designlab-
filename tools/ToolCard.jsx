import { Link } from 'react-router-dom'
import { getToolsCategory } from '../data/tools/categories.js'

// Ми не робимо власних скріншотів чужих інтерфейсів (це чужий UI, який
// застаріє за тиждень і вимагає прав) — натомість показуємо офіційну
// іконку сайту через публічний favicon-сервіс, виведену з officialUrl.
export function toolLogoUrl(tool, size = 64) {
  try {
    const domain = new URL(tool.officialUrl).hostname
    return `https://www.google.com/s2/favicons?sz=${size}&domain=${domain}`
  } catch {
    return null
  }
}

export const PRICING_LABELS = {
  free: 'Безкоштовно',
  'open-source': 'Відкритий код',
  freemium: 'Freemium',
  paid: 'Платно',
  'one-time': 'Одна оплата',
}

// Compact tool card reused on ToolsHome (search/browse results) and
// ToolsCategory (tool list within a category).
export default function ToolCard({ tool, showCategory = false, favorite, onToggleFavorite }) {
  const category = showCategory ? getToolsCategory(tool.category) : null
  return (
    <Link to={`/tools/${tool.category}/${tool.id}`} className="dict-card">
      <div className="dict-card-top">
        <img src={toolLogoUrl(tool)} alt="" className="tools-logo" width="18" height="18" loading="lazy" onError={(e) => { e.target.style.visibility = 'hidden' }} />
        <span className="dict-card-en">{tool.name}</span>
        <span className={'tools-price-badge tools-price-' + tool.pricing}>{PRICING_LABELS[tool.pricing]}</span>
        {onToggleFavorite && (
          <button
            type="button"
            className="dict-card-fav"
            onClick={(e) => { e.preventDefault(); onToggleFavorite(tool.id) }}
            aria-label={favorite ? 'Прибрати з обраного' : 'Додати в обране'}
            aria-pressed={favorite}
          >
            {favorite ? '♥' : '♡'}
          </button>
        )}
      </div>
      <p className="dict-card-def">{tool.description}</p>
      <div className="dict-card-meta">
        {category && <span className="dict-tag">{category.ua}</span>}
        <span className="dict-tag">{tool.type}</span>
        {tool.ai && <span className="dict-tag tools-tag-ai">AI</span>}
        {tool.freePlan && <span className="dict-tag tools-tag-free">Free план</span>}
      </div>
    </Link>
  )
}
