import { useMemo, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'
import NotFound from './NotFound.jsx'
import { ASSET_KINDS, SELF_SCORE_OPTIONS, makeEmptyAsset, THREED_SUBCAT_SECTION } from './threeDProject.js'
import { MODULES } from './modules.js'
import { getSubcategoriesByLevel } from './subcategories.js'

// 3D Design Studio — робочий простір за зразком Game Art/Logo Design/
// Advertising Design Studio: один спільний проєкт (ThreeDProject за :id),
// усі панелі читають і пишуть той самий запис через
// saveThreeDProject({ id, ...patch }).
//
// Чесна межа: сама побудова 3D-сцен відбувається в 3D Lab (реальний
// Three.js-рушій на /labs/3d) — ця студія НЕ дублює його як гірший
// рушій усередині себе, а дає структуру навколо результату: реальний
// JSON-знімок сцени з 3D Lab (вкладка «Експорт» → Copy JSON), за
// потреби скріншот, облік матеріалів/текстур, вимоги проєкту, чесне
// рев'ю й реальна історія версій — той самий принцип, що вже працює
// для треку 3D-моделей у Game Art Studio.

const TRACKS = getSubcategoriesByLevel('3d-design')

const SECTIONS = [
  ...ASSET_KINDS.map((k) => ({ id: k.key, emoji: k.emoji, label: k.label })),
  { id: 'review', emoji: '🖊️', label: 'Рев’ю' },
  { id: 'versions', emoji: '🕓', label: 'Версії' },
]

const SECTION_HELP = {
  objects: { tip: 'Побудуй сцену чи об\'єкт у 3D Lab, на вкладці «Експорт» скопіюй JSON сцени (Copy JSON) і встав його в поле «Нотатка» — це реальний знімок геометрії/позицій/матеріалів, а не вигадана назва файлу. Скріншот із тієї самої вкладки можна завантажити як зображення запису.', criteria: ['Є назва об\'єкта чи сцени', 'Є JSON сцени з 3D Lab або чітка нотатка про стан роботи'] },
  materials: { tip: 'Опиши матеріал і PBR-карти (Albedo/Roughness/Metallic/Normal), які готуєш для об\'єкта — сам файл текстури зберігається в зовнішній програмі (Substance Painter, GIMP, Krita) чи в налаштуваннях матеріалу 3D Lab, тут лише облік і опис.', criteria: ['Є назва матеріалу', 'Вказано, для якого об\'єкта він призначений'] },
  requirements: { tip: 'Занеси технічне завдання проєкту як чекліст: формат експорту (glTF/FBX/OBJ), ліміт полігонів, роздільність текстур, цільовий рушій чи застосунок.', criteria: ['Є щонайменше 3 пункти вимог'] },
  review: { tip: 'Обери рубрику й чесно постав собі самооцінку по кожному критерію (чи це справді «відмінно», чи ще «потребує роботи»), залиш коментар із поясненням.', criteria: ['Є самооцінка щонайменше по половині критеріїв'] },
  versions: { tip: '«Зберегти версію» робить реальний знімок поточного стану проєкту з міткою часу — тут з’являються лише версії, які ти сам створив, а не вигадані v1.0/v2.0.', criteria: ['Збережено хоча б одну версію перед здачею роботи'] },
}

function scorePct(score) {
  if (score === 'Відмінно') return 100
  if (score === 'Непогано') return 60
  if (score === 'Потребує роботи') return 25
  return 0
}

function projectStats(p) {
  return {
    objects: p.assets.objects.length,
    materials: p.assets.materials.length,
    requirementsDone: p.assets.requirements.filter((r) => r.checked).length,
    requirementsTotal: p.assets.requirements.length,
    scored: p.review.items.filter((it) => it.selfScore).length,
    scoredTotal: p.review.items.length,
  }
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
          Реальний інструмент для побудови: <Link to={labLink.url} className="gfx-link">{labLink.label} →</Link>
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
          <TextField
            label="Нотатка"
            value={selected.note}
            onCommit={(v) => update(selected.id, { note: v })}
            textarea
            placeholder={kind === 'objects' ? 'JSON сцени з 3D Lab (Експорт → Copy JSON), або опис стану роботи' : 'PBR-карти, опис матеріалу, для якого об\'єкта призначений'}
          />
          {kind === 'objects' && (
            <>
              <label className="harmony-btn" style={{ cursor: 'pointer', display: 'inline-block', marginTop: 8 }}>
                📤 Завантажити скріншот
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && readImageFile(e.target.files[0], (dataUrl) => { update(selected.id, { imageDataUrl: dataUrl }); toastApi.show('✓ Скріншот додано') })} />
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
      <p className="cl-tab-desc">Технічне завдання як чекліст: формат експорту, ліміт полігонів, роздільність текстур, цільовий рушій чи застосунок.</p>
      {items.map((it) => (
        <div key={it.id} className="ux-audit-row">
          <label className="ux-audit-check">
            <input type="checkbox" checked={it.checked} onChange={() => toggle(it.id)} />
            <input className="cl-text-input" defaultValue={it.title} placeholder="Напр.: до 10000 трикутників, текстури 2048×2048, формат glTF" onBlur={(e) => { if (e.target.value !== it.title) updateText(it.id, e.target.value) }} />
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
      <p className="cl-section-title">Рев’ю 3D-роботи</p>
      <p className="cl-tab-desc"><strong>Чесна межа:</strong> це самооцінка й місце для нотаток реального ментора/фідбеку — студія не оцінює художню чи технічну якість автоматично й не вигадує персону ментора чи бал.</p>
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
  return (
    <div className="gfx-compare-panel">
      <div className="gfx-compare-col">
        <p className="gfx-compare-title">до</p>
        <div className="gfx-compare-stat"><span>3D-об'єкти/сцени</span><b>{before.objects}</b></div>
        <div className="gfx-compare-stat"><span>Матеріали</span><b>{before.materials}</b></div>
        <div className="gfx-compare-stat"><span>Вимоги виконано</span><b>{before.requirementsDone}/{before.requirementsTotal}</b></div>
        <div className="gfx-compare-stat"><span>Критеріїв оцінено</span><b>{before.scored}/{before.scoredTotal}</b></div>
      </div>
      <div className="gfx-compare-arrow">→</div>
      <div className="gfx-compare-col">
        <p className="gfx-compare-title">зараз</p>
        <div className="gfx-compare-stat"><span>3D-об'єкти/сцени</span><b>{after.objects}</b></div>
        <div className="gfx-compare-stat"><span>Матеріали</span><b>{after.materials}</b></div>
        <div className="gfx-compare-stat"><span>Вимоги виконано</span><b>{after.requirementsDone}/{after.requirementsTotal}</b></div>
        <div className="gfx-compare-stat"><span>Критеріїв оцінено</span><b>{after.scored}/{after.scoredTotal}</b></div>
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
      <p className="cl-tab-desc">Реальні знімки стану проєкту на момент збереження — список порожній, доки ти сам не натиснеш «Зберегти версію».</p>
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

export default function ThreeDDesignStudio() {
  const { projectId } = useParams()
  const location = useLocation()
  const { threeDProjects, saveThreeDProject, completed, xp, level } = useProgress()
  const toastApi = useLabToast()
  const project = threeDProjects.find((p) => p.id === projectId)
  const [section, setSection] = useState(location.state?.section || 'objects')
  const [activeTrackId, setActiveTrackId] = useState(() => {
    if (location.state?.subcategory) return location.state.subcategory
    const wanted = location.state?.section || 'objects'
    return TRACKS.find((t) => THREED_SUBCAT_SECTION[t.id] === wanted)?.id || TRACKS[0]?.id
  })

  const trackLessons = useMemo(
    () => MODULES.filter((m) => m.subcategory === activeTrackId).sort((a, b) => a.id - b.id),
    [activeTrackId]
  )
  const activeTrack = TRACKS.find((t) => t.id === activeTrackId)

  if (!project) return <NotFound />

  function onPatch(patch) {
    saveThreeDProject({ id: project.id, ...patch })
  }
  function selectTrack(trackId) {
    setActiveTrackId(trackId)
    setSection(THREED_SUBCAT_SECTION[trackId] || 'objects')
  }

  const help = SECTION_HELP[section]

  return (
    <div className="branding-studio gfx-studio-wide">
      <div className="dict-breadcrumb">
        <Link to="/academy/3d-design">3D Design Academy</Link> <span>→</span>
        {activeTrack && <><span>{activeTrack.emoji} {activeTrack.title}</span> <span>→</span></>}
        <span>{project.name}</span>
      </div>
      <div className="gfx-topbar motion-topbar-sticky">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} defaultValue={project.name} onBlur={(e) => onPatch({ name: e.target.value || 'Новий 3D-проєкт' })} placeholder="Назва проєкту" />
        <span className="gfx-status-pill">{deriveStatus(project)}</span>
        <span className="gfx-xp-pill" title="Загальний прогрес на платформі (усі напрями)">Рівень {level} · {xp} XP</span>
        <button className="harmony-btn" onClick={() => { saveThreeDProject(project); toastApi.show('✓ Збережено') }}>💾 Зберегти</button>
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

          {section === 'objects' && <AssetSection kind="objects" label="3D-об'єкти та сцени" labLink={{ url: '/labs/3d', label: '3D Lab' }} project={project} onPatch={onPatch} toastApi={toastApi} />}
          {section === 'materials' && <AssetSection kind="materials" label="Матеріали та текстури" project={project} onPatch={onPatch} toastApi={toastApi} />}
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
            {project.review.items.length === 0 && <p className="cl-tab-desc">Немає критеріїв для оцінки.</p>}
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
