import { useEffect, useRef, useState } from 'react'
import {
  BRUSH_SIZES, BRUSH_TYPES, BRUSH_VARIANTS, SHAPE_TYPES, DEFAULT_PALETTE, setupCanvas, loadImageToCanvas,
  strokeSegment, strokeCartoonPath, dot, drawShape, drawText, canvasToDataUrl, pointFromEvent,
  drawColorWheel, pickFromWheel, hsvToHex, floodFill,
} from './freePaintEngine.js'
import { useProgress } from '../ProgressContext.jsx'
import { renderThreeDSnapshot, SNAPSHOT_STYLES } from './threeSnapshot.js'
import { CAMERA_VIEWS } from './threeAnimScene.js'

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
// Вікно «Вставити з 3D»: вибір 3D-проєкту з 3D Design Studio, ракурсу й
// стилю (кольоровий / білий макет / розмальовка-контур) з живим превʼю.
// Знімок має прозорий фон і лягає поверх полотна (можна скасувати ↶).
function ThreeDImportModal({ projects, width, height, onInsert, onClose }) {
  const usable = projects.filter((p) => (p.anim?.objects || []).some((o) => o.type !== 'pointLight' && o.type !== 'spotLight'))
  const [projectId, setProjectId] = useState(usable[0]?.id || null)
  const [view, setView] = useState('iso')
  const [style, setStyle] = useState('lines')
  const [preview, setPreview] = useState(null)
  const project = usable.find((p) => p.id === projectId)

  useEffect(() => {
    if (!project) { setPreview(null); return }
    let cancelled = false
    // Рендер у наступному кадрі, щоб вікно встигло відмалюватись.
    const t = setTimeout(() => {
      try {
        const url = renderThreeDSnapshot(project, { width, height, view, style })
        if (!cancelled) setPreview(url)
      } catch (e) {
        console.error(e)
        if (!cancelled) setPreview(null)
      }
    }, 30)
    return () => { cancelled = true; clearTimeout(t) }
  }, [project, view, style, width, height])

  return (
    <div className="fpc-3d-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="draw-modal fpc-3d-modal" role="dialog" aria-label="Вставити з 3D">
        <div className="cl-section-title" style={{ marginTop: 0 }}>🧊 Вставити свою 3D-модель і розмалювати</div>
        {usable.length === 0 ? (
          <p className="cl-tab-desc">У тебе ще немає 3D-проєктів із фігурами. Створи модель у 3D Design Studio (редактор з анімацією) — і вона зʼявиться тут.</p>
        ) : (
          <>
            <div className="cl-section-title">3D-проєкт</div>
            <div className="cl-btn-row">
              {usable.map((p) => (
                <button key={p.id} type="button" className={'cl-mini-btn' + (p.id === projectId ? ' active' : '')} onClick={() => setProjectId(p.id)}>
                  {p.name} ({p.anim.objects.length})
                </button>
              ))}
            </div>
            <div className="cl-section-title">Ракурс</div>
            <div className="cl-btn-row">
              {CAMERA_VIEWS.map((v) => (
                <button key={v.key} type="button" className={'cl-mini-btn' + (v.key === view ? ' active' : '')} onClick={() => setView(v.key)}>{v.icon} {v.label}</button>
              ))}
            </div>
            <div className="cl-section-title">Стиль</div>
            <div className="cl-btn-row">
              {SNAPSHOT_STYLES.map((st) => (
                <button key={st.key} type="button" className={'cl-mini-btn' + (st.key === style ? ' active' : '')} onClick={() => setStyle(st.key)}>{st.label}</button>
              ))}
            </div>
            <div className="fpc-3d-preview">
              {preview ? <img src={preview} alt="Превʼю 3D-моделі" /> : <span className="cl-tab-desc">Рендер…</span>}
            </div>
          </>
        )}
        <div className="cl-picker-top" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="cl-mini-btn" onClick={onClose}>Скасувати</button>
          <button type="button" className="harmony-btn" disabled={!preview} onClick={() => onInsert(preview)}>✓ Вставити на полотно</button>
        </div>
      </div>
    </div>
  )
}

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
  const cartoonBaseRef = useRef(null)
  const cartoonPointsRef = useRef([])

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
  const [show3d, setShow3d] = useState(false)
  const [fillTolerance, setFillTolerance] = useState(40)
  const [placing, setPlacing] = useState(null) // вставлена модель, яку ще можна рухати/масштабувати
  const placeBaseRef = useRef(null)
  const placeDragRef = useRef(null)
  const placeUndoRef = useRef(null) // знімок ДО виділення (для ↶ і «Не вставляти»)
  const lassoRef = useRef(null) // точки ласо під час обведення
  const lassoBaseRef = useRef(null)
  const [fillMode, setFillMode] = useState('area')
  // Масштаб і зсув перегляду полотна (лише вигляд — сам малюнок 1100×760
  // не змінюється, тому пензлі, undo й збереження працюють як раніше).
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })
  const [handTool, setHandTool] = useState(false)
  const [spaceDown, setSpaceDown] = useState(false)
  const wrapRef = useRef(null)
  const panRef = useRef(null)
  const { threeDProjects = [] } = useProgress() || {}
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

  // ── Масштаб / переміщення перегляду ──
  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 8
  // Масштабування навколо точки (clientX/Y), щоб те, що під курсором,
  // лишалось під курсором. Канва трансформується від центру обгортки.
  function zoomAt(factor, clientX, clientY) {
    setView((v) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor))
      if (zoom === v.zoom) return v
      const r = wrapRef.current?.getBoundingClientRect()
      const mx = r && clientX != null ? clientX - (r.left + r.width / 2) : 0
      const my = r && clientY != null ? clientY - (r.top + r.height / 2) : 0
      const k = zoom / v.zoom
      return { zoom, x: mx - (mx - v.x) * k, y: my - (my - v.y) * k }
    })
  }
  function resetView() { setView({ zoom: 1, x: 0, y: 0 }) }
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    function onWheel(e) {
      e.preventDefault()
      if (placingRef.current && e.altKey) { scalePlacingRef.current(Math.exp(-e.deltaY * 0.0015)); return }
      // Коліщатко — масштаб; Shift+коліщатко — вліво/вправо;
      // тачпад (свайп двома пальцями дає deltaX) — рух у всі боки, щипок — масштаб.
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY)
      else if (e.shiftKey) setView((v) => ({ ...v, x: v.x - e.deltaY }))
      else if (e.deltaX !== 0) setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      else zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen])
  // Пробіл (утримувати) — тимчасова «рука», як у Photoshop/Krita.
  useEffect(() => {
    function down(e) {
      if (e.code !== 'Space' || textActive) return
      const t = document.activeElement?.tagName
      if (t === 'INPUT' || t === 'TEXTAREA') return
      e.preventDefault()
      setSpaceDown(true)
    }
    function up(e) { if (e.code === 'Space') setSpaceDown(false) }
    // Стрілки на клавіатурі — рух полотна.
    function arrows(e) {
      const t = document.activeElement?.tagName
      if (textActive || t === 'INPUT' || t === 'TEXTAREA') return
      const d = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [1, 0], ArrowRight: [-1, 0] }[e.key]
      if (!d) return
      e.preventDefault()
      setView((v) => ({ ...v, x: v.x + d[0] * 80, y: v.y + d[1] * 80 }))
    }
    window.addEventListener('keydown', arrows)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('keydown', arrows) }
  }, [textActive])
  const panning = handTool || spaceDown
  function panStart(e) {
    if (e.target.closest?.('.fpc-zoom-bar')) return // кнопки масштабу — звичайні кліки
    // Права (2) або середня (1) кнопка миші — завжди рух полотна, як у 3D.
    if (!(panning || e.button === 1 || e.button === 2)) return
    e.preventDefault()
    e.stopPropagation()
    wrapRef.current.setPointerCapture?.(e.pointerId)
    panRef.current = { x: e.clientX, y: e.clientY }
  }
  function panMove(e) {
    const pr = panRef.current
    if (!pr) return
    const dx = e.clientX - pr.x
    const dy = e.clientY - pr.y
    panRef.current = { x: e.clientX, y: e.clientY }
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
  }
  function panEnd() { panRef.current = null }

  function start(e) {
    if (panRef.current) return
    const ctx = ctxRef.current
    if (!ctx) return
    const p = pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H)

    if (placing) { placingStart(p); return }
    if (tool === 'select') {
      lassoBaseRef.current = captureSnapshot()
      lassoRef.current = [p]
      return
    }
    if (tool === 'fill') {
      const snap = captureSnapshot()
      if (floodFill(ctx, p.x, p.y, color, { opacity, tolerance: fillTolerance, mode: fillMode })) {
        pushUndo(snap)
        commit()
      } else if (fillMode === 'object') {
        onMessage?.('Клікни по самому обʼєкту, а не по фону')
      }
      return
    }
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
    const snap = captureSnapshot()
    pushUndo(snap)
    drawingRef.current = true
    lastPointRef.current = p
    if (brushType === 'hard' && variant === 'cartoon') {
      // Контур малюється одним суцільним шляхом на весь мазок (не по
      // сегментах), щоб петлі й самоперетини не перемальовувались
      // шматками одне поверх одного — див. strokeCartoonPath.
      cartoonBaseRef.current = snap
      cartoonPointsRef.current = [p]
      strokeCartoonPath(ctx, cartoonPointsRef.current, { size, color, opacity, erase: tool === 'eraser' })
      return
    }
    dot(ctx, p.x, p.y, { size, color, opacity, brushType, variant, erase: tool === 'eraser' })
  }

  function move(e) {
    if (lassoRef.current) {
      const p = pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H)
      lassoRef.current.push(p)
      const ctx = ctxRef.current
      ctx.putImageData(lassoBaseRef.current, 0, 0)
      ctx.save()
      ctx.beginPath()
      lassoRef.current.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
      ctx.lineWidth = 2 / view.zoom
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
      ctx.setLineDash([6 / view.zoom, 5 / view.zoom])
      ctx.strokeStyle = '#7c4dff'
      ctx.stroke()
      ctx.restore()
      return
    }
    if (placing) {
      if (placeDragRef.current) placingMove(pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H))
      return
    }
    if (!drawingRef.current) return
    const ctx = ctxRef.current
    const p = pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H)
    if (tool === 'shape') {
      ctx.putImageData(shapeBaseRef.current, 0, 0)
      const start_ = shapeStartRef.current
      drawShape(ctx, shapeType, start_.x, start_.y, p.x, p.y, { color, opacity, filled: shapeFilled, lineWidth: Math.max(2, size * 0.5) })
      return
    }
    if (brushType === 'hard' && variant === 'cartoon') {
      cartoonPointsRef.current.push(p)
      ctx.putImageData(cartoonBaseRef.current, 0, 0)
      strokeCartoonPath(ctx, cartoonPointsRef.current, { size, color, opacity, erase: tool === 'eraser' })
      return
    }
    const last = lastPointRef.current
    strokeSegment(ctx, last.x, last.y, p.x, p.y, { size, color, opacity, brushType, variant, erase: tool === 'eraser' })
    lastPointRef.current = p
  }

  function end() {
    placeDragRef.current = null
    if (lassoRef.current) {
      const poly = lassoRef.current
      lassoRef.current = null
      ctxRef.current.putImageData(lassoBaseRef.current, 0, 0)
      if (poly.length < 5 || !liftSelection(poly)) onMessage?.('Обведи мишкою те, що хочеш перемістити (одним рухом довкола)')
      return
    }
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

  // Знімок 3D-моделі (прозорий фон) лягає поверх поточного малюнка.
  // Вставлена картинка спершу «плаває»: її можна перетягнути й змінити
  // розмір (за кути, повзунком або Shift+коліщатком) і лише кнопкою
  // «Готово» вона назавжди лягає на малюнок. Прозорі поля знімка
  // обрізаються, щоб рамка охоплювала саму модель.
  function insertImage(dataUrl) {
    const ctx = ctxRef.current
    if (!ctx || !dataUrl) return
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const cx = c.getContext('2d')
      cx.drawImage(img, 0, 0)
      const data = cx.getImageData(0, 0, c.width, c.height).data
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if (data[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      }
      if (x1 < 0) return
      const w = x1 - x0 + 1
      const h = y1 - y0 + 1
      const crop = document.createElement('canvas')
      crop.width = w
      crop.height = h
      crop.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h)
      // Координати знімка = логічні координати полотна (знімок того ж розміру).
      const k = CANVAS_W / img.width
      placeUndoRef.current = null
      placeBaseRef.current = captureSnapshot()
      setPlacing({ img: crop, x: x0 * k, y: y0 * k, w: w * k, h: h * k, ratio: w / h })
      setTool('brush')
      onMessage?.('Перетягни модель на потрібне місце, тягни за кут — змінити розмір, потім «✓ Готово»')
    }
    img.src = dataUrl
    setShow3d(false)
  }
  function drawPlacing(pl, withFrame) {
    const ctx = ctxRef.current
    ctx.putImageData(placeBaseRef.current, 0, 0)
    ctx.drawImage(pl.img, pl.x, pl.y, pl.w, pl.h)
    if (!withFrame) return
    ctx.save()
    ctx.strokeStyle = '#7c4dff'
    ctx.lineWidth = 2 / view.zoom
    ctx.setLineDash([8 / view.zoom, 6 / view.zoom])
    ctx.strokeRect(pl.x, pl.y, pl.w, pl.h)
    ctx.setLineDash([])
    const hs = 14 / view.zoom
    ctx.fillStyle = '#ffffff'
    for (const [hx, hy] of [[pl.x, pl.y], [pl.x + pl.w, pl.y], [pl.x, pl.y + pl.h], [pl.x + pl.w, pl.y + pl.h]]) {
      ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs)
      ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs)
    }
    ctx.restore()
  }
  useEffect(() => {
    if (placing) drawPlacing(placing, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placing, view.zoom])
  const placingRef = useRef(null)
  placingRef.current = placing
  const scalePlacingRef = useRef(null)
  scalePlacingRef.current = scalePlacing
  function finishPlacing() {
    if (!placing) return
    drawPlacing(placing, false)
    pushUndo(placeUndoRef.current || placeBaseRef.current)
    placeUndoRef.current = null
    commit()
    setPlacing(null)
    onMessage?.('✓ Готово — розмальовуй!')
  }
  function cancelPlacing() {
    if (!placing) return
    // Для виділеної частини малюнка — повертаємо все як було до виділення.
    ctxRef.current.putImageData(placeUndoRef.current || placeBaseRef.current, 0, 0)
    placeUndoRef.current = null
    setPlacing(null)
  }

  // ── ✂ Виділити й перемістити (ласо) ──
  // Обводиш частину малюнка — вона «піднімається» в рамку (як свіжо
  // вставлена модель: тягни, змінюй розмір, «Готово»), а дірка на її місці
  // заповнюється кольорами фону довкола (інтерполяція від країв + розмиття),
  // щоб не лишалось білої плями.
  function liftSelection(poly) {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    const ratio = canvas.width / CANVAS_W
    const xs = poly.map((q) => q.x)
    const ys = poly.map((q) => q.y)
    const lx0 = Math.max(0, Math.floor(Math.min(...xs)))
    const ly0 = Math.max(0, Math.floor(Math.min(...ys)))
    const lx1 = Math.min(CANVAS_W, Math.ceil(Math.max(...xs)))
    const ly1 = Math.min(CANVAS_H, Math.ceil(Math.max(...ys)))
    if (lx1 - lx0 < 4 || ly1 - ly0 < 4) return false
    const original = captureSnapshot()
    // Вирізаний фрагмент (у реальних пікселях) із маскою-полігоном.
    const W = Math.round((lx1 - lx0) * ratio)
    const H = Math.round((ly1 - ly0) * ratio)
    const piece = document.createElement('canvas')
    piece.width = W
    piece.height = H
    const pc = piece.getContext('2d')
    pc.drawImage(canvas, lx0 * ratio, ly0 * ratio, W, H, 0, 0, W, H)
    pc.globalCompositeOperation = 'destination-in'
    pc.beginPath()
    poly.forEach((q, i) => { const x = (q.x - lx0) * ratio; const y = (q.y - ly0) * ratio; if (i) pc.lineTo(x, y); else pc.moveTo(x, y) })
    pc.closePath()
    pc.fill()
    // Маска дірки на всьому полотні (реальні пікселі).
    const CW = canvas.width
    const CH = canvas.height
    const mc = document.createElement('canvas')
    mc.width = CW
    mc.height = CH
    const mctx = mc.getContext('2d')
    mctx.beginPath()
    poly.forEach((q, i) => { if (i) mctx.lineTo(q.x * ratio, q.y * ratio); else mctx.moveTo(q.x * ratio, q.y * ratio) })
    mctx.closePath()
    mctx.lineWidth = 2
    mctx.fill()
    mctx.stroke()
    const md = mctx.getImageData(0, 0, CW, CH).data
    const img = ctx.getImageData(0, 0, CW, CH)
    const d = img.data
    const bx0 = Math.max(0, Math.floor(lx0 * ratio) - 2), bx1 = Math.min(CW - 1, Math.ceil(lx1 * ratio) + 2)
    const by0 = Math.max(0, Math.floor(ly0 * ratio) - 2), by1 = Math.min(CH - 1, Math.ceil(ly1 * ratio) + 2)
    const hole = (x, y) => md[(y * CW + x) * 4 + 3] > 0
    const fillPx = []
    for (let y = by0; y <= by1; y++) {
      for (let x = bx0; x <= bx1; x++) {
        if (!hole(x, y)) continue
        // Найближчі «живі» пікселі ліворуч/праворуч/вгорі/внизу → зважене середнє.
        let acc = [0, 0, 0]
        let wsum = 0
        const take = (xx, yy, dist) => {
          const j = (yy * CW + xx) * 4
          const w = 1 / dist
          acc[0] += d[j] * w; acc[1] += d[j + 1] * w; acc[2] += d[j + 2] * w; wsum += w
        }
        for (let xx = x - 1; xx >= 0; xx--) if (!hole(xx, y)) { take(xx, y, x - xx); break }
        for (let xx = x + 1; xx < CW; xx++) if (!hole(xx, y)) { take(xx, y, xx - x); break }
        for (let yy = y - 1; yy >= 0; yy--) if (!hole(x, yy)) { take(x, yy, y - yy); break }
        for (let yy = y + 1; yy < CH; yy++) if (!hole(x, yy)) { take(x, yy, yy - y); break }
        if (wsum) fillPx.push([(y * CW + x) * 4, acc[0] / wsum, acc[1] / wsum, acc[2] / wsum])
      }
    }
    for (const [j, r, g, b] of fillPx) { d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255 }
    // Кілька проходів розмиття всередині дірки — прибирає «хрест» інтерполяції.
    for (let pass = 0; pass < 3; pass++) {
      for (const [j] of fillPx) {
        const k = j / 4
        const x = k % CW
        const y = (k - x) / CW
        let r = 0, g = 0, b = 0, n = 0
        for (let dy = -3; dy <= 3; dy += 3) for (let dx = -3; dx <= 3; dx += 3) {
          const xx = x + dx, yy = y + dy
          if (xx < 0 || yy < 0 || xx >= CW || yy >= CH) continue
          const q = (yy * CW + xx) * 4
          r += d[q]; g += d[q + 1]; b += d[q + 2]; n++
        }
        d[j] = r / n; d[j + 1] = g / n; d[j + 2] = b / n
      }
    }
    ctx.putImageData(img, 0, 0)
    placeUndoRef.current = original
    placeBaseRef.current = captureSnapshot()
    setPlacing({ img: piece, x: lx0, y: ly0, w: lx1 - lx0, h: ly1 - ly0, ratio: (lx1 - lx0) / (ly1 - ly0) })
    onMessage?.('Тягни виділене на нове місце, за кут — змінити розмір, потім «✓ Готово»')
    return true
  }
  // Зміна розміру навколо центру (повзунок / коліщатко).
  function scalePlacing(factor) {
    setPlacing((pl) => {
      if (!pl) return pl
      const w = Math.max(20, Math.min(CANVAS_W * 4, pl.w * factor))
      const h = w / pl.ratio
      return { ...pl, x: pl.x + (pl.w - w) / 2, y: pl.y + (pl.h - h) / 2, w, h }
    })
  }
  function placingStart(p) {
    const pl = placing
    const hs = 18 / view.zoom
    const corners = [[pl.x, pl.y, 'tl'], [pl.x + pl.w, pl.y, 'tr'], [pl.x, pl.y + pl.h, 'bl'], [pl.x + pl.w, pl.y + pl.h, 'br']]
    const corner = corners.find(([cx, cy]) => Math.abs(p.x - cx) < hs && Math.abs(p.y - cy) < hs)
    if (corner) { placeDragRef.current = { kind: corner[2], start: pl }; return }
    if (p.x >= pl.x && p.x <= pl.x + pl.w && p.y >= pl.y && p.y <= pl.y + pl.h) {
      placeDragRef.current = { kind: 'move', dx: p.x - pl.x, dy: p.y - pl.y }
    }
  }
  function placingMove(p) {
    const d = placeDragRef.current
    if (!d) return
    if (d.kind === 'move') { setPlacing((pl) => ({ ...pl, x: p.x - d.dx, y: p.y - d.dy })); return }
    // Кут: протилежний кут лишається на місці, пропорції зберігаються.
    const s0 = d.start
    const ax = d.kind.includes('l') ? s0.x + s0.w : s0.x
    const ay = d.kind.includes('t') ? s0.y + s0.h : s0.y
    const w = Math.max(20, Math.max(Math.abs(p.x - ax), Math.abs(p.y - ay) * s0.ratio))
    const h = w / s0.ratio
    setPlacing((pl) => ({ ...pl, w, h, x: d.kind.includes('l') ? ax - w : ax, y: d.kind.includes('t') ? ay - h : ay }))
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
        <button type="button" className={'cl-mini-btn' + (tool === 'fill' ? ' active' : '')} onClick={() => setTool('fill')}>🪣 Заливка</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'select' ? ' active' : '')} onClick={() => setTool('select')} title="Обведи частину малюнка, щоб перемістити або змінити розмір">✂ Виділити й перемістити</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'shape' ? ' active' : '')} onClick={() => setTool('shape')}>◆ Форми</button>
        <button type="button" className={'cl-mini-btn' + (tool === 'text' ? ' active' : '')} onClick={() => setTool('text')}>Т Текст</button>
        <button type="button" className="cl-mini-btn" onClick={undo} disabled={!canUndo}>↶ Скасувати</button>
        <button type="button" className="cl-mini-btn" onClick={clearCanvas}>🗑 Очистити</button>
        <button type="button" className="cl-mini-btn" onClick={() => setShow3d(true)}>🧊 З 3D</button>
        <button type="button" className="cl-mini-btn" onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? '✕ Закрити' : '⛶ На весь екран'}</button>
      </div>

      {placing && (
        <div className="fpc-place-panel">
          <div className="cl-section-title" style={{ margin: '0 0 6px' }}>📐 Розмісти на полотні</div>
          <p className="cl-tab-desc" style={{ margin: '0 0 8px' }}>Тягни всередині рамки — перемістити. Тягни за білий квадратик у куті — збільшити/зменшити. Alt+коліщатко — теж розмір.</p>
          <div className="fpc-slider-field">
            Розмір: {Math.round((placing.w / CANVAS_W) * 100)}%
            <input type="range" min={5} max={250} step={1} value={Math.round((placing.w / CANVAS_W) * 100)} onChange={(e) => scalePlacing((parseInt(e.target.value, 10) / 100) * CANVAS_W / placing.w)} />
          </div>
          <div className="cl-btn-row" style={{ marginTop: 8 }}>
            <button type="button" className="cl-mini-btn" onClick={() => scalePlacing(0.9)}>➖ Менше</button>
            <button type="button" className="cl-mini-btn" onClick={() => scalePlacing(1.1)}>➕ Більше</button>
            <button type="button" className="cl-mini-btn" onClick={() => setPlacing((pl) => ({ ...pl, x: (CANVAS_W - pl.w) / 2, y: (CANVAS_H - pl.h) / 2 }))}>⊕ У центр</button>
          </div>
          <div className="cl-btn-row" style={{ marginTop: 8 }}>
            <button type="button" className="harmony-btn" onClick={finishPlacing}>✓ Готово</button>
            <button type="button" className="cl-mini-btn" onClick={cancelPlacing}>✕ Не вставляти</button>
          </div>
        </div>
      )}
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

      {tool === 'select' && !placing && (
        <p className="cl-tab-desc" style={{ margin: '6px 0' }}>✂ Обведи мишкою одним рухом те, що хочеш перемістити (напр. будиночок). Воно стане рухомим: тягни, змінюй розмір за кути, потім «✓ Готово». Місце під ним заповниться кольорами фону.</p>
      )}
      {tool === 'fill' && (
        <div>
          <div className="cl-btn-row" style={{ marginBottom: 8 }}>
            <button type="button" className={'cl-mini-btn' + (fillMode === 'area' ? ' active' : '')} onClick={() => setFillMode('area')}>▢ Область</button>
            <button type="button" className={'cl-mini-btn' + (fillMode === 'object' ? ' active' : '')} onClick={() => setFillMode('object')}>🏠 Весь обʼєкт</button>
          </div>
          <p className="cl-tab-desc" style={{ margin: '4px 0 8px' }}>
            {fillMode === 'area'
              ? 'Клікни всередині області — вона заллється обраним кольором до найближчих ліній (стіна, вікно, небо…).'
              : 'Клікни по обʼєкту — він увесь перефарбується в обраний колір, а тіні й обʼєм збережуться (зручно для моделі з 3D).'}
          </p>
          <div className="fpc-slider-field">
            Чутливість: {fillTolerance}
            <input type="range" min={0} max={150} step={5} value={fillTolerance} onChange={(e) => setFillTolerance(parseInt(e.target.value, 10))} />
          </div>
          <p className="cl-tab-desc" style={{ margin: '4px 0 8px', fontSize: 11 }}>Менше — заливає лише точно такий колір; більше — захоплює й схожі відтінки (тіні, градієнт).</p>
          <button type="button" className="cl-mini-btn" onClick={() => {
            const ctx = ctxRef.current
            pushUndo(captureSnapshot())
            ctx.save()
            ctx.globalAlpha = opacity
            ctx.fillStyle = color
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
            ctx.restore()
            commit()
            onMessage?.('✓ Полотно залито (↶ — скасувати)')
          }}>🪣 Залити все полотно цим кольором</button>
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
      <div
        ref={wrapRef}
        className={'fpc-canvas-wrap' + (panning ? ' fpc-panning' : '')}
        onPointerDownCapture={panStart}
        onPointerMove={panMove}
        onPointerUp={panEnd}
        onPointerCancel={panEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="fpc-zoom-bar">
          <button type="button" className="cl-mini-btn" onClick={() => zoomAt(1 / 1.25)} title="Віддалити (коліщатко миші вниз)">−</button>
          <button type="button" className="cl-mini-btn fpc-zoom-label" onClick={resetView} title="Показати все полотно">{Math.round(view.zoom * 100)}%</button>
          <button type="button" className="cl-mini-btn" onClick={() => zoomAt(1.25)} title="Приблизити (коліщатко миші вгору)">+</button>
          <button type="button" className={'cl-mini-btn' + (handTool ? ' active' : '')} onClick={() => setHandTool((v) => !v)} title="Рука: тягни, щоб рухати полотно (або тягни правою кнопкою миші / тримай Пробіл)">✋</button>
          <span className="fpc-pad">
            <button type="button" className="cl-mini-btn" style={{ gridArea: 'u' }} onClick={() => setView((v) => ({ ...v, y: v.y + 120 }))} title="Вгору (↑)">▲</button>
            <button type="button" className="cl-mini-btn" style={{ gridArea: 'l' }} onClick={() => setView((v) => ({ ...v, x: v.x + 120 }))} title="Вліво (←)">◀</button>
            <button type="button" className="cl-mini-btn" style={{ gridArea: 'r' }} onClick={() => setView((v) => ({ ...v, x: v.x - 120 }))} title="Вправо (→)">▶</button>
            <button type="button" className="cl-mini-btn" style={{ gridArea: 'd' }} onClick={() => setView((v) => ({ ...v, y: v.y - 120 }))} title="Вниз (↓)">▼</button>
          </span>
        </div>
        <div className="fpc-nav-hint">Права кнопка миші — рухати полотно · коліщатко — масштаб · стрілки ← ↑ → ↓</div>
        <canvas
          ref={canvasRef}
          className="fpc-canvas"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      {show3d && (
        <ThreeDImportModal projects={threeDProjects} width={CANVAS_W} height={CANVAS_H} onInsert={insertImage} onClose={() => setShow3d(false)} />
      )}
    </div>
  )
}
