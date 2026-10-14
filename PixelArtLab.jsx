import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'

// Реальний піксельний редактор — Block C (Pixel Art) курсу Game Art
// потребує справжнього інструмента малювання по сітці, а не макета.
// Малюнок — плаский масив кольорів (hex або null = прозорий) довжиною
// size*size; canvas перемальовується через useEffect без залежностей
// (той самий патерн, що й у Wireframe/Flow Studio), а не керується
// напряму з обробників подій.

const SIZES = [16, 24, 32]
const DEFAULT_PALETTE = ['#1A1A1E', '#5B5B66', '#B8B8C2', '#F5F5F7', '#E0373E', '#E6A028', '#2BB673', '#2E86DE', '#6B62FF', '#D94FAF']
const CELL_PX = 18

function emptyGrid(size) {
  return new Array(size * size).fill(null)
}

function HelpBox({ children }) {
  return (
    <details className="cl-help" open>
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

function floodFill(pixels, size, startIdx, targetColor, fillColor) {
  if (targetColor === fillColor) return pixels
  const next = pixels.slice()
  const stack = [startIdx]
  const x0 = startIdx % size
  const y0 = Math.floor(startIdx / size)
  const visited = new Set()
  while (stack.length) {
    const idx = stack.pop()
    if (visited.has(idx)) continue
    visited.add(idx)
    if (next[idx] !== targetColor) continue
    next[idx] = fillColor
    const x = idx % size
    const y = Math.floor(idx / size)
    if (x > 0) stack.push(idx - 1)
    if (x < size - 1) stack.push(idx + 1)
    if (y > 0) stack.push(idx - size)
    if (y < size - 1) stack.push(idx + size)
  }
  return next
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export default function PixelArtLab() {
  const [size, setSizeState] = useState(16)
  const [palette, setPalette] = useState(DEFAULT_PALETTE)
  const [activeColor, setActiveColor] = useState(DEFAULT_PALETTE[0])
  const [tool, setTool] = useState('pencil')
  const [showGrid, setShowGrid] = useState(true)
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastIdxRef = useRef(null)

  const hist = useLabHistory({ size: 16, pixels: emptyGrid(16) })
  const { pixels } = hist.value

  const labMode = useLabMode()
  const toastApi = useLabToast()
  const { push: pushRecentLab } = useLabRecent('lab')
  useEffect(() => {
    pushRecentLab('pixel-art')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commitPixels(next) {
    hist.set({ size: hist.value.size, pixels: next })
  }

  function changeSize(newSize) {
    hist.reset({ size: newSize, pixels: emptyGrid(newSize) })
    setSizeState(newSize)
    toastApi.show(`✓ Нове полотно ${newSize}×${newSize}`)
  }

  function idxFromEvent(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width) * hist.value.size
    const cy = ((e.clientY - rect.top) / rect.height) * hist.value.size
    const x = Math.floor(cx)
    const y = Math.floor(cy)
    if (x < 0 || y < 0 || x >= hist.value.size || y >= hist.value.size) return null
    return y * hist.value.size + x
  }

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
      return floodFill(draft, hist.value.size, idx, current, activeColor)
    }
    if (tool === 'eyedropper') {
      if (current) setActiveColor(current)
      return draft
    }
    return draft
  }

  function start(e) {
    const idx = idxFromEvent(e)
    if (idx === null) return
    drawingRef.current = true
    lastIdxRef.current = idx
    const next = applyToolAt(idx, pixels.slice())
    commitPixels(next)
  }
  function move(e) {
    if (!drawingRef.current || tool === 'fill' || tool === 'eyedropper') return
    const idx = idxFromEvent(e)
    if (idx === null || idx === lastIdxRef.current) return
    lastIdxRef.current = idx
    const next = applyToolAt(idx, pixels.slice())
    commitPixels(next)
  }
  function end() {
    drawingRef.current = false
    lastIdxRef.current = null
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const n = hist.value.size
    canvas.width = n * CELL_PX
    canvas.height = n * CELL_PX
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    // checkerboard for transparency
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const checker = (x + y) % 2 === 0 ? '#2A2A32' : '#232329'
        ctx.fillStyle = checker
        ctx.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX, CELL_PX)
      }
    }
    for (let i = 0; i < hist.value.pixels.length; i++) {
      const color = hist.value.pixels[i]
      if (!color) continue
      const x = i % n
      const y = Math.floor(i / n)
      ctx.fillStyle = color
      ctx.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX, CELL_PX)
    }
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      for (let i = 0; i <= n; i++) {
        ctx.beginPath()
        ctx.moveTo(i * CELL_PX, 0)
        ctx.lineTo(i * CELL_PX, n * CELL_PX)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i * CELL_PX)
        ctx.lineTo(n * CELL_PX, i * CELL_PX)
        ctx.stroke()
      }
    }
  })

  function exportPng(scale) {
    const n = hist.value.size
    const off = document.createElement('canvas')
    off.width = n * scale
    off.height = n * scale
    const octx = off.getContext('2d')
    octx.imageSmoothingEnabled = false
    for (let i = 0; i < hist.value.pixels.length; i++) {
      const color = hist.value.pixels[i]
      if (!color) continue
      const x = i % n
      const y = Math.floor(i / n)
      octx.fillStyle = color
      octx.fillRect(x * scale, y * scale, scale, scale)
    }
    downloadDataUrl(off.toDataURL('image/png'), `pixel-art-${n}x${n}.png`)
    toastApi.show('✓ PNG завантажено')
  }

  function addPaletteColor() {
    const next = [...palette, '#FFFFFF']
    setPalette(next)
  }
  function updatePaletteColor(i, color) {
    setPalette(palette.map((c, idx) => (idx === i ? color : c)))
  }
  function removePaletteColor(i) {
    if (palette.length <= 1) return
    setPalette(palette.filter((_, idx) => idx !== i))
  }
  function clearCanvas() {
    commitPixels(emptyGrid(hist.value.size))
    toastApi.show('✓ Полотно очищено')
  }

  useLabShortcuts({
    onUndo: hist.canUndo ? hist.undo : undefined,
    onRedo: hist.canRedo ? hist.redo : undefined,
  })

  return (
    <LabShell
      title="Pixel Art Editor"
      subtitle="Справжній піксельний редактор: обмежена палітра, олівець, гумка, заливка, піпетка, скасування дій і експорт PNG у 1x та 8x."
      icon="🟪"
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={hist.undo}
      onRedo={hist.redo}
      toast={toastApi.toast}
      extra={
        <LabInfoTip title="Керування">
          Клік/перетягування лівою кнопкою — малювати обраним інструментом. Olівець фарбує піксель, Гумка стирає, Заливка заповнює суцільну область, Піпетка бере колір з полотна.
        </LabInfoTip>
      }
    >
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

        <div className="cl-panel">
          <p className="cl-tab-desc">Піксельна графіка — малювання по жорсткій сітці з обмеженою кількістю кольорів. Саме так створені всі класичні 2D-ігри: кожен піксель — свідоме рішення, а не випадковий мазок пензля.</p>
          <HelpBox>
            <p>Обмежена палітра (тут — {palette.length} кольорів) змушує продумувати кожен відтінок заздалегідь, замість покладатись на плавні градієнти — це і є дисципліна піксель-арту.</p>
            <p>Заливка (flood fill) заповнює лише суцільну область одного кольору навколо точки кліку — межею служить будь-який інший колір чи прозорість, так само, як «відро з фарбою» в Photoshop/Aseprite.</p>
            <p>Експорт 1x дає файл рівно {hist.value.size}×{hist.value.size} пікселів — саме такий розмір реально піде у спрайт гри. Експорт 8x — та сама картинка, збільшена без згладжування, зручна лише для перегляду чи презентації.</p>
          </HelpBox>

          <p className="cl-section-title">Розмір полотна</p>
          <div className="cl-btn-row">
            {SIZES.map((s) => (
              <button key={s} className={'cl-mini-btn' + (hist.value.size === s ? ' active' : '')} onClick={() => changeSize(s)}>{s}×{s}</button>
            ))}
          </div>

          <p className="cl-section-title">Інструмент</p>
          <div className="cl-btn-row">
            <button className={'cl-mini-btn' + (tool === 'pencil' ? ' active' : '')} onClick={() => setTool('pencil')}>✏️ Олівець</button>
            <button className={'cl-mini-btn' + (tool === 'eraser' ? ' active' : '')} onClick={() => setTool('eraser')}>🧹 Гумка</button>
            <button className={'cl-mini-btn' + (tool === 'fill' ? ' active' : '')} onClick={() => setTool('fill')}>🪣 Заливка</button>
            <button className={'cl-mini-btn' + (tool === 'eyedropper' ? ' active' : '')} onClick={() => setTool('eyedropper')}>💧 Піпетка</button>
            <button className={'cl-mini-btn' + (showGrid ? ' active' : '')} onClick={() => setShowGrid(!showGrid)}>▦ Сітка</button>
          </div>

          <p className="cl-section-title">Палітра</p>
          <div className="pxa-palette">
            {palette.map((c, i) => (
              <div key={i} className="pxa-palette-item">
                <button
                  className={'pxa-swatch' + (activeColor === c ? ' active' : '')}
                  style={{ background: c }}
                  onClick={() => setActiveColor(c)}
                  title={c}
                />
                {labMode.isPro && (
                  <>
                    <input type="color" className="cl-swatch-input" value={c} onChange={(e) => updatePaletteColor(i, e.target.value)} />
                    <button className="cl-mini-btn" onClick={() => removePaletteColor(i)}>×</button>
                  </>
                )}
              </div>
            ))}
            <button className="cl-mini-btn" onClick={addPaletteColor}>+ Колір</button>
          </div>

          <p className="cl-section-title">Файл</p>
          <div className="cl-picker-top">
            <button className="harmony-btn" onClick={() => exportPng(1)}>⬇ PNG 1x</button>
            <button className="harmony-btn" onClick={() => exportPng(8)}>⬇ PNG 8x</button>
            <button className="cl-mini-btn" onClick={clearCanvas}>🗑 Очистити</button>
          </div>
        </div>
      </div>
    </LabShell>
  )
}
