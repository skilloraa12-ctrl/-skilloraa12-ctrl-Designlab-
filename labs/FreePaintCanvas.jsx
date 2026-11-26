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

// ── Обʼєкти (шари), як у Figma ─────────────────────────────────────────
// Кожна завершена дія (мазок, фігура, заливка, текст, вставлена 3D-модель,
// переміщене виділення) стає окремим обʼєктом: прямокутний фрагмент
// (PNG) з позицією. Полотно = білий фон + усі видимі обʼєкти по черзі.
// Обʼєкт виділяється кліком інструментом «↖ Вибрати», видаляється Delete,
// перетягується, ховається — і все це зберігається разом з малюнком, тож
// працює й після оновлення сторінки.
//
// Як обʼєкт отримується: перед дією запамʼятовується знімок полотна, після
// — порівнюється з новим; змінені пікселі (зі збереженим кольором) і є
// обʼєктом. Так однаково працюють усі пензлі й інструменти без їх
// переписування. Гумка дає обʼєкт кольору фону (його можна видалити —
// і стерте повернеться).
const MAX_LAYERS = 50
let layerSeq = 0
function newLayerId() {
  layerSeq += 1
  return `L${Date.now().toString(36)}${layerSeq}`
}
const OP_NAMES = { brush: 'Мазок', eraser: 'Гумка', fill: 'Заливка', shape: 'Фігура', text: 'Текст', place3d: '3D-модель', move: 'Переміщене', fillAll: 'Заливка полотна' }

export default function FreePaintCanvas({ initialImage, initialLayers, onChangeImage, onMessage, assetKey }) {
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
  const toolRef = useRef('brush')
  toolRef.current = tool
  const [brushType, setBrushTypeRaw] = useState('hard')
  const [variant, setVariant] = useState(BRUSH_VARIANTS.hard[0].key)
  function setBrushType(key) {
    setBrushTypeRaw(key)
    const list = BRUSH_VARIANTS[key]
    setVariant(list ? list[0].key : null)
  }
  const [color, setColor] = useState('#1a1a1a')
  const colorRef = useRef('#1a1a1a')
  colorRef.current = color
  const [palette, setPalette] = useState(DEFAULT_PALETTE)
  const [size, setSize] = useState(12)
  const [opacity, setOpacity] = useState(1)
  const opacityRef = useRef(1)
  opacityRef.current = opacity
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
  const fillModeRef = useRef('area')
  fillModeRef.current = fillMode
  // Масштаб і зсув перегляду полотна (лише вигляд — сам малюнок 1100×760
  // не змінюється, тому пензлі, undo й збереження працюють як раніше).
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })
  const [handTool, setHandTool] = useState(false)
  const [spaceDown, setSpaceDown] = useState(false)
  const wrapRef = useRef(null)
  const panRef = useRef(null)
  const { threeDProjects = [] } = useProgress() || {}
  const [canUndo, setCanUndo] = useState(false)
  const selectedIdRef = useRef(null)
  const viewZoomRef = useRef(1)
  viewZoomRef.current = view.zoom

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

  const layersRef = useRef([]) // [{ id, name, x, y, w, h, visible, canvas, src }]
  const [layersVersion, setLayersVersion] = useState(0)
  const [selectedLayerId, setSelectedLayerId] = useState(null)
  selectedIdRef.current = selectedLayerId
  const opBeforeRef = useRef(null) // знімок полотна перед поточною дією
  const opKindRef = useRef(null)
  const layerDragRef = useRef(null)

  function setLayers(next) {
    layersRef.current = next
    setLayersVersion((v) => v + 1)
  }
  function ratio() {
    return canvasRef.current.width / CANVAS_W
  }
  // Перемальовує полотно з обʼєктів (+ рамка обраного в режимі «Вибрати»).
  function composite(withFrame = true) {
    const ctx = ctxRef.current
    if (!ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.restore()
    for (const L of layersRef.current) {
      if (L.visible === false || !L.canvas) continue
      ctx.drawImage(L.canvas, L.x, L.y, L.w, L.h)
    }
    const sel = withFrame && toolRef.current === 'pick' && layersRef.current.find((L) => L.id === selectedIdRef.current)
    if (sel) {
      ctx.save()
      ctx.lineWidth = 2 / viewZoomRef.current
      ctx.strokeStyle = '#7c4dff'
      ctx.setLineDash([7 / viewZoomRef.current, 5 / viewZoomRef.current])
      ctx.strokeRect(sel.x - 2, sel.y - 2, sel.w + 4, sel.h + 4)
      ctx.restore()
    }
  }
  function serializeLayers() {
    return layersRef.current.map(({ id, name, x, y, w, h, visible, src, kind, fillColor }) => ({ id, name, x, y, w, h, visible: visible !== false, src, ...(kind ? { kind, fillColor } : {}) }))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, CANVAS_W, CANVAS_H)
    ctxRef.current = ctx
    undoStackRef.current = []
    setCanUndo(false)
    setTextActive(false)
    setSelectedLayerId(null)
    layersRef.current = []
    let cancelled = false
    const loadImg = (src) => new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })
    const toCanvas = (img, w, h) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      return c
    }
    ;(async () => {
      let layers = []
      if (Array.isArray(initialLayers) && initialLayers.length > 0) {
        for (const L of initialLayers) {
          const img = L.src ? await loadImg(L.src) : null
          if (img) layers.push({ ...L, canvas: toCanvas(img, img.width, img.height) })
        }
      } else if (initialImage) {
        // Старий малюнок без обʼєктів — один обʼєкт на все полотно.
        const img = await loadImg(initialImage)
        if (img) layers.push({ id: newLayerId(), name: 'Попередній малюнок', x: 0, y: 0, w: CANVAS_W, h: CANVAS_H, visible: true, canvas: toCanvas(img, Math.round(CANVAS_W * ratio()), Math.round(CANVAS_H * ratio())), src: initialImage })
      }
      if (cancelled) return
      setLayers(layers)
      composite()
    })()
    composite()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetKey])

  function captureSnapshot() {
    return ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
  }
  // Початок дії: знімок «до» + запис у історію (↶ повертає список обʼєктів).
  function pushUndo(snap, kind) {
    opBeforeRef.current = snap
    opKindRef.current = kind || null
    undoStackRef.current.push(layersRef.current)
    if (undoStackRef.current.length > UNDO_LIMIT) undoStackRef.current.shift()
    setCanUndo(true)
  }
  function undo() {
    const stack = undoStackRef.current
    if (!ctxRef.current || stack.length === 0) return
    opBeforeRef.current = null
    setLayers(stack.pop())
    setCanUndo(stack.length > 0)
    setSelectedLayerId(null)
    composite()
    save()
  }
  // Плоска картинка — JPEG у логічному розмірі (полотно непрозоре, файл
  // у рази менший за PNG у подвоєних пікселях екрана).
  function save() {
    const c = document.createElement('canvas')
    c.width = CANVAS_W
    c.height = CANVAS_H
    c.getContext('2d').drawImage(canvasRef.current, 0, 0, CANVAS_W, CANVAS_H)
    onChangeImage(c.toDataURL('image/jpeg', 0.9), serializeLayers())
  }
  // PNG обʼєкта для збереження — у логічних пікселях (не ×2 для Retina).
  function layerSrc(canvas, w, h) {
    const tw = Math.max(1, Math.round(w))
    const th = Math.max(1, Math.round(h))
    if (canvas.width <= tw) return canvas.toDataURL('image/png')
    const c = document.createElement('canvas')
    c.width = tw
    c.height = th
    c.getContext('2d').drawImage(canvas, 0, 0, tw, th)
    return c.toDataURL('image/png')
  }
  // Кінець дії: різниця «до/після» → новий обʼєкт.
  function commit() {
    const before = opBeforeRef.current
    opBeforeRef.current = null
    if (before) {
      const layer = extractLayer(before, captureSnapshot())
      if (layer) {
        layer.name = `${OP_NAMES[opKindRef.current || toolRef.current] || 'Обʼєкт'} ${layersRef.current.length + 1}`
        // Заливка області суцільним кольором — запамʼятовуємо колір, щоб при
        // видаленні лінії, що її обмежувала, заливка затекла на звільнене місце.
        if (opKindRef.current === 'fill' && fillModeRef.current === 'area' && opacityRef.current >= 1) {
          layer.kind = 'fillArea'
          layer.fillColor = colorRef.current
        }
        let next
        if (opKindRef.current === 'fillAll' && opacityRef.current >= 1) {
          // «Залити все полотно» = фон: суцільний прямокутник у самому низу.
          const c = document.createElement('canvas')
          c.width = canvasRef.current.width
          c.height = canvasRef.current.height
          const cx = c.getContext('2d')
          cx.fillStyle = colorRef.current
          cx.fillRect(0, 0, c.width, c.height)
          next = [{ ...layer, name: 'Фон', x: 0, y: 0, w: CANVAS_W, h: CANVAS_H, canvas: c, src: layerSrc(c, CANVAS_W, CANVAS_H) }, ...layersRef.current]
        } else {
          next = layer.kind === 'fillArea' ? placeFillUnderLines(layer) : [...layersRef.current, layer]
        }
        if (next.length > MAX_LAYERS) next = mergeLayers(next, next.length - MAX_LAYERS + 10)
        setLayers(next)
      } else {
        undoStackRef.current.pop() // нічого не змінилось — і в історії нема чого відміняти
        setCanUndo(undoStackRef.current.length > 0)
      }
      composite()
    }
    save()
  }
  function extractLayer(before, after) {
    const W = after.width
    const H = after.height
    const a = after.data
    const b = before.data
    let x0 = W, y0 = H, x1 = -1, y1 = -1
    for (let y = 0; y < H; y++) {
      const row = y * W * 4
      for (let x = 0; x < W; x++) {
        const j = row + x * 4
        if (a[j] !== b[j] || a[j + 1] !== b[j + 1] || a[j + 2] !== b[j + 2] || a[j + 3] !== b[j + 3]) {
          if (x < x0) x0 = x
          if (x > x1) x1 = x
          if (y < y0) y0 = y
          if (y > y1) y1 = y
        }
      }
    }
    if (x1 < 0) return null
    const w = x1 - x0 + 1
    const h = y1 - y0 + 1
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const cx = c.getContext('2d')
    const out = cx.createImageData(w, h)
    const o = out.data
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const j = ((y + y0) * W + (x + x0)) * 4
        if (a[j] === b[j] && a[j + 1] === b[j + 1] && a[j + 2] === b[j + 2] && a[j + 3] === b[j + 3]) continue
        const k = (y * w + x) * 4
        const al = a[j + 3] / 255 // прозоре (гумка) → колір фону
        o[k] = Math.round(a[j] * al + 255 * (1 - al))
        o[k + 1] = Math.round(a[j + 1] * al + 255 * (1 - al))
        o[k + 2] = Math.round(a[j + 2] * al + 255 * (1 - al))
        o[k + 3] = 255
      }
    }
    cx.putImageData(out, 0, 0)
    const r = W / CANVAS_W
    return { id: newLayerId(), name: '', x: x0 / r, y: y0 / r, w: w / r, h: h / r, visible: true, canvas: c, src: layerSrc(c, w / r, h / r) }
  }
  // Обʼєднує перші `count` обʼєктів (знизу) в один — щоб малюнок не ріс безмежно.
  function mergeLayers(list, count) {
    const parts = list.slice(0, count)
    const rest = list.slice(count)
    const r = ratio()
    const visible = parts.filter((L) => L.visible !== false)
    if (visible.length === 0) return rest
    const x0 = Math.min(...visible.map((L) => L.x))
    const y0 = Math.min(...visible.map((L) => L.y))
    const x1 = Math.max(...visible.map((L) => L.x + L.w))
    const y1 = Math.max(...visible.map((L) => L.y + L.h))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round((x1 - x0) * r))
    c.height = Math.max(1, Math.round((y1 - y0) * r))
    const cx = c.getContext('2d')
    for (const L of visible) cx.drawImage(L.canvas, (L.x - x0) * r, (L.y - y0) * r, L.w * r, L.h * r)
    return [{ id: newLayerId(), name: 'Обʼєднані обʼєкти', x: x0, y: y0, w: x1 - x0, h: y1 - y0, visible: true, canvas: c, src: layerSrc(c, x1 - x0, y1 - y0) }, ...rest]
  }
  function mergeAll() {
    if (layersRef.current.length < 2) return
    undoStackRef.current.push(layersRef.current)
    setCanUndo(true)
    setLayers(mergeLayers(layersRef.current, layersRef.current.length))
    setSelectedLayerId(null)
    composite()
    save()
  }
  function updateLayers(mutator, recordUndo = true) {
    if (recordUndo) {
      undoStackRef.current.push(layersRef.current)
      if (undoStackRef.current.length > UNDO_LIMIT) undoStackRef.current.shift()
      setCanUndo(true)
    }
    setLayers(mutator(layersRef.current))
    composite()
    save()
  }
  // Заливка області лягає ПІД лінії, що її обмежують: вставляється одразу
  // над найвищим обʼєктом, на який вона реально лягла (напр. попередня
  // заливка), а не на самий верх; і «підтікає» під сусідні лінії (до 60 px),
  // тож видалення чи переміщення лінії не лишає дірки.
  function placeFillUnderLines(layer) {
    const ls = layersRef.current
    const r = ratio()
    const CW = canvasRef.current.width
    const CH = canvasRef.current.height
    const fx0 = Math.round(layer.x * r), fy0 = Math.round(layer.y * r)
    const fd = layer.canvas.getContext('2d').getImageData(0, 0, layer.canvas.width, layer.canvas.height).data
    const fw = layer.canvas.width, fh = layer.canvas.height
    // 1) Найвищий обʼєкт, що має фарбу під залитою областю.
    let insertAt = 0
    for (let t = ls.length - 1; t >= 0 && insertAt === 0; t--) {
      const L = ls[t]
      if (L.visible === false) continue
      const lx0 = L.x * r, ly0 = L.y * r, lsc = L.canvas.width / (L.w * r)
      const ox0 = Math.max(fx0, Math.floor(lx0)), oy0 = Math.max(fy0, Math.floor(ly0))
      const ox1 = Math.min(fx0 + fw, Math.ceil(lx0 + L.w * r)), oy1 = Math.min(fy0 + fh, Math.ceil(ly0 + L.h * r))
      if (ox1 <= ox0 || oy1 <= oy0) continue
      const ld = L.canvas.getContext('2d').getImageData(0, 0, L.canvas.width, L.canvas.height).data
      // Яку частку ЦЬОГО обʼєкта накрила заливка: лінію-межу — лише
      // згладжений край (мало), попередню заливку під нею — більшість.
      let hits = 0
      let total = 0
      for (let y = oy0; y < oy1; y += 2) for (let x = ox0; x < ox1; x += 2) {
        const lx = Math.floor((x - lx0) * lsc), ly = Math.floor((y - ly0) * lsc)
        if (lx < 0 || ly < 0 || lx >= L.canvas.width || ly >= L.canvas.height) continue
        if (ld[(ly * L.canvas.width + lx) * 4 + 3] <= 10) continue
        total++
        if (fd[((y - fy0) * fw + (x - fx0)) * 4 + 3] > 0) hits++
      }
      if (hits >= 20 && hits > total * 0.5) insertAt = t + 1
    }
    // 2) Пікселі, закриті обʼєктами, що будуть НАД заливкою.
    const above = ls.slice(insertAt).filter((L) => L.visible !== false)
    if (above.length === 0) return [...ls.slice(0, insertAt), layer]
    const cov = document.createElement('canvas')
    cov.width = CW
    cov.height = CH
    const cc = cov.getContext('2d')
    for (const L of above) cc.drawImage(L.canvas, L.x * r, L.y * r, L.w * r, L.h * r)
    const covD = cc.getImageData(0, 0, CW, CH).data
    // 3) BFS від заливки в закриті пікселі (не далі 60 px).
    const MAXD = Math.round(60 * r)
    const mask = new Uint8Array(CW * CH)
    let queue = []
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      if (fd[(y * fw + x) * 4 + 3] === 0) continue
      const gx = x + fx0, gy = y + fy0
      if (gx < 0 || gy < 0 || gx >= CW || gy >= CH) continue
      const k = gy * CW + gx
      mask[k] = 1
      queue.push(k)
    }
    let gx0 = CW, gy0 = CH, gx1 = -1, gy1 = -1
    for (let dist = 0; dist < MAXD && queue.length; dist++) {
      const nextQ = []
      for (const k of queue) {
        const x = k % CW, y = (k - x) / CW
        if (x < gx0) gx0 = x; if (x > gx1) gx1 = x; if (y < gy0) gy0 = y; if (y > gy1) gy1 = y
        for (const n of [x > 0 ? k - 1 : -1, x < CW - 1 ? k + 1 : -1, y > 0 ? k - CW : -1, y < CH - 1 ? k + CW : -1]) {
          if (n < 0 || mask[n] || covD[n * 4 + 3] < 10) continue
          mask[n] = 1
          nextQ.push(n)
        }
      }
      queue = dist === 0 ? nextQ : nextQ
    }
    for (const k of queue) { const x = k % CW, y = (k - x) / CW; if (x < gx0) gx0 = x; if (x > gx1) gx1 = x; if (y < gy0) gy0 = y; if (y > gy1) gy1 = y }
    if (gx1 < 0) return [...ls.slice(0, insertAt), layer, ...ls.slice(insertAt)]
    const w = gx1 - gx0 + 1, h = gy1 - gy0 + 1
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const cx = c.getContext('2d')
    const out = cx.createImageData(w, h)
    const hex = layer.fillColor.replace('#', '')
    const fr = parseInt(hex.slice(0, 2), 16), fg = parseInt(hex.slice(2, 4), 16), fb = parseInt(hex.slice(4, 6), 16)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!mask[(y + gy0) * CW + (x + gx0)]) continue
      const j = (y * w + x) * 4
      out.data[j] = fr; out.data[j + 1] = fg; out.data[j + 2] = fb; out.data[j + 3] = 255
    }
    cx.putImageData(out, 0, 0)
    const grown = { ...layer, x: gx0 / r, y: gy0 / r, w: w / r, h: h / r, canvas: c, src: layerSrc(c, w / r, h / r) }
    return [...ls.slice(0, insertAt), grown, ...ls.slice(insertAt)]
  }

  // Заливки над видаленим обʼєктом «затікають» у пікселі, які він займав,
  // якщо ці пікселі прилягають до заливки (BFS по масці видаленого обʼєкта).
  function healFillsAfterDelete(ls, del) {
    const idx = ls.findIndex((L) => L.id === del.id)
    const r = ratio()
    const D = del.canvas.getContext('2d').getImageData(0, 0, del.canvas.width, del.canvas.height).data
    const dW = del.canvas.width
    const dScale = dW / del.w
    return ls.map((F, i) => {
      if (i <= idx || F.kind !== 'fillArea' || !F.fillColor) return F
      const ix0 = Math.max(F.x, del.x), iy0 = Math.max(F.y, del.y)
      const ix1 = Math.min(F.x + F.w, del.x + del.w), iy1 = Math.min(F.y + F.h, del.y + del.h)
      if (ix1 <= ix0 || iy1 <= iy0) return F
      const c = document.createElement('canvas')
      c.width = F.canvas.width
      c.height = F.canvas.height
      const cx = c.getContext('2d')
      cx.drawImage(F.canvas, 0, 0)
      const img = cx.getImageData(0, 0, c.width, c.height)
      const d = img.data
      const fW = c.width, fH = c.height
      const fScale = fW / F.w
      // Маска «звільнених» пікселів у координатах заливки.
      const inDel = (fx, fy) => {
        const lx = F.x + (fx + 0.5) / fScale
        const ly = F.y + (fy + 0.5) / fScale
        const dx = Math.floor((lx - del.x) * dScale)
        const dy = Math.floor((ly - del.y) * dScale)
        if (dx < 0 || dy < 0 || dx >= dW || dy >= del.canvas.height) return false
        return D[(dy * dW + dx) * 4 + 3] > 10
      }
      const hex = F.fillColor.replace('#', '')
      const fr = parseInt(hex.slice(0, 2), 16), fg = parseInt(hex.slice(2, 4), 16), fb = parseInt(hex.slice(4, 6), 16)
      const x0 = Math.max(0, Math.floor((ix0 - F.x) * fScale) - 1), y0 = Math.max(0, Math.floor((iy0 - F.y) * fScale) - 1)
      const x1 = Math.min(fW - 1, Math.ceil((ix1 - F.x) * fScale) + 1), y1 = Math.min(fH - 1, Math.ceil((iy1 - F.y) * fScale) + 1)
      const queue = []
      const seen = new Uint8Array(fW * fH)
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const k = y * fW + x
        if (d[k * 4 + 3] > 0 || !inDel(x, y)) continue
        if ((x > 0 && d[(k - 1) * 4 + 3] > 0) || (x < fW - 1 && d[(k + 1) * 4 + 3] > 0) || (y > 0 && d[(k - fW) * 4 + 3] > 0) || (y < fH - 1 && d[(k + fW) * 4 + 3] > 0)) { queue.push(k); seen[k] = 1 }
      }
      if (!queue.length) return F
      while (queue.length) {
        const k = queue.pop()
        const j = k * 4
        d[j] = fr; d[j + 1] = fg; d[j + 2] = fb; d[j + 3] = 255
        const x = k % fW, y = (k - x) / fW
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (nx < 0 || ny < 0 || nx >= fW || ny >= fH) continue
          const n = ny * fW + nx
          if (seen[n] || d[n * 4 + 3] > 0 || !inDel(nx, ny)) continue
          seen[n] = 1
          queue.push(n)
        }
      }
      cx.putImageData(img, 0, 0)
      return { ...F, canvas: c, src: layerSrc(c, F.w, F.h) }
    })
  }
  function deleteLayer(id) {
    updateLayers((ls) => {
      const del = ls.find((L) => L.id === id)
      return (del ? healFillsAfterDelete(ls, del) : ls).filter((L) => L.id !== id)
    })
    if (selectedIdRef.current === id) setSelectedLayerId(null)
    onMessage?.('✓ Обʼєкт видалено (↶ — повернути)')
  }
  function toggleLayer(id) {
    updateLayers((ls) => ls.map((L) => (L.id === id ? { ...L, visible: L.visible === false } : L)))
  }
  function moveLayerOrder(id, dir) {
    updateLayers((ls) => {
      const i = ls.findIndex((L) => L.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= ls.length) return ls
      const next = [...ls]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }
  // Найвищий видимий обʼєкт, у якого під точкою є фарба (з запасом у кілька
  // пікселів — щоб тонку лінію було легко влучити).
  function hitLayer(p) {
    const r = ratio()
    const ls = layersRef.current
    for (let i = ls.length - 1; i >= 0; i--) {
      const L = ls[i]
      if (L.visible === false || p.x < L.x - 4 || p.y < L.y - 4 || p.x > L.x + L.w + 4 || p.y > L.y + L.h + 4) continue
      const cx = Math.round((p.x - L.x) * (L.canvas.width / L.w))
      const cy = Math.round((p.y - L.y) * (L.canvas.height / L.h))
      const R = Math.round(4 * r)
      const sx = Math.max(0, cx - R), sy = Math.max(0, cy - R)
      const ex = Math.min(L.canvas.width, cx + R + 1), ey = Math.min(L.canvas.height, cy + R + 1)
      if (ex <= sx || ey <= sy) continue
      const d = L.canvas.getContext('2d').getImageData(sx, sy, ex - sx, ey - sy).data
      for (let k = 3; k < d.length; k += 4) if (d[k] > 10) return L
    }
    return null
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
    if (tool === 'pick') {
      const L = hitLayer(p)
      setSelectedLayerId(L ? L.id : null)
      selectedIdRef.current = L ? L.id : null
      if (L) layerDragRef.current = { id: L.id, sx: p.x, sy: p.y, ox: L.x, oy: L.y, before: layersRef.current, moved: false }
      composite()
      return
    }
    if (tool === 'select') {
      lassoBaseRef.current = captureSnapshot()
      lassoRef.current = [p]
      return
    }
    if (tool === 'fill') {
      const snap = captureSnapshot()
      if (floodFill(ctx, p.x, p.y, color, { opacity, tolerance: fillTolerance, mode: fillMode })) {
        pushUndo(snap, 'fill')
        commit()
      } else if (fillMode === 'object') {
        onMessage?.('Клікни по самому обʼєкту, а не по фону')
      }
      return
    }
    if (tool === 'text') {
      if (textActive) return
      const snap = captureSnapshot()
      pushUndo(snap, 'text')
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
    const ld = layerDragRef.current
    if (ld) {
      const p = pointFromEvent(canvasRef.current, e, CANVAS_W, CANVAS_H)
      const nx = ld.ox + (p.x - ld.sx)
      const ny = ld.oy + (p.y - ld.sy)
      ld.moved = true
      layersRef.current = layersRef.current.map((L) => (L.id === ld.id ? { ...L, x: nx, y: ny } : L))
      composite()
      return
    }
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
    const ld = layerDragRef.current
    if (ld) {
      layerDragRef.current = null
      if (ld.moved) {
        undoStackRef.current.push(ld.before)
        setCanUndo(true)
        setLayers(layersRef.current)
        composite()
        save()
      }
      return
    }
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
    updateLayers(() => [])
    setSelectedLayerId(null)
    onMessage?.('✓ Полотно очищено (↶ — повернути)')
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
    pushUndo(placeUndoRef.current || placeBaseRef.current, placeUndoRef.current ? 'move' : 'place3d')
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

  // Рамка обраного обʼєкта зʼявляється/зникає разом з інструментом «Вибрати».
  useEffect(() => {
    if (!placing && !textActive) composite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, selectedLayerId])
  // Delete / Backspace — видалити обраний обʼєкт; Esc — зняти виділення.
  useEffect(() => {
    function onKey(e) {
      const t = document.activeElement?.tagName
      if (t === 'INPUT' || t === 'TEXTAREA') return
      if (toolRef.current !== 'pick' || !selectedIdRef.current) return
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteLayer(selectedIdRef.current) }
      else if (e.key === 'Escape') setSelectedLayerId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const layersList = layersRef.current
  const LayersPanel = (
    <details className="fpc-layers" open={tool === 'pick' || undefined}>
      <summary>🗂 Обʼєкти ({layersList.length}) <span className="fpc-layers-hint">— клікни, щоб вибрати й видалити</span></summary>
      {layersList.length === 0 ? (
        <p className="cl-tab-desc" style={{ margin: '6px 0' }}>Поки порожньо. Кожен мазок, заливка, текст чи 3D-модель зʼявиться тут окремим обʼєктом.</p>
      ) : (
        <div className="fpc-layer-list" data-v={layersVersion}>
          {[...layersList].reverse().map((L) => (
            <div key={L.id} className={'fpc-layer-row' + (L.id === selectedLayerId ? ' active' : '') + (L.visible === false ? ' hidden' : '')}>
              <button type="button" className="fpc-layer-main" onClick={() => { setTool('pick'); setSelectedLayerId(L.id) }} title="Вибрати">
                <img src={L.src} alt="" />
                <span>{L.name}</span>
              </button>
              <button type="button" className="cl-mini-btn" onClick={() => moveLayerOrder(L.id, 1)} title="Вище">▲</button>
              <button type="button" className="cl-mini-btn" onClick={() => moveLayerOrder(L.id, -1)} title="Нижче">▼</button>
              <button type="button" className="cl-mini-btn" onClick={() => toggleLayer(L.id)} title={L.visible === false ? 'Показати' : 'Сховати'}>{L.visible === false ? '🙈' : '👁'}</button>
              <button type="button" className="cl-mini-btn" onClick={() => deleteLayer(L.id)} title="Видалити">🗑</button>
            </div>
          ))}
        </div>
      )}
      {layersList.length > 1 && (
        <button type="button" className="cl-mini-btn" style={{ marginTop: 6 }} onClick={mergeAll} title="Зменшує розмір файлу; окремо видаляти вже не вийде">⧉ Обʼєднати все в один</button>
      )}
    </details>
  )

  const Toolbar = (
    <div className="fpc-toolbar">
      <div className="cl-btn-row">
        <button type="button" className={'cl-mini-btn' + (tool === 'pick' ? ' active' : '')} onClick={() => setTool('pick')} title="Клікни по лінії чи обʼєкту, щоб вибрати; тягни — перемістити; Delete — видалити">↖ Вибрати</button>
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

      {tool === 'pick' && (
        <div className="fpc-place-panel">
          <p className="cl-tab-desc" style={{ margin: 0 }}>↖ Клікни по лінії чи обʼєкту — він виділиться рамкою. Тягни — перемістити. <b>Delete</b> або 🗑 — видалити.</p>
          {selectedLayerId && (
            <div className="cl-btn-row" style={{ marginTop: 8 }}>
              <button type="button" className="harmony-btn" onClick={() => deleteLayer(selectedLayerId)}>🗑 Видалити обраний</button>
              <button type="button" className="cl-mini-btn" onClick={() => toggleLayer(selectedLayerId)}>👁 Сховати/показати</button>
            </div>
          )}
        </div>
      )}
      {LayersPanel}
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
            pushUndo(captureSnapshot(), 'fillAll')
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
