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
import { createAnimScene, PRIMITIVES, LIGHT_KINDS, LIGHT_PRESETS, CAMERA_VIEWS } from './labs/threeAnimScene.js'
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
        const meta = PRIMITIVES.find((p) => p.type === o.type) || LIGHT_KINDS.find((p) => p.type === o.type)
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

function ObjectsPanel({ objects, selectedId, onSelect, onAdd, onDelete, onDuplicate, onRename, selected }) {
  return (
    <div>
      <p className="cl-tab-desc">Кожна фігура чи світло отримує власну доріжку на таймлайні. Обʼєкт без жодного ключового кадру лишається статичним — анімація потрібна лише там, де вона справді щось розповідає.</p>
      <HelpBox>
        <p>Це той самий принцип, що в 3D Lab: сцена складається з окремих вузлів (форма/світло + позиція + властивості). Різниця тут — у кожного вузла є ще й <b>ключові кадри</b>: знімки його пози на спільному таймлайні.</p>
        <p>Прожектор світить у напрямку, заданому його обертанням (вкладка «Трансформація») — так само, як ти б повертав будь-яку іншу фігуру.</p>
      </HelpBox>

      <div className="cl-section-title">Додати фігуру</div>
      <div className="cl-btn-row">
        {PRIMITIVES.map((p) => (
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
            const meta = PRIMITIVES.find((p) => p.type === o.type) || LIGHT_KINDS.find((p) => p.type === o.type)
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

export default function ThreeDAnimEditor() {
  const { projectId } = useParams()
  const { threeDProjects, saveThreeDProject } = useProgress()
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
    sceneApiRef.current = api
    api.syncStructure(objectsRef.current, selectedIdRef.current)

    let rotating = false
    let lastX = 0
    let lastY = 0

    function handleClick(e) {
      const id = api.pickAt(e.clientX, e.clientY)
      if (id) applySelected(id)
    }
    function handlePointerDown(e) {
      const id = api.pickAt(e.clientX, e.clientY)
      if (id && id === selectedIdRef.current) {
        rotating = true
        lastX = e.clientX
        lastY = e.clientY
        api.setControlsEnabled(false)
        el.style.cursor = 'grabbing'
      }
    }
    function handlePointerMove(e) {
      if (!rotating) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      applyRotationDeltaRef.current(dx, dy, e.shiftKey)
    }
    function handlePointerUp() {
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
      sceneApiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function addObject(type) {
    const obj = makeAnimObject(type, nextId)
    const next = [...objectsRef.current, obj]
    applyObjects(next)
    applySelected(obj.id)
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
          🔄 Перетягни обраний об'єкт прямо у вʼюпорті, щоб обертати його (горизонтально — вісь Y, вертикально — вісь X, Shift — нахил по Z). Перетягування будь-де інде обертає камеру.
        </LabInfoTip>
      </div>

      <div className="tl-editor-shell">
        <div className="tl-editor-left">
          <ObjectsPanel objects={objects} selectedId={selectedId} selected={selected} onSelect={applySelected} onAdd={addObject} onDelete={deleteObject} onDuplicate={duplicateObject} onRename={renameSelected} />
        </div>

        <div className="tl-editor-center">
          <div ref={containerRef} className="tl-editor-viewport" />
          {selected && <p className="tl-rotate-hint">🔄 Перетягни «{selected.name || 'обраний об\'єкт'}» прямо тут, щоб обертати (Shift — нахил по Z)</p>}

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
            {tab === 'material' && <MaterialTab selected={selected} setMaterial={setMaterial} setLightProp={setLightProp} />}
            {tab === 'lighting' && <LightingTab lighting={lighting} setLighting={setLighting} />}
            {tab === 'camera' && <CameraTab cameraView={cameraView} fov={fov} onSetView={setCameraView} onSetFov={setFov} />}
            {tab === 'export' && (
              <ExportTab objects={objects} duration={duration} getScreenshot={() => sceneApiRef.current?.screenshot()} onRecordVideo={startRecording} recording={recording} onExportGltf={exportGltf} />
            )}
          </div>
        </div>
      </div>
      <LabToast message={toastApi.toast} />
    </div>
  )
}
