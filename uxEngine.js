// UX Design Studio: чисті функції для двох реальних редакторів —
// User Flow (вузли + з'єднання-ребра) і Wireframes (прямокутні
// елементи макета). Обидва навмисно простіші за GraphicDesignStudio.jsx
// (без векторних інструментів) і без keyframes/анімації (motionEngine.js)
// — тут важлива структура й логіка потоку, а не рух чи точна графіка.

// ---------- Wireframe-об'єкти ----------

export const WF_TYPES = [
  { key: 'heading', label: 'Заголовок' },
  { key: 'text', label: 'Текст' },
  { key: 'button', label: 'Кнопка' },
  { key: 'input', label: 'Поле введення' },
  { key: 'image', label: 'Зображення-заповнювач' },
  { key: 'card', label: 'Картка' },
  { key: 'container', label: 'Контейнер' },
  { key: 'nav', label: 'Навігація' },
  { key: 'list', label: 'Список' },
  { key: 'divider', label: 'Роздільник' },
]

export function defaultWfObject(type, p) {
  const base = { id: crypto.randomUUID(), type, x: p.x, y: p.y, w: 160, h: 44, text: '', align: 'left', radius: 4, hidden: false }
  switch (type) {
    case 'heading': return { ...base, w: 220, h: 32, text: 'Заголовок', align: 'left' }
    case 'text': return { ...base, w: 220, h: 48, text: 'Текстовий блок тут.' }
    case 'button': return { ...base, w: 140, h: 40, text: 'Кнопка', align: 'center', radius: 6 }
    case 'input': return { ...base, w: 220, h: 38, text: 'Плейсхолдер', radius: 4 }
    case 'image': return { ...base, w: 200, h: 130, text: 'IMG' }
    case 'card': return { ...base, w: 220, h: 140, text: 'Картка', radius: 8 }
    case 'container': return { ...base, w: 320, h: 200, text: '' }
    case 'nav': return { ...base, w: 320, h: 48, text: 'Головна · Каталог · Профіль' }
    case 'list': return { ...base, w: 240, h: 120, text: '' }
    case 'divider': return { ...base, w: 240, h: 2, text: '' }
    default: return base
  }
}

export function wfLabel(o) {
  const found = WF_TYPES.find((t) => t.key === o.type)
  return found ? found.label : o.type
}

// Намальовано свідомо у відтінках сірого (справжній wireframe — не
// дизайн з кольором), щоб практика Wireframes відповідала темі уроку
// («низька деталізація»), а не виглядала як готовий UI.
export function drawWfObject(ctx, o) {
  ctx.save()
  ctx.globalAlpha = o.hidden ? 0 : 1
  const ink = '#3A3A42'
  const line = '#9D9DA8'
  const fill = '#F5F5F7'
  ctx.lineWidth = 1.5
  switch (o.type) {
    case 'heading':
      ctx.fillStyle = ink
      ctx.font = '700 20px system-ui, sans-serif'
      ctx.textBaseline = 'middle'
      ctx.textAlign = o.align
      ctx.fillText(o.text, o.align === 'center' ? o.x + o.w / 2 : o.x, o.y + o.h / 2)
      break
    case 'text':
      ctx.fillStyle = '#5B5B66'
      ctx.font = '400 13px system-ui, sans-serif'
      ctx.textBaseline = 'top'
      wrapText(ctx, o.text, o.x, o.y, o.w, 16)
      break
    case 'button':
      ctx.fillStyle = ink
      roundRect(ctx, o.x, o.y, o.w, o.h, o.radius)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = '600 13px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(o.text, o.x + o.w / 2, o.y + o.h / 2)
      break
    case 'input':
      ctx.strokeStyle = line
      ctx.fillStyle = '#fff'
      roundRect(ctx, o.x, o.y, o.w, o.h, o.radius)
      ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#9D9DA8'
      ctx.font = '400 13px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(o.text, o.x + 10, o.y + o.h / 2)
      break
    case 'image':
      ctx.fillStyle = fill
      ctx.strokeStyle = line
      ctx.fillRect(o.x, o.y, o.w, o.h)
      ctx.strokeRect(o.x, o.y, o.w, o.h)
      ctx.beginPath()
      ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.w, o.y + o.h)
      ctx.moveTo(o.x + o.w, o.y); ctx.lineTo(o.x, o.y + o.h)
      ctx.stroke()
      ctx.fillStyle = line
      ctx.font = '600 12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(o.text || 'IMG', o.x + o.w / 2, o.y + o.h / 2)
      break
    case 'card':
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = line
      roundRect(ctx, o.x, o.y, o.w, o.h, o.radius)
      ctx.fill(); ctx.stroke()
      ctx.fillStyle = ink
      ctx.font = '600 13px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(o.text, o.x + 10, o.y + 10)
      break
    case 'container':
      ctx.strokeStyle = '#B9B9C2'
      ctx.setLineDash([6, 4])
      ctx.strokeRect(o.x, o.y, o.w, o.h)
      ctx.setLineDash([])
      break
    case 'nav':
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = line
      ctx.fillRect(o.x, o.y, o.w, o.h)
      ctx.strokeRect(o.x, o.y, o.w, o.h)
      ctx.fillStyle = ink
      ctx.font = '500 12.5px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(o.text, o.x + 12, o.y + o.h / 2)
      break
    case 'list': {
      ctx.strokeStyle = line
      ctx.strokeRect(o.x, o.y, o.w, o.h)
      const rows = Math.max(1, Math.floor(o.h / 32))
      for (let i = 1; i < rows; i++) {
        const yy = o.y + i * (o.h / rows)
        ctx.beginPath(); ctx.moveTo(o.x, yy); ctx.lineTo(o.x + o.w, yy); ctx.stroke()
      }
      break
    }
    case 'divider':
      ctx.strokeStyle = line
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.w, o.y); ctx.stroke()
      break
    default:
      break
  }
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = (text || '').split(' ')
  let line = ''
  let yy = y
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy)
      line = w
      yy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, yy)
}

export function wfHitTest(objects, p) {
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i]
    if (o.hidden) continue
    if (p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y && p.y <= o.y + o.h) return o
  }
  return null
}

const WF_HANDLE_SIZE = 8
export function wfHitHandle(o, p) {
  for (const h of wfHandlePositions(o)) {
    if (Math.abs(p.x - h.x) <= WF_HANDLE_SIZE && Math.abs(p.y - h.y) <= WF_HANDLE_SIZE) return h.key
  }
  return null
}
export function wfHandlePositions(o) {
  const { x, y, w, h } = o
  return [
    { key: 'nw', x, y }, { key: 'ne', x: x + w, y }, { key: 'sw', x, y: y + h }, { key: 'se', x: x + w, y: y + h },
  ]
}
export function wfDrawHandles(ctx, o) {
  ctx.save()
  ctx.strokeStyle = '#6B62FF'
  ctx.lineWidth = 1.5
  ctx.strokeRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2)
  for (const h of wfHandlePositions(o)) {
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(h.x, h.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }
  ctx.restore()
}
export function wfResize(o, handle, worldP) {
  const n = { ...o }
  if (handle === 'se') { n.w = Math.max(10, worldP.x - o.x); n.h = Math.max(10, worldP.y - o.y) }
  if (handle === 'ne') { n.w = Math.max(10, worldP.x - o.x); n.h = Math.max(10, o.y + o.h - worldP.y); n.y = o.y + o.h - n.h }
  if (handle === 'sw') { n.w = Math.max(10, o.x + o.w - worldP.x); n.x = o.x + o.w - n.w; n.h = Math.max(10, worldP.y - o.y) }
  if (handle === 'nw') { n.w = Math.max(10, o.x + o.w - worldP.x); n.x = o.x + o.w - n.w; n.h = Math.max(10, o.y + o.h - worldP.y); n.y = o.y + o.h - n.h }
  return n
}

// ---------- User Flow: вузли + ребра ----------

export const FLOW_TYPES = [
  { key: 'start', label: 'Початок', color: '#2BB673' },
  { key: 'action', label: 'Дія', color: '#6B62FF' },
  { key: 'decision', label: 'Рішення', color: '#E6A028' },
  { key: 'end', label: 'Завершення', color: '#2BB673' },
  { key: 'error', label: 'Помилка', color: '#E0373E' },
]

export function defaultFlowBlock(type, p) {
  const label = { start: 'Початок', action: 'Дія', decision: 'Рішення?', end: 'Завершено', error: 'Помилка' }[type] || 'Блок'
  return { id: crypto.randomUUID(), type, x: p.x, y: p.y, w: type === 'decision' ? 140 : 150, h: type === 'decision' ? 90 : 56, label }
}

export function flowHitTest(blocks, p) {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i]
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b
  }
  return null
}

export function drawFlowBlock(ctx, b, selected) {
  const meta = FLOW_TYPES.find((t) => t.key === b.type) || FLOW_TYPES[1]
  ctx.save()
  ctx.lineWidth = selected ? 2.5 : 1.5
  ctx.strokeStyle = meta.color
  ctx.fillStyle = '#fff'
  if (b.type === 'start' || b.type === 'end') {
    roundRect(ctx, b.x, b.y, b.w, b.h, b.h / 2)
    ctx.fill(); ctx.stroke()
  } else if (b.type === 'decision') {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2
    ctx.beginPath()
    ctx.moveTo(cx, b.y); ctx.lineTo(b.x + b.w, cy); ctx.lineTo(cx, b.y + b.h); ctx.lineTo(b.x, cy)
    ctx.closePath(); ctx.fill(); ctx.stroke()
  } else {
    roundRect(ctx, b.x, b.y, b.w, b.h, 8)
    ctx.fill(); ctx.stroke()
  }
  ctx.fillStyle = '#26262E'
  ctx.font = '600 12.5px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  wrapText(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 - 7, b.w - 16, 15)
  ctx.restore()
}

function edgeAnchor(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}

export function drawFlowEdge(ctx, from, to, label, selected) {
  const a = edgeAnchor(from), c = edgeAnchor(to)
  ctx.save()
  ctx.strokeStyle = selected ? '#6B62FF' : '#9D9DA8'
  ctx.fillStyle = ctx.strokeStyle
  ctx.lineWidth = selected ? 2.5 : 1.5
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(c.x, c.y)
  ctx.stroke()
  const angle = Math.atan2(c.y - a.y, c.x - a.x)
  const ah = 8
  const endX = c.x - Math.cos(angle) * (Math.min(to.w, to.h) / 2)
  const endY = c.y - Math.sin(angle) * (Math.min(to.w, to.h) / 2)
  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(endX - ah * Math.cos(angle - Math.PI / 6), endY - ah * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(endX - ah * Math.cos(angle + Math.PI / 6), endY - ah * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  if (label) {
    const mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2
    ctx.fillStyle = '#fff'
    ctx.fillRect(mx - 24, my - 9, 48, 18)
    ctx.fillStyle = '#5B5B66'
    ctx.font = '500 11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, mx, my)
  }
  ctx.restore()
}

// Структурна перевірка потоку (розділ 7 ТЗ: «є початкова точка», «є
// завершення», «основні блоки з'єднані», «немає непередбачених
// тупиків») — реальний аналіз графу, а не декоративна галочка.
export function validateFlow(blocks, edges) {
  const hasStart = blocks.some((b) => b.type === 'start')
  const hasEnd = blocks.some((b) => b.type === 'end')
  const outgoing = new Map()
  for (const b of blocks) outgoing.set(b.id, [])
  for (const e of edges) {
    if (outgoing.has(e.from)) outgoing.get(e.from).push(e.to)
  }
  const startBlocks = blocks.filter((b) => b.type === 'start')
  const reached = new Set()
  const stack = startBlocks.map((b) => b.id)
  while (stack.length) {
    const id = stack.pop()
    if (reached.has(id)) continue
    reached.add(id)
    for (const next of outgoing.get(id) || []) stack.push(next)
  }
  const unreachable = blocks.filter((b) => b.type !== 'start' && !reached.has(b.id))
  const deadEnds = blocks.filter((b) => b.type !== 'end' && (outgoing.get(b.id) || []).length === 0)
  return {
    hasStart,
    hasEnd,
    allConnected: unreachable.length === 0,
    unreachable,
    deadEnds: deadEnds.filter((b) => b.type !== 'start' || blocks.length > 1),
    isValid: hasStart && hasEnd && unreachable.length === 0 && deadEnds.length === 0,
  }
}
