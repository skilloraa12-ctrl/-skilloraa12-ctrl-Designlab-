import { useMemo, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'
import NotFound from './NotFound.jsx'
import GraphicDesignStudio, { buildSvgString } from './GraphicDesignStudio.jsx'
import {
  GRAPHIC_FORMATS, SELF_SCORE_OPTIONS, GRAPHIC_SUBCAT_SECTION, makeEmptyRequirement,
} from './graphicProject.js'
import { contrastRatio, wcagLevel } from './colorMath.js'
import { MODULES } from './modules.js'
import { getSubcategoriesByLevel } from './subcategories.js'

// Graphic Design Studio — той самий принцип "одного спільного проєкту на
// весь напрямок", що й Logo/Advertising/3D Design Studio, але на відміну
// від них "Конструктор" тут не новий SVG-редактор з нуля, а наявний,
// уже повноцінний растрово-векторний редактор GraphicDesignStudio.jsx
// (фігури/текст/зображення/іконки/пензель, шари, undo/redo, експорт
// PNG/JPG/SVG/PDF) — просто вбудований сюди через project/onSaved
// замість того, щоб відкриватися як модалка на одне завдання.
//
// Палітра й Перевірка форматів — це те, чого растровому редактору
// бракувало як інструменту САМЕ для Graphic Design (кольорова палітра
// проєкту з реальною WCAG-перевіркою контрасту, та чесна перевірка
// однієї композиції в кількох стандартних форматах без авто-адаптації).

const TRACKS = getSubcategoriesByLevel('graphic-design')

const SECTIONS = [
  { id: 'builder', emoji: '🏗️', label: 'Конструктор' },
  { id: 'palette', emoji: '🎨', label: 'Палітра' },
  { id: 'formats', emoji: '🖼️', label: 'Перевірка форматів' },
  { id: 'requirements', emoji: '📋', label: 'Вимоги' },
  { id: 'review', emoji: '🖊️', label: 'Рев’ю' },
  { id: 'versions', emoji: '🕓', label: 'Версії' },
]

const SECTION_HELP = {
  builder: { tip: 'Повноцінний редактор: інструменти фігур, тексту, зображень, іконок і пензля зліва, властивості обраного об’єкта справа, шари знизу. «Зберегти проєкт» записує поточний стан у спільний проєкт цього напрямку.', criteria: ['Є хоча б один об’єкт на полотні', 'Проєкт збережено хоча б раз'] },
  palette: { tip: 'Збери робочу палітру кольорів проєкту і перевір контраст пари кольорів за реальною формулою WCAG (та сама, що в Contrast Lab) — не вигаданий бал «гармонійності».', criteria: ['У палітрі є щонайменше 2 кольори', 'Перевірено контраст тексту й фону'] },
  formats: { tip: 'Та сама композиція з Конструктора, БЕЗ автоматичної адаптації, у стандартних розмірах — соцмережі, постери, візитка, банер. Якщо щось обрізається чи «зʼїжджає» — це сигнал повернутися в Конструктор і підлаштувати макет під формат, а не покладатися на уявне авто-масштабування.', criteria: ['Перевірено хоча б у двох форматах'] },
  requirements: { tip: 'Занеси технічне завдання чи бриф клієнта як чекліст: формат, аудиторія, обовʼязкові елементи, дедлайн.', criteria: ['Є щонайменше 3 пункти вимог'] },
  review: { tip: 'Пройди рубрику чесної самооцінки роботи й залиш коментар із поясненням — студія не вигадує оцінку автоматично.', criteria: ['Є самооцінка щонайменше по половині критеріїв'] },
  versions: { tip: '«Зберегти версію» робить реальний знімок поточного стану полотна з міткою часу — на відміну від вигаданих v1.0/v2.0, тут з’являються лише версії, які ти сам створив.', criteria: ['Збережено хоча б одну версію перед здачею роботи'] },
}

function scorePct(score) {
  if (score === 'Відмінно') return 100
  if (score === 'Непогано') return 60
  if (score === 'Потребує роботи') return 25
  return 0
}

function deriveStatus(project) {
  if (project.versions.length > 0) return '🕓 Версію збережено'
  if (project.objects.length > 0) return '✏️ У роботі'
  return '🆕 Новий проєкт'
}

function PaletteSection({ project, onPatch, toastApi }) {
  const palette = project.palette || []
  const [newColor, setNewColor] = useState('#2e6dff')
  const [fg, setFg] = useState(palette[0] || '#1a1a1a')
  const [bg, setBg] = useState(palette[1] || '#ffffff')

  function addColor() {
    if (palette.includes(newColor)) { toastApi.show('Цей колір вже в палітрі'); return }
    onPatch({ palette: [...palette, newColor] })
  }
  function removeColor(hex) {
    onPatch({ palette: palette.filter((c) => c !== hex) })
  }

  const canCheck = palette.length >= 2 && palette.includes(fg) && palette.includes(bg)
  const ratio = canCheck ? contrastRatio(fg, bg) : null
  const level = ratio ? wcagLevel(ratio, false) : null
  const levelLarge = ratio ? wcagLevel(ratio, true) : null

  return (
    <div className="branding-form">
      <p className="cl-section-title">Палітра проєкту</p>
      <p className="cl-tab-desc">Робочі кольори цього проєкту — додавай кнопкою нижче, не прив’язано до конкретних об’єктів на полотні.</p>

      <div className="gfx-row" style={{ flexWrap: 'wrap' }}>
        {palette.length === 0 && <p className="cl-tab-desc">Палітра порожня — додай перший колір.</p>}
        {palette.map((hex) => (
          <div key={hex} className="branding-name-card" style={{ alignItems: 'center', padding: 8, minWidth: 88 }}>
            <div className="cl-role-swatch" style={{ background: hex, width: 64, height: 40 }} />
            <span className="cl-tab-desc" style={{ margin: '4px 0' }}>{hex}</span>
            <button type="button" className="cl-mini-btn" onClick={() => removeColor(hex)}>× Прибрати</button>
          </div>
        ))}
      </div>
      <div className="gfx-row">
        <input type="color" className="cl-swatch-input" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
        <button className="harmony-btn" onClick={addColor}>+ Додати в палітру</button>
      </div>

      <p className="cl-section-title" style={{ marginTop: 20 }}>Перевірка контрасту (WCAG)</p>
      <p className="cl-tab-desc">Обери колір тексту й колір фону з палітри — реальне співвідношення контрасту та проходження AA/AAA, а не оцінка «на око».</p>
      {palette.length < 2 ? (
        <p className="cl-tab-desc">Потрібно щонайменше 2 кольори в палітрі.</p>
      ) : (
        <>
          <div className="gfx-row">
            <label className="gfx-field">Текст
              <select className="cl-text-input" value={fg} onChange={(e) => setFg(e.target.value)}>
                {palette.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="gfx-field">Фон
              <select className="cl-text-input" value={bg} onChange={(e) => setBg(e.target.value)}>
                {palette.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <div className="logo-scale-frame" style={{ width: 220, height: 100, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, border: '1px solid var(--line)' }}>
            Aa Текст
          </div>
          {ratio && (
            <p className="cl-tab-desc" style={{ marginTop: 8 }}>
              Контраст: <strong>{ratio.toFixed(2)}:1</strong> — звичайний текст {level.aa ? '✓ AA' : '✗ AA'}{level.aaa ? ' · ✓ AAA' : ''}, великий текст {levelLarge.aa ? '✓ AA' : '✗ AA'}{levelLarge.aaa ? ' · ✓ AAA' : ''}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function FormatPreview({ project, format }) {
  const svg = buildSvgString(project.objects, format.w, format.h, project.bg)
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  const maxDim = 200
  const scale = Math.min(maxDim / format.w, maxDim / format.h, 1)
  return (
    <div className="logo-scale-frame" style={{ width: format.w * scale, height: format.h * scale }}>
      <img src={dataUri} width={format.w * scale} height={format.h * scale} alt={format.label} style={{ display: 'block' }} />
    </div>
  )
}

function FormatsSection({ project }) {
  return (
    <div className="branding-form">
      <p className="cl-section-title">Перевірка форматів</p>
      <p className="cl-tab-desc">Та сама композиція з Конструктора (без автоматичної адаптації) у стандартних розмірах — реальна перевірка, чи витримує макет зміну формату.</p>
      {project.objects.length === 0 && <p className="cl-tab-desc">Полотно порожнє — спочатку додай щось у Конструкторі.</p>}
      <div className="logo-variation-grid">
        {GRAPHIC_FORMATS.map((f) => (
          <div key={f.key} className="logo-variation-card">
            <FormatPreview project={project} format={f} />
            <p className="cl-tab-desc">{f.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RequirementsSection({ project, onPatch }) {
  const items = project.requirements
  function commit(next) { onPatch({ requirements: next }) }
  function add() { commit([...items, makeEmptyRequirement()]) }
  function toggle(id) { commit(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it))) }
  function updateText(id, title) { commit(items.map((it) => (it.id === id ? { ...it, title } : it))) }
  function remove(id) { commit(items.filter((it) => it.id !== id)) }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Вимоги проєкту</p>
      <p className="cl-tab-desc">Бриф чи технічне завдання як чекліст: формат, аудиторія, обовʼязкові елементи, дедлайн.</p>
      {items.map((it) => (
        <div key={it.id} className="ux-audit-row">
          <label className="ux-audit-check">
            <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} />
            <input className="cl-text-input" defaultValue={it.title} placeholder="Напр.: формат 1080×1080, логотип у кутку" onBlur={(e) => { if (e.target.value !== it.title) updateText(it.id, e.target.value) }} />
          </label>
          <button type="button" className="cl-mini-btn" onClick={() => remove(it.id)}>×</button>
        </div>
      ))}
      <button className="harmony-btn" style={{ marginTop: 10 }} onClick={add}>+ Вимога</button>
    </div>
  )
}

function ReviewSection({ project, onPatch }) {
  const r = project.review
  function updateItem(id, patch) {
    onPatch({ review: { ...r, items: r.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } })
  }
  function addComment() {
    onPatch({ review: { ...r, comments: [...r.comments, { id: crypto.randomUUID(), text: '' }] } })
  }
  function updateComment(id, text) {
    onPatch({ review: { ...r, comments: r.comments.map((c) => (c.id === id ? { ...c, text } : c)) } })
  }
  function removeComment(id) {
    onPatch({ review: { ...r, comments: r.comments.filter((c) => c.id !== id) } })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Рев’ю роботи</p>
      <p className="cl-tab-desc"><strong>Чесна межа:</strong> це самооцінка й місце для нотаток реального ментора/фідбеку — студія не оцінює художню якість автоматично і не вигадує персону ментора чи бал.</p>
      {r.items.map((it) => (
        <div key={it.id} className="branding-name-card" style={{ marginTop: 10 }}>
          <strong>{it.criterion}</strong>
          <div className="cl-btn-row" style={{ marginTop: 6 }}>
            {SELF_SCORE_OPTIONS.map((opt) => (
              <button key={opt} className={'cl-mini-btn' + (it.selfScore === opt ? ' active' : '')} onClick={() => updateItem(it.id, { selfScore: opt })}>{opt}</button>
            ))}
          </div>
          <input className="cl-text-input" style={{ marginTop: 6 }} defaultValue={it.note} placeholder="Коментар / фідбек ментора" onBlur={(e) => { if (e.target.value !== it.note) updateItem(it.id, { note: e.target.value }) }} />
        </div>
      ))}
      <p className="cl-section-title" style={{ marginTop: 16 }}>Коментарі</p>
      {r.comments.map((c) => (
        <div key={c.id} className="ux-list-row">
          <input className="cl-text-input" defaultValue={c.text} placeholder="Загальний коментар до роботи" onBlur={(e) => { if (e.target.value !== c.text) updateComment(c.id, e.target.value) }} />
          <button type="button" className="cl-mini-btn" onClick={() => removeComment(c.id)}>×</button>
        </div>
      ))}
      <button className="cl-mini-btn" onClick={addComment}>+ Коментар</button>
    </div>
  )
}

function VersionsSection({ project, onPatch, toastApi }) {
  const [label, setLabel] = useState('')
  function saveVersion() {
    const { versions, ...snapshot } = project
    const entry = { id: crypto.randomUUID(), label: label.trim() || `Версія ${project.versions.length + 1}`, savedAt: new Date().toISOString(), snapshot }
    onPatch({ versions: [entry, ...project.versions] })
    setLabel('')
    toastApi.show('✓ Версію збережено')
  }
  function removeVersion(id) {
    onPatch({ versions: project.versions.filter((v) => v.id !== id) })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Версії проєкту</p>
      <p className="cl-tab-desc">Реальні знімки стану полотна на момент збереження — список порожній, доки ти сам не натиснеш «Зберегти версію».</p>
      <div className="gfx-row">
        <input className="cl-text-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Назва версії (необов’язково)" />
        <button className="harmony-btn" onClick={saveVersion}>📌 Зберегти версію</button>
      </div>
      {project.versions.length === 0 && <p className="cl-tab-desc" style={{ marginTop: 12 }}>Ще немає жодної збереженої версії.</p>}
      <div className="ux-list-editor" style={{ marginTop: 12 }}>
        {project.versions.map((v) => (
          <div key={v.id} className="ux-list-row">
            <span className="motion-track-label" style={{ flex: 1, minWidth: 0 }}>{v.label} — {new Date(v.savedAt).toLocaleString('uk-UA')} · {v.snapshot.objects.length} обʼєкт(ів)</span>
            <button type="button" className="cl-mini-btn" onClick={() => removeVersion(v.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GraphicStudio() {
  const { projectId } = useParams()
  const location = useLocation()
  const { graphicProjects, saveGraphicProject, completed, xp, level } = useProgress()
  const toastApi = useLabToast()
  const project = graphicProjects.find((p) => p.id === projectId)
  const [section, setSection] = useState(location.state?.section || 'builder')
  const [activeTrackId, setActiveTrackId] = useState(() => {
    if (location.state?.subcategory) return location.state.subcategory
    const wanted = location.state?.section || 'builder'
    return TRACKS.find((t) => GRAPHIC_SUBCAT_SECTION[t.id] === wanted)?.id || TRACKS[0]?.id
  })

  const trackLessons = useMemo(
    () => MODULES.filter((m) => m.subcategory === activeTrackId).sort((a, b) => a.id - b.id),
    [activeTrackId]
  )
  const activeTrack = TRACKS.find((t) => t.id === activeTrackId)

  if (!project) return <NotFound />

  // saveGraphicProject (на відміну від saveLogoProject) не мерджить із
  // наявним записом сам — тому onPatch завжди передає повний обʼєкт
  // проєкту з накладеним патчем, інакше часткове оновлення стерло б
  // решту полів (palette/requirements/review/versions чи сам objects).
  function onPatch(patch) {
    saveGraphicProject({ ...project, ...patch, id: project.id })
  }
  function selectTrack(trackId) {
    setActiveTrackId(trackId)
    setSection(GRAPHIC_SUBCAT_SECTION[trackId] || 'builder')
  }

  const help = SECTION_HELP[section]

  return (
    <div className="branding-studio gfx-studio-wide">
      <div className="dict-breadcrumb">
        <Link to="/academy/graphic-design">Graphic Design Academy</Link> <span>→</span>
        {activeTrack && <><span>{activeTrack.emoji} {activeTrack.title}</span> <span>→</span></>}
        <span>{project.title}</span>
      </div>
      <div className="gfx-topbar motion-topbar-sticky">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} defaultValue={project.title} onBlur={(e) => onPatch({ title: e.target.value || 'Новий графічний проєкт' })} placeholder="Назва проєкту" />
        <span className="gfx-status-pill">{deriveStatus(project)}</span>
        <span className="gfx-xp-pill" title="Загальний прогрес на платформі (усі напрями)">Рівень {level} · {xp} XP</span>
      </div>

      <div className="branding-layout">
        <div className="gfx-track-panel">
          <p className="gfx-track-panel-title">Програма курсу · {TRACKS.length} треків</p>
          <div className="gfx-track-list">
            {TRACKS.map((t) => {
              const lessons = MODULES.filter((m) => m.subcategory === t.id)
              const doneCount = lessons.filter((m) => completed[m.id]).length
              const isActive = t.id === activeTrackId
              return (
                <div key={t.id} className="gfx-track-group">
                  <button type="button" className={'gfx-track-row' + (isActive ? ' active' : '')} onClick={() => selectTrack(t.id)}>
                    <span className="gfx-track-emoji">{t.emoji}</span>
                    <span className="gfx-track-info">
                      <span className="gfx-track-name">{t.title}</span>
                      <span className="gfx-track-progress">{doneCount}/{lessons.length} уроків</span>
                    </span>
                  </button>
                  {isActive && (
                    <div className="gfx-lesson-list">
                      {lessons.map((m) => (
                        <Link key={m.id} to={`/module/${m.id}`} className={'gfx-lesson-row' + (completed[m.id] ? ' done' : '')}>
                          <span className="gfx-lesson-dot">{completed[m.id] ? '✓' : '○'}</span>
                          <span className="gfx-lesson-title">{m.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="branding-center">
          <div className="gfx-view-tabs">
            {SECTIONS.map((s) => (
              <button key={s.id} className={'gfx-view-tab' + (section === s.id ? ' active' : '')} onClick={() => setSection(s.id)}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>

          {trackLessons.length > 0 && (
            <div className="gfx-stage-row">
              {trackLessons.map((m) => (
                <Link key={m.id} to={`/module/${m.id}`} className={'gfx-stage-chip' + (completed[m.id] ? ' done' : '')} title={m.title}>
                  {completed[m.id] ? '✓' : '○'} {m.title}
                </Link>
              ))}
            </div>
          )}

          {section === 'builder' && <GraphicDesignStudio project={project} onSaved={() => toastApi.show('✓ Проєкт збережено')} />}
          {section === 'palette' && <PaletteSection project={project} onPatch={onPatch} toastApi={toastApi} />}
          {section === 'formats' && <FormatsSection project={project} />}
          {section === 'requirements' && <RequirementsSection project={project} onPatch={onPatch} />}
          {section === 'review' && <ReviewSection project={project} onPatch={onPatch} />}
          {section === 'versions' && <VersionsSection project={project} onPatch={onPatch} toastApi={toastApi} />}
        </div>

        <div className="branding-side">
          <p className="cl-section-title">Підказка</p>
          <p className="cl-tab-desc">{help?.tip}</p>
          {help?.criteria && (
            <>
              <p className="cl-section-title">Критерії перевірки</p>
              <ul className="branding-criteria-list">
                {help.criteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}

          <div className="gfx-review-mini">
            <p className="cl-section-title">Самооцінка проєкту</p>
            {project.review.items.map((it) => (
              <div key={it.id} className="gfx-score-row">
                <span className="gfx-score-label">{it.criterion}</span>
                <div className="gfx-score-bar"><div className="gfx-score-fill" style={{ width: scorePct(it.selfScore) + '%' }} /></div>
              </div>
            ))}
            <button className="cl-mini-btn" style={{ marginTop: 10 }} onClick={() => setSection('review')}>Повне рев’ю →</button>
            {project.review.comments.length > 0 && (
              <p className="cl-tab-desc" style={{ marginTop: 10 }}>💬 {project.review.comments.length} коментар(ів) — останній: «{project.review.comments[project.review.comments.length - 1].text || '(порожній)'}»</p>
            )}
          </div>
        </div>
      </div>
      <LabToast message={toastApi.toast} />
    </div>
  )
}
