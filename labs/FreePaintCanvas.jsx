import { useEffect, useRef, useState } from 'react'
import {
  BRUSH_SIZES, BRUSH_TYPES, BRUSH_VARIANTS, SHAPE_TYPES, DEFAULT_PALETTE, setupCanvas, loadImageToCanvas,
  strokeSegment, dot, drawShape, drawText, canvasToDataUrl, pointFromEvent,
  drawColorWheel, pickFromWheel, hsvToHex,
} from './freePaintEngine.js'

const CANVAS_W = 1100
const CANVAS_H = 760
const UNDO_LIMIT = 25
const WHEEL_SIZE = 140

// Довільне цифрове малювання (не піксельна сітка) — для концепт-арту,
// персонажів, кежуал-арту: кілька по-різному текстурованих пензлів
// (не просто перефарбований штрих — кожен реально інакше лягає на
// полотно), кольорове коло замість плоскої палітри, інструмент фігур і
// текст із попереднім переглядом обертання/масштабу перед нанесенням.
// Повноекранний режим за замовчуванням — малювати в вузькій колонці
// студії незручно. Автозбереження в imageDataUrl асета після кожної дії.
function ColorWheel({ hue, sat, value, onPick }) {
  const wheelRef = useRef(null)
  useEffect(() => {
    if (wheelRef.current) drawColorWheel(wheelRef.current, WHEEL_SIZE)
  }, [])
  function handlePointer(e) {
    const rect = wheelRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * WHEEL_SIZE
    const y = ((e.clientY - rect.top) / rect.height) * WHEEL_SIZE
    onPick(pickFromWheel(WHEEL_SIZE, x, y))
  }
  const draggingRef = useRef(false)
  return (
    <div className="fpc-wheel-row">
      <canvas
        ref={wheelRef}
        className="fpc-wheel"
        onPointerDown={(e) => { draggingRef.current = true; handlePointer(e) }}
        onPointerMove={(e) => { if (draggingRef.current) handlePointer(e) }}
        onPointerUp={() => { draggingRef.current = false }}
        onPointerLeave={() => { draggingRef.current = false }}
      />
      <div
        className="fpc-wheel-marker"
        style={{
          left: `${50 + (sat / 100) * 50 * Math.cos((hue * Math.PI) / 180)}%`,
          top: `${50 + (sat / 100) * 50 * Math.sin((hue * Math.PI) / 180)}%`,
        }}
      />
    </div>
  )
}

export default function FreePaintCanvas({ initialImage, onChangeImage, onMessage, assetKey }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const undoStackRef = useRef([])
  const shapeBaseRef = useRef(null)
  const shapeStartRef = useRef(null)
  const textBaseRef = useRef(null)

  const [tool, setTool] = useState('brush')
  const [brushType, setBrushTypeRaw] = useState('hard')
  const [variant, setVariant] = useState(BRUSH_VARIANTS.hard[0].key)
  function setBrushType(key) {
    setBrushTypeRaw(key)
    const list = BRUSH_VARIANTS[key]
    setVariant(list ? list[0].key : null)
  }
  const [color, setColor] = useState('#1a1a1a')
  const [palette, setPalette] = useState(DEFAULT_PALETTE)
  const [size, setSize] = useState(12)
  const [opacity, setOpacity] = useState(1)
  const [fullscreen, setFullscreen] = useState(true)
  const [canUndo, setCanUndo] = useState(false)

  const [hue, setHue] = useState(0)
  const [sat, setSat] = useState(0)
  const [value, setValue] = useState(85)

  const [shapeType, setShapeType] = useState('rect')
  const [shapeFilled, setShapeFilled] = useState(false)

  const [textActive, setTextActive] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [textSize, setTextSize] = useState(48)
  const [textRotation, setTextRotation] = useState(0)
  const [textScale, setTextScale] = useState(1)
  const [textFlipX, setTextFlipX] = useState(false)
  const [textFlipY, setTextFlipY] = useState(false)
  const [textPos, setTextPos] = useState({ x: CANVAS_W / 2, y: CANVAS_H / 2 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, CANVAS_W, CANVAS_H)
    ctxRef.current = ctx
    undoStackRef.current = []
    setCanUndo(false)
    setTextActive(false)
    loadImageToCanvas(ctx, CANVAS_W, CANVAS_H, initialImage, () => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetKey])

  function captureSnapshot() {
    return ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
  }
  function pushUndo(snap) {
    undoStackRef.current.push(snap)
    if (undoStackRef.current.length > UNDO_LIMIT) undoStackRef.current.shift()
    setCanUndo(true)
  }
  function undo() {
    const ctx = ctxRef.current
    const stack = undoStackRef.current
    if (!ctx || stack.length === 0) return
    ctx.putImageData(stack.pop(), 0, 0)
    setCanUndo(stack.length > 0)
    commit()
  }
  function commit() {
    onChangeImage(canvasToDataUrl(canvasRef.current))
  }

  // Живий перегляд тексту: щоразу, як текст чи його трансформація
  // змінюються, відновлюємо знімок «до тексту» і малюємо заново поверх —
  // так текст лишається реально керованим (обертання/масштаб/дзеркало)
  // до моменту, коли студент натисне «Додати».
  useEffect(() => {
    if (!textActive || !textBaseRef.current) return
    const ctx = ctxRef.current
    ctx.putImageData(textBaseRef.current, 0, 0)
    if (textValue) {
      drawText(ctx, textValue, textPos.x, textPos.y, {
        color, opacity, fontSize: textSize, rotation: textRotation,
        scaleX: textScale * (textFlipX ? -1 : 1), scaleY: textScale * (textFlipY ? -1 : 1),
        fontFamily: 'sans-serif',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textActive, textValue, textSize, textRotation, textScale, textFlipX, textFlipY, color, opacity, textPos])

  function confirmText() {
    commit()
    setTextActive(false)
    onMessage?.('✓ Текст додано до малюнка')
  }
  function cancelText() {
    ctxRef.current.putImageData(textBaseRef.current, 0, 0)
    commit()
    setTextActive(false)
  }

  function start(e) {
    const ctx = ctxRef.current
    if (!ctx) return
    const p = pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H)

    if (tool === 'text') {
      if (textActive) return
      const snap = captureSnapshot()
      pushUndo(snap)
      textBaseRef.current = snap
      setTextPos(p)
      setTextValue('')
      setTextActive(true)
      return
    }
    if (tool === 'shape') {
      const snap = captureSnapshot()
      pushUndo(snap)
      shapeBaseRef.current = snap
      shapeStartRef.current = p
      drawingRef.current = true
      return
    }
    pushUndo(captureSnapshot())
    drawingRef.current = true
    lastPointRef.current = p
    dot(ctx, p.x, p.y, { size, color, opacity, brushType, variant, erase: tool === 'eraser' })
  }

  function move(e) {
    if (!drawingRef.current) return
    const ctx = ctxRef.current
    const p = pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H)
    if (tool === 'shape') {
      ctx.putImageData(shapeBaseRef.current, 0, 0)
      const start_ = shapeStartRef.current
      drawShape(ctx, shapeType, start_.x, start_.y, p.x, p.y, { color, opacity, filled: shapeFilled, lineWidth: Math.max(2, size * 0.5) })
      return
    }
    const last = lastPointRef.current
    strokeSegment(ctx, last.x, last.y, p.x, p.y, { size, color, opacity, brushType, variant, erase: tool === 'eraser' })
    lastPointRef.current = p
  }

  function end() {
    if (!drawingRef.current) return
    drawingRef.current = false
    commit()
  }

  function clearCanvas() {
    pushUndo(captureSnapshot())
    const ctx = ctxRef.current
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.restore()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    commit()
    onMessage?.('✓ Полотно очищено')
  }

  function addPaletteColor() { setPalette([...palette, color]) }
  function removePaletteColor(i) {
    if (palette.length <= 1) return
    setPalette(palette.filter((_, idx) => idx !== i))
  }
  function pickWheel({ hue: h, sat: s }) {
    setHue(h); setSat(s)
    setColor(hsvToHex(h, s, value))
  }
  function changeValue(v) {
    setValue(v)
    setColor(hsvToHex(hue, sat, v))
  }

  const Toolbar = (
    <div className="fpc-toolbar">
      <div className="cl-btn-row">
        <button type="button" className={'cl-mini-btn' + (tool === 'brush' ? ' active' : '')} onClick={() => setTool('brush')}>✏️ Пензель</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'eraser' ? ' active' : '')} onClick={() => setTool('eraser')}>🧹 Гумка</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'shape' ? ' active' : '')} onClick={() => setTool('shape')}>◆ Форми</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'text' ? ' active' : '')} onClick={() => setTool('text')}>Т Текст</button>
        <button type="button" className="cl-mini-btn" onClick={undo} disabled={!canUndo}>↶ Скасувати</button>
        <button type="button" className="cl-mini-btn" onClick={clearCanvas}>🗑 Очистити</button>
        <button type="button" className="cl-mini-btn" onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? '✕ Закрити' : '⛶ На весь екран'}</button>
      </div>

      {(tool === 'brush' || tool === 'eraser') && (
        <div className="cl-btn-row" style={{ marginTop: 6 }}>
          {BRUSH_TYPES.map((b) => (
            <button key={b.key} type="button" className={'cl-mini-btn' + (brushType === b.key ? ' active' : '')} onClick={() => setBrushType(b.key)} title={b.label}>
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      )}

      {(tool === 'brush' || tool === 'eraser') && BRUSH_VARIANTS[brushType] && (
        <div className="cl-btn-row fpc-variant-row">
          {BRUSH_VARIANTS[brushType].map((v) => (
            <button key={v.key} type="button" className={'cl-mini-btn' + (variant === v.key ? ' active' : '')} onClick={() => setVariant(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
      )}

      {tool === 'shape' && (
        <div className="cl-btn-row" style={{ marginTop: 6 }}>
          {SHAPE_TYPES.map((s) => (
            <button key={s.key} type="button" className={'cl-mini-btn' + (shapeType === s.key ? ' active' : '')} onClick={() => setShapeType(s.key)}>{s.label}</button>
          ))}
          <button type="button" className={'cl-mini-btn' + (shapeFilled ? ' active' : '')} onClick={() => setShapeFilled(!shapeFilled)}>Заливка</button>
        </div>
      )}

      {tool === 'text' && textActive && (
        <div className="fpc-text-panel">
          <input
            className="cl-text-input"
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Введи текст…"
          />
          <div className="fpc-sliders">
            <label className="fpc-slider-field">Розмір: {textSize}px<input type="range" min={10} max={200} value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} /></label>
            <label className="fpc-slider-field">Обертання: {textRotation}°<input type="range" min={-180} max={180} value={textRotation} onChange={(e) => setTextRotation(Number(e.target.value))} /></label>
            <label className="fpc-slider-field">Масштаб: {Math.round(textScale * 100)}%<input type="range" min={20} max={400} value={Math.round(textScale * 100)} onChange={(e) => setTextScale(Number(e.target.value) / 100)} /></label>
          </div>
          <div className="cl-btn-row">
            <button type="button" className={'cl-mini-btn' + (textFlipX ? ' active' : '')} onClick={() => setTextFlipX(!textFlipX)}>⇋ Дзеркало Х</button>
            <button type="button" className={'cl-mini-btn' + (textFlipY ? ' active' : '')} onClick={() => setTextFlipY(!textFlipY)}>⇅ Дзеркало Y</button>
            <button type="button" className="harmony-btn" onClick={confirmText}>✓ Додати</button>
            <button type="button" className="cl-mini-btn" onClick={cancelText}>✕ Скасувати</button>
          </div>
        </div>
      )}
      {tool === 'text' && !textActive && <p className="cl-tab-desc">Клікни на полотні, щоб поставити текст.</p>}

      <div className="fpc-sliders" style={{ marginTop: 6 }}>
        <label className="fpc-slider-field">
          Розмір: {size}px
          {BRUSH_SIZES.map((s) => (
            <button key={s} type="button" className={'cl-mini-btn' + (size === s ? ' active' : '')} onClick={() => setSize(s)}>{s}</button>
          ))}
          <input type="range" min={2} max={80} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
        <label className="fpc-slider-field">
          Непрозорість: {Math.round(opacity * 100)}%
          <input type="range" min={5} max={100} value={Math.round(opacity * 100)} onChange={(e) => setOpacity(Number(e.target.value) / 100)} />
        </label>
      </div>

      <div className="fpc-color-row">
        <ColorWheel hue={hue} sat={sat} value={value} onPick={pickWheel} />
        <label className="fpc-slider-field fpc-value-slider">
          Яскравість: {value}%
          <input type="range" min={0} max={100} value={value} onChange={(e) => changeValue(Number(e.target.value))} />
        </label>
        <div className="fpc-current-color" style={{ background: color }} title={color} />
      </div>

      <div className="pxa-palette" style={{ marginTop: 8 }}>
        {palette.map((c, i) => (
          <div key={i} className="pxa-palette-item">
            <button type="button" className={'pxa-swatch' + (color === c ? ' active' : '')} style={{ background: c }} onClick={() => setColor(c)} title={c} />
            <button type="button" className="cl-mini-btn" onClick={() => removePaletteColor(i)}>×</button>
          </div>
        ))}
        <input type="color" className="cl-swatch-input" value={color} onChange={(e) => setColor(e.target.value)} title="Свій колір" />
        <button type="button" className="cl-mini-btn" onClick={addPaletteColor}>+ У палітру</button>
      </div>
    </div>
  )

  return (
    <div className={'fpc' + (fullscreen ? ' fpc-fullscreen' : '')}>
      {Toolbar}
      <div className="fpc-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="fpc-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
    </div>
  )
}
