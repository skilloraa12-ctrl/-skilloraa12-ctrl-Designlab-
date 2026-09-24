import { Link, useParams } from 'react-router-dom'
import { getToolsCategory } from './data/tools/categories.js'
import { getToolsByCategory } from './data/tools/tools.js'
import { useToolsFavorites } from './tools/useToolsFavorites.js'
import ToolCard from './tools/ToolCard.jsx'
import NotFound from './NotFound.jsx'

export default function ToolsCategory() {
  const { category: categoryId } = useParams()
  const category = getToolsCategory(categoryId)
  const { toggle: toggleFavorite, isFavorite } = useToolsFavorites()

  if (!category) return <NotFound />

  const tools = getToolsByCategory(categoryId)

  return (
    <div>
      <div className="dict-breadcrumb">
        <Link to="/tools">Інструменти</Link> <span>→</span> <span>{category.ua}</span>
      </div>
      <h1 className="page-title">{category.ua}</h1>
      <p className="page-sub">{category.desc} — {tools.length} {tools.length === 1 ? 'інструмент' : 'інструментів'} у цьому напрямку.</p>

      {tools.length === 0 ? (
        <div className="empty-state">У цьому напрямку поки немає інструментів.</div>
      ) : (
        <div className="dict-card-grid">
          {tools.map((t) => (
            <ToolCard key={t.id} tool={t} favorite={isFavorite(t.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  )
}
