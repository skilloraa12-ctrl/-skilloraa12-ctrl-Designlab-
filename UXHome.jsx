import { Link, useNavigate } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { createEmptyUxProject, UX_STAGES } from './uxProject.js'

// Домашній екран UX Design Studio — той самий патерн, що й MotionHome.jsx/
// BrandingHome.jsx: напрямок не список уроків, а робоча майстерня з
// реальними інструментами (дослідження, персона, journey, flow,
// wireframes, прототип) — UXStudio.jsx.
const STAGE_CARDS = UX_STAGES.map((s) => ({ stage: s.id, emoji: s.emoji, title: s.label }))

function stageStatus(project, stage) {
  if (!project) return 'not-started'
  switch (stage) {
    case 'research': return project.research?.insights?.length > 0 ? 'done' : (project.research?.goal ? 'in-progress' : 'not-started')
    case 'persona': return project.persona?.name ? 'done' : 'not-started'
    case 'journey': return project.journey?.rows?.length > 0 ? 'done' : 'not-started'
    case 'problem': return project.problem?.statement ? 'done' : 'not-started'
    case 'ia': return project.ia?.nodes?.length > 0 ? 'done' : 'not-started'
    case 'flow': return project.flow?.blocks?.length > 0 ? 'in-progress' : 'not-started'
    case 'wireframe': return project.wireframe?.screens?.length > 0 ? 'in-progress' : 'not-started'
    case 'prototype': return project.prototype?.startScreenId ? 'done' : 'not-started'
    case 'testing': return project.testing?.findings?.length > 0 ? 'done' : 'not-started'
    case 'audit': return project.audit?.items?.every((i) => i.checked) ? 'done' : (project.audit?.items?.some((i) => i.checked) ? 'in-progress' : 'not-started')
    case 'presentation': return project.presentation?.summary ? 'done' : 'not-started'
    default: return 'not-started'
  }
}

const STATUS_LABEL = { 'not-started': 'Не розпочато', 'in-progress': 'У процесі', done: 'Завершено' }

export default function UXHome({ subcats, lessonGrid, doneInDirection, totalInDirection }) {
  const { uxProjects, saveUxProject } = useProgress()
  const navigate = useNavigate()
  const latest = uxProjects[0] || null

  function startNew() {
    const id = saveUxProject(createEmptyUxProject('Новий UX-проєкт'))
    navigate(`/ux-studio/${id}`, { state: { stage: 'research' } })
  }

  return (
    <div className="branding-home">
      <div className="dict-breadcrumb">
        <Link to="/academy">Академія</Link> <span>→</span> <span>UX Design</span>
      </div>
      <h1 className="page-title">🧠 UX DESIGN STUDIO</h1>
      <p className="page-sub">Повний цикл UX-процесу — від дослідження й персони до User Flow, wireframes і клікабельного прототипу — у межах DESIGNLAB UA.</p>

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
          <Link className="harmony-btn" to={`/ux-studio/${latest.id}`} state={{ stage: 'research' }}>
            ▶ Продовжити «{latest.name}»
          </Link>
        )}
        <a className="harmony-btn" href="#my-ux-projects">📁 Мої проєкти {uxProjects.length > 0 ? `(${uxProjects.length})` : ''}</a>
      </div>

      <p className="cl-section-title">Етапи роботи над проєктом</p>
      <div className="guide-cat-grid">
        {STAGE_CARDS.map((c) => {
          const status = stageStatus(latest, c.stage)
          return (
            <Link
              key={c.stage}
              className="guide-cat-card"
              to={latest ? `/ux-studio/${latest.id}` : '#'}
              state={{ stage: c.stage }}
              onClick={(e) => { if (!latest) { e.preventDefault(); startNew() } }}
            >
              <div className="guide-cat-title">{c.emoji} {c.title}</div>
              <span className={'lab-card-badge' + (status === 'done' ? ' active' : '')}>{STATUS_LABEL[status]}</span>
            </Link>
          )
        })}
      </div>

      {uxProjects.length > 0 && (
        <div id="my-ux-projects" style={{ marginTop: 28 }}>
          <p className="cl-section-title">Мої проєкти</p>
          <div className="guide-cat-grid">
            {uxProjects.map((p) => (
              <Link key={p.id} className="guide-cat-card" to={`/ux-studio/${p.id}`} state={{ stage: 'research' }}>
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
