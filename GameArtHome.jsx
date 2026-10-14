import { Link, useNavigate } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { createEmptyGameArtProject, ASSET_KINDS } from './gameArtProject.js'

// Домашній екран Game Art Academy — той самий патерн, що й
// UXHome.jsx/MotionHome.jsx: напрямок не список уроків, а робоча
// майстерня з реальними інструментами (Pixel Art Editor, 3D Lab,
// Game Art Studio) поверх повноцінного курсу.
const SECTION_CARDS = [
  ...ASSET_KINDS.map((k) => ({ section: k.key, emoji: k.emoji, title: k.label })),
  { section: 'review', emoji: '🖊️', title: 'Рев’ю' },
  { section: 'versions', emoji: '🕓', title: 'Версії' },
]

function sectionStatus(project, section) {
  if (!project) return 'not-started'
  if (section === 'review') return project.review?.items?.some((i) => i.selfScore) ? 'in-progress' : 'not-started'
  if (section === 'versions') return project.versions?.length > 0 ? 'done' : 'not-started'
  const list = project.assets?.[section] || []
  return list.length > 0 ? 'in-progress' : 'not-started'
}

const STATUS_LABEL = { 'not-started': 'Не розпочато', 'in-progress': 'У процесі', done: 'Завершено' }

export default function GameArtHome({ subcats, lessonGrid, doneInDirection, totalInDirection }) {
  const { gameArtProjects, saveGameArtProject } = useProgress()
  const navigate = useNavigate()
  const latest = gameArtProjects[0] || null

  function startNew() {
    const id = saveGameArtProject(createEmptyGameArtProject('Новий проєкт Game Art'))
    navigate(`/game-art-studio/${id}`, { state: { section: 'concepts2d' } })
  }

  return (
    <div className="branding-home">
      <div className="dict-breadcrumb">
        <Link to="/academy">Академія</Link> <span>→</span> <span>Game Art</span>
      </div>
      <h1 className="page-title">🎨 GAME ART ACADEMY</h1>
      <p className="page-sub">Від перших форм і пікселів до 3D-ресурсів, готових до ігрового рушія — повний шлях Game Artist у межах DESIGNLAB UA.</p>

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
          <Link className="harmony-btn" to={`/game-art-studio/${latest.id}`} state={{ section: 'concepts2d' }}>
            ▶ Продовжити «{latest.name}»
          </Link>
        )}
        <a className="harmony-btn" href="#my-game-art-projects">📁 Мої проєкти {gameArtProjects.length > 0 ? `(${gameArtProjects.length})` : ''}</a>
        <Link className="harmony-btn" to="/labs/pixel-art">🟪 Pixel Art Editor</Link>
        <Link className="harmony-btn" to="/labs/3d">🧊 3D Lab</Link>
      </div>

      <p className="cl-section-title">Робочі області проєкту</p>
      <div className="guide-cat-grid">
        {SECTION_CARDS.map((c) => {
          const status = sectionStatus(latest, c.section)
          return (
            <Link
              key={c.section}
              className="guide-cat-card"
              to={latest ? `/game-art-studio/${latest.id}` : '#'}
              state={{ section: c.section }}
              onClick={(e) => { if (!latest) { e.preventDefault(); startNew() } }}
            >
              <div className="guide-cat-title">{c.emoji} {c.title}</div>
              <span className={'lab-card-badge' + (status === 'done' ? ' active' : '')}>{STATUS_LABEL[status]}</span>
            </Link>
          )
        })}
      </div>

      {gameArtProjects.length > 0 && (
        <div id="my-game-art-projects" style={{ marginTop: 28 }}>
          <p className="cl-section-title">Мої проєкти</p>
          <div className="guide-cat-grid">
            {gameArtProjects.map((p) => (
              <Link key={p.id} className="guide-cat-card" to={`/game-art-studio/${p.id}`} state={{ section: 'concepts2d' }}>
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
