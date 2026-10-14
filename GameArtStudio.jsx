import { useMemo, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'
import NotFound from './NotFound.jsx'
import { ASSET_KINDS, RUBRIC_SETS, SELF_SCORE_OPTIONS, makeEmptyAsset, GAME_ART_SUBCAT_SECTION } from './gameArtProject.js'
import PixelCanvasEditor from './labs/PixelCanvasEditor.jsx'
import { emptyGrid, pixelsToPngDataUrl } from './labs/pixelArtEngine.js'
import { MODULES } from './modules.js'
import { getSubcategoriesByLevel } from './subcategories.js'

// Game Art Studio — робочий простір за зразком UX/Motion/Branding Studio:
// один спільний проєкт (GameArtProject за :id), усі панелі читають і
// пишуть той самий запис через saveGameArtProject({ id, ...patch }).
//
// Ліва панель — реальне дерево всіх 11 треків курсу (subcategories.js) з
// реальним прогресом (completed[]) і списком уроків активного треку, а не
// статичний список категорій роботи. Центр — перемикач реальних розділів
// студії (асети/рев'ю/версії) + рядок-чекліст уроків активного треку.
// Права панель — підказка для розділу + самооцінка проєкту (справжні дані
// з рубрики рев'ю, без вигаданого ментора чи автооцінки). Знизу — реальна
// історія версій з порівнянням «до/після» на основі збережених знімків.
//
// Чесна межа: студія НЕ дублює Pixel Art Editor чи 3D Lab усередині себе
// як окремий рушій — Pixel Art Editor вбудований напряму (спільний
// labs/PixelCanvasEditor.jsx з /labs/pixel-art), а 3D Lab лишається
// окремим реальним інструментом, на який студія посилається.

const TRACKS = getSubcategoriesByLevel('game-art')

const SECTIONS = [
  ...ASSET_KINDS.map((k) => ({ id: k.key, emoji: k.emoji, label: k.label })),
  { id: 'review', emoji: '🖊️', label: 'Рев’ю' },
  { id: 'versions', emoji: '🕓', label: 'Версії' },
]

const SECTION_HELP = {
  concepts2d: { tip: 'Малюй прямо тут — вбудований Pixel Art Editor нижче зберігає малюнок у самому записі проєкту. Коли готово, натисни «Зберегти як зображення концепту». Малював у зовнішній програмі (Krita, Photoshop) — завантаж готовий файл кнопкою «Завантажити зображення».', criteria: ['Є назва концепту', 'Є зображення (намальоване тут або завантажене) або чітка нотатка про задум'] },
  models3d: { tip: 'Побудуй модель у 3D Lab, на вкладці «Експорт» скопіюй JSON сцени і встав його сюди — це реальний знімок геометрії/матеріалів, а не вигадана назва файлу.', criteria: ['Є назва моделі', 'Є JSON сцени або нотатка про стан роботи в Blender'] },
  textures: { tip: 'Опиши текстуру й PBR-карти (Albedo/Normal/Roughness/Metallic), які готуєш — реальний файл текстури зберігається в зовнішній програмі (Substance Painter, GIMP, Krita), тут лише облік.', criteria: ['Є назва текстури', 'Вказано, для якого асета вона призначена'] },
  requirements: { tip: 'Занеси технічне завдання проєкту як чекліст: формат файлів, ліміт полігонів, розмір текстур, стиль.', criteria: ['Є щонайменше 3 пункти вимог'] },
  review: { tip: 'Обери рубрику під тип роботи, чесно постав собі самооцінку по кожному критерію (чи це справді «відмінно», чи ще «потребує роботи») і залиш коментар із поясненням.', criteria: ['Обрано рубрику', 'Є самооцінка щонайменше по половині критеріїв'] },
  versions: { tip: '«Зберегти версію» робить реальний знімок поточного стану проєкту з міткою часу — на відміну від вигаданих v1.0/v2.0, тут з’являються лише версії, які ти сам створив. «Порівняти з поточним» показує реальну різницю у кількості записів і картинках, без вигаданих балів.', criteria: ['Збережено хоча б одну версію перед здачею роботи'] },
}

function scorePct(score) {
  if (score === 'Відмінно') return 100
  if (score === 'Непогано') return 60
  if (score === 'Потребує роботи') return 25
  return 0
}

function projectStats(p) {
  return {
    concepts2d: p.assets.concepts2d.length,
    models3d: p.assets.models3d.length,
    textures: p.assets.textures.length,
    requirementsDone: p.assets.requirements.filter((r) => r.checked).length,
    requirementsTotal: p.assets.requirements.length,
    scored: p.review.items.filter((it) => it.selfScore).length,
    scoredTotal: p.review.items.length,
  }
}

function firstConceptImage(p) {
  return p.assets.concepts2d.find((a) => a.imageDataUrl)?.imageDataUrl || null
}

function deriveStatus(project) {
  if (project.versions.length > 0) return '🕓 Версію збережено'
  const hasAnyAsset = Object.values(project.assets).some((arr) => arr.length > 0)
  if (hasAnyAsset) return '✏️ У роботі'
  return '🆕 Новий проєкт'
}

function TextField({ label, value, onCommit, textarea, placeholder }) {
  const [local, setLocal] = useState(value || '')
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <label className="gfx-field">
      {label}
      <Tag
        className={textarea ? 'gfx-textarea' : 'cl-text-input'}
        rows={textarea ? 3 : undefined}
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { if (local !== (value || '')) onCommit(local) }}
      />
    </label>
  )
}

function readImageFile(file, cb) {
  const reader = new FileReader()
  reader.onload = () => cb(reader.result)
  reader.readAsDataURL(file)
}

function AssetSection({ kind, label, labLink, project, onPatch, toastApi }) {
  const items = project.assets[kind]
  const [selectedId, setSelectedId] = useState(items[0]?.id || null)
  const selected = items.find((a) => a.id === selectedId) || null

  function commit(next) {
    onPatch({ assets: { ...project.assets, [kind]: next } })
  }
  function add() {
    const a = makeEmptyAsset(kind)
    commit([...items, a])
    setSelectedId(a.id)
  }
  function update(id, patch) {
    commit(items.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }
  function remove(id) {
    commit(items.filter((a) => a.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="branding-form">
      <p className="cl-section-title">{label}</p>
      {labLink && (
        <p className="cl-tab-desc">
          {kind === 'concepts2d' ? 'Той самий редактор вбудований нижче. Потрібне більше місця або розмір 24×24/32×32 з іншими налаштуваннями — відкрий ' : 'Реальний інструмент для цієї роботи: '}
          <Link to={labLink.url} className="gfx-link">{labLink.label} →</Link>
        </p>
      )}
      <button className="harmony-btn" onClick={add}>+ Додати запис</button>
      {items.length === 0 && <p className="cl-tab-desc">Ще немає жодного запису.</p>}
      <div className="ux-list-editor" style={{ marginTop: 12 }}>
        {items.map((a) => (
          <div key={a.id} className="ux-list-row">
            <button type="button" className={'cl-mini-btn' + (a.id === selectedId ? ' active' : '')} style={{ flex: 1, textAlign: 'left' }} onClick={() => setSelectedId(a.id)}>
              {a.title || '(без назви)'}
            </button>
            <button type="button" className="cl-mini-btn" onClick={() => remove(a.id)}>×</button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="branding-name-card" style={{ marginTop: 16 }}>
          <TextField label="Назва" value={selected.title} onCommit={(v) => update(selected.id, { title: v })} />
          <TextField label="Нотатка" value={selected.note} onCommit={(v) => update(selected.id, { note: v })} textarea placeholder={kind === 'models3d' ? 'JSON сцени з 3D Lab, або опис стану роботи' : 'Опис, статус, посилання на референс'} />
          {kind === 'concepts2d' && (
            <>
              <p className="cl-section-title" style={{ marginTop: 16 }}>Малювання</p>
              <PixelCanvasEditor
                size={selected.pixelData?.size || 16}
                pixels={selected.pixelData?.pixels || emptyGrid(selected.pixelData?.size || 16)}
                onChangePixels={(next) => update(selected.id, { pixelData: { size: selected.pixelData?.size || 16, pixels: next } })}
                onSizeChange={(newSize) => update(selected.id, { pixelData: { size: newSize, pixels: emptyGrid(newSize) } })}
                showExport={false}
                onMessage={toastApi.show}
              />
              <button
                type="button"
                className="harmony-btn"
                style={{ marginTop: 10 }}
                onClick={() => {
                  if (!selected.pixelData) { toastApi.show('Спочатку намалюй щось'); return }
                  const url = pixelsToPngDataUrl(selected.pixelData.size, selected.pixelData.pixels, 8)
                  update(selected.id, { imageDataUrl: url })
                  toastApi.show('✓ Малюнок збережено як зображення концепту')
                }}
              >
                💾 Зберегти як зображення концепту
              </button>
              <label className="harmony-btn" style={{ cursor: 'pointer', display: 'inline-block', marginTop: 8, marginLeft: 8 }}>
                📤 Завантажити зображення
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && readImageFile(e.target.files[0], (dataUrl) => update(selected.id, { imageDataUrl: dataUrl }))} />
              </label>
              {selected.imageDataUrl && <img src={selected.imageDataUrl} alt={selected.title} className="gfx-concept-preview" />}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function RequirementsSection({ project, onPatch }) {
  const items = project.assets.requirements
  function commit(next) { onPatch({ assets: { ...project.assets, requirements: next } }) }
  function add() { commit([...items, { id: crypto.randomUUID(), kind: 'requirements', title: '', note: '', imageDataUrl: null, checked: false }]) }
  function toggle(id) { commit(items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))) }
  function updateText(id, title) { commit(items.map((it) => (it.id === id ? { ...it, title } : it))) }
  function remove(id) { commit(items.filter((it) => it.id !== id)) }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Вимоги проєкту</p>
      <p className="cl-tab-desc">Технічне завдання як чекліст: формат файлів, ліміт полігонів, розмір текстур, стиль.</p>
      {items.map((it) => (
        <div key={it.id} className="ux-audit-row">
          <label className="ux-audit-check">
            <input type="checkbox" checked={it.checked} onChange={() => toggle(it.id)} />
            <input className="cl-text-input" defaultValue={it.title} placeholder="Напр.: до 2000 трикутників, текстури 1024×1024" onBlur={(e) => { if (e.target.value !== it.title) updateText(it.id, e.target.value) }} />
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
  function setRubricSet(key) {
    const set = RUBRIC_SETS.find((s) => s.key === key)
    onPatch({ review: { ...r, rubricSet: key, items: set.items.map((criterion) => ({ id: crypto.randomUUID(), criterion, selfScore: '', note: '' })) } })
  }
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
      <p className="cl-section-title">Game Art Review Workspace</p>
      <p className="cl-tab-desc"><strong>Чесна межа:</strong> це самооцінка й місце для нотаток реального ментора/фідбеку — студія не оцінює художню якість автоматично і не вигадує персону ментора чи бал.</p>

      <p className="cl-section-title" style={{ marginTop: 12 }}>Рубрика</p>
      <div className="cl-btn-row">
        {RUBRIC_SETS.map((s) => (
          <button key={s.key} className={'cl-mini-btn' + (r.rubricSet === s.key ? ' active' : '')} onClick={() => setRubricSet(s.key)}>{s.label}</button>
        ))}
      </div>

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

function VersionCompare({ snapshot, current }) {
  const before = projectStats(snapshot)
  const after = projectStats(current)
  const beforeImg = firstConceptImage(snapshot)
  const afterImg = firstConceptImage(current)
  return (
    <div className="gfx-compare-panel">
      <div className="gfx-compare-col">
        <p className="gfx-compare-title">до</p>
        <div className="gfx-compare-stat"><span>2D-концепти</span><b>{before.concepts2d}</b></div>
        <div className="gfx-compare-stat"><span>3D-моделі</span><b>{before.models3d}</b></div>
        <div className="gfx-compare-stat"><span>Текстури</span><b>{before.textures}</b></div>
        <div className="gfx-compare-stat"><span>Вимоги виконано</span><b>{before.requirementsDone}/{before.requirementsTotal}</b></div>
        <div className="gfx-compare-stat"><span>Критеріїв оцінено</span><b>{before.scored}/{before.scoredTotal}</b></div>
        {beforeImg && <img src={beforeImg} alt="до" className="gfx-concept-preview" />}
      </div>
      <div className="gfx-compare-arrow">→</div>
      <div className="gfx-compare-col">
        <p className="gfx-compare-title">зараз</p>
        <div className="gfx-compare-stat"><span>2D-концепти</span><b>{after.concepts2d}</b></div>
        <div className="gfx-compare-stat"><span>3D-моделі</span><b>{after.models3d}</b></div>
        <div className="gfx-compare-stat"><span>Текстури</span><b>{after.textures}</b></div>
        <div className="gfx-compare-stat"><span>Вимоги виконано</span><b>{after.requirementsDone}/{after.requirementsTotal}</b></div>
        <div className="gfx-compare-stat"><span>Критеріїв оцінено</span><b>{after.scored}/{after.scoredTotal}</b></div>
        {afterImg && <img src={afterImg} alt="зараз" className="gfx-concept-preview" />}
      </div>
    </div>
  )
}

function VersionsSection({ project, onPatch, toastApi }) {
  const [label, setLabel] = useState('')
  const [compareId, setCompareId] = useState(null)
  function saveVersion() {
    const { versions, ...snapshot } = project
    const entry = { id: crypto.randomUUID(), label: label.trim() || `Версія ${project.versions.length + 1}`, savedAt: new Date().toISOString(), snapshot }
    onPatch({ versions: [entry, ...project.versions] })
    setLabel('')
    toastApi.show('✓ Версію збережено')
  }
  function removeVersion(id) {
    onPatch({ versions: project.versions.filter((v) => v.id !== id) })
    if (compareId === id) setCompareId(null)
  }
  const compareVersion = project.versions.find((v) => v.id === compareId)
  return (
    <div className="branding-form">
      <p className="cl-section-title">Версії проєкту</p>
      <p className="cl-tab-desc">Реальні знімки стану проєкту на момент збереження — список порожній, доки ти сам не натиснеш «Зберегти версію». «Порівняти з поточним» показує справжню різницю в кількості записів і картинках, без вигаданих балів.</p>
      <div className="gfx-row">
        <input className="cl-text-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Назва версії (необов’язково)" />
        <button className="harmony-btn" onClick={saveVersion}>📌 Зберегти версію</button>
      </div>
      {project.versions.length === 0 && <p className="cl-tab-desc" style={{ marginTop: 12 }}>Ще немає жодної збереженої версії.</p>}
      <div className="ux-list-editor" style={{ marginTop: 12 }}>
        {project.versions.map((v) => (
          <div key={v.id}>
            <div className="ux-list-row">
              <span className="motion-track-label" style={{ flex: 1, minWidth: 0 }}>{v.label} — {new Date(v.savedAt).toLocaleString('uk-UA')}</span>
              <button type="button" className="cl-mini-btn" onClick={() => setCompareId(compareId === v.id ? null : v.id)}>
                {compareId === v.id ? '✕ Сховати' : '📊 Порівняти'}
              </button>
              <button type="button" className="cl-mini-btn" onClick={() => removeVersion(v.id)}>×</button>
            </div>
            {compareId === v.id && <VersionCompare snapshot={v.snapshot} current={project} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GameArtStudio() {
  const { projectId } = useParams()
  const location = useLocation()
  const { gameArtProjects, saveGameArtProject, completed, xp, level } = useProgress()
  const toastApi = useLabToast()
  const project = gameArtProjects.find((p) => p.id === projectId)
  const [section, setSection] = useState(location.state?.section || 'concepts2d')
  const [activeTrackId, setActiveTrackId] = useState(() => {
    if (location.state?.subcategory) return location.state.subcategory
    const wanted = location.state?.section || 'concepts2d'
    return TRACKS.find((t) => GAME_ART_SUBCAT_SECTION[t.id] === wanted)?.id || TRACKS[0]?.id
  })

  const trackLessons = useMemo(
    () => MODULES.filter((m) => m.subcategory === activeTrackId).sort((a, b) => a.id - b.id),
    [activeTrackId]
  )
  const activeTrack = TRACKS.find((t) => t.id === activeTrackId)

  if (!project) return <NotFound />

  function onPatch(patch) {
    saveGameArtProject({ id: project.id, ...patch })
  }
  function selectTrack(trackId) {
    setActiveTrackId(trackId)
    setSection(GAME_ART_SUBCAT_SECTION[trackId] || 'concepts2d')
  }

  const help = SECTION_HELP[section]

  return (
    <div className="branding-studio gfx-studio-wide">
      <div className="dict-breadcrumb">
        <Link to="/academy/game-art">Game Art Academy</Link> <span>→</span>
        {activeTrack && <><span>{activeTrack.emoji} {activeTrack.title}</span> <span>→</span></>}
        <span>{project.name}</span>
      </div>
      <div className="gfx-topbar motion-topbar-sticky">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} defaultValue={project.name} onBlur={(e) => onPatch({ name: e.target.value || 'Новий проєкт Game Art' })} placeholder="Назва проєкту" />
        <span className="gfx-status-pill">{deriveStatus(project)}</span>
        <span className="gfx-xp-pill" title="Загальний прогрес на платформі (усі напрями)">Рівень {level} · {xp} XP</span>
        <button className="harmony-btn" onClick={() => { saveGameArtProject(project); toastApi.show('✓ Збережено') }}>💾 Зберегти</button>
        <span className="motion-autosave-note">Кожна зміна зберігається автоматично — ця кнопка лише підтверджує збереження назви проєкту.</span>
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

          {section === 'concepts2d' && <AssetSection kind="concepts2d" label="2D-концепти" labLink={{ url: '/labs/pixel-art', label: 'Pixel Art Editor' }} project={project} onPatch={onPatch} toastApi={toastApi} />}
          {section === 'models3d' && <AssetSection kind="models3d" label="3D-моделі" labLink={{ url: '/labs/3d', label: '3D Lab' }} project={project} onPatch={onPatch} />}
          {section === 'textures' && <AssetSection kind="textures" label="PBR-текстури" project={project} onPatch={onPatch} />}
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
            {project.review.items.length === 0 && <p className="cl-tab-desc">Немає критеріїв — обери рубрику на вкладці «Рев’ю».</p>}
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
