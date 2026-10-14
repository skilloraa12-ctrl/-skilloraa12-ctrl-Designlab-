import { useEffect, useRef, useState } from 'react'
import {
  SIZES, DEFAULT_PALETTE, emptyGrid, floodFill, drawPixelCanvas,
  pixelsToPngDataUrl, downloadDataUrl, idxFromCanvasEvent,
} from './pixelArtEngine.js'

// Той самий піксельний двигун, що й /labs/pixel-art (PixelArtLab.jsx),
// але як повністю контрольований компонент — pixels/size приходять
// ззовні і змінюються через onChangePixels/onSizeChange, тому його
// можна вставити прямо в Game Art Studio (розділ «2D-концепти»), а не
// лише на окрему сторінку лабораторії.
export default function PixelCanvasEditor({
  size, pixels, onChangePixels, onSizeChange,
  showSizePicker = true, showExport = true, exportBaseName = 'pixel-art',
  onMessage,
}) {
  const [palette, setPalette] = useState(DEFAULT_PALETTE)
  const [activeColor, setActiveColor] = useState(DEFAULT_PALETTE[0])
  const [tool, setTool] = useState('pencil')
  const [showGrid, setShowGrid] = useState(true)
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastIdxRef = useRef(null)

  function applyToolAt(idx, draft) {
    const current = draft[idx]
    if (tool === 'pencil') {
      if (current === activeColor) return draft
      const next = draft.slice()
      next[idx] = activeColor
      return next
    }
    if (tool === 'eraser') {
      if (current === null) return draft
      const next = draft.slice()
      next[idx] = null
      return next
    }
    if (tool === 'fill') {
      return floodFill(draft, size, idx, current, activeColor)
    }
    if (tool === 'eyedropper') {
      if (current) setActiveColor(current)
      return draft
    }
    return draft
  }

  function start(e) {
    const idx = idxFromCanvasEvent(canvasRef.current, size, e)
    if (idx === null) return
    drawingRef.current = true
    lastIdxRef.current = idx
    onChangePixels(applyToolAt(idx, pixels.slice()))
  }
  function move(e) {
    if (!drawingRef.current || tool === 'fill' || tool === 'eyedropper') return
    const idx = idxFromCanvasEvent(canvasRef.current, size, e)
    if (idx === null || idx === lastIdxRef.current) return
    lastIdxRef.current = idx
    onChangePixels(applyToolAt(idx, pixels.slice()))
  }
  function end() {
    drawingRef.current = false
    lastIdxRef.current = null
  }

  useEffect(() => {
    if (canvasRef.current) drawPixelCanvas(canvasRef.current, size, pixels, showGrid)
  })

  function exportPng(scale) {
    downloadDataUrl(pixelsToPngDataUrl(size, pixels, scale), `${exportBaseName}-${size}x${size}.png`)
    onMessage?.('✓ PNG завантажено')
  }
  function addPaletteColor() { setPalette([...palette, '#FFFFFF']) }
  function updatePaletteColor(i, color) { setPalette(palette.map((c, idx) => (idx === i ? color : c))) }
  function removePaletteColor(i) {
    if (palette.length <= 1) return
    setPalette(palette.filter((_, idx) => idx !== i))
  }
  function clearCanvas() {
    onChangePixels(emptyGrid(size))
    onMessage?.('✓ Полотно очищено')
  }

  return (
    <div className="cl pxa">
      <div className="pxa-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="pxa-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>

      {showSizePicker && onSizeChange && (
        <div className="cl-btn-row" style={{ marginTop: 10 }}>
          {SIZES.map((s) => (
            <button key={s} type="button" className={'cl-mini-btn' + (size === s ? ' active' : '')} onClick={() => onSizeChange(s)}>{s}×{s}</button>
          ))}
        </div>
      )}

      <div className="cl-btn-row" style={{ marginTop: 10 }}>
        <button type="button" className={'cl-mini-btn' + (tool === 'pencil' ? ' active' : '')} onClick={() => setTool('pencil')}>✏️ Олівець</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'eraser' ? ' active' : '')} onClick={() => setTool('eraser')}>🧹 Гумка</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'fill' ? ' active' : '')} onClick={() => setTool('fill')}>🪣 Заливка</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'eyedropper' ? ' active' : '')} onClick={() => setTool('eyedropper')}>💧 Піпетка</button>
        <button type="button" className={'cl-mini-btn' + (showGrid ? ' active' : '')} onClick={() => setShowGrid(!showGrid)}>▦ Сітка</button>
      </div>

      <div className="pxa-palette" style={{ marginTop: 10 }}>
        {palette.map((c, i) => (
          <div key={i} className="pxa-palette-item">
            <button
              type="button"
              className={'pxa-swatch' + (activeColor === c ? ' active' : '')}
              style={{ background: c }}
              onClick={() => setActiveColor(c)}
              title={c}
            />
            <input type="color" className="cl-swatch-input" value={c} onChange={(e) => updatePaletteColor(i, e.target.value)} />
            <button type="button" className="cl-mini-btn" onClick={() => removePaletteColor(i)}>×</button>
          </div>
        ))}
        <button type="button" className="cl-mini-btn" onClick={addPaletteColor}>+ Колір</button>
      </div>

      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        {showExport && (
          <>
            <button type="button" className="harmony-btn" onClick={() => exportPng(1)}>⬇ PNG 1x</button>
            <button type="button" className="harmony-btn" onClick={() => exportPng(8)}>⬇ PNG 8x</button>
          </>
        )}
        <button type="button" className="cl-mini-btn" onClick={clearCanvas}>🗑 Очистити</button>
      </div>
    </div>
  )
}
