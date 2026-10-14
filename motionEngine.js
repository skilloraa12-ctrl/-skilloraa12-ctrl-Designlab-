// Motion Design Studio: чисті функції для об'єктної моделі сцени,
// хіт-тестів/маніпуляції (той самий патерн, що й GraphicDesignStudio.jsx
// — <canvas> + ручний redraw, а не DOM-елементи), і — головне нове —
// інтерполяції значень властивостей за ключовими кадрами в часі.
// Жодного дублювання з GraphicDesignStudio: об'єктна модель тут
// навмисно простіша (rect/ellipse/text — без векторних інструментів,
// булевих операцій тощо), бо мета Motion Studio — рух і час, а не
// точне векторне редагування (для нього курс явно направляє в
// Graphic Design Studio, модуль 6 цього курсу).

export const EASINGS = [
  { key: 'linear', label: 'Linear' },
  { key: 'easeIn', label: 'Ease In' },
  { key: 'easeOut', label: 'Ease Out' },
  { key: 'easeInOut', label: 'Ease In-Out' },
  { key: 'spring', label: 'Spring (overshoot)' },
]

// Стандартні аналітичні easing-функції (0..1 -> 0..1) — той самий
// набір імен, що й EASING_PRESETS у labs/motionBuilder.js (Motion Lab),
// для термінологічної узгодженості курсу, але тут обчислюються напряму
// (без cubic-bezier-солвера), бо потрібне швидке обчислення щокадру.
export function ease(t, kind) {
  const c = Math.min(1, Math.max(0, t))
  switch (kind) {
    case 'easeIn': return c * c
    case 'easeOut': return 1 - (1 - c) * (1 - c)
    case 'easeInOut': return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2
    case 'spring': {
      // легкий overshoot-і-заспокоєння — узгоджено з принципом Exaggeration (модуль 2)
      const s = 1.70158
      return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2)
    }
    case 'linear':
    default: return c
  }
}

// Тінь і обведення — реальні, по-справжньому відрендерені ефекти
// (canvas 2D shadowBlur/shadowOffset та stroke), а не декоративний
// опис-заглушка: те, що обрано тут, видно і на канвасі, і в SVG-експорті.
export function defaultShadow() {
  return { enabled: false, color: '#000000', blur: 12, offsetX: 4, offsetY: 4 }
}
export function defaultStroke() {
  return { enabled: false, color: '#ffffff', width: 2 }
}

export function defaultObject(type, p) {
  const base = {
    id: crypto.randomUUID(), type, x: p.x, y: p.y, w: 160, h: 90, rotation: 0, opacity: 1, fill: '#6B62FF',
    // hidden — реальне приховування шару: не малюється й не бере участі
    // в клік-виділенні (моушн-студія навмисно спрощена: це порядок
    // шарів + видимість, а не повноцінні групи з вкладеними
    // трансформаціями чи клипінг-маски — цього вона чесно не підтримує).
    hidden: false,
    shadow: defaultShadow(), stroke: defaultStroke(), keyframes: {},
  }
  if (type === 'ellipse') return { ...base, w: 120, h: 120 }
  if (type === 'text') return { ...base, w: 220, h: 50, text: 'Текст', fontSize: 28, fill: '#F4F4F6' }
  return base // rect
}

export function layerLabel(o) {
  if (o.type === 'text') return `“${o.text}”`
  if (o.type === 'ellipse') return 'Еліпс'
  return 'Прямокутник'
}

// Властивості, які можна анімувати ключовими кадрами.
export const ANIMATABLE_PROPS = ['x', 'y', 'w', 'h', 'rotation', 'opacity']

// Значення властивості об'єкта в момент часу t (мс): якщо для неї немає
// жодного keyframe — повертає базове (статичне) значення; якщо є один —
// повертає його; якщо кілька — лінійно/криво інтерполює між сусідніми
// за easing цільового (другого) keyframe, той самий принцип Slow In/Out
// (модуль 3), застосований реально в часі, а не лише в теорії уроку.
export function valueAt(obj, prop, t) {
  const kfs = obj.keyframes[prop]
  if (!kfs || kfs.length === 0) return obj[prop]
  const sorted = [...kfs].sort((a, b) => a.t - b.t)
  if (t <= sorted[0].t) return sorted[0].v
  const last = sorted[sorted.length - 1]
  if (t >= last.t) return last.v
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1]
    if (t >= a.t && t <= b.t) {
      const localT = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t)
      const k = ease(localT, b.easing || 'linear')
      return a.v + (b.v - a.v) * k
    }
  }
  return last.v
}

// Повний «кадр» об'єкта в момент часу t — сукупність усіх властивостей,
// готова для безпосереднього малювання на канвасі.
export function objectAt(obj, t) {
  const frame = { ...obj }
  for (const prop of ANIMATABLE_PROPS) frame[prop] = valueAt(obj, prop, t)
  return frame
}

export function upsertKeyframe(obj, prop, t, v, easing = 'easeOut') {
  const existing = obj.keyframes[prop] || []
  const idx = existing.findIndex((k) => Math.abs(k.t - t) < 16) // той самий кадр (~1 фрейм при 60fps)
  const next = idx >= 0
    ? existing.map((k, i) => (i === idx ? { ...k, v, easing } : k))
    : [...existing, { id: crypto.randomUUID(), t, v, easing }]
  return { ...obj, keyframes: { ...obj.keyframes, [prop]: next } }
}

export function removeKeyframe(obj, prop, keyframeId) {
  const existing = obj.keyframes[prop] || []
  return { ...obj, keyframes: { ...obj.keyframes, [prop]: existing.filter((k) => k.id !== keyframeId) } }
}

export function bboxOf(o) {
  return { x: o.x, y: o.y, w: o.w, h: o.h }
}

export function hitTest(objects, p) {
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i]
    if (p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y && p.y <= o.y + o.h) return o
  }
  return null
}

const HANDLE_SIZE = 9
export function hitHandle(o, p) {
  const handles = handlePositions(o)
  for (const h of handles) {
    if (Math.abs(p.x - h.x) <= HANDLE_SIZE && Math.abs(p.y - h.y) <= HANDLE_SIZE) return h.key
  }
  return null
}

export function handlePositions(o) {
  const { x, y, w, h } = o
  return [
    { key: 'nw', x, y }, { key: 'ne', x: x + w, y }, { key: 'sw', x, y: y + h }, { key: 'se', x: x + w, y: y + h },
    { key: 'rotate', x: x + w / 2, y: y - 24 },
  ]
}

export function drawObject(ctx, o) {
  ctx.save()
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2
  ctx.translate(cx, cy)
  ctx.rotate((o.rotation * Math.PI) / 180)
  ctx.translate(-cx, -cy)
  ctx.globalAlpha = Math.max(0, Math.min(1, o.opacity))
  ctx.fillStyle = o.fill
  if (o.shadow?.enabled) {
    ctx.shadowColor = o.shadow.color
    ctx.shadowBlur = o.shadow.blur
    ctx.shadowOffsetX = o.shadow.offsetX
    ctx.shadowOffsetY = o.shadow.offsetY
  }
  if (o.type === 'ellipse') {
    ctx.beginPath()
    ctx.ellipse(cx, cy, o.w / 2, o.h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    if (o.stroke?.enabled) { ctx.strokeStyle = o.stroke.color; ctx.lineWidth = o.stroke.width; ctx.stroke() }
  } else if (o.type === 'text') {
    ctx.font = `600 ${o.fontSize || 28}px system-ui, sans-serif`
    ctx.textBaseline = 'middle'
    ctx.fillText(o.text || '', o.x, cy)
    if (o.stroke?.enabled) { ctx.strokeStyle = o.stroke.color; ctx.lineWidth = o.stroke.width; ctx.strokeText(o.text || '', o.x, cy) }
  } else {
    ctx.fillRect(o.x, o.y, o.w, o.h)
    if (o.stroke?.enabled) { ctx.strokeStyle = o.stroke.color; ctx.lineWidth = o.stroke.width; ctx.strokeRect(o.x, o.y, o.w, o.h) }
  }
  ctx.restore()
}

export function drawHandles(ctx, o) {
  ctx.save()
  ctx.strokeStyle = '#8B7CFF'
  ctx.lineWidth = 1.5
  ctx.strokeRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2)
  ctx.beginPath()
  ctx.moveTo(o.x + o.w / 2, o.y)
  ctx.lineTo(o.x + o.w / 2, o.y - 24)
  ctx.stroke()
  for (const h of handlePositions(o)) {
    ctx.fillStyle = h.key === 'rotate' ? '#8B7CFF' : '#ffffff'
    ctx.beginPath()
    ctx.arc(h.x, h.y, h.key === 'rotate' ? 6 : 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

export function resizeObj(o, handle, worldP) {
  const n = { ...o }
  if (handle === 'se') { n.w = Math.max(10, worldP.x - o.x); n.h = Math.max(10, worldP.y - o.y) }
  if (handle === 'ne') { n.w = Math.max(10, worldP.x - o.x); n.h = Math.max(10, o.y + o.h - worldP.y); n.y = o.y + o.h - n.h }
  if (handle === 'sw') { n.w = Math.max(10, o.x + o.w - worldP.x); n.x = o.x + o.w - n.w; n.h = Math.max(10, worldP.y - o.y) }
  if (handle === 'nw') { n.w = Math.max(10, o.x + o.w - worldP.x); n.x = o.x + o.w - n.w; n.h = Math.max(10, o.y + o.h - worldP.y); n.y = o.y + o.h - n.h }
  return n
}

export function rotateObj(o, worldP) {
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2
  const deg = (Math.atan2(worldP.y - cy, worldP.x - cx) * 180) / Math.PI + 90
  return { ...o, rotation: Math.round(deg) }
}

// Загальна тривалість сцени, потрібна для keyframe, якщо він стоїть
// пізніше за поточне значення project.duration — використовується, щоб
// таймлайн ніколи не "обрізав" уже створені ключові кадри.
export function maxKeyframeTime(objects) {
  let max = 0
  for (const o of objects) {
    for (const prop of ANIMATABLE_PROPS) {
      for (const k of o.keyframes[prop] || []) max = Math.max(max, k.t)
    }
  }
  return max
}
