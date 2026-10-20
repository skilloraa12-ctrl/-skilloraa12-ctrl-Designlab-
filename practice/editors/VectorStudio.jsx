import { useRef, useState } from 'react'

// Vector Studio (ТЗ 7.B) — v1-набір: Вибір/Прямокутник/Еліпс/Зірка/Лінія/
// Текст/Піпетка, властивості заливки-контуру-позиції-тексту, шари,
// палітра, один артборд. Контракт редактора: project/version/allowedTools/
// onChange(nextProject) — див. коментар у PracticeShell.jsx.
//
// Свідомо НЕ реалізовано цього заходу (чесно, не приховано): редагування
// вузлів (A), перо для довільних контурів (P), булеві операції/градієнт/
// маска (v2), текст по контуру/символи (v3), декілька артбордів одночасно.
// Властивості розміру редагуються числовими полями, а не ручками
// resize-рамки — звужує функціонал, але лишається чесним v1-інструментом
// без половинчастої, ненадійної реалізації перетягування за кут.

const TOOLS = [
  { id: 'select', icon: '↖', label: 'Вибір', key: 'V' },
  { id: 'rect', icon: '▭', label: 'Прямокутник', key: 'R' },
  { id: 'ellipse', icon: '◯', label: 'Еліпс', key: 'E' },
  { id: 'star', icon: '★', label: 'Зірка', key: 'Shift+P' },
  { id: 'line', icon: '╱', label: 'Лінія', key: 'L' },
  { id: 'text', icon: 'T', label: 'Текст', key: 'T' },
  { id: 'eyedropper', icon: '💧', label: 'Піпетка', key: 'I' },
]

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

function ShapeEl({ o, selected, onDown }) {
  const common = { opacity: o.opacity, onPointerDown: (e) => onDown(e, o.id), style: { cursor: 'move' } }
  let node = null
  if (o.type === 'rect') node = <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={o.fill} stroke={o.stroke} strokeWidth={o.strokeWidth} {...common} />
  else if (o.type === 'ellipse') node = <ellipse cx={o.x + o.w / 2} cy={o.y + o.h / 2} rx={o.w / 2} ry={o.h / 2} fill={o.fill} stroke={o.stroke} strokeWidth={o.strokeWidth} {...common} />
  else if (o.type === 'star') node = <polygon points={starPoints(o.x + o.w / 2, o.y + o.h / 2, o.w, o.h)} fill={o.fill} {...common} />
  else if (o.type === 'line') node = <line x1={o.x} y1={o.y} x2={o.x + o.w} y2={o.y + o.h} stroke={o.stroke} strokeWidth={o.strokeWidth} strokeLinecap="round" {...common} />
  else if (o.type === 'text') node = <text x={o.x} y={o.y + o.fontSize} fontFamily={o.fontFamily} fontSize={o.fontSize} fill={o.fill} {...common}>{o.text}</text>
  if (!selected) return node
  const b = { x: o.x - 4, y: o.y - 4, w: (o.w || 0) + 8, h: (o.type === 'line' ? Math.abs(o.h) : o.h || 0) + 8 }
  return <g>{node}<rect x={b.x} y={o.type === 'line' ? Math.min(o.y, o.y + o.h) - 4 : b.y} width={b.w} height={b.h} fill="none" stroke="#F59E0B" strokeDasharray="4 3" pointerEvents="none" /></g>
}

export default function VectorStudio({ project, onChange }) {
  const ab = project.artboards[0]
  const [tool, setTool] = useState('select')
  const [selectedId, setSelectedId] = useState(null)
  const [bottomTab, setBottomTab] = useState('layers')
  const svgRef = useRef(null)
  const dragRef = useRef(null)
  const [guideHint, setGuideHint] = useState(null)

  const selected = project.objects.find((o) => o.id === selectedId) || null
  const centerX = ab.w / 2, centerY = ab.h / 2

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
    const obj = makeObject(tool, p.x - 45, p.y - 35)
    patchObjects([...project.objects, obj])
    setSelectedId(obj.id)
    setTool('select')
  }

  function onShapeDown(e, id) {
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

      <div className="practice-canvas">
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
            {selected.type !== 'line' && (
              <div className="gfx-row">
                <label className="gfx-num">W<input type="number" value={Math.round(selected.w)} onChange={(e) => updateSelected({ w: Math.max(4, Number(e.target.value)) })} /></label>
                <label className="gfx-num">H<input type="number" value={Math.round(selected.h)} onChange={(e) => updateSelected({ h: Math.max(4, Number(e.target.value)) })} /></label>
              </div>
            )}
            {selected.type !== 'line' && selected.type !== 'text' && (
              <label className="gfx-field">Заливка
                <input type="color" value={selected.fill} onChange={(e) => updateSelected({ fill: e.target.value })} />
              </label>
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
        </div>
        {bottomTab === 'layers' && (
          <div className="practice-layers">
            {project.objects.length === 0 && <p className="cl-tab-desc">Ще немає об’єктів.</p>}
            {project.objects.map((o) => (
              <div key={o.id} className={'ux-list-row' + (o.id === selectedId ? ' active' : '')}>
                <button className="cl-mini-btn" style={{ flex: 1, textAlign: 'left' }} onClick={() => setSelectedId(o.id)}>
                  {TOOLS.find((t) => t.id === o.type)?.icon} {o.type === 'text' ? o.text : o.type}
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
        <button className="harmony-btn" style={{ marginLeft: 'auto' }} onClick={exportSvg}>⬇ Експорт SVG</button>
      </div>
    </>
  )
}
