import { useRef, useState, useEffect, useCallback } from 'react'

const COLORS = ['#17171A', '#3E37E0', '#E0523E', '#C8912B', '#2FA36B', '#FFFFFF']
const BG_COLORS = ['#F5F1E8', '#FFFFFF', '#ECEAE3', '#17171A', '#EAF3EC']

const TOOLS = [
  { id: 'pen', label: '✏️ Пензель' },
  { id: 'line', label: '➖ Лінія' },
  { id: 'rect', label: '▭ Прямокутник' },
  { id: 'ellipse', label: '⬭ Еліпс' },
  { id: 'text', label: '🅰 Текст' },
  { id: 'frame', label: '📐 Фрейм' },
  { id: 'block', label: '🧱 Блок' },
  { id: 'eraser', label: '🧽 Ластик' },
]

// Розміри взяті з реальних breakpoint-ів, яким навчає курс (375/768/1440),
// але намальовані в пропорційно зменшеному масштабі, щоб влізти на робочу
// область — це інструмент для швидкого макетування, а не 1:1 прев'ю.
const FRAME_PRESETS = [
  { id: 'mobile', label: '📱 Mobile · 375×667', w: 220, h: 390 },
  { id: 'tablet', label: '📱 Tablet · 768×1024', w: 340, h: 453 },
  { id: 'desktop', label: '🖥️ Desktop · 1440×900', w: 640, h: 400 },
]

const BLOCK_PRESETS = ['Header', 'Navigation', 'Hero', 'Section', 'Content', 'Card', 'Sidebar', 'Footer', 'CTA', 'Image', 'Button', 'Form']

const LAYER_ICONS = { pen: '✏️', line: '➖', rect: '▭', ellipse: '⬭', text: '🅰', frame: '🖼️', block: '🧱' }

function layerLabel(l) {
  if (l.type === 'pen') return l.erase ? 'Ластик' : 'Малюнок пензлем'
  if (l.type === 'line') return 'Лінія'
  if (l.type === 'rect') return 'Прямокутник'
  if (l.type === 'ellipse') return 'Еліпс'
  if (l.type === 'text') return `Текст: «${l.text.length > 20 ? l.text.slice(0, 20) + '…' : l.text}»`
  if (l.type === 'frame') return l.label
  if (l.type === 'block') return `Блок: ${l.label}`
  return l.type
}

let nextLayerId = 1

export default function SketchPad({ module, onSave, onClose }) {
  const baseRef = useRef(null)
  const previewRef = useRef(null)
  const dragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const strokeRef = useRef(null)
  const historyRef = useRef([])
  const redoRef = useRef([])

  const [layers, setLayers] = useState([])
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#17171A')
  const [size, setSize] = useState(4)
  const [fontSize, setFontSize] = useState(28)
  const [fillShape, setFillShape] = useState(false)
  const [framePreset, setFramePreset] = useState('desktop')
  const [blockPreset, setBlockPreset] = useState('Header')
  const [bg, setBg] = useState('#F5F1E8')
  const [showGrid, setShowGrid] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [checked, setChecked] = useState({})

  const commit = useCallback((next) => {
    historyRef.current.push(layers)
    if (historyRef.current.length > 50) historyRef.current.shift()
    redoRef.current = []
    setLayers(next)
    setCanUndo(true)
    setCanRedo(false)
  }, [layers])

  function undo() {
    if (!historyRef.current.length) return
    redoRef.current.push(layers)
    setLayers(historyRef.current.pop())
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(true)
  }

  function redo() {
    if (!redoRef.current.length) return
    historyRef.current.push(layers)
    setLayers(redoRef.current.pop())
    setCanRedo(redoRef.current.length > 0)
    setCanUndo(true)
  }

  function clearAll() {
    commit([])
  }

  function toggleVisible(id) {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)))
  }

  function deleteLayer(id) {
    commit(layers.filter((l) => l.id !== id))
  }

  function moveLayer(id, dir) {
    const idx = layers.findIndex((l) => l.id === id)
    const j = idx + dir
    if (idx < 0 || j < 0 || j >= layers.length) return
    const next = [...layers]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    commit(next)
  }

  function pos(e) {
    const rect = baseRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (baseRef.current.width / rect.width),
      y: (clientY - rect.top) * (baseRef.current.height / rect.height),
    }
  }

  function drawLayer(ctx, l) {
    if (l.type === 'pen') {
      if (l.points.length < 2) return
      ctx.globalCompositeOperation = l.erase ? 'destination-out' : 'source-over'
      ctx.strokeStyle = l.color
      ctx.lineWidth = l.erase ? l.size * 3 : l.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(l.points[0].x, l.points[0].y)
      for (const p of l.points.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    } else if (l.type === 'line') {
      ctx.strokeStyle = l.color
      ctx.lineWidth = l.size
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    } else if (l.type === 'rect') {
      const x = Math.min(l.x1, l.x2), y = Math.min(l.y1, l.y2)
      const w = Math.abs(l.x2 - l.x1), h = Math.abs(l.y2 - l.y1)
      ctx.strokeStyle = l.color
      ctx.fillStyle = l.color
      ctx.lineWidth = l.size
      l.fill ? ctx.fillRect(x, y, w, h) : ctx.strokeRect(x, y, w, h)
    } else if (l.type === 'ellipse') {
      const cx = (l.x1 + l.x2) / 2, cy = (l.y1 + l.y2) / 2
      const rx = Math.abs(l.x2 - l.x1) / 2, ry = Math.abs(l.y2 - l.y1) / 2
      ctx.strokeStyle = l.color
      ctx.fillStyle = l.color
      ctx.lineWidth = l.size
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      l.fill ? ctx.fill() : ctx.stroke()
    } else if (l.type === 'text') {
      ctx.fillStyle = l.color
      ctx.font = `${l.fontSize}px Georgia, serif`
      ctx.fillText(l.text, l.x, l.y)
    } else if (l.type === 'frame') {
      ctx.save()
      ctx.setLineDash([8, 6])
      ctx.strokeStyle = '#8B8578'
      ctx.lineWidth = 2
      ctx.strokeRect(l.x, l.y, l.w, l.h)
      ctx.setLineDash([])
      ctx.fillStyle = '#8B8578'
      ctx.font = '600 13px Inter, sans-serif'
      ctx.fillText(l.label, l.x, l.y > 18 ? l.y - 8 : l.y + l.h + 16)
      ctx.restore()
    } else if (l.type === 'block') {
      ctx.save()
      ctx.fillStyle = 'rgba(62,55,224,0.07)'
      ctx.fillRect(l.x, l.y, l.w, l.h)
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = '#3E37E0'
      ctx.lineWidth = 1.5
      ctx.strokeRect(l.x, l.y, l.w, l.h)
      ctx.setLineDash([])
      ctx.fillStyle = '#3E37E0'
      ctx.font = '600 13px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(l.label, l.x + l.w / 2, l.y + l.h / 2)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
      ctx.restore()
    }
  }

  const redraw = useCallback(() => {
    const canvas = baseRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const l of layers) {
      if (l.visible === false) continue
      drawLayer(ctx, l)
    }
  }, [layers])

  useEffect(() => { redraw() }, [redraw])

  function drawPreview(makeLayer) {
    const preview = previewRef.current
    const ctx = preview.getContext('2d')
    ctx.clearRect(0, 0, preview.width, preview.height)
    drawLayer(ctx, makeLayer)
  }

  function start(e) {
    const p = pos(e)
    startPos.current = p

    if (tool === 'text') {
      const text = window.prompt('Текст для полотна:')
      if (text) {
        commit([...layers, { id: nextLayerId++, type: 'text', x: p.x, y: p.y, text, fontSize, color, visible: true }])
      }
      return
    }

    if (tool === 'frame') {
      const preset = FRAME_PRESETS.find((f) => f.id === framePreset)
      const x = Math.min(Math.max(p.x - preset.w / 2, 0), baseRef.current.width - preset.w)
      const y = Math.min(Math.max(p.y - preset.h / 2, 0), baseRef.current.height - preset.h)
      commit([...layers, { id: nextLayerId++, type: 'frame', x, y, w: preset.w, h: preset.h, label: preset.label, visible: true }])
      return
    }

    dragging.current = true

    if (tool === 'pen' || tool === 'eraser') {
      strokeRef.current = { id: nextLayerId++, type: 'pen', points: [p], color, size, erase: tool === 'eraser', visible: true }
      // Малюємо одразу на базовому полотні (як у оригіналі) — швидко й дає
      // живе прев'ю реального стирання, а не порожнього прозорого шару.
      const ctx = baseRef.current.getContext('2d')
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = tool === 'eraser' ? size * 3 : size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
    }
  }

  function move(e) {
    if (!dragging.current) return
    e.preventDefault()
    const p = pos(e)

    if (tool === 'pen' || tool === 'eraser') {
      strokeRef.current.points.push(p)
      const ctx = baseRef.current.getContext('2d')
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    } else if (tool === 'block') {
      const x = Math.min(startPos.current.x, p.x), y = Math.min(startPos.current.y, p.y)
      const w = Math.abs(p.x - startPos.current.x), h = Math.abs(p.y - startPos.current.y)
      drawPreview({ id: 0, type: 'block', x, y, w, h, label: blockPreset })
    } else if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      drawPreview({ id: 0, type: tool, x1: startPos.current.x, y1: startPos.current.y, x2: p.x, y2: p.y, color, size, fill: fillShape })
    }
  }

  function end(e) {
    if (!dragging.current) return
    dragging.current = false

    if (tool === 'pen' || tool === 'eraser') {
      baseRef.current.getContext('2d').globalCompositeOperation = 'source-over'
      if (strokeRef.current.points.length >= 2) commit([...layers, strokeRef.current])
      strokeRef.current = null
      return
    }

    previewRef.current.getContext('2d').clearRect(0, 0, previewRef.current.width, previewRef.current.height)
    const p = pos(e)
    if (tool === 'block') {
      const x = Math.min(startPos.current.x, p.x), y = Math.min(startPos.current.y, p.y)
      const w = Math.abs(p.x - startPos.current.x), h = Math.abs(p.y - startPos.current.y)
      if (w > 4 && h > 4) commit([...layers, { id: nextLayerId++, type: 'block', x, y, w, h, label: blockPreset, visible: true }])
    } else if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      if (Math.abs(p.x - startPos.current.x) > 2 || Math.abs(p.y - startPos.current.y) > 2) {
        commit([...layers, { id: nextLayerId++, type: tool, x1: startPos.current.x, y1: startPos.current.y, x2: p.x, y2: p.y, color, size, fill: fillShape, visible: true }])
      }
    }
  }

  function flatten() {
    const canvas = baseRef.current
    const out = document.createElement('canvas')
    out.width = canvas.width
    out.height = canvas.height
    const ctx = out.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, 0, 0)
    return out.toDataURL('image/png')
  }

  function download() {
    const link = document.createElement('a')
    link.download = 'designlab-sketch.png'
    link.href = flatten()
    link.click()
  }

  function save() {
    onSave(flatten())
  }

  const checklist = module?.selfCheck || []

  return (
    <div className="sketchpad">
      {module && (
        <div className="sketchpad-hints">
          <p className="eyebrow">Завдання: {module.title}</p>
          {module.practice && <p className="sketchpad-hints-task">{module.practice}</p>}
          {checklist.length > 0 && (
            <ul className="sketchpad-checklist">
              {checklist.map((c, i) => (
                <li key={i}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!checked[i]}
                      onChange={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
                    />
                    {c}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="sketchpad-toolbar">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={'harmony-btn' + (tool === t.id ? ' active' : '')}
            onClick={() => setTool(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="sketchpad-toolbar">
        {tool === 'frame' ? (
          <label className="sketchpad-inline-label">
            Розмір екрана
            <select className="sketchpad-select" value={framePreset} onChange={(e) => setFramePreset(e.target.value)}>
              {FRAME_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <span className="sketchpad-hint-text">Клікни на полотні, щоб розмістити фрейм</span>
          </label>
        ) : tool === 'block' ? (
          <label className="sketchpad-inline-label">
            Тип блоку
            <select className="sketchpad-select" value={blockPreset} onChange={(e) => setBlockPreset(e.target.value)}>
              {BLOCK_PRESETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="sketchpad-hint-text">Потягни на полотні, щоб намалювати блок</span>
          </label>
        ) : (
          <>
            <div className="sketchpad-colors">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={'sketchpad-swatch' + (color === c ? ' active' : '')}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
              <input
                type="color" value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sketchpad-colorpicker"
                title="Свій колір"
              />
            </div>

            {tool === 'text' ? (
              <label className="sketchpad-inline-label">
                Розмір тексту
                <input type="range" min="12" max="72" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="sketchpad-size" />
              </label>
            ) : (
              <label className="sketchpad-inline-label">
                Товщина
                <input type="range" min="1" max="30" value={size} onChange={(e) => setSize(Number(e.target.value))} className="sketchpad-size" />
              </label>
            )}

            {(tool === 'rect' || tool === 'ellipse') && (
              <label className="sketchpad-inline-label">
                <input type="checkbox" checked={fillShape} onChange={(e) => setFillShape(e.target.checked)} />
                Заливка
              </label>
            )}
          </>
        )}
      </div>

      <div className="sketchpad-toolbar">
        <label className="sketchpad-inline-label">
          Фон
          {BG_COLORS.map((c) => (
            <button
              key={c}
              className={'sketchpad-swatch' + (bg === c ? ' active' : '')}
              style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid var(--line)' : undefined }}
              onClick={() => setBg(c)}
              aria-label={c}
            />
          ))}
        </label>
        <label className="sketchpad-inline-label">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Сітка-орієнтир
        </label>
        <button className="harmony-btn" onClick={undo} disabled={!canUndo}>↶ Undo</button>
        <button className="harmony-btn" onClick={redo} disabled={!canRedo}>↷ Redo</button>
        <button className="harmony-btn" onClick={clearAll}>Очистити все</button>
      </div>

      <div
        className={'sketchpad-canvas-wrap' + (showGrid ? ' sketchpad-canvas-wrap--grid' : '')}
        style={{ background: showGrid ? undefined : bg }}
      >
        <canvas
          ref={baseRef}
          width={1200}
          height={750}
          className="sketchpad-canvas sketchpad-canvas--base"
        />
        <canvas
          ref={previewRef}
          width={1200}
          height={750}
          className="sketchpad-canvas sketchpad-canvas--preview"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>

      {layers.length > 0 && (
        <div className="sketchpad-layers">
          <p className="eyebrow">Шари ({layers.length})</p>
          <ul className="sketchpad-layers-list">
            {[...layers].reverse().map((l) => (
              <li key={l.id} className={l.visible === false ? 'sketchpad-layer--hidden' : ''}>
                <span className="sketchpad-layer-name">{LAYER_ICONS[l.type]} {layerLabel(l)}</span>
                <span className="sketchpad-layer-actions">
                  <button onClick={() => moveLayer(l.id, 1)} title="Вище" aria-label="Перемістити шар вище">↑</button>
                  <button onClick={() => moveLayer(l.id, -1)} title="Нижче" aria-label="Перемістити шар нижче">↓</button>
                  <button onClick={() => toggleVisible(l.id)} title="Показати/сховати" aria-label="Показати або сховати шар">{l.visible === false ? '🚫' : '👁'}</button>
                  <button onClick={() => deleteLayer(l.id)} title="Видалити" aria-label="Видалити шар">🗑</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sketchpad-actions">
        <button className="complete-btn" onClick={onClose}>Закрити</button>
        <button className="complete-btn" onClick={download}>Завантажити PNG</button>
        <button className="pf-add-btn" onClick={save}>Зберегти в портфоліо</button>
      </div>
    </div>
  )
}
