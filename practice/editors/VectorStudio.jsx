import { useEffect, useRef, useState } from 'react'
import { versionRank } from '../practiceProject.js'

// Vector Studio (ТЗ 7.B) — v1-набір: Вибір/Прямокутник/Еліпс/Зірка/Лінія/
// Текст/Піпетка, властивості заливки-контуру-позиції-тексту, шари,
// палітра, один артборд. Контракт редактора: project/version/allowedTools/
// onChange(nextProject) — див. коментар у PracticeShell.jsx.
//
// Реальна різниця версій (не лише розблокування за рівнем — ТЗ розділ 4):
// v2 (рівень 4+) відкриває градієнтну заливку (2 кольори, лінійний
// перехід) для прямокутника/еліпса/зірки. v3 (рівень 8+) додатково
// відкриває інструмент «Перо» — довільний контур із прямих сегментів
// (клік додає точку, Enter замикає фігуру, Esc скасовує), що вперше
// реально задіює валідатор pathNodesMax із practiceValidators.js (він
// був визначений раніше, але жоден інструмент досі не створював
// обʼєктів type:'path').
//
// Свідомо НЕ реалізовано цього заходу (чесно, не приховано): криві
// Безьє/ручки дотичних у пера (лише прямі сегменти), редагування вузлів
// існуючого контуру (A), булеві операції, маски, текст по контуру/
// символи, декілька артбордів одночасно. Властивості розміру
// редагуються числовими полями, а не ручками resize-рамки — звужує
// функціонал, але лишається чесним інструментом без половинчастої,
// ненадійної реалізації перетягування за кут.

const BASE_TOOLS = [
  { id: 'select', icon: '↖', label: 'Вибір', key: 'V' },
  { id: 'rect', icon: '▭', label: 'Прямокутник', key: 'R' },
  { id: 'ellipse', icon: '◯', label: 'Еліпс', key: 'E' },
  { id: 'star', icon: '★', label: 'Зірка', key: 'Shift+P' },
  { id: 'line', icon: '╱', label: 'Лінія', key: 'L' },
  { id: 'text', icon: 'T', label: 'Текст', key: 'T' },
]
const PATH_TOOL = { id: 'path', icon: '✎', label: 'Перо', key: 'P' }
const EYEDROPPER_TOOL = { id: 'eyedropper', icon: '💧', label: 'Піпетка', key: 'I' }

function toolsForVersion(vRank) {
  return vRank >= 2 ? [...BASE_TOOLS, PATH_TOOL, EYEDROPPER_TOOL] : [...BASE_TOOLS, EYEDROPPER_TOOL]
}
// Для пошуку іконки в шарах — незалежно від версії, щоб обʼєкт типу
// 'path', створений на v3, не лишився без іконки, якщо студент пізніше
// перемкнув версію назад на v1/v2.
const ALL_TOOLS = [...BASE_TOOLS, PATH_TOOL, EYEDROPPER_TOOL]

export const FONTS = [
  'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma',
  'Trebuchet MS', 'Segoe UI', 'Impact', 'Comic Sans MS', 'Palatino Linotype', 'Brush Script MT',
]

const SNAP = 6

function uid() { return crypto.randomUUID().slice(0, 8) }

function makeObject(type, x, y) {
  const base = { id: uid(), type, x, y, rotation: 0, opacity: 1, guideAligned: false }
  if (type === 'rect') return { ...base, w: 100, h: 70, fill: '#2E6DFF', stroke: 'none', strokeWidth: 0 }
  if (type === 'ellipse') return { ...base, w: 90, h: 90, fill: '#F59E0B', stroke: 'none', strokeWidth: 0 }
  if (type === 'star') return { ...base, w: 90, h: 90, fill: '#FF5A1F', stroke: 'none', strokeWidth: 0 }
  if (type === 'line') return { ...base, w: 120, h: 0, stroke: '#17171A', strokeWidth: 3 }
  if (type === 'text') return { ...base, w: 160, h: 30, text: 'Текст', fontFamily: 'Arial', fontSize: 24, fill: '#17171A' }
  return base
}

function starPoints(cx, cy, w, h) {
  const spikes = 5
  const outerX = w / 2, outerY = h / 2
  const innerX = outerX * 0.42, innerY = outerY * 0.42
  let pts = []
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (Math.PI / spikes) * i - Math.PI / 2
    const rx = i % 2 === 0 ? outerX : innerX
    const ry = i % 2 === 0 ? outerY : innerY
    pts.push(`${cx + Math.cos(ang) * rx},${cy + Math.sin(ang) * ry}`)
  }
  return pts.join(' ')
}

function fillOf(o) {
  return o.fill2 ? `url(#grad-${o.id})` : o.fill
}

function pathBBox(o) {
  const xs = (o.points || []).map((p) => p.x), ys = (o.points || []).map((p) => p.y)
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 0)
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 0)
  return { x: o.x + minX, y: o.y + minY, w: maxX - minX, h: maxY - minY }
}

function ShapeEl({ o, selected, onDown }) {
  const common = { opacity: o.opacity, onPointerDown: (e) => onDown(e, o.id), style: { cursor: 'move' } }
  let node = null
  if (o.type === 'rect') node = (
    <>
      {o.fill2 && <defs><linearGradient id={`grad-${o.id}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={o.fill} /><stop offset="100%" stopColor={o.fill2} /></linearGradient></defs>}
      <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={fillOf(o)} stroke={o.stroke} strokeWidth={o.strokeWidth} {...common} />
    </>
  )
  else if (o.type === 'ellipse') node = (
    <>
      {o.fill2 && <defs><linearGradient id={`grad-${o.id}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={o.fill} /><stop offset="100%" stopColor={o.fill2} /></linearGradient></defs>}
      <ellipse cx={o.x + o.w / 2} cy={o.y + o.h / 2} rx={o.w / 2} ry={o.h / 2} fill={fillOf(o)} stroke={o.stroke} strokeWidth={o.strokeWidth} {...common} />
    </>
  )
  else if (o.type === 'star') node = (
    <>
      {o.fill2 && <defs><linearGradient id={`grad-${o.id}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={o.fill} /><stop offset="100%" stopColor={o.fill2} /></linearGradient></defs>}
      <polygon points={starPoints(o.x + o.w / 2, o.y + o.h / 2, o.w, o.h)} fill={fillOf(o)} {...common} />
    </>
  )
  else if (o.type === 'line') node = <line x1={o.x} y1={o.y} x2={o.x + o.w} y2={o.y + o.h} stroke={o.stroke} strokeWidth={o.strokeWidth} strokeLinecap="round" {...common} />
  else if (o.type === 'text') node = <text x={o.x} y={o.y + o.fontSize} fontFamily={o.fontFamily} fontSize={o.fontSize} fill={o.fill} {...common}>{o.text}</text>
  else if (o.type === 'path') node = <polygon points={(o.points || []).map((p) => `${o.x + p.x},${o.y + p.y}`).join(' ')} fill={o.fill} stroke={o.stroke} strokeWidth={o.strokeWidth} {...common} />
  if (!selected) return node
  const b = o.type === 'path'
    ? (() => { const bb = pathBBox(o); return { x: bb.x - 4, y: bb.y - 4, w: bb.w + 8, h: bb.h + 8 } })()
    : { x: o.x - 4, y: o.y - 4, w: (o.w || 0) + 8, h: (o.type === 'line' ? Math.abs(o.h) : o.h || 0) + 8 }
  return <g>{node}<rect x={b.x} y={o.type === 'line' ? Math.min(o.y, o.y + o.h) - 4 : b.y} width={b.w} height={b.h} fill="none" stroke="#F59E0B" strokeDasharray="4 3" pointerEvents="none" /></g>
}

export default function VectorStudio({ project, version, onChange }) {
  const ab = project.artboards[0]
  const vRank = versionRank(version || 'v1')
  const TOOLS = toolsForVersion(vRank)
  const [tool, setTool] = useState('select')
  const [selectedId, setSelectedId] = useState(null)
  const [bottomTab, setBottomTab] = useState('layers')
  const svgRef = useRef(null)
  const dragRef = useRef(null)
  const [guideHint, setGuideHint] = useState(null)
  const [drawingPoints, setDrawingPoints] = useState([])

  const selected = project.objects.find((o) => o.id === selectedId) || null
  const centerX = ab.w / 2, centerY = ab.h / 2

  function finishPath() {
    if (drawingPoints.length < 3) { setDrawingPoints([]); return }
    const xs = drawingPoints.map((p) => p.x), ys = drawingPoints.map((p) => p.y)
    const minX = Math.min(...xs), minY = Math.min(...ys)
    const obj = {
      id: uid(), type: 'path', x: minX, y: minY, rotation: 0, opacity: 1, guideAligned: false,
      points: drawingPoints.map((p) => ({ x: p.x - minX, y: p.y - minY })),
      fill: '#2E6DFF', stroke: 'none', strokeWidth: 0,
    }
    patchObjects([...project.objects, obj])
    setSelectedId(obj.id)
    setDrawingPoints([])
    setTool('select')
  }

  useEffect(() => {
    if (tool !== 'path') return
    function onKeyDown(e) {
      if (e.key === 'Enter') { e.preventDefault(); finishPath() }
      else if (e.key === 'Escape') { setDrawingPoints([]) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, drawingPoints])

  function patchObjects(next) { onChange({ ...project, objects: next }) }
  function updateSelected(patch) { patchObjects(project.objects.map((o) => (o.id === selectedId ? { ...o, ...patch } : o))) }

  function pos(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const scale = ab.w / rect.width
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale }
  }

  function canvasClick(e) {
    if (tool === 'select') { setSelectedId(null); return }
    const p = pos(e)
    if (tool === 'eyedropper') {
      if (selected) return
      return
    }
    if (tool === 'path') {
      setDrawingPoints((pts) => [...pts, { x: Math.round(p.x), y: Math.round(p.y) }])
      return
    }
    const obj = makeObject(tool, p.x - 45, p.y - 35)
    patchObjects([...project.objects, obj])
    setSelectedId(obj.id)
    setTool('select')
  }

  function onShapeDown(e, id) {
    // Коли активний інструмент малювання (rect/ellipse/star/line/text) і
    // клік стався на вже існуючій фігурі — НЕ перехоплюємо подію як "обрати
    // цю фігуру": пропускаємо її далі до canvasClick, щоб нова фігура
    // справді зʼявилась там, де клікнули (напр. фігури внакладку для
    // прийому негативного простору), а не ігнорувалась мовчки.
    if (['rect', 'ellipse', 'star', 'line', 'text', 'path'].includes(tool)) return
    e.stopPropagation()
    if (tool === 'eyedropper') {
      const src = project.objects.find((o) => o.id === id)
      if (src && selected) updateSelected({ fill: src.fill })
      return
    }
    setSelectedId(id)
    if (tool !== 'select') return
    const obj = project.objects.find((o) => o.id === id)
    const rect = svgRef.current.getBoundingClientRect()
    const scale = ab.w / rect.width
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, ox: obj.x, oy: obj.y, scale }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function onMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) * d.scale
    const dy = (e.clientY - d.startY) * d.scale
    let nx = d.ox + dx, ny = d.oy + dy
    const obj = project.objects.find((o) => o.id === d.id)
    const w = obj.w || 0, h = Math.abs(obj.h || 0)
    const objCenterX = nx + w / 2, objCenterY = ny + h / 2
    let aligned = false
    if (Math.abs(objCenterX - centerX) < SNAP) { nx = centerX - w / 2; aligned = true }
    if (Math.abs(objCenterY - centerY) < SNAP) { ny = centerY - h / 2; aligned = true }
    if (Math.abs(nx - 0) < SNAP) { nx = 0; aligned = true }
    if (Math.abs(ny - 0) < SNAP) { ny = 0; aligned = true }
    setGuideHint(aligned ? { x: objCenterX, y: objCenterY } : null)
    patchObjects(project.objects.map((o) => (o.id === d.id ? { ...o, x: Math.round(nx), y: Math.round(ny), guideAligned: o.guideAligned || aligned } : o)))
  }

  function onUp() {
    dragRef.current = null
    setGuideHint(null)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  function deleteSelected() {
    if (!selectedId) return
    patchObjects(project.objects.filter((o) => o.id !== selectedId))
    setSelectedId(null)
  }
  function duplicateSelected() {
    if (!selected) return
    const copy = { ...selected, id: uid(), x: selected.x + 14, y: selected.y + 14 }
    patchObjects([...project.objects, copy])
    setSelectedId(copy.id)
  }
  function reorder(id, dir) {
    const idx = project.objects.findIndex((o) => o.id === id)
    const j = idx + dir
    if (j < 0 || j >= project.objects.length) return
    const next = [...project.objects]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    patchObjects(next)
  }

  function saveVariant() {
    const entry = { id: uid(), objects: structuredClone(project.objects), savedAt: new Date().toISOString() }
    onChange({ ...project, variants: [entry, ...(project.variants || [])] })
  }
  function loadVariant(entry) {
    patchObjects(structuredClone(entry.objects))
    setSelectedId(null)
  }
  function removeVariant(id) {
    onChange({ ...project, variants: (project.variants || []).filter((v) => v.id !== id) })
  }

  function addPaletteColor(hex) {
    if (project.palette.includes(hex)) return
    onChange({ ...project, palette: [...project.palette, hex] })
  }
  function removePaletteColor(hex) {
    onChange({ ...project, palette: project.palette.filter((c) => c !== hex) })
  }

  function exportSvg() {
    const svgEl = svgRef.current
    const serializer = new XMLSerializer()
    const clone = svgEl.cloneNode(true)
    clone.querySelectorAll('.vs-selection-mark').forEach((n) => n.remove())
    const str = serializer.serializeToString(clone)
    const blob = new Blob([str], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'practice.svg'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    onChange({ ...project, exportedFormats: [...new Set([...(project.exportedFormats || []), 'svg'])] })
  }

  return (
    <>
      <div className="practice-toolbar">
        {TOOLS.map((t) => (
          <button key={t.id} className={'practice-tool-btn' + (tool === t.id ? ' active' : '')} title={`${t.label} (${t.key})`} onClick={() => setTool(t.id)} aria-label={t.label}>
            {t.icon}
          </button>
        ))}
        <div className="practice-tool-sep" />
        <button className="practice-tool-btn" title="Дублювати (Ctrl+D)" onClick={duplicateSelected} aria-label="Дублювати">⧉</button>
        <button className="practice-tool-btn" title="Видалити (Del)" onClick={deleteSelected} aria-label="Видалити">🗑</button>
      </div>

      <div className="practice-canvas" style={{ position: 'relative' }}>
        {tool === 'path' && (
          <p className="cl-tab-desc" style={{ position: 'absolute', top: 8, left: 8, zIndex: 5, background: 'var(--surface)', padding: '4px 8px', borderRadius: 6, margin: 0 }}>
            Клікай, щоб додати точки контуру ({drawingPoints.length}). Enter — замкнути (мін. 3 точки), Esc — скасувати.
          </p>
        )}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${ab.w} ${ab.h}`}
          className="vector-studio-svg"
          onPointerDown={canvasClick}
        >
          <rect x={0} y={0} width={ab.w} height={ab.h} fill={ab.bg} />
          <line x1={centerX} y1={0} x2={centerX} y2={ab.h} className="vs-guide" />
          <line x1={0} y1={centerY} x2={ab.w} y2={centerY} className="vs-guide" />
          {project.objects.map((o) => <ShapeEl key={o.id} o={o} selected={o.id === selectedId} onDown={onShapeDown} />)}
          {guideHint && <circle cx={guideHint.x} cy={guideHint.y} r={3} fill="#F59E0B" />}
          {drawingPoints.length > 0 && (
            <g pointerEvents="none">
              <polyline points={drawingPoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 3" />
              {drawingPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#F59E0B" />)}
            </g>
          )}
        </svg>
      </div>

      <div className="practice-properties">
        <p className="cl-section-title">Властивості</p>
        {!selected && <p className="cl-tab-desc">Обери об’єкт на полотні.</p>}
        {selected && (
          <>
            {selected.type === 'text' && (
              <>
                <label className="gfx-field">Текст
                  <input className="cl-text-input" value={selected.text} onChange={(e) => updateSelected({ text: e.target.value })} />
                </label>
                <label className="gfx-field">Шрифт
                  <select className="cl-text-input" value={selected.fontFamily} onChange={(e) => updateSelected({ fontFamily: e.target.value })}>
                    {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </label>
                <label className="gfx-field">Розмір шрифту: {selected.fontSize}
                  <input type="range" min="10" max="96" value={selected.fontSize} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} />
                </label>
              </>
            )}
            <div className="gfx-row">
              <label className="gfx-num">X<input type="number" value={Math.round(selected.x)} onChange={(e) => updateSelected({ x: Number(e.target.value) })} /></label>
              <label className="gfx-num">Y<input type="number" value={Math.round(selected.y)} onChange={(e) => updateSelected({ y: Number(e.target.value) })} /></label>
            </div>
            {selected.type !== 'line' && selected.type !== 'path' && (
              <div className="gfx-row">
                <label className="gfx-num">W<input type="number" value={Math.round(selected.w)} onChange={(e) => updateSelected({ w: Math.max(4, Number(e.target.value)) })} /></label>
                <label className="gfx-num">H<input type="number" value={Math.round(selected.h)} onChange={(e) => updateSelected({ h: Math.max(4, Number(e.target.value)) })} /></label>
              </div>
            )}
            {selected.type === 'path' && <p className="cl-tab-desc">Контур із {selected.points.length} точок — розмір задають самі точки.</p>}
            {selected.type !== 'line' && selected.type !== 'text' && (
              <label className="gfx-field">Заливка
                <input type="color" value={selected.fill} onChange={(e) => updateSelected({ fill: e.target.value })} />
              </label>
            )}
            {vRank >= 1 && ['rect', 'ellipse', 'star'].includes(selected.type) && (
              <>
                <label className="gfx-field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={!!selected.fill2} onChange={(e) => updateSelected({ fill2: e.target.checked ? '#FFFFFF' : null })} />
                  Градієнт (v2)
                </label>
                {selected.fill2 && (
                  <label className="gfx-field">Другий колір градієнта
                    <input type="color" value={selected.fill2} onChange={(e) => updateSelected({ fill2: e.target.value })} />
                  </label>
                )}
              </>
            )}
            {selected.type === 'text' && (
              <label className="gfx-field">Колір тексту
                <input type="color" value={selected.fill} onChange={(e) => updateSelected({ fill: e.target.value })} />
              </label>
            )}
            {selected.type === 'line' && (
              <label className="gfx-field">Колір лінії
                <input type="color" value={selected.stroke} onChange={(e) => updateSelected({ stroke: e.target.value })} />
              </label>
            )}
            <label className="gfx-field">Прозорість: {Math.round(selected.opacity * 100)}%
              <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity} onChange={(e) => updateSelected({ opacity: Number(e.target.value) })} />
            </label>
          </>
        )}
      </div>

      <div className="practice-bottom">
        <div className="practice-bottom-tabs">
          <button className={bottomTab === 'layers' ? 'active' : ''} onClick={() => setBottomTab('layers')}>Шари</button>
          <button className={bottomTab === 'palette' ? 'active' : ''} onClick={() => setBottomTab('palette')}>Палітра</button>
          <button className={bottomTab === 'variants' ? 'active' : ''} onClick={() => setBottomTab('variants')}>Варіанти</button>
        </div>
        {bottomTab === 'layers' && (
          <div className="practice-layers">
            {project.objects.length === 0 && <p className="cl-tab-desc">Ще немає об’єктів.</p>}
            {project.objects.map((o) => (
              <div key={o.id} className={'ux-list-row' + (o.id === selectedId ? ' active' : '')}>
                <button className="cl-mini-btn" style={{ flex: 1, textAlign: 'left' }} onClick={() => setSelectedId(o.id)}>
                  {ALL_TOOLS.find((t) => t.id === o.type)?.icon} {o.type === 'text' ? o.text : o.type}
                </button>
                <button className="cl-mini-btn" onClick={() => reorder(o.id, 1)}>↑</button>
                <button className="cl-mini-btn" onClick={() => reorder(o.id, -1)}>↓</button>
              </div>
            ))}
          </div>
        )}
        {bottomTab === 'palette' && (
          <div className="practice-palette">
            <div className="cl-btn-row">
              {project.palette.map((c) => (
                <span key={c} className="practice-swatch-wrap">
                  <span className="practice-swatch" style={{ background: c }} />
                  <button className="cl-mini-btn" onClick={() => removePaletteColor(c)}>×</button>
                </span>
              ))}
            </div>
            <input type="color" className="cl-swatch-input" onChange={(e) => addPaletteColor(e.target.value)} />
          </div>
        )}
        {bottomTab === 'variants' && (
          <div className="practice-layers">
            {(project.variants || []).length === 0 && <p className="cl-tab-desc">Ще немає збережених варіантів поточного стану полотна.</p>}
            {(project.variants || []).map((v, i) => (
              <div key={v.id} className="ux-list-row">
                <button className="cl-mini-btn" style={{ flex: 1, textAlign: 'left' }} onClick={() => loadVariant(v)}>
                  Варіант {(project.variants.length - i)} · {v.objects.length} об’єкт(ів) · {new Date(v.savedAt).toLocaleTimeString('uk-UA')}
                </button>
                <button className="cl-mini-btn" onClick={() => removeVariant(v.id)}>×</button>
              </div>
            ))}
            <button className="harmony-btn" style={{ marginTop: 6 }} onClick={saveVariant}>📌 Зберегти варіант</button>
          </div>
        )}
        <button className="harmony-btn" style={{ marginLeft: 'auto' }} onClick={exportSvg}>⬇ Експорт SVG</button>
      </div>
    </>
  )
}
