import { useEffect, useRef, useState } from 'react'
import {
  BRUSH_SIZES, DEFAULT_PALETTE, setupCanvas, loadImageToCanvas,
  strokeSegment, dot, canvasToDataUrl, pointFromEvent,
} from './freePaintEngine.js'

const CANVAS_W = 1100
const CANVAS_H = 760
const UNDO_LIMIT = 25

// Довільне цифрове малювання (не піксельна сітка) — для концепт-арту,
// персонажів, кежуал-арту: безперервний пензель, великий полотно,
// регульований розмір/непрозорість/м'якість краю, гумка, палітра +
// власний колір, скасування дій, і повноекранний режим (бо малювати в
// 300px-колонці справді незручно). Автозбереження в imageDataUrl асета
// при кожному відпусканні пензля — той самий принцип, що й в усій студії.
export default function FreePaintCanvas({ initialImage, onChangeImage, onMessage, assetKey }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const undoStackRef = useRef([])

  const [tool, setTool] = useState('brush')
  const [color, setColor] = useState('#1a1a1a')
  const [palette, setPalette] = useState(DEFAULT_PALETTE)
  const [size, setSize] = useState(12)
  const [opacity, setOpacity] = useState(1)
  const [soft, setSoft] = useState(false)
  const [fullscreen, setFullscreen] = useState(true)
  const [canUndo, setCanUndo] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, CANVAS_W, CANVAS_H)
    ctxRef.current = ctx
    undoStackRef.current = []
    setCanUndo(false)
    loadImageToCanvas(ctx, CANVAS_W, CANVAS_H, initialImage, () => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetKey])

  function pushUndoSnapshot() {
    const ctx = ctxRef.current
    if (!ctx) return
    const snap = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    undoStackRef.current.push(snap)
    if (undoStackRef.current.length > UNDO_LIMIT) undoStackRef.current.shift()
    setCanUndo(true)
  }

  function undo() {
    const ctx = ctxRef.current
    const stack = undoStackRef.current
    if (!ctx || stack.length === 0) return
    const snap = stack.pop()
    ctx.putImageData(snap, 0, 0)
    setCanUndo(stack.length > 0)
    commit()
  }

  function commit() {
    onChangeImage(canvasToDataUrl(canvasRef.current))
  }

  function start(e) {
    const ctx = ctxRef.current
    if (!ctx) return
    pushUndoSnapshot()
    drawingRef.current = true
    const p = pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H)
    lastPointRef.current = p
    dot(ctx, p.x, p.y, { size, color, opacity, soft, erase: tool === 'eraser' })
  }
  function move(e) {
    if (!drawingRef.current) return
    const ctx = ctxRef.current
    const p = pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H)
    const last = lastPointRef.current
    strokeSegment(ctx, last.x, last.y, p.x, p.y, { size, color, opacity, soft, erase: tool === 'eraser' })
    lastPointRef.current = p
  }
  function end() {
    if (!drawingRef.current) return
    drawingRef.current = false
    commit()
  }

  function clearCanvas() {
    pushUndoSnapshot()
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

  const Toolbar = (
    <div className="fpc-toolbar">
      <div className="cl-btn-row">
        <button type="button" className={'cl-mini-btn' + (tool === 'brush' ? ' active' : '')} onClick={() => setTool('brush')}>✏️ Пензель</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'eraser' ? ' active' : '')} onClick={() => setTool('eraser')}>🧹 Гумка</button>
        <button type="button" className={'cl-mini-btn' + (soft ? ' active' : '')} onClick={() => setSoft(!soft)}>◎ М’який край</button>
        <button type="button" className="cl-mini-btn" onClick={undo} disabled={!canUndo}>↶ Скасувати</button>
        <button type="button" className="cl-mini-btn" onClick={clearCanvas}>🗑 Очистити</button>
        <button type="button" className="cl-mini-btn" onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? '✕ Закрити' : '⛶ На весь екран'}</button>
      </div>
      <div className="fpc-sliders">
        <label className="fpc-slider-field">
          Розмір пензля: {size}px
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
