import { Link, useNavigate } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { createEmptyMotionProject, MOTION_STAGES } from './motionProject.js'

// Домашній екран Motion Design Studio — той самий патерн, що й
// BrandingHome.jsx: напрямок не просто список уроків, а робоча
// майстерня з реальним канвас+таймлайн редактором (MotionStudio.jsx).
const STAGE_CARDS = [
  { stage: 'idea', emoji: '💡', title: 'Ідея', desc: 'Мета, сценарій, формат' },
  { stage: 'storyboard', emoji: '🎞️', title: 'Розкадровка', desc: 'Ключові кадри сцени' },
  { stage: 'animation', emoji: '🎬', title: 'Анімація', desc: 'Канва, таймлайн, keyframes' },
  { stage: 'effects', emoji: '✨', title: 'Ефекти', desc: 'Прозорість та інші ефекти' },
  { stage: 'sound', emoji: '🔊', title: 'Звук', desc: 'Концепція звукового супроводу' },
  { stage: 'export', emoji: '📤', title: 'Експорт', desc: 'SVG-кадр і дані проєкту' },
  { stage: 'presentation', emoji: '🗣️', title: 'Презентація', desc: 'Підсумковий показ роботи' },
]

function stageStatus(project, stage) {
  if (!project) return 'not-started'
  if (stage === 'idea') return project.idea?.goal ? 'done' : (project.idea?.scenario ? 'in-progress' : 'not-started')
  if (stage === 'storyboard') return project.storyboard?.frames?.length > 0 ? 'done' : 'not-started'
  if (stage === 'animation') return project.objects?.length > 0 ? 'in-progress' : 'not-started'
  if (stage === 'effects') return project.effects?.notes ? 'in-progress' : 'not-started'
  if (stage === 'sound') return project.sound?.concept ? 'done' : 'not-started'
  if (stage === 'export') return 'not-started'
  if (stage === 'presentation') return project.presentation?.slides?.length > 0 ? 'done' : 'not-started'
  return 'not-started'
}

const STATUS_LABEL = { 'not-started': 'Не розпочато', 'in-progress': 'У процесі', done: 'Завершено' }

export default function MotionHome({ subcats, lessonGrid, doneInDirection, totalInDirection }) {
  const { motionProjects, saveMotionProject } = useProgress()
  const navigate = useNavigate()
  const latest = motionProjects[0] || null

  function startNew() {
    const id = saveMotionProject(createEmptyMotionProject('Новий моушн-проєкт'))
    navigate(`/motion-studio/${id}`, { state: { stage: 'idea' } })
  }

  return (
    <div className="branding-home">
      <div className="dict-breadcrumb">
        <Link to="/academy">Академія</Link> <span>→</span> <span>Motion Design</span>
      </div>
      <h1 className="page-title">🎬 MOTION DESIGN STUDIO</h1>
      <p className="page-sub">Повний цикл створення анімації — від ідеї й розкадровки до реального канвас-редактора з ключовими кадрами, таймлайном і експортом — у межах DESIGNLAB UA.</p>

      {totalInDirection > 0 && (
        <>
          <div className="guide-progress-bar" style={{ maxWidth: 420, marginTop: 4 }}>
            <div className="guide-progress-fill" style={{ width: `${Math.round((doneInDirection / totalInDirection) * 100)}%` }} />
          </div>
          <p className="guide-progress-label" style={{ marginBottom: 14 }}>{doneInDirection}/{totalInDirection} уроків курсу пройдено</p>
        </>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0 22px' }}>
        <button className="pf-add-btn" onClick={startNew}>+ Почати новий проєкт</button>
        {latest && (
          <Link className="harmony-btn" to={`/motion-studio/${latest.id}`} state={{ stage: 'animation' }}>
            ▶ Продовжити «{latest.name}»
          </Link>
        )}
        <a className="harmony-btn" href="#my-motion-projects">📁 Мої проєкти {motionProjects.length > 0 ? `(${motionProjects.length})` : ''}</a>
      </div>

      <p className="cl-section-title">Етапи роботи над проєктом</p>
      <div className="guide-cat-grid">
        {STAGE_CARDS.map((c) => {
          const status = stageStatus(latest, c.stage)
          return (
            <Link
              key={c.stage}
              className="guide-cat-card"
              to={latest ? `/motion-studio/${latest.id}` : '#'}
              state={{ stage: c.stage }}
              onClick={(e) => { if (!latest) { e.preventDefault(); startNew() } }}
            >
              <div className="guide-cat-title">{c.emoji} {c.title}</div>
              <div className="guide-cat-en">{c.desc}</div>
              <span className={'lab-card-badge' + (status === 'done' ? ' active' : '')}>{STATUS_LABEL[status]}</span>
            </Link>
          )
        })}
      </div>

      {motionProjects.length > 0 && (
        <div id="my-motion-projects" style={{ marginTop: 28 }}>
          <p className="cl-section-title">Мої проєкти</p>
          <div className="guide-cat-grid">
            {motionProjects.map((p) => (
              <Link key={p.id} className="guide-cat-card" to={`/motion-studio/${p.id}`} state={{ stage: 'animation' }}>
                <div className="guide-cat-title">{p.name}</div>
                <div className="guide-cat-en">Оновлено {new Date(p.updatedAt).toLocaleDateString('uk-UA')}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <p className="cl-section-title">Уроки курсу</p>
        {lessonGrid}
      </div>
    </div>
  )
}
