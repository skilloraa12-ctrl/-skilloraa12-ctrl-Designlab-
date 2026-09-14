import { useRef, useState, useEffect, useCallback } from 'react'

const COLORS = ['#17171A', '#3E37E0', '#E0523E', '#C8912B', '#2FA36B', '#FFFFFF']
const BG_COLORS = ['#F5F1E8', '#FFFFFF', '#ECEAE3', '#17171A', '#EAF3EC']

const TOOLS = [
  { id: 'pen', label: '✏️ Пензель' },
  { id: 'line', label: '➖ Лінія' },
  { id: 'rect', label: '▭ Прямокутник' },
  { id: 'ellipse', label: '⬭ Еліпс' },
  { id: 'text', label: '🅰 Текст' },
  { id: 'eraser', label: '🧽 Ластик' },
]

export default function SketchPad({ onSave, onClose }) {
  const baseRef = useRef(null)
  const previewRef = useRef(null)
  const dragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const historyRef = useRef([])
  const redoRef = useRef([])

  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#17171A')
  const [size, setSize] = useState(4)
  const [fontSize, setFontSize] = useState(28)
  const [fillShape, setFillShape] = useState(false)
  const [bg, setBg] = useState('#F5F1E8')
  const [showGrid, setShowGrid] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Полотно з контентом лишається прозорим — колір фону й сітка це лише
  // візуальний орієнтир (CSS), як у реальних дизайн-інструментах: сітка
  // не потрапляє у фінальний експорт.
  useEffect(() => {
    const canvas = baseRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  function pos(e) {
    const rect = baseRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (baseRef.current.width / rect.width),
      y: (clientY - rect.top) * (baseRef.current.height / rect.height),
    }
  }

  const pushHistory = useCallback(() => {
    historyRef.current.push(baseRef.current.toDataURL())
    if (historyRef.current.length > 30) historyRef.current.shift()
    redoRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  function restoreFromDataUrl(dataUrl) {
    const canvas = baseRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = dataUrl
  }

  function undo() {
    if (historyRef.current.length === 0) return
    redoRef.current.push(baseRef.current.toDataURL())
    const prev = historyRef.current.pop()
    restoreFromDataUrl(prev)
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(true)
  }

  function redo() {
    if (redoRef.current.length === 0) return
    historyRef.current.push(baseRef.current.toDataURL())
    const next = redoRef.current.pop()
    restoreFromDataUrl(next)
    setCanRedo(redoRef.current.length > 0)
    setCanUndo(true)
  }

  function clearAll() {
    pushHistory()
    baseRef.current.getContext('2d').clearRect(0, 0, baseRef.current.width, baseRef.current.height)
  }

  function drawShape(ctx, p1, p2) {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (tool === 'line') {
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    } else if (tool === 'rect') {
      const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y)
      const w = Math.abs(p2.x - p1.x), h = Math.abs(p2.y - p1.y)
      fillShape ? ctx.fillRect(x, y, w, h) : ctx.strokeRect(x, y, w, h)
    } else if (tool === 'ellipse') {
      const x = (p1.x + p2.x) / 2, y = (p1.y + p2.y) / 2
      const rx = Math.abs(p2.x - p1.x) / 2, ry = Math.abs(p2.y - p1.y) / 2
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
      fillShape ? ctx.fill() : ctx.stroke()
    }
  }

  function start(e) {
    const p = pos(e)
    startPos.current = p

    if (tool === 'text') {
      pushHistory()
      const text = window.prompt('Текст для полотна:')
      if (text) {
        const ctx = baseRef.current.getContext('2d')
        ctx.fillStyle = color
        ctx.font = `${fontSize}px Georgia, serif`
        ctx.fillText(text, p.x, p.y)
      } else {
        historyRef.current.pop() // нічого не намалювали — прибираємо порожній запис історії
        setCanUndo(historyRef.current.length > 0)
      }
      return
    }

    pushHistory()
    dragging.current = true

    if (tool === 'pen' || tool === 'eraser') {
      const ctx = baseRef.current.getContext('2d')
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
    }
  }

  function move(e) {
    if (!dragging.current) return
    e.preventDefault()
    const p = pos(e)

    if (tool === 'pen' || tool === 'eraser') {
      const ctx = baseRef.current.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = color
      ctx.lineWidth = tool === 'eraser' ? size * 3 : size
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    } else {
      // Лінія/прямокутник/еліпс малюються на прев'ю-шарі, поки тягнемо мишку
      const preview = previewRef.current
      const ctx = preview.getContext('2d')
      ctx.clearRect(0, 0, preview.width, preview.height)
      drawShape(ctx, startPos.current, p)
    }
  }

  function end(e) {
    if (!dragging.current) return
    dragging.current = false

    if (tool === 'pen' || tool === 'eraser') {
      baseRef.current.getContext('2d').globalCompositeOperation = 'source-over'
      return
    }
    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      const p = pos(e)
      const ctx = baseRef.current.getContext('2d')
      drawShape(ctx, startPos.current, p)
      previewRef.current.getContext('2d').clearRect(0, 0, previewRef.current.width, previewRef.current.height)
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

  return (
    <div className="sketchpad">
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
          width={900}
          height={560}
          className="sketchpad-canvas sketchpad-canvas--base"
        />
        <canvas
          ref={previewRef}
          width={900}
          height={560}
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

      <div className="sketchpad-actions">
        <button className="complete-btn" onClick={onClose}>Закрити</button>
        <button className="complete-btn" onClick={download}>Завантажити PNG</button>
        <button className="pf-add-btn" onClick={save}>Зберегти в портфоліо</button>
      </div>
    </div>
  )
}
