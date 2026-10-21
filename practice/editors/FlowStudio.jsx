import { useEffect, useRef, useState } from 'react'
import { versionRank } from '../practiceProject.js'

// Flow & Layout Studio (ТЗ 7.C) — v1-набір для UX/UI/Web/App: екрани
// (Frame) на спільному нескінченному полотні, прямокутники/текст/
// компоненти з бібліотеки, і Зв'язок — проста стрілка «екран А → екран
// Б», що й перевіряється валідаторами screenCount/hasLink/
// allScreensReachable (реальна перевірка досяжності графом, не фейкова).
//
// Реальна різниця версій (ТЗ розділ 4): v2 (рівень 4+) відкриває
// вирівнювання-прилипання (snap) до центру й країв екрана під час
// перетягування обʼєктів — досі перетягування не мало жодного
// снепінгу. v3 (рівень 8+) відкриває «▶ Переглянути прототип» —
// режим прогляду, що виконує обіцянку з попереднього дисклеймера
// («режим прототипу з клікабельним переглядом»): показує екрани по
// одному на весь канвас, клік будь-де на екрані переходить до
// першого звʼязку з нього (links — усе ще рівня «екран → екран», не
// прив'язані до конкретного обʼєкта/кнопки, тож це огляд структури
// переходів, а не повноцінна інтерактивна симуляція кліків по
// кнопках — чесно позначено як спрощення).
//
// Свідомо НЕ реалізовано цього заходу: Auto layout, сітки колонок 4/8/
// 12, constraints (прив'язка до країв), посилання на конкретний
// обʼєкт як тригер переходу (лише рівень екрана), перемикач адаптиву
// Mobile/Tablet/Desktop для ОДНОГО екрана (тут кожен розмір — окремий
// Frame, що теж чесно покриває "кілька екранів різних пристроїв",
// просто без автоматичної синхронізації вмісту між ними).

const FRAME_PRESETS = [
  { id: 'mobile', label: 'Mobile 375×812', w: 375, h: 812 },
  { id: 'android', label: 'Android 360×800', w: 360, h: 800 },
  { id: 'tablet', label: 'Tablet 768×1024', w: 768, h: 1024 },
  { id: 'desktop', label: 'Desktop 1440×900', w: 1440, h: 900 },
]

const COMPONENT_TYPES = [
  { id: 'button', label: 'Кнопка', w: 120, h: 44 },
  { id: 'input', label: 'Поле вводу', w: 220, h: 44 },
  { id: 'checkbox', label: 'Чекбокс', w: 20, h: 20 },
  { id: 'switch', label: 'Перемикач', w: 44, h: 24 },
  { id: 'card', label: 'Картка', w: 220, h: 140 },
  { id: 'nav', label: 'Нав-панель', w: 360, h: 56 },
  { id: 'tab', label: 'Таб', w: 90, h: 36 },
  { id: 'modal', label: 'Модальне вікно', w: 280, h: 180 },
  { id: 'listitem', label: 'Елемент списку', w: 320, h: 56 },
]

const STATES = ['default', 'hover', 'pressed', 'disabled', 'error']

function uid() { return crypto.randomUUID().slice(0, 8) }

function componentStyle(type, state) {
  const base = { fill: '#2E6DFF', stroke: 'none', radius: 8 }
  if (type === 'input') return { fill: '#ffffff', stroke: '#E3E1D9', radius: 8 }
  if (type === 'checkbox') return { fill: '#ffffff', stroke: '#68676E', radius: 4 }
  if (type === 'switch') return { fill: '#D8D6CE', stroke: 'none', radius: 12 }
  if (type === 'card') return { fill: '#ffffff', stroke: '#E3E1D9', radius: 12 }
  if (type === 'nav') return { fill: '#17171A', stroke: 'none', radius: 0 }
  if (type === 'tab') return { fill: '#F5F4F0', stroke: '#E3E1D9', radius: 8 }
  if (type === 'modal') return { fill: '#ffffff', stroke: '#17171A', radius: 14 }
  if (type === 'listitem') return { fill: '#ffffff', stroke: '#E3E1D9', radius: 0 }
  if (state === 'disabled') return { ...base, fill: '#D8D6CE' }
  if (state === 'pressed') return { ...base, fill: '#1E4FC4' }
  if (state === 'hover') return { ...base, fill: '#4A82FF' }
  if (state === 'error') return { ...base, fill: '#E0523E' }
  return base
}

function ComponentNode({ o, selected, onDown }) {
  const s = componentStyle(o.componentType, o.state)
  const common = { onPointerDown: (e) => onDown(e, o.id), style: { cursor: 'move' } }
  return (
    <g {...common}>
      <rect x={o.x} y={o.y} width={o.w} height={o.h} rx={s.radius} fill={s.fill} stroke={s.stroke} strokeWidth={s.stroke === 'none' ? 0 : 1.5} />
      {['button', 'tab'].includes(o.componentType) && (
        <text x={o.x + o.w / 2} y={o.y + o.h / 2 + 4} textAnchor="middle" fontSize={13} fill={o.componentType === 'button' ? '#fff' : '#17171A'}>{o.label || COMPONENT_TYPES.find((c) => c.id === o.componentType)?.label}</text>
      )}
      {selected && <rect x={o.x - 3} y={o.y - 3} width={o.w + 6} height={o.h + 6} fill="none" stroke="#F59E0B" strokeDasharray="4 3" pointerEvents="none" />}
    </g>
  )
}

const SNAP = 8

export default function FlowStudio({ project, version, onChange }) {
  const vRank = versionRank(version || 'v1')
  const [tool, setTool] = useState('select')
  const [selectedId, setSelectedId] = useState(null)
  const [bottomTab, setBottomTab] = useState('screens')
  const [compPick, setCompPick] = useState('button')
  const [linkFrom, setLinkFrom] = useState(null)
  const [guideHint, setGuideHint] = useState(null)
  const [previewFrameId, setPreviewFrameId] = useState(null)
  const svgRef = useRef(null)
  const dragRef = useRef(null)

  const frames = project.frames || []
  const objects = project.objects || []
  const links = project.links || []

  const bounds = frames.reduce((b, f) => ({
    minX: Math.min(b.minX, f.x), minY: Math.min(b.minY, f.y),
    maxX: Math.max(b.maxX, f.x + f.w), maxY: Math.max(b.maxY, f.y + f.h),
  }), { minX: 0, minY: 0, maxX: 800, maxY: 600 })
  const vb = { x: bounds.minX - 40, y: bounds.minY - 40, w: bounds.maxX - bounds.minX + 80, h: bounds.maxY - bounds.minY + 80 }

  const selectedObj = objects.find((o) => o.id === selectedId) || null
  const selectedFrame = frames.find((f) => f.id === selectedId) || null

  useEffect(() => {
    if (previewFrameId && !frames.some((f) => f.id === previewFrameId)) setPreviewFrameId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, previewFrameId])

  function patch(nextObjects, nextFrames) {
    onChange({ ...project, objects: nextObjects ?? objects, frames: nextFrames ?? frames })
  }
  function updateObj(patchObj) { patch(objects.map((o) => (o.id === selectedId ? { ...o, ...patchObj } : o))) }
  function updateFrame(patchObj) { patch(undefined, frames.map((f) => (f.id === selectedId ? { ...f, ...patchObj } : f))) }

  function addFrame(preset) {
    const x = frames.length === 0 ? 0 : Math.max(...frames.map((f) => f.x + f.w)) + 60
    const frame = { id: uid(), name: `Екран ${frames.length + 1}`, device: preset.id, w: preset.w, h: preset.h, x, y: 0 }
    patch(undefined, [...frames, frame])
    setSelectedId(frame.id)
    setTool('select')
  }

  function nearestFrameId(x, y) {
    const f = frames.find((fr) => x >= fr.x && x <= fr.x + fr.w && y >= fr.y && y <= fr.y + fr.h)
    return f?.id || null
  }

  function pos(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const scale = vb.w / rect.width
    return { x: vb.x + (e.clientX - rect.left) * scale, y: vb.y + (e.clientY - rect.top) * scale }
  }

  function canvasClick(e) {
    const p = pos(e)
    if (tool === 'rect' || tool === 'text') {
      const obj = tool === 'rect'
        ? { id: uid(), type: 'rect', x: p.x - 50, y: p.y - 30, w: 100, h: 60, fill: '#2E6DFF', frameId: nearestFrameId(p.x, p.y) }
        : { id: uid(), type: 'text', x: p.x - 40, y: p.y - 10, w: 120, h: 24, text: 'Текст', fontFamily: 'Arial', fontSize: 18, fill: '#17171A', frameId: nearestFrameId(p.x, p.y) }
      patch([...objects, obj])
      setSelectedId(obj.id)
      setTool('select')
      return
    }
    if (tool === 'component') {
      const c = COMPONENT_TYPES.find((c) => c.id === compPick)
      const obj = { id: uid(), type: 'component', componentType: c.id, state: 'default', x: p.x - c.w / 2, y: p.y - c.h / 2, w: c.w, h: c.h, frameId: nearestFrameId(p.x, p.y) }
      patch([...objects, obj])
      setSelectedId(obj.id)
      setTool('select')
      return
    }
    if (tool === 'select') setSelectedId(null)
  }

  function onNodeDown(e, id, isFrame) {
    // Коли активний інструмент створення (R/T/K) і клік стався на екрані
    // чи на вже існуючому обʼєкті (isFrame або ні) — НЕ перехоплюємо
    // подію як "обрати це": пропускаємо її далі до canvasClick на <svg>,
    // щоб новий обʼєкт справді зʼявився там, де клікнули, а не ігнорувався.
    // Без цього інструменти прямокутника/тексту/компонента працювали б
    // лише в порожньому просторі, а клік по вже існуючому обʼєкту (напр.
    // кнопка поверх модального вікна) просто вибирав би той обʼєкт і
    // мовчки не створював нічого нового.
    if (['rect', 'text', 'component'].includes(tool)) return
    e.stopPropagation()
    if (tool === 'link' && isFrame) {
      if (!linkFrom) { setLinkFrom(id); return }
      if (linkFrom !== id) {
        onChange({ ...project, links: [...links, { id: uid(), from: linkFrom, to: id }] })
      }
      setLinkFrom(null)
      setTool('select')
      return
    }
    setSelectedId(id)
    if (tool !== 'select') return
    const list = isFrame ? frames : objects
    const item = list.find((x) => x.id === id)
    const rect = svgRef.current.getBoundingClientRect()
    const scale = vb.w / rect.width
    dragRef.current = { id, isFrame, startX: e.clientX, startY: e.clientY, ox: item.x, oy: item.y, scale }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  function onMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) * d.scale
    const dy = (e.clientY - d.startY) * d.scale
    let nx = Math.round(d.ox + dx), ny = Math.round(d.oy + dy)
    if (d.isFrame) {
      patch(undefined, frames.map((f) => (f.id === d.id ? { ...f, x: nx, y: ny } : f)))
      return
    }
    // v2: вирівнювання-прилипання до центру й країв рідного екрана —
    // лише для обʼєктів (не для самих екранів, у яких немає "батька").
    if (vRank >= 1) {
      const obj = objects.find((o) => o.id === d.id)
      const frame = frames.find((f) => f.id === obj?.frameId)
      if (frame) {
        const w = obj.w || 0, h = obj.h || 0
        const objCenterX = nx + w / 2, objCenterY = ny + h / 2
        const frameCenterX = frame.x + frame.w / 2, frameCenterY = frame.y + frame.h / 2
        let aligned = false
        if (Math.abs(objCenterX - frameCenterX) < SNAP) { nx = Math.round(frameCenterX - w / 2); aligned = true }
        if (Math.abs(objCenterY - frameCenterY) < SNAP) { ny = Math.round(frameCenterY - h / 2); aligned = true }
        if (Math.abs(nx - frame.x) < SNAP) { nx = frame.x; aligned = true }
        if (Math.abs(ny - frame.y) < SNAP) { ny = frame.y; aligned = true }
        if (Math.abs(nx + w - (frame.x + frame.w)) < SNAP) { nx = frame.x + frame.w - w; aligned = true }
        if (Math.abs(ny + h - (frame.y + frame.h)) < SNAP) { ny = frame.y + frame.h - h; aligned = true }
        setGuideHint(aligned ? { x: nx + w / 2, y: ny + h / 2 } : null)
      }
    }
    patch(objects.map((o) => (o.id === d.id ? { ...o, x: nx, y: ny } : o)))
  }
  function onUp() {
    dragRef.current = null
    setGuideHint(null)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  function deleteSelected() {
    if (selectedFrame) {
      patch(objects.filter((o) => o.frameId !== selectedId), frames.filter((f) => f.id !== selectedId))
      onChange({ ...project, links: links.filter((l) => l.from !== selectedId && l.to !== selectedId) })
    } else if (selectedObj) {
      patch(objects.filter((o) => o.id !== selectedId))
    }
    setSelectedId(null)
  }

  function frameCenter(id) {
    const f = frames.find((x) => x.id === id)
    return f ? { x: f.x + f.w / 2, y: f.y + f.h / 2 } : { x: 0, y: 0 }
  }

  return (
    <>
      <div className="practice-toolbar">
        <button className={'practice-tool-btn' + (tool === 'select' ? ' active' : '')} title="Вибір (V)" onClick={() => setTool('select')} aria-label="Вибір">↖</button>
        <button className={'practice-tool-btn' + (tool === 'rect' ? ' active' : '')} title="Прямокутник (R)" onClick={() => setTool('rect')} aria-label="Прямокутник">▭</button>
        <button className={'practice-tool-btn' + (tool === 'text' ? ' active' : '')} title="Текст (T)" onClick={() => setTool('text')} aria-label="Текст">T</button>
        <button className={'practice-tool-btn' + (tool === 'component' ? ' active' : '')} title="Компонент (K)" onClick={() => setTool('component')} aria-label="Компонент">⬚</button>
        <button className={'practice-tool-btn' + (tool === 'link' ? ' active' : '')} title="Зв’язок (Shift+L)" onClick={() => { setTool('link'); setLinkFrom(null) }} aria-label="Зв’язок">↗</button>
        <div className="practice-tool-sep" />
        <button className="practice-tool-btn" title="Видалити" onClick={deleteSelected} aria-label="Видалити">🗑</button>
        {vRank >= 2 && frames.length > 0 && (
          <>
            <div className="practice-tool-sep" />
            <button className="practice-tool-btn" title="Переглянути прототип (v3)" onClick={() => setPreviewFrameId(frames[0].id)} aria-label="Переглянути прототип">▶</button>
          </>
        )}
      </div>

      <div className="practice-canvas" style={{ position: 'relative' }}>
        {previewFrameId && (() => {
          const f = frames.find((x) => x.id === previewFrameId)
          if (!f) return null
          const outgoing = links.find((l) => l.from === previewFrameId)
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#17171A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="cl-tab-desc" style={{ color: '#F5F4F0' }}>{f.name}{!outgoing && ' · кінцевий екран (переходу немає)'}</span>
                <button className="cl-mini-btn" onClick={() => setPreviewFrameId(null)}>✕ Закрити перегляд</button>
              </div>
              <svg
                className="flow-preview-svg"
                viewBox={`${f.x} ${f.y} ${f.w} ${f.h}`}
                style={{ maxWidth: '90%', maxHeight: '80%', background: '#fff', cursor: outgoing ? 'pointer' : 'default', boxShadow: '0 4px 24px rgba(0,0,0,.4)' }}
                onClick={() => outgoing && setPreviewFrameId(outgoing.to)}
              >
                {objects.filter((o) => o.frameId === previewFrameId).map((o) => {
                  if (o.type === 'component') return <ComponentNode key={o.id} o={o} selected={false} onDown={() => {}} />
                  if (o.type === 'rect') return <rect key={o.id} x={o.x} y={o.y} width={o.w} height={o.h} fill={o.fill} />
                  if (o.type === 'text') return <text key={o.id} x={o.x} y={o.y + o.fontSize} fontFamily={o.fontFamily} fontSize={o.fontSize} fill={o.fill}>{o.text}</text>
                  return null
                })}
              </svg>
              <p className="cl-tab-desc" style={{ color: '#9b9a9f', marginTop: 8 }}>
                {outgoing ? 'Клікни будь-де на екрані, щоб перейти далі.' : 'У цього екрана ще немає вихідного зв’язку.'}
              </p>
            </div>
          )
        })()}
        <svg ref={svgRef} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className="vector-studio-svg" style={{ background: '#2a2756' }} onPointerDown={canvasClick}>
          {links.map((l) => {
            const a = frameCenter(l.from), b = frameCenter(l.to)
            return <line key={l.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#F59E0B" strokeWidth={2} markerEnd="url(#arrow)" opacity={0.8} />
          })}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#F59E0B" /></marker>
          </defs>
          {frames.map((f) => (
            <g key={f.id} onPointerDown={(e) => onNodeDown(e, f.id, true)} style={{ cursor: tool === 'link' ? 'crosshair' : 'move' }}>
              <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#fff" stroke={f.id === selectedId || f.id === linkFrom ? '#F59E0B' : '#17171A'} strokeWidth={f.id === selectedId || f.id === linkFrom ? 3 : 1.5} />
              <text x={f.x} y={f.y - 8} fontSize={13} fill="#F5F4F0">{f.name}</text>
            </g>
          ))}
          {objects.map((o) => {
            if (o.type === 'component') return <ComponentNode key={o.id} o={o} selected={o.id === selectedId} onDown={onNodeDown} />
            if (o.type === 'rect') return <rect key={o.id} x={o.x} y={o.y} width={o.w} height={o.h} fill={o.fill} onPointerDown={(e) => onNodeDown(e, o.id)} style={{ cursor: 'move' }} stroke={o.id === selectedId ? '#F59E0B' : 'none'} strokeWidth={o.id === selectedId ? 2 : 0} />
            if (o.type === 'text') return <text key={o.id} x={o.x} y={o.y + o.fontSize} fontFamily={o.fontFamily} fontSize={o.fontSize} fill={o.fill} onPointerDown={(e) => onNodeDown(e, o.id)} style={{ cursor: 'move' }}>{o.text}</text>
            return null
          })}
          {guideHint && <circle cx={guideHint.x} cy={guideHint.y} r={3} fill="#F59E0B" />}
        </svg>
      </div>

      <div className="practice-properties">
        <p className="cl-section-title">Властивості</p>
        {!selectedObj && !selectedFrame && <p className="cl-tab-desc">Обери екран чи об’єкт на полотні.</p>}
        {selectedFrame && (
          <>
            <label className="gfx-field">Назва екрана
              <input className="cl-text-input" value={selectedFrame.name} onChange={(e) => updateFrame({ name: e.target.value })} />
            </label>
            <p className="cl-tab-desc">{selectedFrame.w}×{selectedFrame.h}px</p>
          </>
        )}
        {selectedObj && (
          <>
            {selectedObj.type === 'text' && (
              <label className="gfx-field">Текст
                <input className="cl-text-input" value={selectedObj.text} onChange={(e) => updateObj({ text: e.target.value })} />
              </label>
            )}
            {selectedObj.type === 'component' && (
              <label className="gfx-field">Стан
                <select className="cl-text-input" value={selectedObj.state} onChange={(e) => updateObj({ state: e.target.value })}>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            )}
            <div className="gfx-row">
              <label className="gfx-num">W<input type="number" value={Math.round(selectedObj.w)} onChange={(e) => updateObj({ w: Math.max(4, Number(e.target.value)) })} /></label>
              <label className="gfx-num">H<input type="number" value={Math.round(selectedObj.h)} onChange={(e) => updateObj({ h: Math.max(4, Number(e.target.value)) })} /></label>
            </div>
            {(selectedObj.type === 'rect' || selectedObj.type === 'text') && (
              <label className="gfx-field">Колір
                <input type="color" value={selectedObj.fill} onChange={(e) => updateObj({ fill: e.target.value })} />
              </label>
            )}
          </>
        )}
      </div>

      <div className="practice-bottom">
        <div className="practice-bottom-tabs">
          <button className={bottomTab === 'screens' ? 'active' : ''} onClick={() => setBottomTab('screens')}>Екрани</button>
          <button className={bottomTab === 'components' ? 'active' : ''} onClick={() => setBottomTab('components')}>Компоненти</button>
        </div>
        {bottomTab === 'screens' && (
          <div className="practice-layers">
            {frames.length === 0 && <p className="cl-tab-desc">Ще немає жодного екрана — додай пресетом нижче.</p>}
            {frames.map((f) => (
              <div key={f.id} className={'ux-list-row' + (f.id === selectedId ? ' active' : '')}>
                <button className="cl-mini-btn" style={{ flex: 1, textAlign: 'left' }} onClick={() => setSelectedId(f.id)}>{f.name} · {f.w}×{f.h}</button>
              </div>
            ))}
            <div className="cl-btn-row" style={{ marginTop: 6 }}>
              {FRAME_PRESETS.map((p) => <button key={p.id} className="cl-mini-btn" onClick={() => addFrame(p)}>+ {p.label}</button>)}
            </div>
          </div>
        )}
        {bottomTab === 'components' && (
          <div className="practice-palette">
            <div className="cl-btn-row">
              {COMPONENT_TYPES.map((c) => (
                <button key={c.id} className={'cl-mini-btn' + (compPick === c.id ? ' active' : '')} onClick={() => { setCompPick(c.id); setTool('component') }}>{c.label}</button>
              ))}
            </div>
            <p className="cl-tab-desc">Обери компонент і клікни на полотні, щоб додати (інструмент «Компонент» активується сам).</p>
          </div>
        )}
      </div>
    </>
  )
}
