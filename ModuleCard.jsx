import { Link } from 'react-router-dom'
import { useProgress } from '../context/ProgressContext.jsx'

export default function ModuleCard({ module }) {
  const { completed, toggleModule } = useProgress()
  const done = !!completed[module.id]

  return (
    <div className="mod-row">
      <span className="mod-num">{String(module.id).padStart(2, '0')}</span>
      <button
        className={'mod-check' + (done ? ' done' : '')}
        onClick={(e) => { e.preventDefault(); toggleModule(module.id) }}
        aria-label={done ? 'Позначити не пройденим' : 'Позначити пройденим'}
      >
        {done ? '✓' : ''}
      </button>
      <Link to={`/module/${module.id}`} className="mod-title-link">
        <span className="mod-title">{module.title}</span>
      </Link>
      <Link to={`/module/${module.id}`} className="mod-arrow">→</Link>
    </div>
  )
}
