import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'
import NotFound from './NotFound.jsx'
import { MOTION_STAGES, CANVAS_PRESETS } from './motionProject.js'
import {
  EASINGS, defaultObject, defaultShadow, defaultStroke, valueAt, objectAt, upsertKeyframe, removeKeyframe,
  hitTest, hitHandle, drawObject, drawHandles, resizeObj, rotateObj, maxKeyframeTime,
} from './motionEngine.js'

// Motion Design Studio — робочий простір за зразком Branding Studio:
// ліва панель етапів, центральна робоча область (залежить від етапу),
// права панель допомоги. Один проєкт за раз (MotionProject за :id).
// Етап «Анімація» — єдиний реальний канвас+таймлайн+keyframes-редактор
// курсу (а не просто посилання на Motion Lab): перетягування об'єкта
// на канвасі в конкретний момент часу СТВОРЮЄ чи ОНОВЛЮЄ ключовий
// кадр саме в цей момент — реальна дія, а не демонстраційна кнопка.

const STAGE_HELP = {
  idea: { tip: 'Опиши мету й сценарій ролика, перш ніж створювати об’єкти — той самий принцип «спочатку сенс, потім форма», що й у Branding.', criteria: ['Сформульована мета', 'Є короткий сценарій', 'Обраний формат і канал показу'] },
  storyboard: { tip: 'Розбий сценарій на 4-8 ключових кадрів. Чорновий, швидкий опис — достатньо (модуль 7, урок 24701).', criteria: ['Є щонайменше 4 кадри', 'Кожен кадр має опис дії'] },
  animation: { tip: 'Додай об’єкт, перейди на потрібний момент часу (клік по шкалі), перемісти/зміни об’єкт — ключовий кадр створюється автоматично. Натисни ▶ для перегляду.', criteria: ['Є щонайменше один анімований об’єкт', 'Щонайменше 2 ключові кадри на властивість', 'Перевірено відтворенням (принцип з уроку 24304)'] },
  effects: { tip: 'Ефекти (прозорість, тінь) впливають на вже створені об’єкти — обери об’єкт на етапі «Анімація», потім онови його тут.', criteria: ['Продумано, які ефекти підсилюють сенс (не лише прикраса)'] },
  sound: { tip: 'Навіть якщо немає аудіоінструмента, опиши задум звуку словами — це реальна частина препродакшну (модуль 8).', criteria: ['Описано загальну ідею звуку/музики', 'Вказано джерело (за потреби)'] },
  export: { tip: 'Збережи кадр як SVG/PNG чи весь проєкт як JSON. Чесно: відеорендеринг (MP4/GIF) тут не реалізований — модуль 9 пояснює, де це зробити.', criteria: ['Експортовано хоча б один файл'] },
  presentation: { tip: 'Зведи проєкт у кілька слайдів для показу — модуль 10, урок про аніматик для клієнта.', criteria: ['Є щонайменше 2 слайди'] },
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

function IdeaStage({ project, onPatch }) {
  const i = project.idea
  const set = (field) => (val) => onPatch({ idea: { ...i, [field]: val } })
  return (
    <div className="branding-form">
      <p className="cl-section-title">Ідея та сценарій</p>
      <p className="cl-tab-desc">Це перший, текстовий етап — тут нічого не малюється. Заповни поля нижче (можна коротко), тоді переходь на етап «🎬 Анімація» ліворуч — там вже реальний канвас, де будуєш і рухаєш об'єкти.</p>
      <TextField label="Мета ролика" value={i.goal} onCommit={set('goal')} placeholder="Навіщо цей ролик існує" />
      <TextField label="Сценарій" value={i.scenario} onCommit={set('scenario')} textarea placeholder="Що відбувається від початку до кінця" />
      <TextField label="Цільова аудиторія" value={i.audience} onCommit={set('audience')} />
      <TextField label="Формат" value={i.format} onCommit={set('format')} placeholder="UI-мікровзаємодія / рекламний ролик / заставка" />
      <TextField label="Канал показу" value={i.channel} onCommit={set('channel')} placeholder="Instagram Reels / сайт / YouTube" />
    </div>
  )
}

function StoryboardStage({ project, onPatch }) {
  const frames = project.storyboard.frames
  function addFrame() {
    onPatch({ storyboard: { frames: [...frames, { id: crypto.randomUUID(), title: '', desc: '', durationMs: 1000 }] } })
  }
  function update(id, patch) {
    onPatch({ storyboard: { frames: frames.map((f) => (f.id === id ? { ...f, ...patch } : f)) } })
  }
  function remove(id) {
    onPatch({ storyboard: { frames: frames.filter((f) => f.id !== id) } })
  }
  const totalMs = frames.reduce((s, f) => s + (Number(f.durationMs) || 0), 0)
  return (
    <div className="branding-form">
      <p className="cl-section-title">Розкадровка</p>
      <p className="cl-tab-desc">Теж текстовий етап — плануєш послідовність кадрів словами, перш ніж будувати їх на канвасі. Натисни «+ Новий кадр», опиши, що відбувається, і онови тривалість. Коли план готовий — переходь на «🎬 Анімація», щоб це реально побудувати й заанімувати.</p>
      <p className="cl-tab-desc">Орієнтовна загальна тривалість за кадрами: {(totalMs / 1000).toFixed(1)}с</p>
      <button className="harmony-btn" onClick={addFrame}>+ Новий кадр</button>
      {frames.map((f, idx) => (
        <div key={f.id} className="branding-name-card">
          <div className="gfx-row" style={{ alignItems: 'center' }}>
            <strong style={{ flex: 1 }}>Кадр {idx + 1}</strong>
            <button className="cl-mini-btn" onClick={() => remove(f.id)}>Видалити</button>
          </div>
          <TextField label="Що відбувається" value={f.title} onCommit={(v) => update(f.id, { title: v })} />
          <TextField label="Опис дії" value={f.desc} onCommit={(v) => update(f.id, { desc: v })} textarea />
          <label className="gfx-field">
            Тривалість (мс)
            <input className="cl-text-input" type="number" step="100" value={f.durationMs} onChange={(e) => update(f.id, { durationMs: Number(e.target.value) || 0 })} />
          </label>
        </div>
      ))}
    </div>
  )
}

function EffectsStage({ project, onPatch, objects, onUpdateObject }) {
  const e = project.effects
  return (
    <div className="branding-form">
      <p className="cl-section-title">Ефекти</p>
      <p className="cl-tab-desc">Прозорість уже керується ключовими кадрами на етапі «Анімація». Тінь і обведення нижче — реальні ефекти: вони одразу малюються на канвасі (і враховуються в SVG-експорті), а не просто описані текстом.</p>
      {objects.length === 0 && <p className="cl-tab-desc">Спочатку додай об’єкти на етапі «Анімація».</p>}
      {objects.map((o) => {
        const shadow = o.shadow || defaultShadow()
        const stroke = o.stroke || defaultStroke()
        return (
          <div key={o.id} className="branding-name-card">
            <strong>{o.type === 'text' ? `Текст: «${o.text}»` : o.type === 'ellipse' ? 'Еліпс' : 'Прямокутник'}</strong>
            <label className="gfx-field">
              Базова прозорість
              <input type="range" min="0" max="1" step="0.05" value={o.opacity} onChange={(ev) => onUpdateObject(o.id, { opacity: Number(ev.target.value) })} />
            </label>

            <label className="gfx-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <input type="checkbox" checked={shadow.enabled} onChange={(ev) => onUpdateObject(o.id, { shadow: { ...shadow, enabled: ev.target.checked } })} />
              Тінь
            </label>
            {shadow.enabled && (
              <div className="branding-score-grid">
                <label className="gfx-field">Колір тіні
                  <input type="color" className="sketchpad-colorpicker" value={shadow.color} onChange={(ev) => onUpdateObject(o.id, { shadow: { ...shadow, color: ev.target.value } })} />
                </label>
                <label className="gfx-field">Розмиття ({shadow.blur}px)
                  <input type="range" min="0" max="60" value={shadow.blur} onChange={(ev) => onUpdateObject(o.id, { shadow: { ...shadow, blur: Number(ev.target.value) } })} />
                </label>
                <label className="gfx-field">Зсув X ({shadow.offsetX}px)
                  <input type="range" min="-40" max="40" value={shadow.offsetX} onChange={(ev) => onUpdateObject(o.id, { shadow: { ...shadow, offsetX: Number(ev.target.value) } })} />
                </label>
                <label className="gfx-field">Зсув Y ({shadow.offsetY}px)
                  <input type="range" min="-40" max="40" value={shadow.offsetY} onChange={(ev) => onUpdateObject(o.id, { shadow: { ...shadow, offsetY: Number(ev.target.value) } })} />
                </label>
              </div>
            )}

            <label className="gfx-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <input type="checkbox" checked={stroke.enabled} onChange={(ev) => onUpdateObject(o.id, { stroke: { ...stroke, enabled: ev.target.checked } })} />
              Обведення (контур)
            </label>
            {stroke.enabled && (
              <div className="branding-score-grid">
                <label className="gfx-field">Колір контуру
                  <input type="color" className="sketchpad-colorpicker" value={stroke.color} onChange={(ev) => onUpdateObject(o.id, { stroke: { ...stroke, color: ev.target.value } })} />
                </label>
                <label className="gfx-field">Товщина ({stroke.width}px)
                  <input type="range" min="1" max="20" value={stroke.width} onChange={(ev) => onUpdateObject(o.id, { stroke: { ...stroke, width: Number(ev.target.value) } })} />
                </label>
              </div>
            )}
          </div>
        )
      })}
      <p className="cl-tab-desc" style={{ marginTop: 14 }}><strong>Чесна межа:</strong> складніші ефекти (світіння/glow, розмиття самого об’єкта, частинки) студія поки не рендерить по-справжньому — якщо задум потребує такого, опиши його нижче й перенеси в один з інструментів модуля 9 (Rive, Cavalry) для реалізації.</p>
      <TextField label="Нотатки про інші ефекти (що не підтримує студія)" value={e.notes} onCommit={(v) => onPatch({ effects: { notes: v } })} textarea placeholder="Опиши задум — якщо вище немає потрібного ефекту" />
    </div>
  )
}

function SoundStage({ project, onPatch }) {
  const s = project.sound
  // Реальне прослуховування локального аудіофайлу (не просто текстове
  // поле-заглушка) — чесна межа: сам файл лишається тільки в цій вкладці
  // браузера (не йде на сервер і не зберігається в проєкті), бо студія
  // не вміє вшивати аудіо в JSON-стан прогресу.
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioName, setAudioName] = useState('')

  function pickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(URL.createObjectURL(file))
    setAudioName(file.name)
  }

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])

  return (
    <div className="branding-form">
      <p className="cl-section-title">Звук</p>
      <p className="cl-tab-desc">Завантаж свій аудіофайл і прослухай його тут по-справжньому — щоб перевірити настрій і темп, перш ніж синхронізувати з анімацією вручну (модуль 8).</p>

      <label className="gfx-field">
        Аудіофайл (mp3/wav/ogg)
        <input type="file" accept="audio/*" className="cl-text-input" onChange={pickFile} />
      </label>
      {audioUrl && (
        <div className="branding-name-card">
          <strong>{audioName}</strong>
          <audio controls src={audioUrl} style={{ width: '100%', marginTop: 8 }} />
        </div>
      )}
      <p className="cl-tab-desc"><strong>Чесна межа:</strong> цей файл не зберігається в проєкті й не завантажується на сервер — лише прев’ю в цій вкладці. Студія поки не вміє автоматично синхронізувати аудіодоріжку з таймлайном «Анімації» — познач потрібні акценти нотатками нижче. Безкоштовні джерела треків: YouTube Audio Library, Mixkit, Pixabay Audio (перевір ліцензію кожного файлу).</p>

      <TextField label="Концепція звуку/музики" value={s.concept} onCommit={(v) => onPatch({ sound: { ...s, concept: v } })} textarea placeholder="Який настрій, темп, які ключові звукові акценти" />
      <TextField label="Нотатки синхронізації" value={s.syncNotes} onCommit={(v) => onPatch({ sound: { ...s, syncNotes: v } })} textarea placeholder="Який момент анімації має співпасти з яким звуковим акцентом" />
    </div>
  )
}

function ExportStage({ project, objects, canvasSize, toastApi }) {
  function exportFrameSvg() {
    const w = canvasSize.w, h = canvasSize.h
    // Тінь/обведення мають виглядати в SVG так само, як на канвасі —
    // інакше експорт бреше про те, що насправді побудовано в студії.
    const defs = []
    const parts = objects.map((o, i) => {
      const shadow = o.shadow
      let filterAttr = ''
      if (shadow?.enabled) {
        const filterId = `shadow${i}`
        defs.push(`<filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${shadow.offsetX}" dy="${shadow.offsetY}" stdDeviation="${shadow.blur / 2}" flood-color="${shadow.color}"/></filter>`)
        filterAttr = ` filter="url(#${filterId})"`
      }
      const strokeAttr = o.stroke?.enabled ? ` stroke="${o.stroke.color}" stroke-width="${o.stroke.width}"` : ''
      if (o.type === 'ellipse') return `<ellipse cx="${o.x + o.w / 2}" cy="${o.y + o.h / 2}" rx="${o.w / 2}" ry="${o.h / 2}" fill="${o.fill}" opacity="${o.opacity}"${strokeAttr}${filterAttr} transform="rotate(${o.rotation} ${o.x + o.w / 2} ${o.y + o.h / 2})"/>`
      if (o.type === 'text') return `<text x="${o.x}" y="${o.y + o.h / 2}" font-size="${o.fontSize || 28}" font-family="system-ui, sans-serif" font-weight="600" fill="${o.fill}" opacity="${o.opacity}"${strokeAttr}${filterAttr} dominant-baseline="middle">${(o.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`
      return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${o.fill}" opacity="${o.opacity}"${strokeAttr}${filterAttr} transform="rotate(${o.rotation} ${o.x + o.w / 2} ${o.y + o.h / 2})"/>`
    })
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs.length > 0 ? `<defs>${defs.join('')}</defs>` : ''}${parts.join('')}</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    downloadBlob(blob, `${project.name || 'motion'}-frame.svg`)
    toastApi.show('✓ Кадр експортовано як SVG')
  }
  function exportProjectJson() {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${project.name || 'motion'}-project.json`)
    toastApi.show('✓ Проєкт експортовано як JSON')
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Експорт</p>
      <p className="cl-tab-desc">
        <strong>Чесна межа:</strong> ця студія не рендерить відео (MP4/GIF/WebM) чи Lottie-анімацію — лише окремий кадр (SVG) і дані проєкту (JSON). Для реального відеоекспорту використовуй безкоштовні інструменти з модуля 9: Rive, LottieFiles, Cavalry чи Blender — туди можна перенести ідею, таймінг і композицію, продумані тут.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="harmony-btn" onClick={exportFrameSvg}>⬇ Поточний кадр (SVG)</button>
        <button className="harmony-btn" onClick={exportProjectJson}>⬇ Дані проєкту (JSON)</button>
      </div>
      <p className="cl-section-title" style={{ marginTop: 18 }}>Безкоштовні інструменти для реального відеоекспорту</p>
      <div className="tools-row">
        <Link to="/tools/motion-design/rive" className="tool-badge tool-badge--free">Rive · безкоштовно</Link>
        <Link to="/tools/motion-design/lottiefiles" className="tool-badge tool-badge--free">LottieFiles · безкоштовно</Link>
        <Link to="/tools/motion-design/cavalry" className="tool-badge tool-badge--free">Cavalry · безкоштовно</Link>
        <Link to="/tools/3d-design/blender" className="tool-badge tool-badge--free">Blender · безкоштовно</Link>
      </div>
    </div>
  )
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function PresentationStage({ project, onPatch }) {
  const slides = project.presentation.slides
  const autoSummary = [
    project.idea.goal && `Мета: ${project.idea.goal}`,
    project.idea.format && `Формат: ${project.idea.format}`,
    project.storyboard.frames.length > 0 && `Кадрів у розкадровці: ${project.storyboard.frames.length}`,
    project.objects && project.objects.length > 0 && `Анімованих об’єктів: ${project.objects.length}`,
  ].filter(Boolean)
  function addSlide() {
    onPatch({ presentation: { slides: [...slides, { id: crypto.randomUUID(), title: '', content: '' }] } })
  }
  function update(id, patch) {
    onPatch({ presentation: { slides: slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) } })
  }
  function remove(id) {
    onPatch({ presentation: { slides: slides.filter((s) => s.id !== id) } })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Презентація</p>
      {autoSummary.length > 0 && (
        <div className="branding-name-card">
          <strong>Автоматично з проєкту:</strong>
          <ul>{autoSummary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      <button className="harmony-btn" onClick={addSlide}>+ Новий слайд</button>
      {slides.map((s, i) => (
        <div key={s.id} className="branding-name-card">
          <div className="gfx-row" style={{ alignItems: 'center' }}>
            <strong style={{ flex: 1 }}>Слайд {i + 1}</strong>
            <button className="cl-mini-btn" onClick={() => remove(s.id)}>Видалити</button>
          </div>
          <TextField label="Заголовок" value={s.title} onCommit={(v) => update(s.id, { title: v })} />
          <TextField label="Зміст" value={s.content} onCommit={(v) => update(s.id, { content: v })} textarea />
        </div>
      ))}
    </div>
  )
}

// ---------- Етап «Анімація»: реальний канвас + таймлайн + keyframes ----------

function AnimationStage({ project, onPatch, toastApi }) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const playRef = useRef(null)
  const objects = project.objects
  const [selectedId, setSelectedId] = useState(objects[0]?.id || null)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [easingForNewKf, setEasingForNewKf] = useState('easeOut')
  const duration = project.duration

  const selected = objects.find((o) => o.id === selectedId) || null
  // Канва має РЕАГУВАТИ на реальну доступну ширину центральної колонки
  // (aspect-ratio + width:100%), а не мати фіксовану піксельну ширину —
  // інакше на вузькому вікні вона просто вилазить за межі панелі й
  // ламає весь layout (обрізаний текст, горизонтальний скрол).
  const maxDisplayW = Math.min(project.canvas.w, 560)

  function commitObjects(next) { onPatch({ objects: next }) }

  function addShape(type) {
    const o = defaultObject(type, { x: project.canvas.w / 2 - 80, y: project.canvas.h / 2 - 45 })
    commitObjects([...objects, o])
    setSelectedId(o.id)
  }
  function deleteSelected() {
    if (!selected) return
    commitObjects(objects.filter((o) => o.id !== selected.id))
    setSelectedId(null)
  }
  function duplicateSelected() {
    if (!selected) return
    const copy = { ...selected, id: crypto.randomUUID(), x: selected.x + 16, y: selected.y + 16 }
    commitObjects([...objects, copy])
    setSelectedId(copy.id)
  }

  function pos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) }
  }

  function start(e) {
    if (!selected) {
      const hit = hitTest(objects, pos(e))
      if (hit) setSelectedId(hit.id)
      return
    }
    const p = pos(e)
    const frame = objectAt(selected, time)
    const h = hitHandle(frame, p)
    if (h === 'rotate') { dragRef.current = { mode: 'rotate', orig: frame }; return }
    if (h) { dragRef.current = { mode: 'resize', handle: h, orig: frame }; return }
    const hit = hitTest(objects.map((o) => objectAt(o, time)), p)
    if (hit && hit.id === selected.id) { dragRef.current = { mode: 'move', orig: frame, startP: p }; return }
    if (hit) { setSelectedId(hit.id); return }
    setSelectedId(null)
  }

  function move(e) {
    if (!dragRef.current || !selected) return
    e.preventDefault()
    const p = pos(e)
    const drag = dragRef.current
    let next = null
    if (drag.mode === 'move') next = { ...drag.orig, x: drag.orig.x + (p.x - drag.startP.x), y: drag.orig.y + (p.y - drag.startP.y) }
    if (drag.mode === 'resize') next = resizeObj(drag.orig, drag.handle, p)
    if (drag.mode === 'rotate') next = rotateObj(drag.orig, p)
    if (!next) return
    // Перетягування на канвасі в конкретний момент часу СТВОРЮЄ/ОНОВЛЮЄ
    // keyframe саме в цей момент — реальна дія, а не демонстрація.
    let updated = selected
    for (const prop of ['x', 'y', 'w', 'h', 'rotation']) {
      if (next[prop] !== drag.orig[prop]) updated = upsertKeyframe(updated, prop, time, next[prop], easingForNewKf)
    }
    commitObjects(objects.map((o) => (o.id === updated.id ? updated : o)))
  }

  function end() { dragRef.current = null }

  function setProp(prop, value) {
    if (!selected) return
    const updated = upsertKeyframe(selected, prop, time, value, easingForNewKf)
    commitObjects(objects.map((o) => (o.id === updated.id ? updated : o)))
  }

  function setBaseProp(patch) {
    if (!selected) return
    commitObjects(objects.map((o) => (o.id === selected.id ? { ...o, ...patch } : o)))
  }

  function removeKf(prop, id) {
    if (!selected) return
    const updated = removeKeyframe(selected, prop, id)
    commitObjects(objects.map((o) => (o.id === updated.id ? updated : o)))
  }

  function togglePlay() {
    if (playing) { setPlaying(false); return }
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) { if (playRef.current) cancelAnimationFrame(playRef.current); return }
    let last = performance.now()
    function tick(now) {
      const dt = now - last
      last = now
      setTime((t) => {
        const nt = t + dt
        if (nt >= duration) { setPlaying(false); return duration }
        return nt
      })
      playRef.current = requestAnimationFrame(tick)
    }
    playRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(playRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = project.canvas.w
    canvas.height = project.canvas.h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#17171A'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (const o of objects) {
      const frame = objectAt(o, time)
      drawObject(ctx, frame)
      if (o.id === selectedId) drawHandles(ctx, frame)
    }
  })

  const longestKf = maxKeyframeTime(objects)
  // Якщо на обраному об'єкті є хоча б 1 ключовий кадр на якійсь
  // властивості, але ніде немає 2+ — об'єкт виглядає «готовим», але
  // рухатись йому нічим (нема між чим інтерполювати). Це найчастіша
  // причина скарги «анімація не працює» — тому підказка має бути явною,
  // а не захованою в документації.
  const kfCounts = selected ? Object.values(selected.keyframes).map((kfs) => (kfs || []).length) : []
  const hasAnyKf = kfCounts.some((n) => n >= 1)
  const hasMotion = kfCounts.some((n) => n >= 2)

  return (
    <div className="motion-anim-stage">
      <p className="cl-tab-desc motion-howto">
        <strong>Як це працює:</strong> додай фігуру → клікни по шкалі часу внизу, щоб обрати момент → перемісти/зміни фігуру (чи введи число в полі праворуч) — ключовий кадр з'явиться в цю мить автоматично. Один кадр = нічого не рухається. Перейди в ІНШУ мить часу і зміни об'єкт ще раз — це додасть другий кадр, і між ними з'явиться рух. Натисни ▶, щоб перевірити.
      </p>
      <div className="motion-anim-toolbar">
        <button className="cl-mini-btn" onClick={() => addShape('rect')}>▭ Прямокутник</button>
        <button className="cl-mini-btn" onClick={() => addShape('ellipse')}>◯ Еліпс</button>
        <button className="cl-mini-btn" onClick={() => addShape('text')}>T Текст</button>
        {selected && <button className="cl-mini-btn" onClick={duplicateSelected}>⧉ Дублювати</button>}
        {selected && <button className="cl-mini-btn" onClick={deleteSelected}>🗑 Видалити</button>}
      </div>

      <div className="motion-anim-primary">
        <div className="motion-canvas-wrap" style={{ maxWidth: maxDisplayW, aspectRatio: `${project.canvas.w} / ${project.canvas.h}` }}>
          <span className="motion-time-badge">⏱ {(time / 1000).toFixed(2)}с</span>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%' }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
        </div>

        <Timeline
          objects={objects}
          selectedId={selectedId}
          onSelect={setSelectedId}
          time={time}
          duration={duration}
          onSeek={setTime}
          onDurationChange={(ms) => onPatch({ duration: Math.max(ms, longestKf + 200, 500) })}
          playing={playing}
          onTogglePlay={togglePlay}
          onRestart={() => setTime(0)}
        />
      </div>

      <div className="motion-props-panel">
        {!selected && <p className="cl-tab-desc">Додай чи обери об’єкт, щоб побачити властивості.</p>}
        {selected && (
          <>
            <p className="cl-section-title">{selected.type === 'text' ? 'Текст' : selected.type === 'ellipse' ? 'Еліпс' : 'Прямокутник'}</p>
            {hasAnyKf && !hasMotion && (
              <p className="motion-warning">⚠ Поки що лише 1 ключовий кадр — об'єкт не рухається. Клікни по іншому місцю на шкалі часу внизу й зміни цю фігуру ще раз, щоб додати другий кадр.</p>
            )}
            {selected.type === 'text' && (
              <label className="gfx-field">Текст
                <input className="cl-text-input" value={selected.text} onChange={(e) => setBaseProp({ text: e.target.value })} />
              </label>
            )}
            <label className="gfx-field">Колір
              <input type="color" className="sketchpad-colorpicker" value={selected.fill} onChange={(e) => setBaseProp({ fill: e.target.value })} />
            </label>
            <label className="gfx-field">
              Easing для нових ключових кадрів
              <select className="cl-text-input" value={easingForNewKf} onChange={(e) => setEasingForNewKf(e.target.value)}>
                {EASINGS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </label>
            {['x', 'y', 'w', 'h', 'rotation', 'opacity'].map((prop) => (
              <PropertyRow key={prop} prop={prop} obj={selected} time={time} onSet={setProp} onRemoveKf={removeKf} />
            ))}
          </>
        )}
      </div>

      {objects.length > 0 && (
        <button className="cl-mini-btn" style={{ marginTop: 8 }} onClick={() => toastApi.show(`Перевірено живцем: ${(duration / 1000).toFixed(1)}с (принцип з уроку 24304)`)}>
          ✓ Позначити: перевірено відтворенням
        </button>
      )}
    </div>
  )
}

function PropertyRow({ prop, obj, time, onSet, onRemoveKf }) {
  const labels = { x: 'X', y: 'Y', w: 'Ширина', h: 'Висота', rotation: 'Обертання', opacity: 'Прозорість' }
  const kfs = (obj.keyframes[prop] || []).slice().sort((a, b) => a.t - b.t)
  const current = valueAt(obj, prop, time)
  const step = prop === 'opacity' ? 0.05 : 1
  return (
    <div className="motion-prop-row">
      <label className="gfx-field">
        {labels[prop]}
        <input
          className="cl-text-input"
          type="number"
          step={step}
          value={Math.round(current * 100) / 100}
          onChange={(e) => onSet(prop, Number(e.target.value))}
        />
      </label>
      {kfs.length > 0 && (
        <div className="motion-kf-list">
          {kfs.map((k) => (
            <span key={k.id} className="motion-kf-chip">
              {(k.t / 1000).toFixed(1)}с: {Math.round(k.v * 100) / 100}
              <button type="button" onClick={() => onRemoveKf(prop, k.id)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Timeline({ objects, selectedId, onSelect, time, duration, onSeek, onDurationChange, playing, onTogglePlay, onRestart }) {
  const trackRef = useRef(null)
  function seekFromEvent(e) {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    onSeek(Math.round(ratio * duration))
  }
  return (
    <div className="motion-timeline">
      <div className="motion-timeline-controls">
        <button className="cl-mini-btn" onClick={onRestart}>⏮</button>
        <button className="cl-mini-btn" onClick={onTogglePlay}>{playing ? '⏸ Пауза' : '▶ Відтворити'}</button>
        <span className="motion-time-label">{(time / 1000).toFixed(2)}с / {(duration / 1000).toFixed(2)}с</span>
        <label className="gfx-field" style={{ marginLeft: 'auto', maxWidth: 140 }}>
          Тривалість (мс)
          <input className="cl-text-input" type="number" step="100" value={duration} onChange={(e) => onDurationChange(Number(e.target.value) || 500)} />
        </label>
      </div>
      <div className="motion-timeline-ruler" ref={trackRef} onPointerDown={(e) => { seekFromEvent(e); const move = (ev) => seekFromEvent(ev); const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up) }}>
        <div className="motion-playhead" style={{ left: `${(time / duration) * 100}%` }} />
      </div>
      <div className="motion-timeline-tracks">
        {objects.length === 0 && <p className="cl-tab-desc">Додай об’єкт на канвасі, щоб побачити доріжку.</p>}
        {objects.map((o) => {
          const allKfTimes = new Set()
          for (const prop of ['x', 'y', 'w', 'h', 'rotation', 'opacity']) {
            for (const k of o.keyframes[prop] || []) allKfTimes.add(k.t)
          }
          return (
            <div key={o.id} className={'motion-track' + (o.id === selectedId ? ' active' : '')} onClick={() => onSelect(o.id)}>
              <span className="motion-track-label">{o.type === 'text' ? `“${o.text}”` : o.type === 'ellipse' ? 'Еліпс' : 'Прямокутник'}</span>
              <div className="motion-track-lane">
                {[...allKfTimes].map((t) => (
                  <span key={t} className="motion-kf-dot" style={{ left: `${(t / duration) * 100}%` }} title={`${(t / 1000).toFixed(2)}с`} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Головний компонент ----------

export default function MotionStudio() {
  const { projectId } = useParams()
  const location = useLocation()
  const { motionProjects, saveMotionProject } = useProgress()
  const toastApi = useLabToast()
  const project = motionProjects.find((p) => p.id === projectId)
  const [stage, setStage] = useState(location.state?.stage || 'idea')

  if (!project) return <NotFound />

  function onPatch(patch) {
    saveMotionProject({ id: project.id, ...patch })
  }

  const help = STAGE_HELP[stage]

  return (
    <div className="branding-studio">
      <div className="dict-breadcrumb">
        <Link to="/academy/motion-design">Motion Design Studio</Link> <span>→</span> <span>{project.name}</span>
      </div>
      <div className="gfx-topbar motion-topbar-sticky">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} defaultValue={project.name} onBlur={(e) => onPatch({ name: e.target.value || 'Новий моушн-проєкт' })} placeholder="Назва проєкту" />
        <select className="cl-text-input" style={{ maxWidth: 220 }} defaultValue="" onChange={(e) => { const p = CANVAS_PRESETS.find((c) => c.id === e.target.value); if (p) onPatch({ canvas: { w: p.w, h: p.h } }) }}>
          <option value="" disabled>Розмір канви…</option>
          {CANVAS_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <button className="harmony-btn" onClick={() => { saveMotionProject(project); toastApi.show('✓ Збережено') }}>💾 Зберегти</button>
        <span className="motion-autosave-note">Кожна зміна зберігається автоматично — ця кнопка лише підтверджує збереження назви проєкту.</span>
      </div>

      <div className={'branding-layout' + (stage === 'animation' ? ' branding-layout--canvas' : '')}>
        <div className="branding-stages">
          {MOTION_STAGES.map((s) => (
            <button key={s.id} className={'branding-stage-btn' + (stage === s.id ? ' active' : '')} onClick={() => setStage(s.id)}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div className="branding-center">
          {stage === 'idea' && <IdeaStage project={project} onPatch={onPatch} />}
          {stage === 'storyboard' && <StoryboardStage project={project} onPatch={onPatch} />}
          {stage === 'animation' && <AnimationStage project={project} onPatch={onPatch} toastApi={toastApi} />}
          {stage === 'effects' && <EffectsStage project={project} onPatch={onPatch} objects={project.objects} onUpdateObject={(id, patch) => onPatch({ objects: project.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) })} />}
          {stage === 'sound' && <SoundStage project={project} onPatch={onPatch} />}
          {stage === 'export' && <ExportStage project={project} objects={project.objects} canvasSize={project.canvas} toastApi={toastApi} />}
          {stage === 'presentation' && <PresentationStage project={project} onPatch={onPatch} />}
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
        </div>
      </div>
      <LabToast message={toastApi.toast} />
    </div>
  )
}
