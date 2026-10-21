import { useEffect, useRef, useState } from 'react'
import { versionRank } from '../practiceProject.js'

// Motion Studio (ТЗ 7.D) — v1: фігури/текст на композиції 500×500,
// кожна властивість (X/Y/масштаб/поворот/прозорість) анімується через
// ключові кадри — "◔ Додати ключ" знімає поточну позу обʼєкта в
// поточний момент часу, програвання лінійно інтерполює між сусідніми
// ключами.
//
// Реальна різниця версій (ТЗ розділ 4): ТЗ прямо називав «Ease In/
// Out/Bounce» нереалізованими в v1 — тепер вони реально рахуються в
// poseAt(), не просто додані в список підтримуваних назв. v2 (рівень
// 4+) відкриває вибір кривої прискорення (easing) для кожного
// ключового кадру: Лінійна/Ease In/Ease Out/Ease In-Out. v3 (рівень
// 8+) додатково відкриває Bounce (пружний відскок наприкінці руху).
//
// Свідомо спрощено: ОДИН ключовий кадр знімає ВСІ властивості разом
// (ТЗ хоче окремий тумблер ◔ на кожну властивість окремо — повний
// per-property keying додає суттєву складність стану заради рівня
// завдань, де цього не вимагається). Крива Безьє (довільна, не з
// фіксованого набору) з ТЗ так само не реалізована. Експорт — лише
// SVG поточного кадру (не WebM/GIF): повноцінний запис відео в
// браузері виходить за межі цього заходу.

const COMP = { w: 500, h: 500 }

// easing(f) приймає прогрес 0..1 і повертає скоригований прогрес —
// застосовується ДО лінійної інтерполяції значень, а не замість неї.
const EASINGS = {
  linear: (f) => f,
  easeIn: (f) => f * f,
  easeOut: (f) => 1 - (1 - f) * (1 - f),
  easeInOut: (f) => (f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2),
  bounce: (f) => {
    const n1 = 7.5625, d1 = 2.75
    if (f < 1 / d1) return n1 * f * f
    if (f < 2 / d1) return n1 * (f -= 1.5 / d1) * f + 0.75
    if (f < 2.5 / d1) return n1 * (f -= 2.25 / d1) * f + 0.9375
    return n1 * (f -= 2.625 / d1) * f + 0.984375
  },
}
const EASING_LABELS = { linear: 'Лінійна', easeIn: 'Ease In', easeOut: 'Ease Out', easeInOut: 'Ease In-Out', bounce: 'Bounce' }

function uid() { return crypto.randomUUID() }

function makeObject(type, x, y) {
  const base = { id: uid(), type, x, y, opacity: 1, scale: 1, rotation: 0, keyframes: [] }
  if (type === 'rect') return { ...base, w: 100, h: 70, fill: '#2E6DFF' }
  if (type === 'ellipse') return { ...base, w: 90, h: 90, fill: '#F59E0B' }
  return { ...base, w: 160, h: 30, text: 'Текст', fontFamily: 'Arial', fontSize: 28, fill: '#17171A' }
}

function poseAt(obj, t) {
  // Активна чернетка (щойно відредагована позиція/властивість у момент,
  // де немає точного ключа) переважає над будь-якою інтерполяцією —
  // доки студент її не захопить «Додати ключ» чи не змінить час.
  if (obj.draftPose) return { x: obj.draftPose.x, y: obj.draftPose.y, opacity: obj.draftPose.opacity, scale: obj.draftPose.scale, rotation: obj.draftPose.rotation }
  const kfs = obj.keyframes || []
  const base = { x: obj.x, y: obj.y, opacity: obj.opacity, scale: obj.scale, rotation: obj.rotation }
  if (kfs.length === 0) return base
  const sorted = [...kfs].sort((a, b) => a.time - b.time)
  // Повертає лише саму позу (x/y/opacity/scale/rotation) — НЕ ключовий
  // кадр як є: той несе ще й власні id/time, які інакше просочуються у
  // addKeyframe() через {id: uid(), time, ...pose} (властивості ...pose
  // йдуть ПІСЛЯ в літералі й перезаписують щойно згенеровані id/time
  // чужими значеннями зі старого ключа — саме так новий ключ міг
  // непомітно вкрасти id і час уже наявного).
  const pick = (k) => ({ x: k.x, y: k.y, opacity: k.opacity, scale: k.scale, rotation: k.rotation })
  if (t <= sorted[0].time) return pick(sorted[0])
  if (t >= sorted[sorted.length - 1].time) return pick(sorted[sorted.length - 1])
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1]
    if (t >= a.time && t <= b.time) {
      const span = b.time - a.time || 1
      const linearF = (t - a.time) / span
      // Крива прискорення сегмента визначається СТАРТОВИМ ключем (a) —
      // типова конвенція таймлайнів анімації.
      const ease = EASINGS[a.easing] || EASINGS.linear
      const f = ease(linearF)
      const lerp = (k) => a[k] + (b[k] - a[k]) * f
      return { x: lerp('x'), y: lerp('y'), opacity: lerp('opacity'), scale: lerp('scale'), rotation: lerp('rotation') }
    }
  }
  return sorted[sorted.length - 1]
}

export default function MotionStudio({ project, version, onChange }) {
  const vRank = versionRank(version || 'v1')
  const [tool, setTool] = useState('select')
  const [selectedId, setSelectedId] = useState(null)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [bottomTab, setBottomTab] = useState('timeline')
  const svgRef = useRef(null)
  const dragRef = useRef(null)
  const rafRef = useRef(null)
  const lastTsRef = useRef(null)

  const objects = project.objects || []
  const duration = project.duration || 5
  const selected = objects.find((o) => o.id === selectedId) || null

  useEffect(() => {
    if (!playing) return
    function tick(ts) {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts
      setTime((t) => {
        const next = t + dt
        if (next >= duration) { setPlaying(false); return duration }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current); lastTsRef.current = null }
  }, [playing, duration])

  function patchObjects(next) { onChange({ ...project, objects: next }) }

  function pos(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const scale = COMP.w / rect.width
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale }
  }

  function canvasClick(e) {
    if (tool === 'select') { setSelectedId(null); return }
    const p = pos(e)
    const obj = makeObject(tool, p.x - 45, p.y - 30)
    patchObjects([...objects, obj])
    setSelectedId(obj.id)
    setTool('select')
  }

  function onShapeDown(e, id) {
    // Клік інструментом малювання (rect/ellipse/text) по вже існуючій
    // фігурі не повинен просто вибирати її — пропускаємо подію далі до
    // canvasClick, щоб нова фігура дійсно зʼявилась там, де клікнули
    // (той самий клас бага, що й у VectorStudio/FlowStudio).
    if (['rect', 'ellipse', 'text'].includes(tool)) return
    e.stopPropagation()
    setSelectedId(id)
    if (tool !== 'select') return
    const obj = objects.find((o) => o.id === id)
    const pose = poseAt(obj, time)
    const rect = svgRef.current.getBoundingClientRect()
    const scale = COMP.w / rect.width
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, ox: pose.x, oy: pose.y, scale }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  function onMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) * d.scale
    const dy = (e.clientY - d.startY) * d.scale
    setLivePose(d.id, { x: Math.round(d.ox + dx), y: Math.round(d.oy + dy) })
  }
  function onUp() {
    dragRef.current = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  // Редагування властивості: якщо на поточному часі вже є ключ — оновлює
  // ЙОГО напряму. Інакше — зберігає чернетку (draftPose), яку poseAt()
  // показує НА МІСЦІ звичайної інтерпольованої/крайової пози, доки її не
  // захопить кнопка «Додати ключ» або не скине зміна часу. Раніше тут
  // писалось просто в o.x/o.y/... («базову» позу) — але щойно в обʼєкта
  // зʼявлявся хоча б ОДИН ключ, poseAt() більше ніколи не читав ці поля
  // (лише keyframes), тож така правка ставала візуально невидимою:
  // перетягнути чи ввести нову позицію для другого кадру в будь-який
  // момент, що не збігається день-у-день з часом наявного ключа, не мало
  // жодного ефекту на екрані, і «Додати ключ» захоплював стару
  // (незмінену) позу — другий кадр з іншою позою неможливо було
  // створити звичайним шляхом через UI.
  function setLivePose(id, patch) {
    patchObjects(objects.map((o) => {
      if (o.id !== id) return o
      const kfs = o.keyframes || []
      const idx = kfs.findIndex((k) => Math.abs(k.time - time) < 0.01)
      if (idx >= 0) {
        const nextKfs = kfs.map((k, i) => (i === idx ? { ...k, ...patch } : k))
        return { ...o, keyframes: nextKfs, draftPose: undefined }
      }
      return { ...o, draftPose: { ...poseAt(o, time), ...patch } }
    }))
  }
  // Скидає чернетки поз усіх обʼєктів — викликається щоразу, як студент
  // перемикає час (повзунком таймлайна), бо чернетка стосується лише
  // того моменту, де її редагували, і втрачає сенс деінде.
  function setTimeAndClearDrafts(t) {
    setTime(t)
    if (objects.some((o) => o.draftPose)) {
      patchObjects(objects.map((o) => (o.draftPose ? { ...o, draftPose: undefined } : o)))
    }
  }

  function addKeyframe() {
    if (!selected) return
    const pose = poseAt(selected, time)
    const kfs = [...(selected.keyframes || [])]
    const idx = kfs.findIndex((k) => Math.abs(k.time - time) < 0.01)
    const prevEasing = idx >= 0 ? kfs[idx].easing : 'linear'
    const entry = { id: uid(), time: Math.round(time * 100) / 100, ...pose, easing: prevEasing }
    if (idx >= 0) kfs[idx] = entry
    else kfs.push(entry)
    patchObjects(objects.map((o) => (o.id === selectedId ? { ...o, keyframes: kfs, draftPose: undefined } : o)))
  }
  function setKeyframeEasing(easing) {
    if (!selected) return
    const kfs = (selected.keyframes || []).map((k) => (Math.abs(k.time - time) < 0.01 ? { ...k, easing } : k))
    patchObjects(objects.map((o) => (o.id === selectedId ? { ...o, keyframes: kfs } : o)))
  }
  function removeKeyframe(objId, kfTime) {
    patchObjects(objects.map((o) => (o.id === objId ? { ...o, keyframes: (o.keyframes || []).filter((k) => k.time !== kfTime) } : o)))
  }
  function deleteSelected() {
    if (!selectedId) return
    patchObjects(objects.filter((o) => o.id !== selectedId))
    setSelectedId(null)
  }

  return (
    <>
      <div className="practice-toolbar">
        <button className={'practice-tool-btn' + (tool === 'select' ? ' active' : '')} title="Вибір (V)" onClick={() => setTool('select')} aria-label="Вибір">↖</button>
        <button className={'practice-tool-btn' + (tool === 'rect' ? ' active' : '')} title="Прямокутник (R)" onClick={() => setTool('rect')} aria-label="Прямокутник">▭</button>
        <button className={'practice-tool-btn' + (tool === 'ellipse' ? ' active' : '')} title="Еліпс (E)" onClick={() => setTool('ellipse')} aria-label="Еліпс">◯</button>
        <button className={'practice-tool-btn' + (tool === 'text' ? ' active' : '')} title="Текст (T)" onClick={() => setTool('text')} aria-label="Текст">T</button>
        <div className="practice-tool-sep" />
        <button className="practice-tool-btn" title="Видалити" onClick={deleteSelected} aria-label="Видалити">🗑</button>
      </div>

      <div className="practice-canvas">
        <svg ref={svgRef} viewBox={`0 0 ${COMP.w} ${COMP.h}`} className="vector-studio-svg" onPointerDown={canvasClick}>
          <rect x={0} y={0} width={COMP.w} height={COMP.h} fill="#ffffff" />
          {objects.map((o) => {
            const pose = poseAt(o, time)
            const cx = pose.x + o.w / 2, cy = pose.y + o.h / 2
            const transform = `translate(${cx} ${cy}) rotate(${pose.rotation}) scale(${pose.scale}) translate(${-cx} ${-cy})`
            const common = { opacity: pose.opacity, transform, onPointerDown: (e) => onShapeDown(e, o.id), style: { cursor: 'move' } }
            let node = null
            if (o.type === 'rect') node = <rect x={pose.x} y={pose.y} width={o.w} height={o.h} fill={o.fill} {...common} />
            else if (o.type === 'ellipse') node = <ellipse cx={cx} cy={cy} rx={o.w / 2} ry={o.h / 2} fill={o.fill} {...common} />
            else node = <text x={pose.x} y={pose.y + o.fontSize} fontFamily={o.fontFamily} fontSize={o.fontSize} fill={o.fill} {...common}>{o.text}</text>
            return (
              <g key={o.id}>
                {node}
                {o.id === selectedId && <rect x={pose.x - 3} y={pose.y - 3} width={o.w + 6} height={o.h + 6} fill="none" stroke="#F59E0B" strokeDasharray="4 3" pointerEvents="none" />}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="practice-properties">
        <p className="cl-section-title">Властивості</p>
        {!selected && <p className="cl-tab-desc">Обери обʼєкт на полотні.</p>}
        {selected && (() => {
          const pose = poseAt(selected, time)
          const kfAtTime = (selected.keyframes || []).find((k) => Math.abs(k.time - time) < 0.01)
          const easingOptions = vRank >= 2 ? Object.keys(EASINGS) : ['linear', 'easeIn', 'easeOut', 'easeInOut']
          return (
            <>
              {selected.type === 'text' && (
                <label className="gfx-field">Текст
                  <input className="cl-text-input" value={selected.text} onChange={(e) => patchObjects(objects.map((o) => (o.id === selectedId ? { ...o, text: e.target.value } : o)))} />
                </label>
              )}
              <div className="gfx-row">
                <label className="gfx-num">X<input type="number" value={Math.round(pose.x)} onChange={(e) => setLivePose(selectedId, { x: Number(e.target.value) })} /></label>
                <label className="gfx-num">Y<input type="number" value={Math.round(pose.y)} onChange={(e) => setLivePose(selectedId, { y: Number(e.target.value) })} /></label>
              </div>
              <label className="gfx-field">Масштаб: {pose.scale.toFixed(2)}
                <input type="range" min="0.1" max="3" step="0.05" value={pose.scale} onChange={(e) => setLivePose(selectedId, { scale: Number(e.target.value) })} />
              </label>
              <label className="gfx-field">Поворот: {Math.round(pose.rotation)}°
                <input type="range" min="-180" max="180" value={pose.rotation} onChange={(e) => setLivePose(selectedId, { rotation: Number(e.target.value) })} />
              </label>
              <label className="gfx-field">Прозорість: {Math.round(pose.opacity * 100)}%
                <input type="range" min="0" max="1" step="0.05" value={pose.opacity} onChange={(e) => setLivePose(selectedId, { opacity: Number(e.target.value) })} />
              </label>
              <label className="gfx-field">Колір
                <input type="color" value={selected.fill} onChange={(e) => patchObjects(objects.map((o) => (o.id === selectedId ? { ...o, fill: e.target.value } : o)))} />
              </label>
              <button className="harmony-btn" style={{ marginTop: 6 }} onClick={addKeyframe}>◔ Додати ключ на {time.toFixed(2)}с</button>
              {vRank >= 1 && kfAtTime && (
                <label className="gfx-field" style={{ marginTop: 6 }}>Крива прискорення (з цього ключа)
                  <select className="cl-text-input" value={kfAtTime.easing || 'linear'} onChange={(e) => setKeyframeEasing(e.target.value)}>
                    {easingOptions.map((k) => <option key={k} value={k}>{EASING_LABELS[k]}</option>)}
                  </select>
                </label>
              )}
            </>
          )
        })()}
      </div>

      <div className="practice-bottom">
        <div className="practice-bottom-tabs">
          <button className={bottomTab === 'timeline' ? 'active' : ''} onClick={() => setBottomTab('timeline')}>Таймлайн</button>
          <button className={bottomTab === 'export' ? 'active' : ''} onClick={() => setBottomTab('export')}>Експорт</button>
        </div>
        {bottomTab === 'timeline' && (
          <div className="practice-layers">
            <div className="cl-btn-row" style={{ alignItems: 'center' }}>
              <button className="cl-mini-btn" onClick={() => setPlaying((p) => !p)}>{playing ? '⏸' : '▶'}</button>
              <input type="range" min="0" max={duration} step="0.01" value={time} onChange={(e) => { setPlaying(false); setTimeAndClearDrafts(Number(e.target.value)) }} style={{ flex: 1 }} />
              <span className="cl-tab-desc">{time.toFixed(2)}с / {duration}с</span>
            </div>
            {objects.map((o) => (
              <div key={o.id} className={'motion-track' + (o.id === selectedId ? ' active' : '')} onClick={() => setSelectedId(o.id)}>
                <span className="motion-track-label">{o.type === 'text' ? o.text : o.type}</span>
                <span className="motion-track-lane">
                  {(o.keyframes || []).map((k) => (
                    <button key={k.id} className="motion-kf-dot" style={{ left: `${(k.time / duration) * 100}%` }} title={`${k.time}с`} onClick={(e) => { e.stopPropagation(); removeKeyframe(o.id, k.time) }} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}
        {bottomTab === 'export' && (
          <div className="practice-layers">
            <p className="cl-tab-desc">Рендер поточного кадру в SVG (повноцінний відео-експорт — за межами цього заходу).</p>
            <button className="harmony-btn" onClick={() => {
              const svgEl = svgRef.current
              const str = new XMLSerializer().serializeToString(svgEl)
              const blob = new Blob([str], { type: 'image/svg+xml' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'frame.svg'; a.click()
              setTimeout(() => URL.revokeObjectURL(url), 2000)
              onChange({ ...project, exportedFormats: [...new Set([...(project.exportedFormats || []), 'svg'])] })
            }}>⬇ Кадр SVG</button>
          </div>
        )}
      </div>
    </>
  )
}
