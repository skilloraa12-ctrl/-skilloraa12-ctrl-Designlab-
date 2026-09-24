import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getToolsCategory } from './data/tools/categories.js'
import { getTool } from './data/tools/tools.js'
import { useToolsFavorites } from './tools/useToolsFavorites.js'
import { useToolsRecent } from './tools/useToolsRecent.js'
import { PRICING_LABELS } from './tools/ToolCard.jsx'
import NotFound from './NotFound.jsx'

const PLATFORM_LABELS = { web: 'Web', windows: 'Windows', macos: 'macOS', ios: 'iOS', android: 'Android' }

function Field({ label, value }) {
  if (!value) return null
  return (
    <div className="dict-field">
      <div className="dict-field-label">{label}</div>
      <p className="dict-field-value">{value}</p>
    </div>
  )
}

export default function ToolsDetail() {
  const { category: categoryId, tool: toolId } = useParams()
  const tool = getTool(toolId)
  const category = getToolsCategory(categoryId)
  const { toggle: toggleFavorite, isFavorite } = useToolsFavorites()
  const { push: pushRecent } = useToolsRecent()

  useEffect(() => {
    if (tool) pushRecent(tool.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool?.id])

  if (!tool || !category || tool.category !== categoryId) return <NotFound />

  const favorite = isFavorite(tool.id)

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/tools">Інструменти</Link> <span>→</span>{' '}
        <Link to={`/tools/${category.id}`}>{category.ua}</Link> <span>→</span> <span>{tool.name}</span>
      </div>

      <div className="dict-term-head">
        <div>
          <h1 className="page-title dict-term-title">{tool.name}</h1>
          <div className="dict-term-ua">{tool.type}</div>
        </div>
        <button
          type="button"
          className={'pf-add-btn' + (favorite ? ' active' : '')}
          onClick={() => toggleFavorite(tool.id)}
          aria-pressed={favorite}
        >
          {favorite ? '♥ В обраному' : '♡ В обране'}
        </button>
      </div>

      <div className="dict-term-tags">
        <span className="dict-tag">{category.ua}</span>
        <span className={'dict-tag tools-price-badge tools-price-' + tool.pricing}>{PRICING_LABELS[tool.pricing]}</span>
        {tool.ai && <span className="dict-tag tools-tag-ai">AI</span>}
        {tool.figmaPlugin && <span className="dict-tag">Figma-плагін</span>}
        {tool.platforms.map((p) => <span key={p} className="dict-tag">{PLATFORM_LABELS[p]}</span>)}
      </div>

      <p className="dict-term-shortdef">{tool.description}</p>

      <Field label="Для чого" value={tool.purpose} />
      <Field label="Ціна" value={tool.priceFrom} />
      {tool.note && <Field label="Важливо знати" value={tool.note} />}

      <div className="dict-field">
        <a href={tool.officialUrl} target="_blank" rel="noopener noreferrer" className="save-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Офіційний сайт та ціни →
        </a>
      </div>
    </div>
  )
}
