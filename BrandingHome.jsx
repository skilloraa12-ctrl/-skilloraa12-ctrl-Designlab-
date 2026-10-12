import { Link, useNavigate } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { createEmptyBrandProject, BRAND_STAGES } from './brandProject.js'

// Домашній екран Branding Studio (ТЗ, п.3.1) — показується на
// /academy/branding замість (над) загальної сітки підкатегорій, щоб
// напрямок не був просто ще одним списком уроків, а справжньою
// робочою майстернею: почати/продовжити бренд, список своїх брендів,
// картки 8 ключових етапів.
const STAGE_CARDS = [
  { stage: 'strategy', emoji: '🎯', title: 'Стратегія', desc: 'Місія, позиціонування, УЦП' },
  { stage: 'naming', emoji: '🔤', title: 'Назва та концепція', desc: 'Нейминг і творчий напрямок' },
  { stage: 'logo', emoji: '🏷️', title: 'Логотип', desc: 'Знак, що впізнається' },
  { stage: 'palette', emoji: '🎨', title: 'Кольори й типографіка', desc: 'Фірмова палітра та шрифти' },
  { stage: 'graphicElements', emoji: '◼️', title: 'Візуальна айдентика', desc: 'Форми, патерни, іконографіка' },
  { stage: 'mediaApplications', emoji: '📦', title: 'Носії бренду', desc: 'Візитка, паковання, соцмережі' },
  { stage: 'guidelines', emoji: '📖', title: 'Брендбук', desc: 'Систематизовані правила' },
  { stage: 'presentation', emoji: '🖥️', title: 'Презентація', desc: 'Фінальний кейс для портфоліо' },
]

function stageStatus(project, stage) {
  if (!project) return 'not-started'
  if (stage === 'strategy') return project.strategy?.positioning ? 'done' : (project.strategy?.mission ? 'in-progress' : 'not-started')
  if (stage === 'naming') return project.naming?.chosenId ? 'done' : (project.naming?.candidates?.length > 0 ? 'in-progress' : 'not-started')
  if (stage === 'logo') return project.logos?.length > 0 ? 'in-progress' : 'not-started'
  if (stage === 'palette') return (project.palette?.primary?.length > 0) ? 'in-progress' : 'not-started'
  if (stage === 'graphicElements') return project.graphicElements?.notes ? 'in-progress' : 'not-started'
  if (stage === 'mediaApplications') return project.mediaApplications?.length > 0 ? 'in-progress' : 'not-started'
  if (stage === 'guidelines') return project.guidelines?.exportedAt ? 'done' : (Object.keys(project.guidelines?.pages || {}).length > 0 ? 'in-progress' : 'not-started')
  if (stage === 'presentation') return project.presentation?.slides?.length > 0 ? 'in-progress' : 'not-started'
  return 'not-started'
}

const STATUS_LABEL = { 'not-started': 'Не розпочато', 'in-progress': 'У процесі', done: 'Завершено' }

export default function BrandingHome({ subcats, lessonGrid, doneInDirection, totalInDirection }) {
  const { brandProjects, saveBrandProject } = useProgress()
  const navigate = useNavigate()
  const latest = brandProjects[0] || null

  function startNew() {
    const id = saveBrandProject(createEmptyBrandProject('Новий бренд'))
    navigate(`/branding-studio/${id}`, { state: { stage: 'brief' } })
  }

  return (
    <div className="branding-home">
      <div className="dict-breadcrumb">
        <Link to="/academy">Академія</Link> <span>→</span> <span>Branding</span>
      </div>
      <h1 className="page-title">🏢 BRANDING STUDIO</h1>
      <p className="page-sub">Повний цикл створення бренду — від брифу й дослідження до стратегії, назви, логотипа, візуальної айдентики та фінальної презентації — у межах DESIGNLAB UA.</p>

      {totalInDirection > 0 && (
        <>
          <div className="guide-progress-bar" style={{ maxWidth: 420, marginTop: 4 }}>
            <div className="guide-progress-fill" style={{ width: `${Math.round((doneInDirection / totalInDirection) * 100)}%` }} />
          </div>
          <p className="guide-progress-label" style={{ marginBottom: 14 }}>{doneInDirection}/{totalInDirection} уроків курсу пройдено</p>
        </>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0 22px' }}>
        <button className="pf-add-btn" onClick={startNew}>+ Почати новий бренд</button>
        {latest && (
          <Link className="harmony-btn" to={`/branding-studio/${latest.id}`} state={{ stage: 'brief' }}>
            ▶ Продовжити «{latest.name}»
          </Link>
        )}
        <a className="harmony-btn" href="#my-brands">📁 Мої бренди {brandProjects.length > 0 ? `(${brandProjects.length})` : ''}</a>
      </div>

      <p className="cl-section-title">Етапи роботи над брендом</p>
      <div className="guide-cat-grid">
        {STAGE_CARDS.map((c) => {
          const status = stageStatus(latest, c.stage)
          return (
            <Link
              key={c.stage}
              className="guide-cat-card"
              to={latest ? `/branding-studio/${latest.id}` : '#'}
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

      {brandProjects.length > 0 && (
        <div id="my-brands" style={{ marginTop: 28 }}>
          <p className="cl-section-title">Мої бренди</p>
          <div className="guide-cat-grid">
            {brandProjects.map((p) => (
              <Link key={p.id} className="guide-cat-card" to={`/branding-studio/${p.id}`} state={{ stage: 'brief' }}>
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
