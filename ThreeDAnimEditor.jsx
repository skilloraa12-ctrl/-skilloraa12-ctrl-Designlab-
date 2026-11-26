import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import { useLabHistory } from './labs/useLabHistory.js'
import LabToast from './labs/LabToast.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import NotFound from './NotFound.jsx'
import { createAnimScene, PRIMITIVES, CUSTOM_SHAPE, DEFAULT_PROFILE, PRIMITIVE_PROFILES, PAINT_W, PAINT_H, PAINT_SIDES, pointKey, LIGHT_KINDS, LIGHT_PRESETS, CAMERA_VIEWS } from './labs/threeAnimScene.js'
import { createEmptyAnimScene, makeAnimObject, makeKeyframeFromObject, LIGHT_TYPES } from './threeDProject.js'

// Повноцінний 3D-редактор з анімацією для 3D Design Studio — окремий від
// 3D Lab (що лишається незмінним інструментом для Game Art та інших
// напрямків). Макет: обʼєкти/додавання зліва, повноекранний вʼюпорт і
// таймлайн по центру, властивості обраного обʼєкта справа — класична
// 3D-редакторна схема. Реальний спільний таймлайн із ключовими кадрами
// (+ easing, copy/paste), точкові/прожекторні джерела світла як окремі
// анімовані обʼєкти сцени, undo/redo, клавіатурні скорочення, прив'язка
// до сітки, і експорт готової анімації (WebM-відео або glTF з анімацією).

const TABS = [
  { key: 'transform', icon: '🔄', label: 'Трансформація' },
  { key: 'shape', icon: '✏️', label: 'Форма' },
  { key: 'paint', icon: '🖌', label: 'Малювати' },
  { key: 'material', icon: '🎨', label: 'Матеріал/Світло' },
  { key: 'lighting', icon: '💡', label: 'Освітлення' },
  { key: 'camera', icon: '🎥', label: 'Камера' },
  { key: 'export', icon: '📤', label: 'Експорт' },
]

const EASING_OPTIONS = [
  { key: 'linear', label: 'Лінійно' },
  { key: 'easeIn', label: 'Ease In' },
  { key: 'easeOut', label: 'Ease Out' },
  { key: 'easeInOut', label: 'Ease In-Out' },
]
const EASINGS = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}

const SNAP_SIZE = 0.25
const SHAPES = [...PRIMITIVES, CUSTOM_SHAPE]
const PROFILE_RANGE = 1.5

let idCounter = 0
function nextId() {
  idCounter += 1
  return `aobj-${Date.now()}-${idCounter}`
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
function downloadText(text, filename, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
function safeFileName(name) {
  // Keeps Unicode letters (Ukrainian project names included) — only strips
  // whitespace (→ underscore) and characters invalid in filenames.
  return (name || 'animation').trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '') || 'animation'
}
function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

function lerp(a, b, t) {
  return a + (b - a) * t
}
// Rotation stored in degrees 0-360 — shortest-path interpolation so a
// keyframe pair like 350°→10° spins 20° forward, not 340° backward.
function lerpAngle(a, b, t) {
  const diff = (((b - a + 180) % 360) + 360) % 360 - 180
  return a + diff * t
}
function lerpVec3(a, b, t, angle = false) {
  const f = angle ? lerpAngle : lerp
  return { x: f(a.x, b.x, t), y: f(a.y, b.y, t), z: f(a.z, b.z, t) }
}

// Pose of one object at a given time: before the first keyframe or with no
// keyframes at all, holds the object's base transform; after the last, holds
// steady there; between two, eases (per the destination keyframe's `easing`)
// and interpolates (shortest-path for rotation).
function poseAt(obj, time) {
  const kfs = obj.keyframes
  if (!kfs || kfs.length === 0) return { position: obj.position, rotation: obj.rotation, scale: obj.scale }
  const sorted = [...kfs].sort((a, b) => a.time - b.time)
  if (time <= sorted[0].time) return sorted[0]
  const last = sorted[sorted.length - 1]
  if (time >= last.time) return last
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (time >= a.time && time <= b.time) {
      const raw = (time - a.time) / (b.time - a.time || 1)
      const t = (EASINGS[b.easing] || EASINGS.linear)(raw)
      return {
        position: lerpVec3(a.position, b.position, t),
        rotation: lerpVec3(a.rotation, b.rotation, t, true),
        scale: lerpVec3(a.scale, b.scale, t),
      }
    }
  }
  return { position: obj.position, rotation: obj.rotation, scale: obj.scale }
}

function findKeyframeAt(obj, time) {
  return obj.keyframes.find((k) => Math.abs(k.time - time) < 0.01) || null
}

function formatTime(t) {
  return `${t.toFixed(2)}с`
}

function HelpBox({ children }) {
  return (
    <details className="cl-help">
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

function AxisRow({ label, values, onChange, min = -5, max = 5, step = 0.05 }) {
  return (
    <div className="l3d-axis-row">
      <span className="l3d-axis-label">{label}</span>
      {['x', 'y', 'z'].map((axis) => (
        <label key={axis} className="l3d-axis-field">
          <span>{axis.toUpperCase()}</span>
          <input type="range" min={min} max={max} step={step} value={values[axis]} onChange={(e) => onChange(axis, parseFloat(e.target.value))} />
          <input type="number" step={step} value={Math.round(values[axis] * 100) / 100} onChange={(e) => onChange(axis, parseFloat(e.target.value) || 0)} />
        </label>
      ))}
    </div>
  )
}

function Timeline({ objects, selectedId, onSelect, duration, currentTime, onScrub, onJumpToKeyframe }) {
  return (
    <div className="tl-tracks">
      {objects.length === 0 && <p className="cl-tab-desc" style={{ margin: 0 }}>Додай обʼєкт зліва, щоб побачити тут його доріжку.</p>}
      {objects.map((o) => {
        const meta = SHAPES.find((p) => p.type === o.type) || LIGHT_KINDS.find((p) => p.type === o.type)
        return (
          <div key={o.id} className="tl-track-row">
            <button type="button" className={'tl-track-label' + (o.id === selectedId ? ' active' : '')} onClick={() => onSelect(o.id)} title={o.name || o.type}>
              {meta?.icon} {o.name || meta?.label || o.type}
            </button>
            <div
              className="tl-track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
                onScrub(Math.round(ratio * duration * 100) / 100)
                onSelect(o.id)
              }}
            >
              {duration > 0 && <div className="tl-playhead" style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }} />}
              {o.keyframes.map((k) => (
                <button
                  key={k.time}
                  type="button"
                  className="tl-keyframe"
                  style={{ left: `${duration > 0 ? (k.time / duration) * 100 : 0}%` }}
                  title={`${formatTime(k.time)} · ${k.easing || 'linear'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(o.id)
                    onJumpToKeyframe(k.time)
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ObjectsPanel({ objects, selectedId, onSelect, onAdd, onDraw, onImportFile, pendingImport, onImportApply, onImportCancel, onDelete, onDuplicate, onRename, selected }) {
  return (
    <div>
      <p className="cl-tab-desc">Кожна фігура чи світло отримує власну доріжку на таймлайні. Обʼєкт без жодного ключового кадру лишається статичним — анімація потрібна лише там, де вона справді щось розповідає.</p>
      <HelpBox>
        <p>Це той самий принцип, що в 3D Lab: сцена складається з окремих вузлів (форма/світло + позиція + властивості). Різниця тут — у кожного вузла є ще й <b>ключові кадри</b>: знімки його пози на спільному таймлайні.</p>
        <p>Прожектор світить у напрямку, заданому його обертанням (вкладка «Трансформація») — так само, як ти б повертав будь-яку іншу фігуру.</p>
      </HelpBox>

      <button className="harmony-btn draw-shape-btn" onClick={onDraw}>🖌 Намалювати форму → 3D</button>
      <label className="harmony-btn draw-shape-btn" style={{ cursor: 'pointer' }} title="Файл scene.json, збережений на вкладці «Експорт»">
        📥 Відкрити 3D-файл (JSON)
        <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onImportFile(f) }} />
      </label>
      {pendingImport && (
        <div className="import-banner">
          <p className="cl-tab-desc" style={{ margin: '0 0 8px' }}>Файл «{pendingImport.fileName}»: {pendingImport.objects.length} обʼєктів. Що зробити?</p>
          <div className="cl-btn-row">
            <button className="cl-mini-btn active" onClick={() => onImportApply('add')}>➕ Додати до сцени</button>
            <button className="cl-mini-btn" onClick={() => onImportApply('replace')}>♻ Замінити сцену</button>
            <button className="cl-mini-btn" onClick={onImportCancel}>Скасувати</button>
          </div>
        </div>
      )}
      <div className="cl-section-title">Додати фігуру</div>
      <div className="cl-btn-row">
        {SHAPES.map((p) => (
          <button key={p.type} className="harmony-btn" onClick={() => onAdd(p.type)}>{p.icon} {p.label}</button>
        ))}
      </div>
      <div className="cl-section-title">Додати світло</div>
      <div className="cl-btn-row">
        {LIGHT_KINDS.map((p) => (
          <button key={p.type} className="harmony-btn" onClick={() => onAdd(p.type)}>{p.icon} {p.label}</button>
        ))}
      </div>

      <div className="cl-section-title">Обʼєкти в сцені ({objects.length})</div>
      {objects.length === 0 ? (
        <p className="cl-tab-desc">Сцена порожня — додай фігуру чи світло вище.</p>
      ) : (
        <div className="l3d-object-list">
          {objects.map((o, i) => {
            const meta = SHAPES.find((p) => p.type === o.type) || LIGHT_KINDS.find((p) => p.type === o.type)
            return (
              <div key={o.id} className={'l3d-object-row' + (o.id === selectedId ? ' active' : '')}>
                <button className="l3d-object-select" onClick={() => onSelect(o.id)}>
                  {meta?.icon} {o.name || `${meta?.label || o.type} #${i + 1}`} {o.keyframes.length > 0 && <span title="Анімований">🎬{o.keyframes.length}</span>}
                </button>
                <button className="cl-mini-btn" onClick={() => onDuplicate(o.id)} title="Дублювати (Ctrl+D)">⧉</button>
                <button className="cl-mini-btn" onClick={() => onDelete(o.id)} title="Видалити (Del)">✕</button>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <>
          <div className="cl-section-title">Назва обраного обʼєкта</div>
          <input className="cl-hex-input" value={selected.name || ''} placeholder="Наприклад: М'яч, Камінь, Прожектор…" onChange={(e) => onRename(e.target.value)} style={{ textTransform: 'none' }} />
        </>
      )}
    </div>
  )
}

function TransformTab({ selected, time, onEdit, onAddKeyframe, onDeleteKeyframe, onSetEasing, onCopy, onPaste, canPaste, snapEnabled, onToggleSnap }) {
  if (!selected) return <p className="cl-tab-desc">Вибери обʼєкт зліва, щоб керувати позою й ключовими кадрами.</p>
  const existingKf = findKeyframeAt(selected, time)
  const pose = existingKf || selected
  return (
    <div>
      <p className="cl-tab-desc">Постав повзунки в потрібну позу, потім натисни «Додати ключовий кадр тут», щоб зафіксувати її на поточному часі таймлайна.</p>
      <HelpBox>
        <p>Якщо на поточному часі вже є ключовий кадр цього обʼєкта — повзунки редагують саме його. Якщо кадру тут немає — повзунки редагують «базову» позу (стартова точка, коли на обʼєкті взагалі немає кадрів).</p>
        <p>Easing визначає прискорення переходу з попереднього кадру в цей: лінійно — рівномірний рух, Ease In/Out — плавний старт чи зупинка, як у реальних обʼєктів під дією інерції.</p>
      </HelpBox>

      <label className="cl-editrow" style={{ marginBottom: 10 }}>
        <input type="checkbox" checked={snapEnabled} onChange={onToggleSnap} /> 🧲 Прив'язка позиції до сітки ({SNAP_SIZE})
      </label>

      <div className="cl-picker-top" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        {existingKf ? (
          <>
            <span className="gfx-status-pill">✦ Кадр на {formatTime(time)}</span>
            <button className="cl-mini-btn" onClick={() => onDeleteKeyframe(selected.id, time)}>🗑 Видалити</button>
            <button className="cl-mini-btn" onClick={onCopy} title="Ctrl+C">⧉ Копіювати</button>
          </>
        ) : (
          <>
            <span className="gfx-status-pill">Базова поза (кадру тут немає)</span>
            <button className="harmony-btn" onClick={onAddKeyframe}>◆ Додати ключовий кадр тут</button>
          </>
        )}
        {canPaste && <button className="cl-mini-btn" onClick={onPaste} title="Ctrl+V">📋 Вставити кадр</button>}
      </div>

      {existingKf && (
        <>
          <div className="cl-section-title">Easing (прискорення в цей кадр)</div>
          <div className="cl-btn-row" style={{ marginBottom: 14 }}>
            {EASING_OPTIONS.map((e) => (
              <button key={e.key} className={'cl-mini-btn' + ((existingKf.easing || 'linear') === e.key ? ' active' : '')} onClick={() => onSetEasing(e.key)}>{e.label}</button>
            ))}
          </div>
        </>
      )}

      <div className="cl-section-title">Position</div>
      <AxisRow label="Position" values={pose.position} onChange={(axis, v) => onEdit('position', axis, v)} min={-4} max={4} step={0.05} />
      <div className="cl-section-title">Rotation (°)</div>
      <AxisRow label="Rotation" values={pose.rotation} onChange={(axis, v) => onEdit('rotation', axis, v)} min={0} max={360} step={1} />
      <div className="cl-section-title">Scale</div>
      <AxisRow label="Scale" values={pose.scale} onChange={(axis, v) => onEdit('scale', axis, v)} min={0.1} max={3} step={0.05} />
    </div>
  )
}

function distToSegment(p, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy || 1e-9
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

// 2D-редактор контуру «Своєї форми»: тягни точки, клік по порожньому
// місцю — нова точка (вставляється в найближчий відрізок), подвійний клік
// по точці — видалити. Для «обертання» ліва половина — лише дзеркальне
// превʼю: профіль задається праворуч від осі.
function ProfileEditor({ mode, points, onChange }) {
  const svgRef = useRef(null)
  const dragIdx = useRef(null)
  const closed = mode === 'extrude'
  const R = PROFILE_RANGE

  function toLocal(e) {
    const rect = svgRef.current.getBoundingClientRect()
    let x = ((e.clientX - rect.left) / rect.width) * 2 * R - R
    let y = -(((e.clientY - rect.top) / rect.height) * 2 * R - R)
    const r = (v) => Math.round(Math.max(-R, Math.min(R, v)) * 100) / 100
    x = r(x)
    y = r(y)
    if (mode === 'lathe') x = Math.max(0, x)
    return { x, y }
  }
  function handleMove(e) {
    if (dragIdx.current === null) return
    const p = toLocal(e)
    onChange(points.map((pt, i) => (i === dragIdx.current ? p : pt)))
  }
  function handleUp() {
    dragIdx.current = null
  }
  function handleBgClick(e) {
    if (e.target.dataset.handle) return
    const p = toLocal(e)
    const segCount = closed ? points.length : points.length - 1
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < segCount; i++) {
      const d = distToSegment(p, points[i], points[(i + 1) % points.length])
      if (d < bestD) { bestD = d; best = i }
    }
    const next = [...points]
    next.splice(best + 1, 0, p)
    onChange(next)
  }
  const toSvg = (pt) => `${pt.x},${-pt.y}`
  const path = points.map(toSvg).join(' ')
  const mirror = points.map((pt) => `${-pt.x},${-pt.y}`).join(' ')
  const grid = []
  for (let v = -R; v <= R + 1e-6; v += 0.25) {
    const major = Math.abs(v) < 1e-6
    grid.push(<line key={'v' + v} x1={v} y1={-R} x2={v} y2={R} stroke={major ? '#6b6b80' : '#2c2c38'} strokeWidth={major ? 0.015 : 0.008} />)
    grid.push(<line key={'h' + v} x1={-R} y1={v} x2={R} y2={v} stroke={major ? '#6b6b80' : '#2c2c38'} strokeWidth={major ? 0.015 : 0.008} />)
  }
  return (
    <svg
      ref={svgRef}
      className="shape-profile-svg"
      viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      onClick={handleBgClick}
    >
      <rect x={-R} y={-R} width={2 * R} height={2 * R} fill="#14141b" />
      {grid}
      {mode === 'lathe' && <rect x={-R} y={-R} width={R} height={2 * R} fill="rgba(0,0,0,0.35)" />}
      {mode === 'lathe' && <polyline points={mirror} fill="none" stroke="#7d78ff" strokeWidth={0.02} strokeDasharray="0.06 0.05" opacity={0.6} />}
      {closed
        ? <polygon points={path} fill="rgba(125,120,255,0.25)" stroke="#9b97ff" strokeWidth={0.025} />
        : <polyline points={path} fill="none" stroke="#9b97ff" strokeWidth={0.03} />}
      {points.map((pt, i) => (
        <circle
          key={i}
          data-handle="1"
          cx={pt.x}
          cy={-pt.y}
          r={0.065}
          fill={i === 0 ? '#ffd23f' : '#ffffff'}
          stroke="#3E37E0"
          strokeWidth={0.02}
          style={{ cursor: 'grab' }}
          onPointerDown={(e) => {
            e.preventDefault()
            dragIdx.current = i
            svgRef.current.setPointerCapture?.(e.pointerId)
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (points.length > 3) onChange(points.filter((_, j) => j !== i))
          }}
        >
          <title>Точка {i + 1}: ({pt.x}; {pt.y}) — подвійний клік видаляє</title>
        </circle>
      ))}
    </svg>
  )
}

// Рамер–Дуглас–Пекер: прибирає зайві точки з мальованої від руки лінії,
// лишаючи форму — щоб контур мав десятки точок, а не сотні.
function simplifyPath(pts, eps) {
  if (pts.length < 3) return pts
  let maxD = 0
  let idx = 0
  const a = pts[0]
  const b = pts[pts.length - 1]
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distToSegment(pts[i], a, b)
    if (d > maxD) { maxD = d; idx = i }
  }
  if (maxD <= eps) return [a, b]
  const left = simplifyPath(pts.slice(0, idx + 1), eps)
  const right = simplifyPath(pts.slice(idx), eps)
  return [...left.slice(0, -1), ...right]
}

// Перетворює намальований штрих (координати -1..1) на контур профілю.
// Видавлювання: замкнена форма, вписана в ~1.4 одиниці. Обертання: штрих
// — половина силуету (ліва частина дзеркалиться), краї доводяться до осі,
// щоб тіло вийшло суцільним.
function strokeToProfilePoints(stroke, mode, startEps = 0.015, maxPoints = 48) {
  if (stroke.length < (mode === 'lathe' ? 2 : 3)) return null
  let eps = startEps
  let pts = simplifyPath(stroke, eps)
  while (pts.length > maxPoints) { eps *= 1.5; pts = simplifyPath(stroke, eps) }
  const r = (v) => Math.round(v * 100) / 100
  if (mode === 'lathe') {
    let out = pts.map((p) => ({ x: r(Math.abs(p.x) * 0.9), y: r(p.y * 0.9) }))
    if (out[0].y > out[out.length - 1].y) out = out.reverse() // знизу вгору, як у LatheGeometry
    out = out.filter((p, i) => i === 0 || p.x !== out[i - 1].x || p.y !== out[i - 1].y)
    if (out[0].x > 0) out.unshift({ x: 0, y: out[0].y })
    if (out[out.length - 1].x > 0) out.push({ x: 0, y: out[out.length - 1].y })
    return out.length >= 3 ? out : null
  }
  // Замкнена форма: кінець зʼєднується з початком; центруємо й масштабуємо.
  if (pts.length > 3 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 0.05) pts = pts.slice(0, -1)
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1
  const k = 1.4 / size
  const out = pts.map((p) => ({ x: r((p.x - cx) * k), y: r((p.y - cy) * k) }))
  return out.length >= 3 ? out : null
}

// Вікно «Намалюй форму»: три інструменти — ✏️ від руки, 📏 лінійка (рівні
// відрізки з довжиною/кутом, прив'язка до сітки, Shift — кут кратний 15°)
// і 〰 вигин (тягни середню ручку відрізка — він вигинається кривою).
// Шлях = вузли + для кожного відрізка необовʼязкова контрольна точка
// квадратичної кривої Безьє (null — пряма). Будь-який інструмент редагує
// той самий шлях, тож від руки намальоване можна потім вирівняти/вигнути.
// ── Малюнок → контур ─────────────────────────────────────────────────
// Малюнок від руки обробляється як картинка, а не як одна лінія: усі
// штрихи растеризуються товстим пензлем (це ж закриває невеликі щілини
// між кінцями ліній), усе, що обведене, зафарбовується, а потім обводиться
// зовнішній контур найбільшої намальованої плями. Тому порядок штрихів,
// перетини, кілька окремих ліній чи незамкнений на кілька пікселів
// контур не мають значення: що намальовано — те й стане 3D.
const TRACE_N = 240

function rasterizeDrawing(strokes, path, closedPath) {
  const N = TRACE_N
  const cv = document.createElement('canvas')
  cv.width = N
  cv.height = N
  const ctx = cv.getContext('2d')
  const px = (p) => [((p.x + 1) / 2) * N, ((1 - p.y) / 2) * N]
  const CLOSE = 7 // px: товщина пензля для закриття щілин
  ctx.strokeStyle = '#000'
  ctx.fillStyle = '#000'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = CLOSE * 2
  const draw = (pts, close) => {
    if (pts.length === 1) { const [x, y] = px(pts[0]); ctx.beginPath(); ctx.arc(x, y, CLOSE, 0, Math.PI * 2); ctx.fill(); return }
    ctx.beginPath()
    pts.forEach((p, i) => { const [x, y] = px(p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
    if (close) ctx.closePath()
    ctx.stroke()
  }
  strokes.forEach((st) => draw(st, false))
  if (path.length >= 2) draw(path, closedPath)
  const data = ctx.getImageData(0, 0, N, N).data
  const ink = new Uint8Array(N * N)
  for (let i = 0; i < N * N; i++) ink[i] = data[i * 4 + 3] > 40 ? 1 : 0
  // Зовнішній фон = заливка від країв по незафарбованих пікселях.
  const outside = new Uint8Array(N * N)
  const stack = []
  for (let i = 0; i < N; i++) stack.push(i, (N - 1) * N + i, i * N, i * N + N - 1)
  while (stack.length) {
    const k = stack.pop()
    if (outside[k] || ink[k]) continue
    outside[k] = 1
    const x = k % N
    const y = (k / N) | 0
    if (x > 0) stack.push(k - 1)
    if (x < N - 1) stack.push(k + 1)
    if (y > 0) stack.push(k - N)
    if (y < N - 1) stack.push(k + N)
  }
  // Заповнена фігура, «стоншена» назад на півпензля мінус тонку лінію,
  // щоб контур ліг посередині намальованої лінії, а не по її зовнішньому краю.
  const filled = new Uint8Array(N * N)
  for (let i = 0; i < N * N; i++) filled[i] = outside[i] ? 0 : 1
  const R = CLOSE - 2
  const eroded = new Uint8Array(N * N)
  const offs = []
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= R * R) offs.push([dx, dy])
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!filled[y * N + x]) continue
      let ok = 1
      for (const [dx, dy] of offs) {
        const xx = x + dx
        const yy = y + dy
        if (xx < 0 || yy < 0 || xx >= N || yy >= N || !filled[yy * N + xx]) { ok = 0; break }
      }
      eroded[y * N + x] = ok
    }
  }
  // Лишаємо тільки найбільшу пляму (випадкові крапки ігноруються).
  const label = new Int32Array(N * N)
  let best = 0
  let bestSize = 0
  let cur = 0
  for (let i = 0; i < N * N; i++) {
    if (!eroded[i] || label[i]) continue
    cur += 1
    let size = 0
    const st = [i]
    label[i] = cur
    while (st.length) {
      const k = st.pop()
      size += 1
      const x = k % N
      const nb = [x > 0 ? k - 1 : -1, x < N - 1 ? k + 1 : -1, k - N, k + N]
      for (const j of nb) if (j >= 0 && j < N * N && eroded[j] && !label[j]) { label[j] = cur; st.push(j) }
    }
    if (size > bestSize) { bestSize = size; best = cur }
  }
  if (!best || bestSize < 30) return null
  const mask = new Uint8Array(N * N)
  for (let i = 0; i < N * N; i++) mask[i] = label[i] === best ? 1 : 0
  return mask
}

// Обхід зовнішнього контуру маски (Moore neighbor tracing) → точки -1..1.
function traceMaskOutline(mask) {
  const N = TRACE_N
  const at = (x, y) => (x >= 0 && y >= 0 && x < N && y < N ? mask[y * N + x] : 0)
  let start = -1
  for (let i = 0; i < N * N; i++) if (mask[i]) { start = i; break }
  if (start < 0) return []
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
  const sx = start % N
  const sy = (start / N) | 0
  let x = sx
  let y = sy
  let dir = 7
  const out = []
  for (let guard = 0; guard < N * N * 2; guard++) {
    out.push({ x: ((x + 0.5) / N) * 2 - 1, y: 1 - ((y + 0.5) / N) * 2 })
    let found = false
    for (let k = 0; k < 8; k++) {
      const d = (dir + 6 + k) % 8 // починаємо огляд ліворуч від попереднього напрямку
      const nx = x + dirs[d][0]
      const ny = y + dirs[d][1]
      if (at(nx, ny)) { x = nx; y = ny; dir = d; found = true; break }
    }
    if (!found || (x === sx && y === sy)) break
  }
  return out
}

// Превʼю/результат малюнка: для обʼємної фігури — замкнений контур, для
// тіла обертання — силует (найбільший радіус у кожному ряду).
function traceDrawing(strokes, path, closedPath, mode) {
  const mask = rasterizeDrawing(strokes, path, closedPath)
  if (!mask) return null
  const N = TRACE_N
  if (mode === 'lathe') {
    const rows = []
    for (let y = N - 1; y >= 0; y -= 2) {
      let r = -1
      for (let x = 0; x < N; x++) if (mask[y * N + x]) r = Math.max(r, Math.abs(((x + 0.5) / N) * 2 - 1))
      if (r >= 0) rows.push({ x: r, y: 1 - ((y + 0.5) / N) * 2 })
    }
    if (rows.length < 2) return null
    return simplifyPath(rows, 0.006)
  }
  const outline = traceMaskOutline(mask)
  if (outline.length < 8) return null
  // Допуск ~1.5 px сітки: прибирає тремтіння руки, але лишає кути.
  let pts = simplifyPath([...outline, outline[0]], 0.013).slice(0, -1)
  let eps = 0.013
  while (pts.length > 80) { eps *= 1.4; pts = simplifyPath([...outline, outline[0]], eps).slice(0, -1) }
  return pts.length >= 3 ? pts : null
}

const DRAW_GRID = 0.125
const HIT_R = 0.06

function quadPoint(a, c, b, t) {
  const u = 1 - t
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
}

function DrawShapeModal({ initialMode = 'extrude', onCancel, onDone }) {
  const canvasRef = useRef(null)
  const strokeRef = useRef([]) // сирий штрих під час малювання від руки
  const dragRef = useRef(null) // { kind: 'free' | 'node' | 'ctrl', index }
  const hoverRef = useRef(null)
  const [mode, setMode] = useState(initialMode)
  const [tool, setTool] = useState('free')
  const [snap, setSnap] = useState(true)
  const [nodes, setNodes] = useState([])
  const [inks, setInks] = useState([]) // штрихи від руки (кожен — масив точок)
  const [order, setOrder] = useState([]) // 'ink' | 'node' — для «↶ Крок назад»
  const [ctrls, setCtrls] = useState([])
  const [depth, setDepth] = useState(0.5)
  const [bevel, setBevel] = useState(true)
  const [, force] = useState(0)
  const nodesRef = useRef(nodes)
  const ctrlsRef = useRef(ctrls)
  nodesRef.current = nodes
  ctrlsRef.current = ctrls

  const closed = mode === 'extrude'
  const segCount = (n) => (closed ? (n >= 3 ? n : Math.max(0, n - 1)) : Math.max(0, n - 1))
  const segEnds = (i, ns) => [ns[i], ns[(i + 1) % ns.length]]
  function handlePos(i, ns = nodesRef.current, cs = ctrlsRef.current) {
    const [a, b] = segEnds(i, ns)
    const c = cs[i]
    return c ? quadPoint(a, c, b, 0.5) : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
  function samplePath(ns = nodes, cs = ctrls) {
    if (ns.length === 0) return []
    const out = [ns[0]]
    for (let i = 0; i < segCount(ns.length); i++) {
      const [a, b] = segEnds(i, ns)
      const c = cs[i]
      if (c) for (let k = 1; k <= 12; k++) out.push(quadPoint(a, c, b, k / 12))
      else out.push(b)
    }
    if (closed && ns.length >= 3) out.pop() // останній збігається з першим
    return out
  }

  const traced = useMemo(
    () => (inks.length > 0 ? traceDrawing(inks, samplePath(), closed && nodes.length >= 3, mode) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inks, nodes, ctrls, mode]
  )

  function redraw() {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const W = cv.width
    const px = (p) => [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * W]
    const s = W / 400
    ctx.fillStyle = '#14141b'
    ctx.fillRect(0, 0, W, W)
    // Сітка (дрібна + основна) і лінійки по краях
    for (let i = 1; i < 16; i++) {
      ctx.strokeStyle = i % 2 ? '#1d1d27' : '#2a2a37'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo((i * W) / 16, 0); ctx.lineTo((i * W) / 16, W); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, (i * W) / 16); ctx.lineTo(W, (i * W) / 16); ctx.stroke()
    }
    ctx.fillStyle = '#8a8aa0'
    ctx.font = `${10 * s}px sans-serif`
    for (let i = 0; i <= 16; i++) {
      const len = (i % 4 === 0 ? 10 : i % 2 === 0 ? 6 : 3) * s
      ctx.fillRect((i * W) / 16, 0, 1, len)
      ctx.fillRect(0, (i * W) / 16, len, 1)
      if (i % 4 === 0 && i > 0 && i < 16) {
        ctx.fillText(String((i / 16) * 2 - 1), (i * W) / 16 + 2 * s, 20 * s)
        ctx.fillText(String(1 - (i / 16) * 2), 12 * s, (i * W) / 16 - 2 * s)
      }
    }
    if (mode === 'lathe') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, 0, W / 2, W)
      ctx.strokeStyle = '#8a86ff'
      ctx.setLineDash([8 * s, 6 * s])
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, W); ctx.stroke()
      ctx.setLineDash([])
    }
    const drawLine = (pts, style, width, fill) => {
      if (pts.length < 2) return
      ctx.beginPath()
      pts.forEach((p, i) => { const [x, y] = px(p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
      if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill() }
      ctx.strokeStyle = style
      ctx.lineWidth = width * s
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    // Штрих від руки (поки малюється)
    if (dragRef.current?.kind === 'free') {
      inks.forEach((st) => drawLine(st, '#bebbff', 4))
      drawLine(samplePath(), '#bebbff', 4)
      drawLine(strokeRef.current, '#bebbff', 4)
      return
    }
    // Превʼю того, що стане 3D (контур малюнка від руки).
    if (traced) {
      if (closed) drawLine(traced, 'rgba(255,210,63,0.9)', 2, 'rgba(125,120,255,0.28)')
      else {
        const prof = [{ x: 0, y: traced[0].y }, ...traced, { x: 0, y: traced[traced.length - 1].y }]
        drawLine([...prof, ...[...prof].reverse().map((p) => ({ x: -p.x, y: p.y }))], 'rgba(255,210,63,0.9)', 2, 'rgba(125,120,255,0.28)')
      }
    }
    inks.forEach((st) => drawLine(st.length === 1 ? [st[0], st[0]] : st, '#bebbff', 4))
    const path = samplePath()
    if (path.length >= 2) {
      drawLine(path, '#bebbff', 4, !traced && closed && nodes.length >= 3 ? 'rgba(125,120,255,0.22)' : null)
      if (mode === 'lathe' && !traced) drawLine(path.map((p) => ({ x: -p.x, y: p.y })), 'rgba(190,187,255,0.3)', 3)
    }
    // Превʼю наступного відрізка лінійкою + довжина й кут
    const hv = hoverRef.current
    if (tool === 'line' && hv && nodes.length > 0 && !dragRef.current) {
      const last = nodes[nodes.length - 1]
      ctx.setLineDash([6 * s, 5 * s])
      drawLine([last, hv], '#ffd23f', 2)
      ctx.setLineDash([])
      const len = Math.hypot(hv.x - last.x, hv.y - last.y)
      const ang = Math.round((Math.atan2(hv.y - last.y, hv.x - last.x) * 180) / Math.PI)
      const [hx, hy] = px(hv)
      ctx.fillStyle = '#ffd23f'
      ctx.font = `bold ${11 * s}px sans-serif`
      ctx.fillText(`${len.toFixed(2)} · ${ang}°`, hx + 10 * s, hy - 10 * s)
    }
    // Ручки вигину (середини відрізків) — ромбики
    if (tool !== 'free') {
      for (let i = 0; i < segCount(nodes.length); i++) {
        const h = handlePos(i, nodes, ctrls)
        const [x, y] = px(h)
        if (ctrls[i]) {
          const [a, b] = segEnds(i, nodes)
          ctx.strokeStyle = 'rgba(255,210,63,0.35)'
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(...px(a)); ctx.lineTo(...px(ctrls[i])); ctx.lineTo(...px(b)); ctx.stroke()
        }
        const r = 6 * s
        ctx.fillStyle = ctrls[i] ? '#ffd23f' : '#3E37E0'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5 * s
        ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); ctx.stroke()
      }
    }
    // Вузли
    nodes.forEach((n, i) => {
      const [x, y] = px(n)
      ctx.beginPath()
      ctx.arc(x, y, 6.5 * s, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? '#ffd23f' : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#3E37E0'
      ctx.lineWidth = 2 * s
      ctx.stroke()
    })
  }
  useEffect(() => {
    const cv = canvasRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = Math.round(cv.clientWidth * dpr)
    cv.height = cv.width
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(redraw)

  function toLocal(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * 2 - 1, y: 1 - ((e.clientY - rect.top) / rect.height) * 2 }
  }
  // Лінійка: прив'язка до сітки та (Shift) кут, кратний 15° від попереднього вузла.
  function constrain(p, e, from) {
    let q = { ...p }
    if (e.shiftKey && from) {
      const len = Math.hypot(q.x - from.x, q.y - from.y)
      const a = Math.round(Math.atan2(q.y - from.y, q.x - from.x) / (Math.PI / 12)) * (Math.PI / 12)
      q = { x: from.x + Math.cos(a) * len, y: from.y + Math.sin(a) * len }
    }
    if (snap) q = { x: Math.round(q.x / DRAW_GRID) * DRAW_GRID, y: Math.round(q.y / DRAW_GRID) * DRAW_GRID }
    const r = (v) => Math.round(Math.max(-1, Math.min(1, v)) * 1000) / 1000
    return { x: r(q.x), y: r(q.y) }
  }
  function hitTest(p) {
    const ns = nodesRef.current
    for (let i = ns.length - 1; i >= 0; i--) if (Math.hypot(ns[i].x - p.x, ns[i].y - p.y) < HIT_R) return { kind: 'node', index: i }
    if (tool !== 'free') {
      for (let i = 0; i < segCount(ns.length); i++) {
        const h = handlePos(i)
        if (Math.hypot(h.x - p.x, h.y - p.y) < HIT_R) return { kind: 'ctrl', index: i }
      }
    }
    return null
  }

  function down(e) {
    e.preventDefault()
    canvasRef.current.setPointerCapture?.(e.pointerId)
    const p = toLocal(e)
    const hit = tool === 'free' ? null : hitTest(p) // від руки завжди малює, не чіпляє точки
    if (hit) { dragRef.current = hit; return }
    if (tool === 'free') {
      dragRef.current = { kind: 'free' }
      strokeRef.current = [p]
      redraw()
      return
    }
    // Лінійка/вигин: клік по порожньому — новий вузол у кінці шляху.
    const ns = nodesRef.current
    const q = constrain(p, e, ns[ns.length - 1])
    setNodes([...ns, q])
    setOrder((o) => [...o, 'node'])
    setCtrls([...ctrlsRef.current.slice(0, Math.max(0, ns.length - 1)), null, null].slice(0, ns.length + 1))
  }
  function move(e) {
    const p = toLocal(e)
    const d = dragRef.current
    if (!d) {
      if (tool === 'line') {
        const ns = nodesRef.current
        hoverRef.current = constrain(p, e, ns[ns.length - 1])
        redraw()
      }
      return
    }
    if (d.kind === 'free') {
      const last = strokeRef.current[strokeRef.current.length - 1]
      if (Math.hypot(p.x - last.x, p.y - last.y) < 0.008) return
      strokeRef.current.push(p)
      redraw()
      return
    }
    if (d.kind === 'node') {
      const ns = nodesRef.current
      const prev = d.index > 0 ? ns[d.index - 1] : null
      const q = constrain(p, e, prev)
      setNodes(ns.map((n, i) => (i === d.index ? q : n)))
      return
    }
    // Вигин: крива проходить через курсор посередині відрізка.
    const [a, b] = segEnds(d.index, nodesRef.current)
    const c = { x: 2 * p.x - (a.x + b.x) / 2, y: 2 * p.y - (a.y + b.y) / 2 }
    const cs = [...ctrlsRef.current]
    cs[d.index] = c
    setCtrls(cs)
  }
  function up() {
    const d = dragRef.current
    dragRef.current = null
    if (d?.kind === 'free') {
      const st = strokeRef.current
      strokeRef.current = []
      if (st.length >= 1) {
        setInks((arr) => [...arr, st])
        setOrder((o) => [...o, 'ink'])
      }
    }
    force((v) => v + 1)
  }
  function leave() {
    hoverRef.current = null
    redraw()
  }
  function dbl(e) {
    const hit = hitTest(toLocal(e))
    if (!hit) return
    if (hit.kind === 'node') {
      setNodes(nodesRef.current.filter((_, i) => i !== hit.index))
      setCtrls(ctrlsRef.current.filter((_, i) => i !== hit.index).map((c, i) => (i === hit.index - 1 ? null : c)))
    } else {
      const cs = [...ctrlsRef.current]
      cs[hit.index] = null
      setCtrls(cs)
    }
  }
  function undoLast() {
    const last = order[order.length - 1] || (inks.length ? 'ink' : 'node')
    setOrder(order.slice(0, -1))
    if (last === 'ink') { setInks(inks.slice(0, -1)); return }
    setNodes(nodesRef.current.slice(0, -1))
    setCtrls(ctrlsRef.current.slice(0, Math.max(0, nodesRef.current.length - 1)))
  }
  function clear() {
    setNodes([])
    setCtrls([])
    setInks([])
    setOrder([])
  }
  const canFinish = inks.length > 0 ? !!traced : nodes.length >= (closed ? 3 : 2)
  function finish() {
    // Шлях уже чистий (вузли + криві) — спрощуємо мінімально, щоб вигини
    // лишились плавними в 3D.
    const pts = inks.length > 0
      ? (traced ? strokeToProfilePoints(traced, mode, 0.002, 90) : null)
      : strokeToProfilePoints(samplePath(), mode, 0.002, 90)
    if (!pts) return
    onDone({ mode, points: pts, depth, bevel })
  }

  const hint = tool === 'free'
    ? 'Малюй мишкою скільки завгодно ліній — жовтий контур показує, що саме стане 3D (усе обведене зафарбовується).'
    : tool === 'line'
      ? 'Клікай — кожен клік ставить точку, між ними рівна лінія. Показано довжину й кут. Shift — кут кратний 15°.'
      : 'Тягни ромбик посередині відрізка — лінія вигнеться в той бік. Подвійний клік по ромбику — знову пряма.'

  return (
    <div className="draw-modal-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="draw-modal" role="dialog" aria-label="Намалюй форму">
        <div className="cl-section-title" style={{ marginTop: 0 }}>🖌 Намалюй форму — вона стане 3D</div>
        <div className="cl-btn-row" style={{ marginBottom: 8 }}>
          <button className={'cl-mini-btn' + (mode === 'extrude' ? ' active' : '')} onClick={() => setMode('extrude')}>⭐ Обʼємна фігура</button>
          <button className={'cl-mini-btn' + (mode === 'lathe' ? ' active' : '')} onClick={() => setMode('lathe')}>🏺 Тіло обертання</button>
        </div>
        <div className="cl-btn-row draw-tools" style={{ marginBottom: 8 }}>
          <button className={'cl-mini-btn' + (tool === 'line' ? ' active' : '')} onClick={() => setTool('line')}>📏 Лінійка</button>
          <button className={'cl-mini-btn' + (tool === 'bend' ? ' active' : '')} onClick={() => setTool('bend')}>〰 Вигнути</button>
          <button className={'cl-mini-btn' + (tool === 'free' ? ' active' : '')} onClick={() => setTool('free')}>✏️ Від руки</button>
          <label className="cl-editrow draw-snap"><input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} /> 🧲 Сітка</label>
        </div>
        <p className="cl-tab-desc" style={{ marginBottom: 8 }}>
          {hint} {mode === 'lathe' ? 'Малюй праворуч від пунктирної осі — половина силуету обернеться по колу.' : 'Контур замкнеться сам.'}
        </p>
        <canvas
          ref={canvasRef}
          className="draw-modal-canvas"
          style={{ cursor: tool === 'bend' ? 'grab' : 'crosshair' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={leave}
          onDoubleClick={dbl}
        />
        <p className="cl-tab-desc" style={{ margin: '6px 0' }}>Точки можна тягнути будь-яким інструментом · подвійний клік по точці — видалити.</p>
        {mode === 'extrude' && (
          <>
            <div className="cl-editrow"><label>Товщина
              <input type="range" min={0.1} max={1.5} step={0.05} value={depth} onChange={(e) => setDepth(parseFloat(e.target.value))} />
              <span>{depth.toFixed(2)}</span>
            </label></div>
            <label className="cl-editrow"><input type="checkbox" checked={bevel} onChange={(e) => setBevel(e.target.checked)} /> Округлені краї</label>
          </>
        )}
        <div className="cl-picker-top draw-modal-footer" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="cl-mini-btn" onClick={undoLast} disabled={nodes.length === 0 && inks.length === 0}>↶ Крок назад</button>
          <button className="cl-mini-btn" onClick={clear} disabled={nodes.length === 0 && inks.length === 0}>🧽 Стерти</button>
          <button className="cl-mini-btn" onClick={onCancel}>Скасувати</button>
          <button className="harmony-btn" onClick={finish} disabled={!canFinish}>✨ Перетворити на 3D</button>
        </div>
      </div>
    </div>
  )
}


function ShapeTab({
  selected, pointsVisible, onTogglePoints, selectedPointKey, pointBase, softRadius, onSoftRadius,
  symmetry, onToggleSymmetry, onSetPointCoord, onResetShape, onSetProfile, onRedraw,
}) {
  if (!selected) return <p className="cl-tab-desc">Вибери фігуру зліва, щоб змінювати її форму.</p>
  if (LIGHT_TYPES.includes(selected.type)) return <p className="cl-tab-desc">У світла немає форми — вибери фігуру.</p>
  const edits = selected.vertexEdits || {}
  const editedCount = Object.keys(edits).length
  const isCustom = selected.type === 'custom'
  const primitiveProfile = !isCustom && PRIMITIVE_PROFILES[selected.type] ? PRIMITIVE_PROFILES[selected.type]() : null
  const profile = isCustom ? (selected.profile || DEFAULT_PROFILE) : primitiveProfile
  const typeLabel = SHAPES.find((p) => p.type === selected.type)?.label
  const profilePoints = profile ? (profile.points?.[profile.mode] || DEFAULT_PROFILE.points[profile.mode]) : null
  const d = selectedPointKey ? edits[selectedPointKey] : null
  const cur = pointBase ? { x: pointBase.x + (d?.x || 0), y: pointBase.y + (d?.y || 0), z: pointBase.z + (d?.z || 0) } : null

  function updateProfile(patch) {
    const base = profile || DEFAULT_PROFILE
    onSetProfile({ ...base, ...patch, points: { ...DEFAULT_PROFILE.points, ...base.points, ...(patch.points || {}) } })
  }

  return (
    <div>
      <p className="cl-tab-desc">Змінюй форму будь-якої фігури, перетягуючи її точки (вершини) прямо у вʼюпорті{profile ? ', або намалюй власний контур нижче' : ''}.</p>
      <HelpBox>
        <p><b>Точки у вʼюпорті:</b> кожна біла точка — вершина сітки. Затисни точку й тягни — вона рухається паралельно екрану, тож поверни камеру, щоб тягнути в потрібному напрямку (напр. ракурс «Спереду» — рух по X/Y, «Зверху» — по X/Z). Блакитні — вже зсунуті, жовта — обрана.</p>
        <p><b>М'яке виділення</b> тягне разом із точкою сусідні в заданому радіусі з плавним затуханням — так ліпиться органічна форма замість гострого «шипа».</p>
        <p><b>Симетрія X</b> дзеркально повторює зсув на протилежному боці фігури.</p>
        {profile && <p><b>Своя форма:</b> у режимі «Обертання» контур обертається навколо вертикальної осі (ваза, келих, пішак), у режимі «Видавлювання» замкнений контур отримує товщину (зірка, буква, логотип).</p>}
        <p>Форма не анімується ключовими кадрами — вона однакова на всьому таймлайні.</p>
      </HelpBox>

      {profile && (
        <>
          <div className="cl-section-title">{isCustom ? 'Контур своєї форми' : `Контур фігури «${typeLabel}»`}</div>
          {!isCustom && <p className="cl-tab-desc">Тягни точки контуру — фігура зміниться. Після першої зміни вона стане «Своєю формою» з таким самим виглядом.</p>}
          <div className="cl-btn-row" style={{ marginBottom: 10 }}>
            <button className={'cl-mini-btn' + (profile.mode === 'lathe' ? ' active' : '')} onClick={() => updateProfile({ mode: 'lathe' })}>🏺 Обертання</button>
            <button className={'cl-mini-btn' + (profile.mode === 'extrude' ? ' active' : '')} onClick={() => updateProfile({ mode: 'extrude' })}>⭐ Видавлювання</button>
          </div>
          <ProfileEditor
            mode={profile.mode}
            points={profilePoints}
            onChange={(pts) => updateProfile({ points: { [profile.mode]: pts } })}
          />
          <p className="cl-tab-desc" style={{ marginTop: 6 }}>Тягни точки · клік по порожньому місцю — додати точку · подвійний клік по точці — видалити ({profilePoints.length} точок).</p>
          {profile.mode === 'lathe' && (
            <div className="cl-editrow"><label>Кількість граней (полі)
              <input type="range" min={3} max={64} step={1} value={profile.segments || 48} onChange={(e) => updateProfile({ segments: parseInt(e.target.value, 10) })} />
              <span>{profile.segments || 48}</span>
            </label></div>
          )}
          {profile.mode === 'extrude' && (
            <label className="cl-editrow"><input type="checkbox" checked={!!profile.bevel} onChange={(e) => updateProfile({ bevel: e.target.checked })} /> Округлені краї</label>
          )}
          {profile.mode === 'extrude' && (
            <div className="cl-editrow"><label>Товщина
              <input type="range" min={0.05} max={2} step={0.05} value={profile.depth || 0.6} onChange={(e) => updateProfile({ depth: parseFloat(e.target.value) })} />
              <span>{(profile.depth || 0.6).toFixed(2)}</span>
            </label></div>
          )}
          <div className="cl-btn-row" style={{ marginBottom: 6 }}>
            <button className="cl-mini-btn" onClick={onRedraw}>🖌 Намалювати від руки</button>
            <button className="cl-mini-btn" onClick={() => updateProfile({ points: { [profile.mode]: DEFAULT_PROFILE.points[profile.mode] } })}>↺ Стандартний контур</button>
          </div>
          {editedCount > 0 && <p className="cl-tab-desc">⚠ Зміна контуру скидає ручні зсуви 3D-точок нижче.</p>}
        </>
      )}

      {!profile && <p className="cl-tab-desc">«{typeLabel}» не описується 2D-контуром — змінюй його форму точками у вʼюпорті нижче.</p>}
      <div className="cl-section-title">Точки у вʼюпорті</div>
      <label className="cl-editrow" style={{ marginBottom: 8 }}>
        <input type="checkbox" checked={pointsVisible} onChange={onTogglePoints} /> ✏️ Показати й редагувати точки
      </label>
      <label className="cl-editrow" style={{ marginBottom: 8 }}>
        <input type="checkbox" checked={symmetry} onChange={onToggleSymmetry} /> 🪞 Симетрія по X
      </label>
      <div className="cl-editrow"><label>М'яке виділення (радіус)
        <input type="range" min={0} max={1.5} step={0.05} value={softRadius} onChange={(e) => onSoftRadius(parseFloat(e.target.value))} />
        <span>{softRadius === 0 ? 'вимк.' : softRadius.toFixed(2)}</span>
      </label></div>

      {cur ? (
        <>
          <div className="cl-section-title">Обрана точка</div>
          <AxisRow label="Точка" values={cur} onChange={onSetPointCoord} min={-2} max={2} step={0.01} />
        </>
      ) : (
        <p className="cl-tab-desc">Клікни точку у вʼюпорті, щоб обрати її та вводити координати точно.</p>
      )}

      <div className="cl-picker-top" style={{ marginTop: 12 }}>
        <span className="gfx-status-pill">Змінено точок: {editedCount}</span>
        <button className="cl-mini-btn" onClick={onResetShape} disabled={editedCount === 0}>↺ Скинути форму</button>
      </div>
    </div>
  )
}

const PAINT_SWATCHES = ['#1a1a1a', '#ffffff', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#6d4c41', '#f48fb1']

// Вкладка «Малювати»: розфарбування моделі прямо у вʼюпорті (360° —
// крутиш камеру й малюєш з будь-якого боку) + наклеювання готових
// малюнків (з Game Art Studio чи файлу) на потрібний бік моделі.
function PaintTab({ selected, brush, setBrush, onFill, onStamp, onClearPaint, artImages }) {
  const [side, setSide] = useState('front')
  if (!selected) return <p className="cl-tab-desc">Вибери фігуру зліва, щоб малювати на ній.</p>
  if (LIGHT_TYPES.includes(selected.type)) return <p className="cl-tab-desc">На світлі малювати не можна — вибери фігуру.</p>
  function stampFromUrl(url) {
    const img = new Image()
    img.onload = () => onStamp(img, side)
    img.src = url
  }
  return (
    <div>
      <p className="cl-tab-desc">Тягни мишкою <b>по моделі</b> — малюєш прямо на ній. Тягни <b>поза моделлю</b> — крутиш камеру, щоб домалювати з іншого боку (усі 360°).</p>
      <HelpBox>
        <p>Малюнок зберігається разом із моделлю, потрапляє в glTF-експорт і в «🧊 З 3D» у Game Art Studio. Undo (Ctrl+Z) скасовує мазки.</p>
        <p><b>Гумка</b> повертає колір основи фігури. <b>Наклеїти малюнок</b> — кладе картинку на обраний бік моделі (як наліпку): так переносиш на 3D те, що намалювала в 2D.</p>
        <p>Якщо потім змінити форму фігури (точки/контур), малюнок може трохи зсунутися.</p>
      </HelpBox>

      <div className="cl-btn-row" style={{ marginBottom: 10 }}>
        <button className={'cl-mini-btn' + (brush.mode === 'brush' ? ' active' : '')} onClick={() => setBrush({ ...brush, mode: 'brush' })}>🖌 Пензель</button>
        <button className={'cl-mini-btn' + (brush.mode === 'eraser' ? ' active' : '')} onClick={() => setBrush({ ...brush, mode: 'eraser' })}>🧽 Гумка</button>
      </div>
      <div className="cl-picker-top">
        <input type="color" className="cl-swatch-input" value={brush.color} onChange={(e) => setBrush({ ...brush, color: e.target.value, mode: 'brush' })} />
        <div className="paint-swatches">
          {PAINT_SWATCHES.map((c) => (
            <button key={c} type="button" className={'paint-swatch' + (brush.color === c ? ' active' : '')} style={{ background: c }} title={c} onClick={() => setBrush({ ...brush, color: c, mode: 'brush' })} />
          ))}
        </div>
      </div>
      <div className="cl-editrow"><label>Розмір пензля
        <input type="range" min={2} max={60} step={1} value={brush.size} onChange={(e) => setBrush({ ...brush, size: parseInt(e.target.value, 10) })} />
        <span>{brush.size}</span>
      </label></div>
      <div className="cl-editrow"><label>Непрозорість
        <input type="range" min={0.1} max={1} step={0.05} value={brush.opacity} onChange={(e) => setBrush({ ...brush, opacity: parseFloat(e.target.value) })} />
        <span>{Math.round(brush.opacity * 100)}%</span>
      </label></div>
      <div className="cl-btn-row" style={{ margin: '6px 0 4px' }}>
        <button className="cl-mini-btn" onClick={() => onFill(brush.color)}>🪣 Залити все цим кольором</button>
        <button className="cl-mini-btn" onClick={onClearPaint} disabled={!selected.paint}>🗑 Прибрати малюнок</button>
      </div>

      <div className="cl-section-title">Наклеїти малюнок на модель</div>
      <div className="cl-btn-row" style={{ marginBottom: 8 }}>
        {PAINT_SIDES.map((sd) => (
          <button key={sd.key} className={'cl-mini-btn' + (side === sd.key ? ' active' : '')} onClick={() => setSide(sd.key)}>{sd.label}</button>
        ))}
      </div>
      <label className="harmony-btn" style={{ cursor: 'pointer', display: 'inline-block', marginBottom: 8 }}>
        🖼 З файлу (PNG/JPG)
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
          const f = e.target.files[0]
          e.target.value = ''
          if (!f) return
          const r = new FileReader()
          r.onload = () => stampFromUrl(r.result)
          r.readAsDataURL(f)
        }} />
      </label>
      {artImages.length > 0 ? (
        <>
          <p className="cl-tab-desc" style={{ margin: '4px 0' }}>Твої малюнки з Game Art Studio — клікни, щоб наклеїти:</p>
          <div className="paint-art-grid">
            {artImages.map((a) => (
              <button key={a.id} type="button" className="paint-art-item" onClick={() => stampFromUrl(a.url)} title={`${a.project} — ${a.title}`}>
                <img src={a.url} alt={a.title} />
                <span>{a.title}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="cl-tab-desc">Малюнки, збережені в Game Art Studio, теж зʼявляться тут.</p>
      )}
    </div>
  )
}

function MaterialTab({ selected, setMaterial, setLightProp }) {
  if (!selected) return <p className="cl-tab-desc">Вибери обʼєкт зліва, щоб редагувати матеріал чи світло.</p>
  if (LIGHT_TYPES.includes(selected.type)) {
    const l = selected.light
    const isSpot = selected.type === 'spotLight'
    return (
      <div>
        <p className="cl-tab-desc">{isSpot ? 'Прожектор світить у напрямку, заданому обертанням на вкладці «Трансформація».' : 'Точкове світло випромінює рівномірно в усіх напрямках з однієї точки.'}</p>
        <div className="cl-picker-top">
          <input type="color" className="cl-swatch-input" value={l.color} onChange={(e) => setLightProp('color', e.target.value)} />
          <input className="cl-hex-input" value={l.color} onChange={(e) => setLightProp('color', e.target.value)} />
        </div>
        <div className="cl-editrow"><label>Intensity
          <input type="range" min={0} max={5} step={0.1} value={l.intensity} onChange={(e) => setLightProp('intensity', parseFloat(e.target.value))} />
          <span>{l.intensity.toFixed(1)}</span>
        </label></div>
        <div className="cl-editrow"><label>Distance (0 = без обмеження)
          <input type="range" min={0} max={20} step={0.5} value={l.distance} onChange={(e) => setLightProp('distance', parseFloat(e.target.value))} />
          <span>{l.distance}</span>
        </label></div>
        <div className="cl-editrow"><label>Decay
          <input type="range" min={0} max={4} step={0.1} value={l.decay} onChange={(e) => setLightProp('decay', parseFloat(e.target.value))} />
          <span>{l.decay.toFixed(1)}</span>
        </label></div>
        {isSpot && (
          <>
            <div className="cl-editrow"><label>Angle (°)
              <input type="range" min={5} max={80} step={1} value={l.angle} onChange={(e) => setLightProp('angle', parseFloat(e.target.value))} />
              <span>{l.angle}°</span>
            </label></div>
            <div className="cl-editrow"><label>Penumbra
              <input type="range" min={0} max={1} step={0.05} value={l.penumbra} onChange={(e) => setLightProp('penumbra', parseFloat(e.target.value))} />
              <span>{l.penumbra.toFixed(2)}</span>
            </label></div>
          </>
        )}
      </div>
    )
  }
  const m = selected.material
  return (
    <div>
      <p className="cl-tab-desc">Колір і PBR-властивості поверхні. Матеріал не анімується ключовими кадрами — лише трансформація.</p>
      <div className="cl-picker-top">
        <input type="color" className="cl-swatch-input" value={m.color} onChange={(e) => setMaterial('color', e.target.value)} />
        <input className="cl-hex-input" value={m.color} onChange={(e) => setMaterial('color', e.target.value)} />
      </div>
      <div className="cl-editrow">
        <label>Metalness
          <input type="range" min={0} max={1} step={0.01} value={m.metalness} onChange={(e) => setMaterial('metalness', parseFloat(e.target.value))} />
          <span>{m.metalness.toFixed(2)}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Roughness
          <input type="range" min={0} max={1} step={0.01} value={m.roughness} onChange={(e) => setMaterial('roughness', parseFloat(e.target.value))} />
          <span>{m.roughness.toFixed(2)}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Opacity
          <input type="range" min={0.05} max={1} step={0.01} value={m.opacity} onChange={(e) => setMaterial('opacity', parseFloat(e.target.value))} />
          <span>{m.opacity.toFixed(2)}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label><input type="checkbox" checked={m.wireframe} onChange={(e) => setMaterial('wireframe', e.target.checked)} /> Wireframe</label>
      </div>
    </div>
  )
}

function LightingTab({ lighting, setLighting }) {
  return (
    <div>
      <p className="cl-tab-desc">Глобальне тло-освітлення сцени (ambient/key/fill) — ті самі пресети, що в 3D Lab. Окремо від будь-яких точкових/прожекторних світел, доданих як обʼєкти зліва.</p>
      <div className="l3d-template-grid">
        {LIGHT_PRESETS.map((p) => (
          <button key={p.key} className={'l3d-template-card' + (lighting === p.key ? ' active' : '')} onClick={() => setLighting(p.key)}>
            <span className="l3d-template-icon">{p.icon}</span>
            <span className="l3d-template-label">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CameraTab({ cameraView, fov, onSetView, onSetFov }) {
  return (
    <div>
      <p className="cl-tab-desc">Готові ракурси камери — так само, як у 3D Lab.</p>
      <div className="l3d-template-grid">
        {CAMERA_VIEWS.map((v) => (
          <button key={v.key} className={'l3d-template-card' + (cameraView === v.key ? ' active' : '')} onClick={() => onSetView(v.key)}>
            <span className="l3d-template-icon">{v.icon}</span>
            <span className="l3d-template-label">{v.label}</span>
          </button>
        ))}
      </div>
      <div className="cl-editrow" style={{ marginTop: 16 }}>
        <label>Field of View
          <input type="range" min={25} max={90} value={fov} onChange={(e) => onSetFov(parseInt(e.target.value, 10))} />
          <span>{fov}°</span>
        </label>
      </div>
    </div>
  )
}

function ExportTab({ objects, duration, getScreenshot, onRecordVideo, recording, onExportGltf }) {
  const animatedCount = objects.filter((o) => o.keyframes.length >= 2).length
  const hasSpot = objects.some((o) => o.type === 'spotLight' && o.keyframes.length >= 2)
  const json = JSON.stringify({ duration, objects }, null, 2)
  return (
    <div>
      <p className="cl-tab-desc">Забери готову анімацію: скріншот поточного кадру, JSON сцени, відео (WebM) або glTF-файл із реальним анімаційним кліпом.</p>
      <HelpBox>
        <p><b>WebM-відео</b> записує те, що бачиш у вʼюпорті, під час одного повного проходу таймлайна — кнопка сама переведе час на 0 і відтворить анімацію один раз.</p>
        <p><b>glTF з анімацією</b> експортує реальний <code>AnimationClip</code> (потрібно щонайменше 2 ключові кадри на обʼєкті) — відкрий файл у будь-якому glTF-переглядачі (напр. gltf-viewer.donmccurdy.com).</p>
        {hasSpot && <p>⚠ Напрямок прожектора (куди він світить) — зручність лише цього редактора, Three.js обчислює її не через обертання; у glTF прожектор експортується з позицією й анімацією, але без напрямку прицілу.</p>}
      </HelpBox>
      {animatedCount === 0 && <p className="cl-tab-desc">⚠ Жоден обʼєкт ще не має щонайменше 2 ключових кадрів — glTF-експорт анімації буде порожнім, доки не додаси кадри на вкладці «Трансформація».</p>}

      <div className="cl-section-title">Файли</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => downloadDataUrl(getScreenshot(), 'scene.png')}>⬇ PNG (поточний кадр)</button>
        <button className="harmony-btn" onClick={() => downloadText(json, 'scene.json', 'application/json')}>⬇ JSON</button>
      </div>
      <div className="cl-section-title">Анімація</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={onRecordVideo} disabled={recording}>{recording ? '⏺ Запис…' : '🎥 Записати WebM-відео'}</button>
        <button className="harmony-btn" onClick={onExportGltf} disabled={animatedCount === 0}>⬇ glTF (.glb) з анімацією</button>
      </div>
    </div>
  )
}

// Обгортка: редактор монтується лише ПІСЛЯ того, як прогрес завантажився
// з сервера. Внутрішній редактор бере сцену з проєкту один раз — при
// монтуванні (далі живе власним станом з undo/redo й автозбереженням).
// Якщо змонтувати його раніше (пряме відкриття/оновлення сторінки), він
// стартував би з порожньою сценою й автозбереженням затер би справжню.
export default function ThreeDAnimEditor() {
  const { projectId } = useParams()
  const { threeDProjects, ready } = useProgress()
  if (!ready) return <p className="cl-tab-desc" style={{ padding: 24 }}>Завантаження 3D-проєкту…</p>
  if (!threeDProjects.some((p) => p.id === projectId)) return <NotFound />
  return <ThreeDAnimEditorInner key={projectId} />
}

function ThreeDAnimEditorInner() {
  const { projectId } = useParams()
  const { threeDProjects, saveThreeDProject, gameArtProjects = [] } = useProgress()
  const artImages = useMemo(() => gameArtProjects.flatMap((p) =>
    Object.values(p.assets || {}).flat().filter((a) => a && a.imageDataUrl).map((a) => ({ id: a.id, title: a.title || 'Без назви', project: p.name, url: a.imageDataUrl }))
  ), [gameArtProjects])
  const toastApi = useLabToast()
  const project = threeDProjects.find((p) => p.id === projectId)
  const anim0 = project?.anim || createEmptyAnimScene()

  const [duration, setDurationState] = useState(anim0.duration)
  const [fps, setFpsState] = useState(anim0.fps)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loopPlayback, setLoopPlayback] = useState(true)
  const [lighting, setLighting] = useState('studio')
  const [cameraView, setCameraViewState] = useState('iso')
  const [fov, setFovState] = useState(50)
  const [tab, setTab] = useState('transform')
  const [recording, setRecording] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(false)
  const [hasClipboard, setHasClipboard] = useState(false)
  // Точки у вʼюпорті: для фігур із 2D-контуром за замовчуванням сховані
  // (контур зручніший, а округлені краї дають сотні точок), для решти — видно.
  const [pointsPref, setPointsPref] = useState({ profile: false, other: true })
  const [selectedPointKey, setSelectedPointKey] = useState(null)
  const [softRadius, setSoftRadius] = useState(0)
  const [symmetry, setSymmetry] = useState(false)
  const [drawTarget, setDrawTarget] = useState(null) // null | 'new' | id обʼєкта
  const [pendingImport, setPendingImport] = useState(null)
  const [sceneKey, setSceneKey] = useState(0)
  const [sceneLost, setSceneLost] = useState(false)
  const [brush, setBrushState] = useState({ mode: 'brush', color: '#e53935', size: 14, opacity: 1 })
  const brushRef = useRef(brush)
  function setBrush(b) { brushRef.current = b; setBrushState(b) }

  const hist = useLabHistory({ objects: anim0.objects, selectedId: anim0.objects[0]?.id ?? null })
  const [objects, setObjectsState] = useState(hist.value.objects)
  const [selectedId, setSelectedIdState] = useState(hist.value.selectedId)

  const containerRef = useRef(null)
  const sceneApiRef = useRef(null)
  const objectsRef = useRef(objects)
  const selectedIdRef = useRef(selectedId)
  const durationRef = useRef(duration)
  const fpsRef = useRef(fps)
  const loopRef = useRef(loopPlayback)
  const currentTimeRef = useRef(currentTime)
  const playingRef = useRef(playing)
  const projectRef = useRef(project)
  const saveTimerRef = useRef(null)
  const historyTimerRef = useRef(null)
  const recorderRef = useRef(null)
  const recordingRef = useRef(false)
  const clipboardRef = useRef(null)
  const editModeRef = useRef(false)
  const paintModeRef = useRef(false)
  // Обертання обʼєкта перетягуванням — лише за увімкненим перемикачем або
  // з Alt; за замовчуванням будь-яке перетягування крутить камеру (ракурс),
  // щоб можна було оглянути сцену з усіх боків, не зачіпаючи обʼєкт.
  const [rotateObjMode, setRotateObjMode] = useState(false)
  const rotateObjModeRef = useRef(false)
  rotateObjModeRef.current = rotateObjMode
  const pointDragRef = useRef(null)
  const softRadiusRef = useRef(softRadius)
  const symmetryRef = useRef(symmetry)
  softRadiusRef.current = softRadius
  symmetryRef.current = symmetry

  useEffect(() => { durationRef.current = duration }, [duration])
  useEffect(() => { fpsRef.current = fps }, [fps])
  useEffect(() => { loopRef.current = loopPlayback }, [loopPlayback])
  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { projectRef.current = project }, [project])

  function scheduleSave(nextObjects, nextDuration, nextFps) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (!projectRef.current) return
      saveThreeDProject({
        ...projectRef.current,
        anim: { objects: nextObjects ?? objectsRef.current, duration: nextDuration ?? durationRef.current, fps: nextFps ?? fpsRef.current },
      })
    }, 500)
  }
  function scheduleHistoryCommit() {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current)
    historyTimerRef.current = setTimeout(() => {
      hist.set({ objects: objectsRef.current, selectedId: selectedIdRef.current })
    }, 400)
  }

  function applyObjects(next) {
    objectsRef.current = next
    setObjectsState(next)
    scheduleHistoryCommit()
    scheduleSave(next, undefined, undefined)
  }
  function applySelected(id) {
    selectedIdRef.current = id
    setSelectedIdState(id)
    scheduleHistoryCommit()
  }
  function handleUndo() {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current)
    hist.undo()
  }
  function handleRedo() {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current)
    hist.redo()
  }
  useEffect(() => {
    objectsRef.current = hist.value.objects
    selectedIdRef.current = hist.value.selectedId
    setObjectsState(hist.value.objects)
    setSelectedIdState(hist.value.selectedId)
    scheduleSave(hist.value.objects, undefined, undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hist.value])

  function applyDuration(next) {
    durationRef.current = next
    setDurationState(next)
    if (currentTimeRef.current > next) setCurrentTime(next)
    scheduleSave(undefined, next, undefined)
  }
  function applyFps(next) {
    fpsRef.current = next
    setFpsState(next)
    scheduleSave(undefined, undefined, next)
  }

  // Mount the Three.js scene once; dispose on unmount. Also wires up
  // direct-manipulation rotation: dragging starting ON the already-selected
  // object spins it (via applyRotationDeltaRef, see above) instead of
  // orbiting the camera — the orbit controls are briefly disabled for the
  // duration of that one drag so the two gestures don't fight each other.
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const api = createAnimScene(el)
    const glCanvas = api.getRenderer().domElement
    const onLost = () => setSceneLost(true)
    glCanvas.addEventListener('webglcontextlost', onLost)
    sceneApiRef.current = api
    api.syncStructure(objectsRef.current, selectedIdRef.current)

    let rotating = false
    let painting = false
    let pointDragging = false
    let suppressClick = false
    let lastX = 0
    let lastY = 0

    function handleClick(e) {
      if (suppressClick) { suppressClick = false; return }
      if (editModeRef.current && api.pickPoint(e.clientX, e.clientY)) return
      const id = api.pickAt(e.clientX, e.clientY)
      if (id) applySelected(id)
    }
    function handlePointerDown(e) {
      if (paintModeRef.current) {
        // Режим малювання: по моделі — мазок, поза нею — звичайне обертання камери.
        if (beginPaintRef.current(e.clientX, e.clientY)) {
          painting = true
          api.setControlsEnabled(false)
        }
        return
      }
      if (editModeRef.current) {
        // Режим точок: захоплення точки тягне її; обертання обʼєкта
        // перетягуванням вимкнене, щоб жести не плутались.
        const key = api.pickPoint(e.clientX, e.clientY)
        if (key && startPointDragRef.current(key)) {
          pointDragging = true
          api.setControlsEnabled(false)
          el.style.cursor = 'move'
        }
        return
      }
      const id = api.pickAt(e.clientX, e.clientY)
      if (id && id === selectedIdRef.current && (rotateObjModeRef.current || e.altKey)) {
        rotating = true
        lastX = e.clientX
        lastY = e.clientY
        api.setControlsEnabled(false)
        el.style.cursor = 'grabbing'
      }
    }
    function handlePointerMove(e) {
      if (painting) {
        api.paintStroke(selectedIdRef.current, e.clientX, e.clientY, paintBrushFor(selectedIdRef.current), false)
        return
      }
      if (pointDragging) {
        const delta = api.dragPointTo(e.clientX, e.clientY)
        if (delta) applyPointDragRef.current(delta)
        return
      }
      if (!rotating) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      applyRotationDeltaRef.current(dx, dy, e.shiftKey)
    }
    function handlePointerUp() {
      if (painting) {
        painting = false
        suppressClick = true
        setTimeout(() => { suppressClick = false }, 0)
        api.setControlsEnabled(true)
        endPaintRef.current()
        return
      }
      if (pointDragging) {
        pointDragging = false
        suppressClick = true
        setTimeout(() => { suppressClick = false }, 0)
        api.endPointDrag()
        pointDragRef.current = null
        api.setControlsEnabled(true)
        el.style.cursor = 'grab'
        return
      }
      if (!rotating) return
      rotating = false
      api.setControlsEnabled(true)
      el.style.cursor = 'grab'
    }

    el.addEventListener('click', handleClick)
    el.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      el.removeEventListener('click', handleClick)
      el.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      api.dispose()
      glCanvas.removeEventListener('webglcontextlost', onLost)
      sceneApiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey])

  // Structural resync on edits — also re-applies each object's base
  // transform, which the pose effect below then overrides with the correct
  // interpolated value for the current time (effects run in declaration
  // order within the same commit).
  useEffect(() => {
    sceneApiRef.current?.syncStructure(objects, selectedId)
  }, [objects, selectedId])

  // Lightweight per-frame-safe pose update — runs on every time change
  // (scrubbing or playback) without rebuilding any geometry/material.
  useEffect(() => {
    const api = sceneApiRef.current
    if (!api) return
    for (const obj of objects) {
      const pose = poseAt(obj, currentTime)
      api.setPose(obj.id, pose.position, pose.rotation, pose.scale)
    }
  }, [currentTime, objects])

  useEffect(() => { sceneApiRef.current?.setLighting(lighting) }, [lighting])

  // Маркери точок обраної фігури — лише на вкладці «Форма».
  const selectedForEdit = objects.find((o) => o.id === selectedId) || null
  const hasProfileEditor = !!selectedForEdit && (selectedForEdit.type === 'custom' || !!PRIMITIVE_PROFILES[selectedForEdit.type])
  const pointsVisible = hasProfileEditor ? pointsPref.profile : pointsPref.other
  const editMode = tab === 'shape' && pointsVisible && !!selectedForEdit && !LIGHT_TYPES.includes(selectedForEdit.type)
  editModeRef.current = editMode
  const paintMode = tab === 'paint' && !!selectedForEdit && !LIGHT_TYPES.includes(selectedForEdit.type)
  paintModeRef.current = paintMode
  useEffect(() => {
    const api = sceneApiRef.current
    if (!api) return
    if (editMode) api.showPointHandles(selectedId, selectedForEdit?.vertexEdits, selectedPointKey)
    else api.clearHandles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, objects, selectedId, selectedPointKey])
  useEffect(() => { setSelectedPointKey(null) }, [selectedId])

  function setCameraView(viewKey) {
    setCameraViewState(viewKey)
    sceneApiRef.current?.setCameraView(viewKey)
  }
  function setFov(deg) {
    setFovState(deg)
    sceneApiRef.current?.setFov(deg)
  }

  // Playback loop
  useEffect(() => {
    if (!playing) return
    let raf
    let last = performance.now()
    function tick(now) {
      const dt = (now - last) / 1000
      last = now
      let t = currentTimeRef.current + dt
      let keepGoing = true
      if (t >= durationRef.current) {
        t = durationRef.current
        if (loopRef.current && !recordingRef.current) {
          t = 0
        } else {
          setPlaying(false)
          keepGoing = false
        }
      }
      setCurrentTime(t)
      if (keepGoing) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  // Stop the recorder exactly when a recording playback pass naturally ends.
  useEffect(() => {
    if (!playing && recordingRef.current && recorderRef.current) {
      recorderRef.current.stop()
    }
  }, [playing])

  const selected = useMemo(() => objects.find((o) => o.id === selectedId) || null, [objects, selectedId])
  const animatedCount = useMemo(() => objects.filter((o) => o.keyframes.length > 0).length, [objects])

  function finishDrawing({ mode, points, depth, bevel }) {
    const target = drawTarget
    setDrawTarget(null)
    const existing = target && target !== 'new' ? objectsRef.current.find((o) => o.id === target) : null
    const base = existing?.profile || (existing && PRIMITIVE_PROFILES[existing.type]?.()) || DEFAULT_PROFILE
    const profile = { ...base, mode, depth, bevel, points: { ...DEFAULT_PROFILE.points, ...base.points, [mode]: points } }
    if (existing) {
      setProfile(profile)
      toastApi.show('✓ Форму перемальовано')
      return
    }
    const obj = { ...makeAnimObject('custom', nextId), profile, name: 'Намальована форма' }
    applyObjects([...objectsRef.current, obj])
    applySelected(obj.id)
    setTab('shape')
    toastApi.show('✨ Малюнок перетворено на 3D')
  }

  function addObject(type) {
    const obj = makeAnimObject(type, nextId)
    const next = [...objectsRef.current, obj]
    applyObjects(next)
    applySelected(obj.id)
    if (type === 'custom') setTab('shape')
    toastApi.show('✓ Додано')
  }
  function deleteObject(id) {
    const next = objectsRef.current.filter((o) => o.id !== id)
    applyObjects(next)
    if (selectedIdRef.current === id) applySelected(next[0]?.id ?? null)
  }
  function duplicateObject(id) {
    const obj = objectsRef.current.find((o) => o.id === id)
    if (!obj) return
    const clone = {
      ...obj,
      id: nextId(),
      name: obj.name ? `${obj.name} (копія)` : null,
      position: { ...obj.position, x: obj.position.x + 0.4 },
      keyframes: obj.keyframes.map((k) => ({ ...k, position: { ...k.position, x: k.position.x + 0.4 } })),
    }
    const next = [...objectsRef.current, clone]
    applyObjects(next)
    applySelected(clone.id)
    toastApi.show('✓ Здубльовано')
  }
  function renameSelected(name) {
    if (!selectedIdRef.current) return
    applyObjects(objectsRef.current.map((o) => (o.id === selectedIdRef.current ? { ...o, name: name || null } : o)))
  }
  function setMaterial(key, value) {
    if (!selectedIdRef.current) return
    applyObjects(objectsRef.current.map((o) => (o.id === selectedIdRef.current ? { ...o, material: { ...o.material, [key]: value } } : o)))
  }
  function setLightProp(key, value) {
    if (!selectedIdRef.current) return
    applyObjects(objectsRef.current.map((o) => (o.id === selectedIdRef.current ? { ...o, light: { ...o.light, [key]: value } } : o)))
  }

  // Edits position/rotation/scale: if a keyframe exists exactly at the
  // current time, patches that keyframe in place; otherwise patches the
  // object's base (rest) transform. Position edits snap to the grid when
  // snapEnabled is on.
  function editPose(group, axis, value) {
    if (!selectedIdRef.current) return
    if (group === 'position' && snapEnabled) value = Math.round(value / SNAP_SIZE) * SNAP_SIZE
    const t = currentTimeRef.current
    const next = objectsRef.current.map((o) => {
      if (o.id !== selectedIdRef.current) return o
      const idx = o.keyframes.findIndex((k) => Math.abs(k.time - t) < 0.01)
      if (idx >= 0) {
        const kfs = [...o.keyframes]
        kfs[idx] = { ...kfs[idx], [group]: { ...kfs[idx][group], [axis]: value } }
        return { ...o, keyframes: kfs }
      }
      return { ...o, [group]: { ...o[group], [axis]: value } }
    })
    applyObjects(next)
  }

  // Direct-manipulation rotation: dragging the selected object in the
  // viewport spins it (horizontal → Y, vertical → X; hold Shift to roll Z
  // instead) — the discoverable alternative to typing degrees in the
  // sliders. Wired up from the pointer handlers below via a ref so the
  // once-registered scene-mount effect always calls the current version.
  function applyRotationDelta(dx, dy, roll) {
    const id = selectedIdRef.current
    if (!id) return
    const t = currentTimeRef.current
    const wrap = (v) => ((v % 360) + 360) % 360
    const next = objectsRef.current.map((o) => {
      if (o.id !== id) return o
      const idx = o.keyframes.findIndex((k) => Math.abs(k.time - t) < 0.01)
      const source = idx >= 0 ? o.keyframes[idx].rotation : o.rotation
      const nextRot = roll
        ? { x: source.x, y: source.y, z: wrap(source.z + dx * 0.6) }
        : { x: wrap(source.x + dy * 0.6), y: wrap(source.y + dx * 0.6), z: source.z }
      if (idx >= 0) {
        const kfs = [...o.keyframes]
        kfs[idx] = { ...kfs[idx], rotation: nextRot }
        return { ...o, keyframes: kfs }
      }
      return { ...o, rotation: nextRot }
    })
    applyObjects(next)
  }
  const applyRotationDeltaRef = useRef(applyRotationDelta)
  applyRotationDeltaRef.current = applyRotationDelta

  // ── Малювання на моделі ──
  function paintBrushFor(id) {
    const b = brushRef.current
    const obj = objectsRef.current.find((o) => o.id === id)
    return { size: b.size, opacity: b.mode === 'eraser' ? 1 : b.opacity, color: b.mode === 'eraser' ? (obj?.material?.color || '#ffffff') : b.color }
  }
  function setPaint(id, url) {
    applyObjects(objectsRef.current.map((o) => (o.id === id ? { ...o, paint: url } : o)))
  }
  // Перший мазок/наліпка на фігурі без малюнка: створюємо полотно кольору
  // основи й одразу синхронізуємо сцену, щоб у меша зʼявилась розгортка.
  function ensurePaintNow(id) {
    const obj = objectsRef.current.find((o) => o.id === id)
    if (!obj || obj.paint) return
    const c = document.createElement('canvas')
    c.width = PAINT_W
    c.height = PAINT_H
    const ctx = c.getContext('2d')
    ctx.fillStyle = obj.material.color
    ctx.fillRect(0, 0, PAINT_W, PAINT_H)
    const next = objectsRef.current.map((o) => (o.id === id ? { ...o, paint: c.toDataURL('image/jpeg', 0.88) } : o))
    objectsRef.current = next
    sceneApiRef.current?.syncStructure(next, selectedIdRef.current)
    applyObjects(next)
  }
  function beginPaint(x, y) {
    const api = sceneApiRef.current
    const id = selectedIdRef.current
    if (!api || !id || api.pickAt(x, y) !== id) return false
    ensurePaintNow(id)
    return api.paintStroke(id, x, y, paintBrushFor(id), true)
  }
  function endPaint() {
    const id = selectedIdRef.current
    const url = sceneApiRef.current?.commitPaint(id)
    if (url) setPaint(id, url)
  }
  const beginPaintRef = useRef(beginPaint)
  beginPaintRef.current = beginPaint
  const endPaintRef = useRef(endPaint)
  endPaintRef.current = endPaint
  function fillModel(color) {
    const id = selectedIdRef.current
    if (!id) return
    ensurePaintNow(id)
    const url = sceneApiRef.current?.fillPaint(id, color)
    if (url) { setPaint(id, url); toastApi.show('✓ Модель залито') }
  }
  function stampOnModel(img, side) {
    const id = selectedIdRef.current
    if (!id) return
    ensurePaintNow(id)
    const url = sceneApiRef.current?.stampImage(id, img, side)
    if (url) { setPaint(id, url); toastApi.show('✓ Малюнок наклеєно — поверни модель, щоб побачити') }
  }
  function clearModelPaint() {
    const id = selectedIdRef.current
    if (id) setPaint(id, null)
  }

  // ── Відкрити 3D-файл (JSON з вкладки «Експорт») ──
  const VALID_TYPES = new Set([...SHAPES.map((x) => x.type), ...LIGHT_TYPES])
  function importSceneFile(file) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const list = Array.isArray(data) ? data : data.objects || data.anim?.objects
        if (!Array.isArray(list)) throw new Error('no objects')
        const vec = (v, d) => ({ x: Number(v?.x ?? d.x) || 0, y: Number(v?.y ?? d.y) || 0, z: Number(v?.z ?? d.z) || 0 })
        const objs = list.filter((o) => o && typeof o === 'object').map((o) => {
          const type = VALID_TYPES.has(o.type) ? o.type : 'box'
          const base = makeAnimObject(type, nextId)
          return {
            ...base,
            name: typeof o.name === 'string' ? o.name : null,
            position: vec(o.position, base.position),
            rotation: vec(o.rotation, base.rotation),
            scale: vec(o.scale, base.scale),
            material: base.material ? { ...base.material, ...(o.material || {}) } : null,
            light: base.light ? { ...base.light, ...(o.light || {}) } : null,
            vertexEdits: o.vertexEdits && typeof o.vertexEdits === 'object' ? o.vertexEdits : {},
            profile: type === 'custom' ? (o.profile || base.profile) : null,
            paint: typeof o.paint === 'string' && o.paint.startsWith('data:image/') ? o.paint : null,
            keyframes: Array.isArray(o.keyframes) ? o.keyframes.filter((k) => k && typeof k.time === 'number').map((k) => ({
              time: k.time, position: vec(k.position, base.position), rotation: vec(k.rotation, base.rotation), scale: vec(k.scale, base.scale), easing: k.easing || 'linear',
            })) : [],
          }
        })
        if (objs.length === 0) throw new Error('empty')
        setPendingImport({ fileName: file.name, objects: objs, duration: Number(data.duration) || null })
      } catch {
        toastApi.show('✗ Це не схоже на 3D-файл сцени (JSON)')
      }
    }
    reader.readAsText(file)
  }
  function applyImport(how) {
    if (!pendingImport) return
    const next = how === 'replace' ? pendingImport.objects : [...objectsRef.current, ...pendingImport.objects]
    applyObjects(next)
    applySelected(pendingImport.objects[0]?.id ?? null)
    if (how === 'replace' && pendingImport.duration) applyDuration(Math.max(1, Math.min(60, pendingImport.duration)))
    toastApi.show(`✓ Завантажено ${pendingImport.objects.length} обʼєктів`)
    setPendingImport(null)
  }

  // ── Редагування форми по точках ──
  function setVertexEdits(id, edits) {
    applyObjects(objectsRef.current.map((o) => (o.id === id ? { ...o, vertexEdits: edits } : o)))
  }
  function mirrorKeyOf(p) {
    return pointKey(-p.x, p.y, p.z)
  }
  // Додає зсув `delta` до точки `center` (+ сусідів у радіусі м'якого
  // виділення з плавним затуханням) і, з симетрією, дзеркально по X.
  function influence(points, out, center, delta) {
    const r = softRadiusRef.current
    for (const p of points) {
      let w = 0
      if (p.key === center.key) w = 1
      else if (r > 0) {
        const dist = Math.hypot(p.x - center.x, p.y - center.y, p.z - center.z)
        if (dist < r) { const t = 1 - dist / r; w = t * t * (3 - 2 * t) }
      }
      if (w === 0) continue
      const prev = out[p.key] || { x: 0, y: 0, z: 0 }
      out[p.key] = { x: prev.x + delta.x * w, y: prev.y + delta.y * w, z: prev.z + delta.z * w }
    }
  }
  function computeEdits(points, snapshot, center, delta) {
    const out = { ...snapshot }
    const mk = mirrorKeyOf(center)
    const mirror = symmetryRef.current ? points.find((p) => p.key === mk) : null
    let d = delta
    if (mirror && mirror.key === center.key) d = { ...delta, x: 0 } // точка на площині симетрії лишається на ній
    influence(points, out, center, d)
    if (mirror && mirror.key !== center.key) influence(points, out, mirror, { x: -d.x, y: d.y, z: d.z })
    for (const k of Object.keys(out)) {
      const v = out[k]
      if (Math.abs(v.x) < 1e-4 && Math.abs(v.y) < 1e-4 && Math.abs(v.z) < 1e-4) delete out[k]
      else out[k] = { x: Math.round(v.x * 1e4) / 1e4, y: Math.round(v.y * 1e4) / 1e4, z: Math.round(v.z * 1e4) / 1e4 }
    }
    return out
  }
  function startPointDrag(key) {
    const api = sceneApiRef.current
    const id = selectedIdRef.current
    const obj = objectsRef.current.find((o) => o.id === id)
    if (!api || !obj) return false
    const points = api.getPoints(id)
    const center = points.find((p) => p.key === key)
    if (!center) return false
    const snapshot = { ...(obj.vertexEdits || {}) }
    if (!api.beginPointDrag(id, key, snapshot)) return false
    pointDragRef.current = { id, points, center, snapshot }
    setSelectedPointKey(key)
    return true
  }
  function applyPointDrag(delta) {
    const drag = pointDragRef.current
    if (!drag) return
    let d = delta
    if (snapEnabled) {
      // Прив'язка: сама точка стає на сітку, а не зсув.
      const base = drag.center
      const prev = drag.snapshot[base.key] || { x: 0, y: 0, z: 0 }
      const snap = (b, p, dv) => Math.round((b + p + dv) / SNAP_SIZE) * SNAP_SIZE - b - p
      d = { x: snap(base.x, prev.x, delta.x), y: snap(base.y, prev.y, delta.y), z: snap(base.z, prev.z, delta.z) }
    }
    setVertexEdits(drag.id, computeEdits(drag.points, drag.snapshot, drag.center, d))
  }
  const startPointDragRef = useRef(startPointDrag)
  startPointDragRef.current = startPointDrag
  const applyPointDragRef = useRef(applyPointDrag)
  applyPointDragRef.current = applyPointDrag

  function setPointCoord(axis, value) {
    const api = sceneApiRef.current
    const id = selectedIdRef.current
    const obj = objectsRef.current.find((o) => o.id === id)
    if (!api || !obj || !selectedPointKey || Number.isNaN(value)) return
    const points = api.getPoints(id)
    const center = points.find((p) => p.key === selectedPointKey)
    if (!center) return
    const prev = obj.vertexEdits?.[center.key] || { x: 0, y: 0, z: 0 }
    const delta = { x: 0, y: 0, z: 0 }
    delta[axis] = value - (center[axis] + prev[axis])
    setVertexEdits(id, computeEdits(points, { ...(obj.vertexEdits || {}) }, center, delta))
  }
  function resetShape() {
    if (!selectedIdRef.current) return
    setVertexEdits(selectedIdRef.current, {})
    setSelectedPointKey(null)
    toastApi.show('✓ Форму скинуто')
  }
  function setProfile(profile) {
    const id = selectedIdRef.current
    if (!id) return
    setSelectedPointKey(null)
    // Стандартна фігура при першому редагуванні контуру стає «Своєю формою».
    applyObjects(objectsRef.current.map((o) => (o.id === id ? { ...o, type: 'custom', profile, vertexEdits: {} } : o)))
  }

  function addKeyframeHere() {
    if (!selectedIdRef.current) return
    const t = Math.round(currentTimeRef.current * 100) / 100
    const next = objectsRef.current.map((o) => {
      if (o.id !== selectedIdRef.current) return o
      if (o.keyframes.some((k) => Math.abs(k.time - t) < 0.01)) return o
      const kf = makeKeyframeFromObject(o, t)
      return { ...o, keyframes: [...o.keyframes, kf].sort((a, b) => a.time - b.time) }
    })
    applyObjects(next)
    toastApi.show('✓ Ключовий кадр додано')
  }
  function deleteKeyframe(objId, time) {
    const next = objectsRef.current.map((o) => (o.id === objId ? { ...o, keyframes: o.keyframes.filter((k) => Math.abs(k.time - time) > 0.01) } : o))
    applyObjects(next)
  }
  function setEasing(value) {
    if (!selectedIdRef.current) return
    const t = currentTimeRef.current
    const next = objectsRef.current.map((o) => {
      if (o.id !== selectedIdRef.current) return o
      const idx = o.keyframes.findIndex((k) => Math.abs(k.time - t) < 0.01)
      if (idx < 0) return o
      const kfs = [...o.keyframes]
      kfs[idx] = { ...kfs[idx], easing: value }
      return { ...o, keyframes: kfs }
    })
    applyObjects(next)
  }
  function copyKeyframe() {
    const id = selectedIdRef.current
    if (!id) return
    const obj = objectsRef.current.find((o) => o.id === id)
    const kf = obj && findKeyframeAt(obj, currentTimeRef.current)
    if (!kf) return
    clipboardRef.current = { position: { ...kf.position }, rotation: { ...kf.rotation }, scale: { ...kf.scale }, easing: kf.easing || 'linear' }
    setHasClipboard(true)
    toastApi.show('✓ Кадр скопійовано')
  }
  function pasteKeyframe() {
    const id = selectedIdRef.current
    if (!id || !clipboardRef.current) return
    const t = Math.round(currentTimeRef.current * 100) / 100
    const clip = clipboardRef.current
    const next = objectsRef.current.map((o) => {
      if (o.id !== id) return o
      const withoutSame = o.keyframes.filter((k) => Math.abs(k.time - t) > 0.01)
      const kf = { time: t, position: { ...clip.position }, rotation: { ...clip.rotation }, scale: { ...clip.scale }, easing: clip.easing }
      return { ...o, keyframes: [...withoutSame, kf].sort((a, b) => a.time - b.time) }
    })
    applyObjects(next)
    toastApi.show('✓ Кадр вставлено')
  }

  function togglePlay() {
    if (!playingRef.current && currentTimeRef.current >= durationRef.current) setCurrentTime(0)
    setPlaying((p) => !p)
  }
  function stopPlayback() {
    setPlaying(false)
    setCurrentTime(0)
  }
  function scrub(t) {
    setPlaying(false)
    setCurrentTime(Math.min(durationRef.current, Math.max(0, t)))
  }
  function stepFrame(dir) {
    setPlaying(false)
    const step = 1 / fpsRef.current
    const next = Math.min(durationRef.current, Math.max(0, currentTimeRef.current + dir * step))
    setCurrentTime(Math.round(next * 1000) / 1000)
  }

  // Keyboard shortcuts: registered once with an empty dep array, so every
  // handler it calls must read current state via refs (never via a plain
  // closed-over state variable) to stay correct for the life of the page.
  useEffect(() => {
    function handler(e) {
      const typing = isTypingTarget(document.activeElement)
      const mod = e.ctrlKey || e.metaKey
      if (e.code === 'Space' && !typing) {
        e.preventDefault()
        togglePlay()
        return
      }
      if (typing) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIdRef.current) { e.preventDefault(); deleteObject(selectedIdRef.current) }
        return
      }
      if (mod && e.key.toLowerCase() === 'd') {
        if (selectedIdRef.current) { e.preventDefault(); duplicateObject(selectedIdRef.current) }
        return
      }
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); return }
      if (mod && e.key.toLowerCase() === 'c') { e.preventDefault(); copyKeyframe(); return }
      if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); pasteKeyframe(); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepFrame(-1); return }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepFrame(1); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startRecording() {
    const api = sceneApiRef.current
    if (!api || recordingRef.current) return
    const canvas = api.getRenderer().domElement
    let stream
    try {
      stream = canvas.captureStream(fps)
    } catch {
      toastApi.show('✗ Запис відео не підтримується цим браузером')
      return
    }
    let recorder
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    } catch {
      try {
        recorder = new MediaRecorder(stream)
      } catch {
        toastApi.show('✗ Запис відео не підтримується цим браузером')
        return
      }
    }
    const chunks = []
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      downloadDataUrl(url, `${safeFileName(project?.name)}.webm`)
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      recordingRef.current = false
      setRecording(false)
    }
    recorderRef.current = recorder
    recordingRef.current = true
    setRecording(true)
    setPlaying(false)
    setCurrentTime(0)
    requestAnimationFrame(() => {
      recorder.start()
      setPlaying(true)
    })
  }

  function exportGltf() {
    const api = sceneApiRef.current
    if (!api) return
    const scene = api.getScene()
    const tracks = []
    for (const obj of objectsRef.current) {
      if (!obj.keyframes || obj.keyframes.length < 2) continue
      const sorted = [...obj.keyframes].sort((a, b) => a.time - b.time)
      const times = sorted.map((k) => k.time)
      const posValues = []
      const scaleValues = []
      const quatValues = []
      for (const k of sorted) {
        posValues.push(k.position.x, k.position.y, k.position.z)
        scaleValues.push(k.scale.x, k.scale.y, k.scale.z)
        const euler = new THREE.Euler(THREE.MathUtils.degToRad(k.rotation.x), THREE.MathUtils.degToRad(k.rotation.y), THREE.MathUtils.degToRad(k.rotation.z))
        const q = new THREE.Quaternion().setFromEuler(euler)
        quatValues.push(q.x, q.y, q.z, q.w)
      }
      tracks.push(new THREE.VectorKeyframeTrack(`${obj.id}.position`, times, posValues))
      tracks.push(new THREE.QuaternionKeyframeTrack(`${obj.id}.quaternion`, times, quatValues))
      tracks.push(new THREE.VectorKeyframeTrack(`${obj.id}.scale`, times, scaleValues))
    }
    if (tracks.length === 0) {
      toastApi.show('✗ Додай щонайменше 2 ключові кадри на обʼєкті для glTF-анімації')
      return
    }
    const clip = new THREE.AnimationClip('Animation', durationRef.current, tracks)
    const exporter = new GLTFExporter()
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          downloadDataUrl(URL.createObjectURL(new Blob([result], { type: 'application/octet-stream' })), `${safeFileName(project?.name)}.glb`)
        } else {
          downloadText(JSON.stringify(result, null, 2), `${safeFileName(project?.name)}.gltf`, 'model/gltf+json')
        }
        toastApi.show('✓ glTF експортовано')
      },
      (err) => {
        toastApi.show('✗ Помилка експорту glTF')
        console.error(err)
      },
      { binary: true, animations: [clip] }
    )
  }

  if (!project) return <NotFound />

  return (
    <div className="tl-editor-page">
      <div className="dict-breadcrumb">
        <Link to="/academy/3d-design">3D Design Academy</Link> <span>→</span>
        <Link to={`/3d-design-studio/${project.id}`}>{project.name}</Link> <span>→</span>
        <span>Редактор з анімацією</span>
      </div>
      <div className="gfx-topbar motion-topbar-sticky">
        <Link to={`/3d-design-studio/${project.id}`} className="harmony-btn">← До Studio</Link>
        <span className="gfx-status-pill">{objects.length} обʼєктів · {animatedCount} анімовано</span>
        <button className="cl-mini-btn" onClick={handleUndo} disabled={!hist.canUndo} title="Ctrl+Z">↺ Undo</button>
        <button className="cl-mini-btn" onClick={handleRedo} disabled={!hist.canRedo} title="Ctrl+Shift+Z">↻ Redo</button>
        <span className="motion-autosave-note">Зберігається автоматично.</span>
        <LabInfoTip title="Клавіші та керування">
          Space — грати/пауза, Del — видалити, Ctrl+D — дублювати, ←/→ — крок кадру, Ctrl+C/V — копіювати/вставити кадр.
          <br /><br />
          ✏️ Вкладка «Форма» — тягни точки (вершини) фігури прямо у вʼюпорті, щоб змінити її форму; «Своя форма» — малюєш контур по точках.
          <br /><br />
          🎥 Ліва кнопка миші — крутити камеру навколо сцени; Shift+ліва або права кнопка — зсунути сцену вліво/вправо/вгору/вниз; коліщатко — наблизити/віддалити. Те саме — кнопками ▲◀▶▼ ⟲⟳ + − ⌂ у куті вʼюпорта.
          <br /><br />
          🔄 Щоб обертати сам обʼєкт мишкою — увімкни «🔄 Крутити обʼєкт» під вʼюпортом або тягни його з затиснутим Alt (горизонтально — вісь Y, вертикально — вісь X, Shift — нахил по Z).
        </LabInfoTip>
      </div>

      <div className="tl-editor-shell">
        <div className="tl-editor-left">
          <ObjectsPanel objects={objects} selectedId={selectedId} selected={selected} onSelect={applySelected} onAdd={addObject} onDraw={() => setDrawTarget('new')} onImportFile={importSceneFile} pendingImport={pendingImport} onImportApply={applyImport} onImportCancel={() => setPendingImport(null)} onDelete={deleteObject} onDuplicate={duplicateObject} onRename={renameSelected} />
        </div>

        <div className="tl-editor-center">
          <div className="tl-viewport-wrap">
            <div ref={containerRef} className="tl-editor-viewport" />
            <div className="tl-nav-bar" title="Навігація камерою">
              <button type="button" className="cl-mini-btn" onClick={() => sceneApiRef.current?.orbitView(-20)} title="Повернути камеру вліво">⟲</button>
              <span className="fpc-pad">
                <button type="button" className="cl-mini-btn" style={{ gridArea: 'u' }} onClick={() => sceneApiRef.current?.panView(0, -1)} title="Сцена вгору">▲</button>
                <button type="button" className="cl-mini-btn" style={{ gridArea: 'l' }} onClick={() => sceneApiRef.current?.panView(1, 0)} title="Сцена вліво">◀</button>
                <button type="button" className="cl-mini-btn" style={{ gridArea: 'r' }} onClick={() => sceneApiRef.current?.panView(-1, 0)} title="Сцена вправо">▶</button>
                <button type="button" className="cl-mini-btn" style={{ gridArea: 'd' }} onClick={() => sceneApiRef.current?.panView(0, 1)} title="Сцена вниз">▼</button>
              </span>
              <button type="button" className="cl-mini-btn" onClick={() => sceneApiRef.current?.orbitView(20)} title="Повернути камеру вправо">⟳</button>
              <button type="button" className="cl-mini-btn" onClick={() => sceneApiRef.current?.zoomView(0.8)} title="Наблизити">+</button>
              <button type="button" className="cl-mini-btn" onClick={() => sceneApiRef.current?.zoomView(1.25)} title="Віддалити">−</button>
              <button type="button" className="cl-mini-btn" onClick={() => setCameraView(cameraView)} title="Повернути вигляд за замовчуванням">⌂</button>
            </div>
            {sceneLost && (
              <div className="tl-viewport-lost">
                <p>3D-перегляд зупинився (браузер вимкнув WebGL). Твоя сцена ціла.</p>
                <button className="harmony-btn" onClick={() => { setSceneLost(false); setSceneKey((k) => k + 1) }}>🔄 Перезапустити 3D</button>
              </div>
            )}
          </div>
          {paintMode ? (
            <p className="tl-rotate-hint">🖌 Малюй прямо на «{selected?.name || 'моделі'}». Тягни поза моделлю — крути камеру й малюй з іншого боку.</p>
          ) : editMode ? (
            <p className="tl-rotate-hint">✏️ Режим точок: тягни точку, щоб змінити форму. Тягни поза точками — обертай камеру, щоб рухати точку в іншій площині.</p>
          ) : (
            <div className="tl-rotate-hint tl-view-hint">
              <span>{rotateObjMode && selected
                ? `🔄 Тягни «${selected.name || 'обраний обʼєкт'}», щоб обертати його (Shift — нахил по Z). Поза ним — камера.`
                : '🎥 Тягни — крутити камеру · Shift+тягни або права кнопка — рухати сцену · коліщатко — наблизити · або кнопки у вʼюпорті'}</span>
              <button type="button" className={'cl-mini-btn' + (rotateObjMode ? ' active' : '')} onClick={() => setRotateObjMode((v) => !v)} title="Або тягни обʼєкт із затиснутим Alt">🔄 Крутити обʼєкт</button>
            </div>
          )}

          <div className="tl-controls">
            <button className="cl-mini-btn" onClick={() => stepFrame(-1)} title="←">⏮</button>
            <button className="harmony-btn" onClick={togglePlay}>{playing ? '⏸ Пауза' : '▶ Відтворити'}</button>
            <button className="cl-mini-btn" onClick={() => stepFrame(1)} title="→">⏭</button>
            <button className="harmony-btn" onClick={stopPlayback}>⏹ Стоп</button>
            <button type="button" className={'cl-mini-btn' + (loopPlayback ? ' active' : '')} onClick={() => setLoopPlayback((v) => !v)}>🔁 Повтор</button>
            <div className="tl-settings">
              <label>Тривалість (с)
                <input type="number" min={1} max={60} step={1} value={duration} onChange={(e) => applyDuration(Math.max(1, parseInt(e.target.value, 10) || 1))} />
              </label>
              <label>FPS
                <input type="number" min={12} max={60} step={1} value={fps} onChange={(e) => applyFps(Math.max(12, parseInt(e.target.value, 10) || 24))} />
              </label>
            </div>
          </div>
          <div className="tl-scrubber-row">
            <input type="range" min={0} max={duration} step={1 / fps} value={currentTime} onChange={(e) => scrub(parseFloat(e.target.value))} />
            <span className="tl-time-label">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <Timeline objects={objects} selectedId={selectedId} onSelect={applySelected} duration={duration} currentTime={currentTime} onScrub={scrub} onJumpToKeyframe={scrub} />
        </div>

        <div className="tl-editor-right">
          <div className="cl-tabs">
            {TABS.map((t) => (
              <button key={t.key} className={'cl-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
                <span className="cl-tab-icon">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
          <div className="cl-panel">
            {tab === 'transform' && (
              <TransformTab
                selected={selected}
                time={currentTime}
                onEdit={editPose}
                onAddKeyframe={addKeyframeHere}
                onDeleteKeyframe={deleteKeyframe}
                onSetEasing={setEasing}
                onCopy={copyKeyframe}
                onPaste={pasteKeyframe}
                canPaste={hasClipboard}
                snapEnabled={snapEnabled}
                onToggleSnap={() => setSnapEnabled((v) => !v)}
              />
            )}
            {tab === 'shape' && (
              <ShapeTab
                selected={selected}
                pointsVisible={pointsVisible}
                onTogglePoints={() => setPointsPref((p) => (hasProfileEditor ? { ...p, profile: !p.profile } : { ...p, other: !p.other }))}
                selectedPointKey={selectedPointKey}
                pointBase={selected && selectedPointKey ? (sceneApiRef.current?.getPoints(selected.id).find((p) => p.key === selectedPointKey) || null) : null}
                softRadius={softRadius}
                onSoftRadius={setSoftRadius}
                symmetry={symmetry}
                onToggleSymmetry={() => setSymmetry((v) => !v)}
                onSetPointCoord={setPointCoord}
                onResetShape={resetShape}
                onSetProfile={setProfile}
                onRedraw={() => setDrawTarget(selectedId)}
              />
            )}
            {tab === 'paint' && (
              <PaintTab selected={selected} brush={brush} setBrush={setBrush} onFill={fillModel} onStamp={stampOnModel} onClearPaint={clearModelPaint} artImages={artImages} />
            )}
            {tab === 'material' && <MaterialTab selected={selected} setMaterial={setMaterial} setLightProp={setLightProp} />}
            {tab === 'lighting' && <LightingTab lighting={lighting} setLighting={setLighting} />}
            {tab === 'camera' && <CameraTab cameraView={cameraView} fov={fov} onSetView={setCameraView} onSetFov={setFov} />}
            {tab === 'export' && (
              <ExportTab objects={objects} duration={duration} getScreenshot={() => sceneApiRef.current?.screenshot()} onRecordVideo={startRecording} recording={recording} onExportGltf={exportGltf} />
            )}
          </div>
        </div>
      </div>
      {drawTarget && (
        <DrawShapeModal
          initialMode={(() => {
            const o = drawTarget !== 'new' ? objects.find((x) => x.id === drawTarget) : null
            return o?.profile?.mode || (o && PRIMITIVE_PROFILES[o.type]?.().mode) || 'extrude'
          })()}
          onCancel={() => setDrawTarget(null)}
          onDone={finishDrawing}
        />
      )}
      <LabToast message={toastApi.toast} />
    </div>
  )
}
