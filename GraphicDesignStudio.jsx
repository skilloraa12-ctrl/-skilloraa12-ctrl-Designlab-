import { useEffect, useRef, useState } from 'react'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import { useLabHistory } from './labs/useLabHistory.js'
import LabToast from './labs/LabToast.jsx'

// Практичний графічний редактор для напрямку Graphic Design — єдиний
// робочий простір (не покроковий майстер), бо реальна робота дизайнера
// графіки — це вільне компонування об'єктів на полотні, а не лінійна
// послідовність кроків. Той самий об'єктний підхід, що й SketchPad.jsx
// (вибір/рух/resize), але з уніфікованою моделлю об'єктів, поворотом,
// контекстною панеллю властивостей і панеллю шарів із перейменуванням/
// блокуванням/дублюванням — як того вимагає ТЗ для цього напрямку.

const TOOLS = [
  { id: 'select', icon: '🖱️', label: 'Об’єкти' },
  { id: 'rect', icon: '▭', label: 'Прямокутник' },
  { id: 'ellipse', icon: '⬭', label: 'Еліпс' },
  { id: 'line', icon: '➖', label: 'Лінія' },
  { id: 'text', icon: '🅰', label: 'Текст' },
  { id: 'image', icon: '🖼️', label: 'Зображення' },
  { id: 'icon', icon: '⭐', label: 'Іконки' },
  { id: 'draw', icon: '🖌️', label: 'Пензель' },
]

// Невелика бібліотека готових векторних іконок — кожна як багатокутник
// у нормалізованому полі 0..100, масштабований під o.w/o.h об'єкта. Той
// самий принцип "ілюстрація простими формами", що й у модулі 10 курсу
// (вектор): прості фігури замість довільних кривих Безьє.
function regularPolygon(cx, cy, r, sides, rotationDeg = -90) {
  const pts = []
  for (let i = 0; i < sides; i++) {
    const a = ((rotationDeg + (360 / sides) * i) * Math.PI) / 180
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}
function starPoints(cx, cy, outerR, innerR, spikes) {
  const pts = []
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = ((-90 + (360 / (spikes * 2)) * i) * Math.PI) / 180
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}
function heartPoints() {
  const pts = []
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    pts.push([50 + x * 2.6, 50 + y * 2.6])
  }
  return pts
}
const ICONS = {
  star: starPoints(50, 50, 46, 19, 5),
  heart: heartPoints(),
  arrow: [[10, 35], [55, 35], [55, 15], [92, 50], [55, 85], [55, 65], [10, 65]],
  check: [[14, 55], [36, 76], [86, 14], [96, 24], [38, 92], [4, 64]],
  plus: [[40, 8], [60, 8], [60, 40], [92, 40], [92, 60], [60, 60], [60, 92], [40, 92], [40, 60], [8, 60], [8, 40], [40, 40]],
  bolt: [[55, 4], [18, 56], [45, 56], [34, 96], [84, 40], [52, 40]],
  bubble: [[8, 10], [92, 10], [92, 66], [46, 66], [30, 92], [34, 66], [8, 66]],
  circle: regularPolygon(50, 50, 46, 28),
}
const ICON_LIST = [
  { id: 'star', label: 'Зірка' },
  { id: 'heart', label: 'Серце' },
  { id: 'arrow', label: 'Стрілка' },
  { id: 'check', label: 'Галочка' },
  { id: 'plus', label: 'Плюс' },
  { id: 'bolt', label: 'Блискавка' },
  { id: 'bubble', label: 'Бульбашка' },
  { id: 'circle', label: 'Коло' },
]

const CANVAS_PRESETS = [
  { id: 'square', label: 'Пост у соцмережі · 1080×1080', w: 1080, h: 1080 },
  { id: 'story', label: 'Сторіз · 1080×1920', w: 1080, h: 1920 },
  { id: 'banner', label: 'Банер · 1200×630', w: 1200, h: 630 },
  { id: 'poster', label: 'Постер A4 · 595×842', w: 595, h: 842 },
  { id: 'landscape', label: 'Горизонтальний · 1600×900', w: 1600, h: 900 },
]

const FONT_FAMILIES = [
  { css: 'Inter, Arial, sans-serif', label: 'Sans (сучасний)' },
  { css: 'Georgia, "Times New Roman", serif', label: 'Serif (класичний)' },
  { css: '"Courier New", monospace', label: 'Monospace (технічний)' },
  { css: 'Impact, "Arial Black", sans-serif', label: 'Display (акцентний)' },
]

const FILL_SWATCHES = ['#17171A', '#3E37E0', '#E0523E', '#C8912B', '#2FA36B', '#FFFFFF', 'none']
const BG_SWATCHES = ['#FFFFFF', '#F5F1E8', '#17171A', '#ECEAE3', '#EAF3EC']
const QUICK_PALETTE = ['#17171A', '#3E37E0', '#6B62FF', '#E0523E', '#C8912B', '#2FA36B', '#3B82D6', '#FFFFFF']
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2]

let nextId = 1
const uid = () => `o${nextId++}`

function defaultObject(type, p) {
  const base = { id: uid(), type, visible: true, locked: false, opacity: 1, rotation: 0 }
  if (type === 'rect') return { ...base, name: 'Прямокутник', x: p.x, y: p.y, w: 1, h: 1, fill: '#3E37E0', stroke: 'none', strokeWidth: 2, radius: 0, shadow: false, shadowColor: '#17171A', shadowBlur: 16 }
  if (type === 'ellipse') return { ...base, name: 'Еліпс', x: p.x, y: p.y, w: 1, h: 1, fill: '#E0523E', stroke: 'none', strokeWidth: 2, shadow: false, shadowColor: '#17171A', shadowBlur: 16 }
  if (type === 'line') return { ...base, name: 'Лінія', x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: '#17171A', strokeWidth: 4 }
  if (type === 'text') return { ...base, name: 'Текст', x: p.x, y: p.y, w: 240, h: 60, text: 'Новий текст', fontFamily: FONT_FAMILIES[0].css, fontSize: 28, fontWeight: 400, color: '#17171A', align: 'left', lineHeight: 1.25, letterSpacing: 0 }
  if (type === 'image') return { ...base, name: 'Зображення', x: p.x, y: p.y, w: 240, h: 240, src: null, shadow: false, shadowColor: '#17171A', shadowBlur: 16 }
  if (type === 'icon') return { ...base, name: 'Іконка', x: p.x, y: p.y, w: 80, h: 80, iconId: 'star', fill: '#3E37E0', shadow: false, shadowColor: '#17171A', shadowBlur: 16 }
  return base
}

function bboxOf(o) {
  if (o.type === 'line') return { x: Math.min(o.x1, o.x2), y: Math.min(o.y1, o.y2), w: Math.abs(o.x2 - o.x1), h: Math.abs(o.y2 - o.y1) }
  if (o.type === 'path') {
    const xs = o.points.map((p) => p.x), ys = o.points.map((p) => p.y)
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
  }
  return { x: o.x, y: o.y, w: o.w, h: o.h }
}

function toLocal(o, p) {
  if (o.type === 'line' || !o.rotation) return p
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2
  const rad = -(o.rotation * Math.PI) / 180
  const dx = p.x - cx, dy = p.y - cy
  return { x: dx * Math.cos(rad) - dy * Math.sin(rad) + cx, y: dx * Math.sin(rad) + dy * Math.cos(rad) + cy }
}

function rotatePoint(cx, cy, x, y, deg) {
  const rad = (deg * Math.PI) / 180
  const dx = x - cx, dy = y - cy
  return { x: cx + dx * Math.cos(rad) - dy * Math.sin(rad), y: cy + dx * Math.sin(rad) + dy * Math.cos(rad) }
}

function hitTest(objects, p) {
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i]
    if (o.visible === false || o.locked) continue
    if (o.type === 'line' || o.type === 'path') {
      const pts = o.type === 'line' ? [{ x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }] : o.points
      let hit = false
      for (let s = 0; s < pts.length - 1; s++) {
        const a = pts[s], b = pts[s + 1]
        const dx = b.x - a.x, dy = b.y - a.y
        const lenSq = dx * dx + dy * dy
        let t = lenSq === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
        t = Math.max(0, Math.min(1, t))
        const d = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
        if (d <= Math.max(o.strokeWidth, 8)) { hit = true; break }
      }
      if (hit) return o
      continue
    }
    const lp = toLocal(o, p)
    if (o.type === 'ellipse') {
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2
      const rx = o.w / 2, ry = o.h / 2
      if (rx === 0 || ry === 0) continue
      const ddx = (lp.x - cx) / rx, ddy = (lp.y - cy) / ry
      if (ddx * ddx + ddy * ddy <= 1) return o
      continue
    }
    if (lp.x >= o.x && lp.x <= o.x + o.w && lp.y >= o.y && lp.y <= o.y + o.h) return o
  }
  return null
}

function wrapLines(ctx, text, maxW) {
  const out = []
  String(text).split('\n').forEach((para) => {
    const words = para.split(' ')
    let line = ''
    words.forEach((w) => {
      const test = line ? line + ' ' + w : w
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w }
      else line = test
    })
    out.push(line)
  })
  return out
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawObject(ctx, o, imageCache) {
  if (o.visible === false) return
  ctx.save()
  ctx.globalAlpha = o.opacity ?? 1
  if (o.type === 'line') {
    ctx.strokeStyle = o.color
    ctx.lineWidth = o.strokeWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(o.x1, o.y1)
    ctx.lineTo(o.x2, o.y2)
    ctx.stroke()
    ctx.restore()
    return
  }
  if (o.type === 'path') {
    if (!o.points || o.points.length < 2) { ctx.restore(); return }
    ctx.strokeStyle = o.color
    ctx.lineWidth = o.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    o.points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)))
    ctx.stroke()
    ctx.restore()
    return
  }
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2
  if (o.rotation) {
    ctx.translate(cx, cy)
    ctx.rotate((o.rotation * Math.PI) / 180)
    ctx.translate(-cx, -cy)
  }
  if (o.shadow) {
    ctx.shadowColor = o.shadowColor
    ctx.shadowBlur = o.shadowBlur
    ctx.shadowOffsetY = Math.round(o.shadowBlur / 4)
  }
  if (o.type === 'rect') {
    if (o.fill && o.fill !== 'none') { ctx.fillStyle = o.fill; roundRectPath(ctx, o.x, o.y, o.w, o.h, o.radius || 0); ctx.fill() }
    if (o.stroke && o.stroke !== 'none' && o.strokeWidth > 0) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeWidth; roundRectPath(ctx, o.x, o.y, o.w, o.h, o.radius || 0); ctx.stroke() }
  } else if (o.type === 'ellipse') {
    ctx.beginPath()
    ctx.ellipse(cx, cy, Math.max(o.w / 2, 0.01), Math.max(o.h / 2, 0.01), 0, 0, Math.PI * 2)
    if (o.fill && o.fill !== 'none') { ctx.fillStyle = o.fill; ctx.fill() }
    if (o.stroke && o.stroke !== 'none' && o.strokeWidth > 0) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeWidth; ctx.stroke() }
  } else if (o.type === 'text') {
    ctx.fillStyle = o.color
    ctx.font = `${o.fontWeight || 400} ${o.fontSize}px ${o.fontFamily}`
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${o.letterSpacing || 0}px`
    ctx.textAlign = o.align || 'left'
    ctx.textBaseline = 'top'
    const tx = o.align === 'center' ? o.x + o.w / 2 : o.align === 'right' ? o.x + o.w : o.x
    const lines = wrapLines(ctx, o.text, o.w)
    let ty = o.y
    lines.forEach((line) => { ctx.fillText(line, tx, ty); ty += o.fontSize * (o.lineHeight || 1.2) })
  } else if (o.type === 'image') {
    const img = imageCache.current.get(o.id)
    if (img && img.complete) ctx.drawImage(img, o.x, o.y, o.w, o.h)
    else { ctx.fillStyle = '#00000014'; ctx.fillRect(o.x, o.y, o.w, o.h) }
  } else if (o.type === 'icon') {
    const pts = ICONS[o.iconId] || ICONS.star
    ctx.beginPath()
    pts.forEach(([px, py], i) => {
      const ax = o.x + (px / 100) * o.w
      const ay = o.y + (py / 100) * o.h
      if (i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay)
    })
    ctx.closePath()
    if (o.fill && o.fill !== 'none') { ctx.fillStyle = o.fill; ctx.fill() }
  }
  ctx.restore()
}

function drawHandles(ctx, o) {
  if (o.type === 'path') {
    const bb = bboxOf(o)
    ctx.save()
    ctx.strokeStyle = '#3E37E0'
    ctx.setLineDash([4, 3])
    ctx.lineWidth = 1.5
    ctx.strokeRect(bb.x - 4, bb.y - 4, bb.w + 8, bb.h + 8)
    ctx.restore()
    return
  }
  const bb = bboxOf(o)
  const corners = o.type === 'line'
    ? [{ x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }]
    : [[bb.x, bb.y], [bb.x + bb.w, bb.y], [bb.x, bb.y + bb.h], [bb.x + bb.w, bb.y + bb.h]].map(([x, y]) => {
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2
        return o.rotation ? rotatePoint(cx, cy, x, y, o.rotation) : { x, y }
      })
  ctx.save()
  ctx.strokeStyle = '#3E37E0'
  ctx.lineWidth = 1.5
  if (o.type !== 'line') {
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    corners.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)))
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.fillStyle = '#3E37E0'
  corners.forEach((c) => { ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill() })
  if (o.type !== 'line' && o.type !== 'text') {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2
    const top = o.rotation ? rotatePoint(cx, cy, cx, bb.y, o.rotation) : { x: cx, y: bb.y }
    const handle = o.rotation ? rotatePoint(cx, cy, cx, bb.y - 26, o.rotation) : { x: cx, y: bb.y - 26 }
    ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(handle.x, handle.y); ctx.stroke()
    ctx.beginPath(); ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2); ctx.fillStyle = '#2FA36B'; ctx.fill()
  }
  ctx.restore()
}

function hitHandle(o, p) {
  const R = 10
  if (o.type === 'path') return null
  if (o.type === 'line') {
    if (Math.hypot(p.x - o.x1, p.y - o.y1) <= R) return 'p1'
    if (Math.hypot(p.x - o.x2, p.y - o.y2) <= R) return 'p2'
    return null
  }
  const bb = bboxOf(o)
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2
  if (o.type !== 'text') {
    const handlePt = o.rotation ? rotatePoint(cx, cy, cx, bb.y - 26, o.rotation) : { x: cx, y: bb.y - 26 }
    if (Math.hypot(p.x - handlePt.x, p.y - handlePt.y) <= R) return 'rotate'
  }
  const rawCorners = { nw: [bb.x, bb.y], ne: [bb.x + bb.w, bb.y], sw: [bb.x, bb.y + bb.h], se: [bb.x + bb.w, bb.y + bb.h] }
  for (const [name, [x, y]] of Object.entries(rawCorners)) {
    const c = o.rotation ? rotatePoint(cx, cy, x, y, o.rotation) : { x, y }
    if (Math.hypot(p.x - c.x, p.y - c.y) <= R) return name
  }
  return null
}

function translateObj(o, dx, dy) {
  if (o.type === 'line') return { ...o, x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy }
  if (o.type === 'path') return { ...o, points: o.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
  return { ...o, x: o.x + dx, y: o.y + dy }
}

function resizeObj(o, handle, worldP) {
  if (o.type === 'line') return handle === 'p1' ? { ...o, x1: worldP.x, y1: worldP.y } : { ...o, x2: worldP.x, y2: worldP.y }
  const lp = toLocal(o, worldP)
  let nx = o.x, ny = o.y, nw = o.w, nh = o.h
  if (handle === 'nw') { nw = o.x + o.w - lp.x; nh = o.y + o.h - lp.y; nx = lp.x; ny = lp.y }
  else if (handle === 'ne') { nw = lp.x - o.x; nh = o.y + o.h - lp.y; ny = lp.y }
  else if (handle === 'sw') { nw = o.x + o.w - lp.x; nh = lp.y - o.y; nx = lp.x }
  else if (handle === 'se') { nw = lp.x - o.x; nh = lp.y - o.y }
  nw = Math.max(nw, 8); nh = Math.max(nh, 8)
  return { ...o, x: nx, y: ny, w: nw, h: nh }
}

function rotateObj(o, worldP) {
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2
  const deg = (Math.atan2(worldP.y - cy, worldP.x - cx) * 180) / Math.PI + 90
  return { ...o, rotation: Math.round(deg) }
}

export function buildSvgString(objects, W, H, bg) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let body = `<rect x="0" y="0" width="${W}" height="${H}" fill="${bg}"/>`
  objects.forEach((o) => {
    if (o.visible === false) return
    const opacity = o.opacity ?? 1
    if (o.type === 'line') {
      body += `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${o.color}" stroke-width="${o.strokeWidth}" stroke-linecap="round" opacity="${opacity}"/>`
      return
    }
    if (o.type === 'path') {
      if (!o.points || o.points.length < 2) return
      const pts = o.points.map((pt) => `${pt.x},${pt.y}`).join(' ')
      body += `<polyline points="${pts}" fill="none" stroke="${o.color}" stroke-width="${o.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
      return
    }
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2
    const transform = o.rotation ? ` transform="rotate(${o.rotation} ${cx} ${cy})"` : ''
    const shadowFilter = o.shadow ? ` filter="drop-shadow(0 ${Math.round(o.shadowBlur / 4)}px ${o.shadowBlur}px ${o.shadowColor})"` : ''
    if (o.type === 'rect') {
      body += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${o.radius || 0}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${o.strokeWidth || 0}" opacity="${opacity}"${transform}${shadowFilter}/>`
    } else if (o.type === 'ellipse') {
      body += `<ellipse cx="${cx}" cy="${cy}" rx="${o.w / 2}" ry="${o.h / 2}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${o.strokeWidth || 0}" opacity="${opacity}"${transform}${shadowFilter}/>`
    } else if (o.type === 'text') {
      const anchor = o.align === 'center' ? 'middle' : o.align === 'right' ? 'end' : 'start'
      const tx = o.align === 'center' ? o.x + o.w / 2 : o.align === 'right' ? o.x + o.w : o.x
      body += `<text x="${tx}" y="${o.y + o.fontSize}" font-family="${esc(o.fontFamily)}" font-size="${o.fontSize}" font-weight="${o.fontWeight || 400}" fill="${o.color}" text-anchor="${anchor}" opacity="${opacity}"${transform}>`
      String(o.text).split('\n').forEach((line, i) => { body += `<tspan x="${tx}" dy="${i === 0 ? 0 : o.fontSize * (o.lineHeight || 1.2)}">${esc(line)}</tspan>` })
      body += `</text>`
    } else if (o.type === 'image' && o.src) {
      body += `<image x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" href="${o.src}" opacity="${opacity}"${transform}${shadowFilter}/>`
    } else if (o.type === 'icon') {
      const pts = ICONS[o.iconId] || ICONS.star
      const d = pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${(o.x + (px / 100) * o.w).toFixed(2)} ${(o.y + (py / 100) * o.h).toFixed(2)}`).join(' ') + ' Z'
      body += `<path d="${d}" fill="${o.fill}" opacity="${opacity}"${transform}${shadowFilter}/>`
    }
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`
}

// Мінімальний, але коректний одно-сторінковий PDF: полотно растеризується
// в JPEG і вшивається як /XObject-зображення на сторінку — чесний растровий
// експорт (не векторний), без нової залежності (jsPDF тощо) заради одного
// формату. Якщо колись знадобиться справжній векторний PDF — окремий етап.
async function canvasToPdfBlob(canvas) {
  const jpegBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  const jpegBuf = new Uint8Array(await jpegBlob.arrayBuffer())
  const W = canvas.width, H = canvas.height
  const enc = new TextEncoder()
  const chunks = []
  let offset = 0
  const offsets = {}
  function push(part) {
    const bytes = typeof part === 'string' ? enc.encode(part) : part
    chunks.push(bytes)
    offset += bytes.length
  }
  push('%PDF-1.4\n')
  offsets[1] = offset
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  offsets[2] = offset
  push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')
  offsets[3] = offset
  push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`)
  offsets[4] = offset
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuf.length} >>\nstream\n`)
  push(jpegBuf)
  push('\nendstream\nendobj\n')
  offsets[5] = offset
  const content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`
  push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)
  const xrefOffset = offset
  let xref = 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 1; i <= 5; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
  push(xref)
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)
  return new Blob(chunks, { type: 'application/pdf' })
}

function download(blobOrUrl, filename) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  if (typeof blobOrUrl !== 'string') setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function PropertiesPanel({ selected, canvasSize, bg, showGrid, gridColumns, onCanvasChange, onBgChange, onGridChange, onGridColumnsChange, onUpdate, onImageFile }) {
  if (!selected) {
    return (
      <div className="gfx-props">
        <p className="cl-section-title">Властивості полотна</p>
        <label className="sketchpad-inline-label" style={{ display: 'block', marginBottom: 8 }}>
          Розмір
          <select className="sketchpad-select" style={{ marginLeft: 6 }} value={CANVAS_PRESETS.find((p) => p.w === canvasSize.w && p.h === canvasSize.h)?.id || ''} onChange={(e) => {
            const preset = CANVAS_PRESETS.find((p) => p.id === e.target.value)
            if (preset) onCanvasChange({ w: preset.w, h: preset.h })
          }}>
            <option value="">— свій розмір —</option>
            {CANVAS_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <div className="gfx-row">
          <label className="gfx-num">Ширина<input type="number" min="50" max="4000" value={canvasSize.w} onChange={(e) => onCanvasChange({ w: Math.max(50, Number(e.target.value) || 50) })} /></label>
          <label className="gfx-num">Висота<input type="number" min="50" max="4000" value={canvasSize.h} onChange={(e) => onCanvasChange({ h: Math.max(50, Number(e.target.value) || 50) })} /></label>
        </div>
        <p className="cl-section-title" style={{ marginTop: 14 }}>Фон</p>
        <div className="sketchpad-colors">
          {BG_SWATCHES.map((c) => (
            <button key={c} className={'sketchpad-swatch' + (bg === c ? ' active' : '')} style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid var(--line)' : undefined }} onClick={() => onBgChange(c)} aria-label={c} />
          ))}
          <input type="color" value={bg} onChange={(e) => onBgChange(e.target.value)} className="sketchpad-colorpicker" />
        </div>
        <label className="sketchpad-inline-label" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={showGrid} onChange={(e) => onGridChange(e.target.checked)} />
          Сітка-орієнтир (не друкується)
        </label>
        {showGrid && (
          <label className="gfx-num" style={{ display: 'block', marginTop: 8 }}>Колонок
            <input type="number" min="1" max="24" value={gridColumns} onChange={(e) => onGridColumnsChange(Math.max(1, Number(e.target.value) || 1))} />
          </label>
        )}
        <p className="cl-tab-desc" style={{ marginTop: 10 }}>Нічого не вибрано — клікни об’єкт на полотні чи в списку шарів, щоб редагувати його властивості.</p>
      </div>
    )
  }

  const o = selected
  const set = (patch) => onUpdate(o.id, patch)

  return (
    <div className="gfx-props">
      <p className="cl-section-title">Властивості — {o.name}</p>

      {o.type === 'text' && (
        <>
          <label className="gfx-field">Текст
            <textarea className="gfx-textarea" rows={3} value={o.text} onChange={(e) => set({ text: e.target.value })} />
          </label>
          <label className="gfx-field">Шрифт
            <select className="sketchpad-select" value={o.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })}>
              {FONT_FAMILIES.map((f) => <option key={f.css} value={f.css}>{f.label}</option>)}
            </select>
          </label>
          <div className="gfx-row">
            <label className="gfx-num">Розмір<input type="number" min="8" max="240" value={o.fontSize} onChange={(e) => set({ fontSize: Number(e.target.value) || 1 })} /></label>
            <label className="gfx-num">Насиченість
              <select className="sketchpad-select" value={o.fontWeight} onChange={(e) => set({ fontWeight: Number(e.target.value) })}>
                <option value={400}>Звичайний</option>
                <option value={700}>Жирний</option>
              </select>
            </label>
          </div>
          <div className="gfx-row">
            <label className="gfx-num">Міжрядковий<input type="number" step="0.05" min="0.8" max="3" value={o.lineHeight} onChange={(e) => set({ lineHeight: Number(e.target.value) || 1 })} /></label>
            <label className="gfx-num">Міжлітерний<input type="number" step="0.5" min="-5" max="30" value={o.letterSpacing} onChange={(e) => set({ letterSpacing: Number(e.target.value) || 0 })} /></label>
          </div>
          <label className="gfx-field">Вирівнювання
            <div className="cl-btn-row">
              {['left', 'center', 'right'].map((a) => (
                <button key={a} className={'harmony-btn' + (o.align === a ? ' active' : '')} onClick={() => set({ align: a })}>{a === 'left' ? '⇤' : a === 'center' ? '≡' : '⇥'}</button>
              ))}
            </div>
          </label>
          <label className="gfx-field">Колір
            <input type="color" value={o.color} onChange={(e) => set({ color: e.target.value })} className="sketchpad-colorpicker" />
          </label>
        </>
      )}

      {(o.type === 'rect' || o.type === 'ellipse') && (
        <>
          <label className="gfx-field">Заливка
            <div className="sketchpad-colors">
              {FILL_SWATCHES.map((c) => (
                <button key={c} className={'sketchpad-swatch' + (o.fill === c ? ' active' : '')} style={{ background: c === 'none' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/8px 8px' : c, border: c === '#FFFFFF' || c === 'none' ? '1.5px solid var(--line)' : undefined }} onClick={() => set({ fill: c })} aria-label={c} />
              ))}
              <input type="color" value={o.fill === 'none' ? '#ffffff' : o.fill} onChange={(e) => set({ fill: e.target.value })} className="sketchpad-colorpicker" />
            </div>
          </label>
          <label className="gfx-field">Контур
            <div className="sketchpad-colors">
              {FILL_SWATCHES.map((c) => (
                <button key={'s' + c} className={'sketchpad-swatch' + (o.stroke === c ? ' active' : '')} style={{ background: c === 'none' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/8px 8px' : c, border: c === '#FFFFFF' || c === 'none' ? '1.5px solid var(--line)' : undefined }} onClick={() => set({ stroke: c })} aria-label={c} />
              ))}
              <input type="color" value={o.stroke === 'none' ? '#000000' : o.stroke} onChange={(e) => set({ stroke: e.target.value })} className="sketchpad-colorpicker" />
            </div>
          </label>
          <div className="gfx-row">
            <label className="gfx-num">Товщина контуру<input type="number" min="0" max="40" value={o.strokeWidth} onChange={(e) => set({ strokeWidth: Number(e.target.value) || 0 })} /></label>
            {o.type === 'rect' && <label className="gfx-num">Радіус кутів<input type="number" min="0" max="200" value={o.radius} onChange={(e) => set({ radius: Number(e.target.value) || 0 })} /></label>}
          </div>
        </>
      )}

      {(o.type === 'line' || o.type === 'path') && (
        <>
          <label className="gfx-field">Колір
            <input type="color" value={o.color} onChange={(e) => set({ color: e.target.value })} className="sketchpad-colorpicker" />
          </label>
          <label className="gfx-num">Товщина<input type="number" min="1" max="60" value={o.strokeWidth} onChange={(e) => set({ strokeWidth: Number(e.target.value) || 1 })} /></label>
        </>
      )}

      {o.type === 'icon' && (
        <>
          <label className="gfx-field">Іконка
            <div className="cl-btn-row" style={{ flexWrap: 'wrap' }}>
              {ICON_LIST.map((ic) => (
                <button key={ic.id} className={'harmony-btn' + (o.iconId === ic.id ? ' active' : '')} onClick={() => set({ iconId: ic.id })}>{ic.label}</button>
              ))}
            </div>
          </label>
          <label className="gfx-field">Колір
            <div className="sketchpad-colors">
              {FILL_SWATCHES.filter((c) => c !== 'none').map((c) => (
                <button key={c} className={'sketchpad-swatch' + (o.fill === c ? ' active' : '')} style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid var(--line)' : undefined }} onClick={() => set({ fill: c })} aria-label={c} />
              ))}
              <input type="color" value={o.fill} onChange={(e) => set({ fill: e.target.value })} className="sketchpad-colorpicker" />
            </div>
          </label>
        </>
      )}

      {o.type === 'image' && (
        <label className="gfx-field">
          <span className="harmony-btn" style={{ display: 'inline-block', cursor: 'pointer' }}>
            {o.src ? '🔄 Замінити зображення' : '📤 Завантажити зображення'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && onImageFile(o.id, e.target.files[0])} />
          </span>
        </label>
      )}

      {o.type !== 'line' && 'shadow' in o && (
        <>
          <label className="sketchpad-inline-label" style={{ marginBottom: 6 }}>
            <input type="checkbox" checked={o.shadow} onChange={(e) => set({ shadow: e.target.checked })} />
            Тінь
          </label>
          {o.shadow && (
            <div className="gfx-row">
              <label className="gfx-num">Колір тіні<input type="color" value={o.shadowColor} onChange={(e) => set({ shadowColor: e.target.value })} className="sketchpad-colorpicker" /></label>
              <label className="gfx-num">Розмиття<input type="number" min="0" max="80" value={o.shadowBlur} onChange={(e) => set({ shadowBlur: Number(e.target.value) || 0 })} /></label>
            </div>
          )}
        </>
      )}

      {o.type !== 'line' && o.type !== 'path' && (
        <>
          <div className="gfx-row">
            <label className="gfx-num">X<input type="number" value={Math.round(o.x)} onChange={(e) => set({ x: Number(e.target.value) || 0 })} /></label>
            <label className="gfx-num">Y<input type="number" value={Math.round(o.y)} onChange={(e) => set({ y: Number(e.target.value) || 0 })} /></label>
          </div>
          <div className="gfx-row">
            <label className="gfx-num">Ширина<input type="number" min="4" value={Math.round(o.w)} onChange={(e) => set({ w: Math.max(4, Number(e.target.value) || 4) })} /></label>
            <label className="gfx-num">Висота<input type="number" min="4" value={Math.round(o.h)} onChange={(e) => set({ h: Math.max(4, Number(e.target.value) || 4) })} /></label>
          </div>
          <label className="gfx-num" style={{ display: 'block' }}>Поворот (°)<input type="number" value={Math.round(o.rotation || 0)} onChange={(e) => set({ rotation: Number(e.target.value) || 0 })} /></label>
        </>
      )}

      <label className="gfx-num" style={{ display: 'block', marginTop: 8 }}>Прозорість
        <input type="range" min="0" max="1" step="0.05" value={o.opacity} onChange={(e) => set({ opacity: Number(e.target.value) })} />
      </label>
    </div>
  )
}

function LayersPanel({ objects, selectedId, onSelect, onToggleVisible, onToggleLock, onRename, onDuplicate, onDelete, onReorder }) {
  const [renamingId, setRenamingId] = useState(null)
  const [draft, setDraft] = useState('')
  if (objects.length === 0) return null
  return (
    <div className="sketchpad-layers">
      <p className="eyebrow">Шари ({objects.length})</p>
      <ul className="sketchpad-layers-list">
        {[...objects].reverse().map((o) => (
          <li key={o.id} className={(o.visible === false ? 'sketchpad-layer--hidden ' : '') + (o.id === selectedId ? 'sketchpad-layer--selected' : '')}>
            {renamingId === o.id ? (
              <input
                className="cl-text-input" autoFocus value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => { onRename(o.id, draft.trim() || o.name); setRenamingId(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
              />
            ) : (
              <span className="sketchpad-layer-name" onClick={() => onSelect(o.id)} role="button" tabIndex={0}>
                {o.type === 'rect' ? '▭' : o.type === 'ellipse' ? '⬭' : o.type === 'line' ? '➖' : o.type === 'text' ? '🅰' : '🖼️'} {o.name}{o.locked ? ' 🔒' : ''}
              </span>
            )}
            <span className="sketchpad-layer-actions">
              <button onClick={() => { setRenamingId(o.id); setDraft(o.name) }} title="Перейменувати">✎</button>
              <button onClick={() => onReorder(o.id, 1)} title="Вище">↑</button>
              <button onClick={() => onReorder(o.id, -1)} title="Нижче">↓</button>
              <button onClick={() => onDuplicate(o.id)} title="Дублювати">⧉</button>
              <button onClick={() => onToggleLock(o.id)} title="Заблокувати/розблокувати">{o.locked ? '🔒' : '🔓'}</button>
              <button onClick={() => onToggleVisible(o.id)} title="Показати/сховати">{o.visible === false ? '🚫' : '👁'}</button>
              <button onClick={() => onDelete(o.id)} title="Видалити">🗑</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// `project` (optional) pins this editor to one specific, already-existing
// shared project (Graphic Design Studio's "Конструктор" tab passes its
// one direction-wide project here) instead of the default standalone
// behaviour (Branding Studio's embedded logo tool, and the legacy
// per-lesson modal): when provided, state loads from it on mount, saves
// always write back to its exact id via onSaved, and the in-editor
// project switcher (New/recent projects) is hidden, since project
// identity is then owned by the parent page's :projectId route, not by
// this editor.
export default function GraphicDesignStudio({ module, onClose, project, onSaved }) {
  const { addPortfolioItem, graphicProjects, saveGraphicProject } = useProgress()
  const toastApi = useLabToast()
  const canvasRef = useRef(null)
  const imageCache = useRef(new Map())
  const dragRef = useRef(null)

  const initialObjects = useRef(project?.objects || []).current
  const objHistory = useLabHistory(initialObjects)
  const objects = objHistory.value
  const [liveObj, setLiveObj] = useState(null)

  const [canvasSize, setCanvasSize] = useState({ w: project?.canvasW || 1080, h: project?.canvasH || 1080 })
  const [bg, setBg] = useState(project?.bg || '#FFFFFF')
  const [showGrid, setShowGrid] = useState(false)
  const [gridColumns, setGridColumns] = useState(8)
  const [zoom, setZoom] = useState(1)
  const [tool, setTool] = useState('select')
  const [rightTab, setRightTab] = useState('design')
  const [selectedId, setSelectedId] = useState(null)
  const [projectId, setProjectId] = useState(project?.id || null)
  const [projectTitle, setProjectTitle] = useState(project?.title || (module?.title ? `${module.title} — проєкт` : 'Новий проєкт'))
  const [checked, setChecked] = useState({})

  const selected = objects.find((o) => o.id === selectedId) || null
  const drawSelected = liveObj && liveObj.id === selectedId ? liveObj : selected

  useEffect(() => {
    objects.forEach((o) => {
      if (o.type === 'image' && o.src && !imageCache.current.has(o.id)) {
        const img = new Image()
        img.onload = () => redraw()
        img.src = o.src
        imageCache.current.set(o.id, img)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects])

  function redraw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (showGrid) {
      ctx.save()
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1
      const step = canvas.width / Math.max(1, gridColumns)
      for (let x = 0; x <= canvas.width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke() }
      const rowStep = canvas.height / Math.max(1, Math.round(gridColumns * (canvas.height / canvas.width)))
      for (let y = 0; y <= canvas.height; y += rowStep) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke() }
      ctx.restore()
    }
    objects.forEach((o) => drawObject(ctx, liveObj && liveObj.id === o.id ? liveObj : o, imageCache))
    // Об'єкт, що ще малюється (нова фігура/лінія/пензель), ще не в
    // objects — без цього рядка нічого не видно до відпускання кнопки.
    if (liveObj && !objects.some((o) => o.id === liveObj.id)) drawObject(ctx, liveObj, imageCache)
    if (tool === 'select' && drawSelected && drawSelected.visible !== false) drawHandles(ctx, drawSelected)
  }

  useEffect(() => { redraw() })

  function pos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) }
  }

  function commitObjects(next) {
    objHistory.set(next)
  }

  function addObject(o) {
    commitObjects([...objects, o])
    setSelectedId(o.id)
  }

  function updateObject(id, patch) {
    commitObjects(objects.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  // Швидка палітра під полотном (як колірні плашки в референсі) — б'є
  // одразу в «головний» колір вибраного об'єкта: заливку для фігур,
  // колір тексту чи лінії. Без вибору — підказуємо обрати об'єкт.
  function applyQuickColor(hex) {
    if (!selected) { toastApi.show('Спочатку вибери об’єкт на полотні'); return }
    if (selected.type === 'text' || selected.type === 'line' || selected.type === 'path') updateObject(selected.id, { color: hex })
    else if (selected.type === 'rect' || selected.type === 'ellipse' || selected.type === 'icon') updateObject(selected.id, { fill: hex })
  }

  function handleImageFile(id, file) {
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result
      updateObject(id, { src })
      const img = new Image()
      img.onload = () => { imageCache.current.set(id, img); redraw() }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function toggleVisible(id) { commitObjects(objects.map((o) => (o.id === id ? { ...o, visible: o.visible === false } : o))) }
  function toggleLock(id) { commitObjects(objects.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o))) }
  function renameObj(id, name) { commitObjects(objects.map((o) => (o.id === id ? { ...o, name } : o))) }
  function deleteObj(id) { commitObjects(objects.filter((o) => o.id !== id)); if (selectedId === id) setSelectedId(null) }
  function duplicateObj(id) {
    const o = objects.find((x) => x.id === id)
    if (!o) return
    const copy = { ...o, id: uid(), name: o.name + ' (копія)' }
    if (copy.type === 'line') { copy.x1 += 16; copy.y1 += 16; copy.x2 += 16; copy.y2 += 16 }
    else if (copy.type === 'path') { copy.points = copy.points.map((p) => ({ x: p.x + 16, y: p.y + 16 })) }
    else { copy.x += 16; copy.y += 16 }
    commitObjects([...objects, copy])
    setSelectedId(copy.id)
  }
  function reorderObj(id, dir) {
    const idx = objects.findIndex((o) => o.id === id)
    const j = idx + dir
    if (idx < 0 || j < 0 || j >= objects.length) return
    const next = [...objects]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    commitObjects(next)
  }

  function start(e) {
    const p = pos(e)
    if (tool === 'select') {
      if (selected && !selected.locked) {
        const h = hitHandle(selected, p)
        if (h === 'rotate') { dragRef.current = { mode: 'rotate', orig: selected }; return }
        if (h) { dragRef.current = { mode: 'resize', handle: h, orig: selected }; return }
      }
      const hit = hitTest(objects, p)
      if (hit) { setSelectedId(hit.id); dragRef.current = { mode: 'move', orig: hit, startP: p } }
      else setSelectedId(null)
      return
    }
    if (tool === 'text') {
      const o = defaultObject('text', { x: p.x - 120, y: p.y - 20 })
      addObject(o)
      setTool('select')
      return
    }
    if (tool === 'image') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = () => {
        if (!input.files[0]) return
        const o = defaultObject('image', { x: p.x - 120, y: p.y - 120 })
        const reader = new FileReader()
        reader.onload = () => {
          o.src = reader.result
          addObject(o)
          const img = new Image()
          img.onload = () => { imageCache.current.set(o.id, img); redraw() }
          img.src = o.src
        }
        reader.readAsDataURL(input.files[0])
      }
      input.click()
      setTool('select')
      return
    }
    if (tool === 'icon') {
      const o = defaultObject('icon', { x: p.x - 40, y: p.y - 40 })
      addObject(o)
      setTool('select')
      return
    }
    if (tool === 'draw') {
      dragRef.current = { mode: 'draw', type: 'path', startP: p }
      setLiveObj({ id: uid(), type: 'path', name: 'Пензель', points: [p], color: '#17171A', strokeWidth: 6, visible: true, locked: false, opacity: 1 })
      return
    }
    dragRef.current = { mode: 'draw', type: tool, startP: p, obj: defaultObject(tool, p) }
  }

  function move(e) {
    if (!dragRef.current) return
    e.preventDefault()
    const p = pos(e)
    const drag = dragRef.current
    if (drag.mode === 'move') { setLiveObj(translateObj(drag.orig, p.x - drag.startP.x, p.y - drag.startP.y)); return }
    if (drag.mode === 'resize') { setLiveObj(resizeObj(drag.orig, drag.handle, p)); return }
    if (drag.mode === 'rotate') { setLiveObj(rotateObj(drag.orig, p)); return }
    if (drag.mode === 'draw') {
      const sp = drag.startP
      if (drag.type === 'line') setLiveObj({ ...drag.obj, x1: sp.x, y1: sp.y, x2: p.x, y2: p.y })
      else if (drag.type === 'path') setLiveObj((prev) => (prev && prev.type === 'path' ? { ...prev, points: [...prev.points, p] } : prev))
      else setLiveObj({ ...drag.obj, x: Math.min(sp.x, p.x), y: Math.min(sp.y, p.y), w: Math.abs(p.x - sp.x), h: Math.abs(p.y - sp.y) })
    }
  }

  function end() {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    if (drag.mode === 'draw') {
      if (liveObj && (liveObj.w > 4 || liveObj.h > 4 || liveObj.type === 'line' || (liveObj.type === 'path' && liveObj.points.length > 1))) addObject(liveObj)
      setLiveObj(null)
      return
    }
    if (liveObj) { commitObjects(objects.map((o) => (o.id === liveObj.id ? liveObj : o))); setLiveObj(null) }
  }

  function handleSaveProject() {
    // Pinned to a shared project (Graphic Design Studio's own route): keep
    // every field that lives outside this editor (palette/requirements/
    // review/versions) intact — saveGraphicProject replaces the record
    // wholesale by id, it doesn't merge partial patches itself.
    const base = project ? { ...project } : { lessonId: module?.id }
    const id = saveGraphicProject({ ...base, id: projectId, title: projectTitle, canvasW: canvasSize.w, canvasH: canvasSize.h, bg, objects })
    setProjectId(id)
    toastApi.show('✓ Проєкт збережено')
    onSaved?.(id)
  }

  function openProject(p) {
    setProjectId(p.id)
    setProjectTitle(p.title)
    setCanvasSize({ w: p.canvasW, h: p.canvasH })
    setBg(p.bg)
    imageCache.current = new Map()
    objHistory.reset(p.objects)
    setSelectedId(null)
    toastApi.show('✓ Проєкт відкрито')
  }

  function newProject() {
    setProjectId(null)
    setProjectTitle(module?.title ? `${module.title} — проєкт` : 'Новий проєкт')
    objHistory.reset([])
    setSelectedId(null)
  }

  async function exportAs(format) {
    const canvas = canvasRef.current
    if (!canvas) return
    const base = (projectTitle || 'design').replace(/[^\p{L}\p{N}_-]+/gu, '_')
    if (format === 'png') { download(canvas.toDataURL('image/png'), `${base}.png`); toastApi.show('✓ PNG завантажено') }
    else if (format === 'jpg') { download(canvas.toDataURL('image/jpeg', 0.92), `${base}.jpg`); toastApi.show('✓ JPG завантажено') }
    else if (format === 'svg') {
      const svg = buildSvgString(objects, canvasSize.w, canvasSize.h, bg)
      download(new Blob([svg], { type: 'image/svg+xml' }), `${base}.svg`)
      toastApi.show('✓ SVG завантажено')
    } else if (format === 'pdf') {
      const blob = await canvasToPdfBlob(canvas)
      download(blob, `${base}.pdf`)
      toastApi.show('✓ PDF завантажено')
    }
  }

  function handleSaveToPortfolio() {
    const canvas = canvasRef.current
    addPortfolioItem({
      title: projectTitle,
      desc: module?.practice || 'Створено у вбудованому Graphic Design Studio.',
      tags: [module?.title, 'Graphic Design Studio'].filter(Boolean),
      attachments: canvas ? [{ url: canvas.toDataURL('image/png'), name: 'design.png', type: 'image' }] : [],
    })
    toastApi.show('✓ Збережено в портфоліо')
  }

  const checklist = module?.selfCheck || []
  // CSS aspect-ratio + height:100% на канвасі конфліктують (циклічна
  // залежність: відсоткова висота не резолвиться відносно висоти,
  // виведеної з aspect-ratio) — браузер тоді показує canvas у його
  // нативній роздільності замість зменшеної. Рахуємо W/H явно в пікселях.
  const displayW = Math.round(Math.min(canvasSize.w, 640) * zoom)
  const displayH = Math.round(displayW * (canvasSize.h / canvasSize.w))

  return (
    <div className="sketchpad gfx-studio">
      {module && (
        <div className="sketchpad-hints">
          <p className="eyebrow">Завдання: {module.title}</p>
          {module.practice && <p className="sketchpad-hints-task">{module.practice}</p>}
          {checklist.length > 0 && (
            <ul className="sketchpad-checklist">
              {checklist.map((c, i) => (
                <li key={i}><label><input type="checkbox" checked={!!checked[i]} onChange={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))} />{c}</label></li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="gfx-topbar">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Назва проєкту" />
        <button className="harmony-btn" disabled={!objHistory.canUndo} onClick={objHistory.undo}>↶ Undo</button>
        <button className="harmony-btn" disabled={!objHistory.canRedo} onClick={objHistory.redo}>↷ Redo</button>
        {!project && <button className="harmony-btn" onClick={newProject}>📄 Новий</button>}
        <button className="harmony-btn" onClick={handleSaveProject}>💾 Зберегти проєкт</button>
      </div>

      {!project && graphicProjects.length > 0 && (
        <div className="gfx-projects-row">
          <span className="gds-level-toolbar-label">Мої проєкти:</span>
          {graphicProjects.slice(0, 8).map((p) => (
            <button key={p.id} className={'cl-mini-btn' + (p.id === projectId ? ' active' : '')} onClick={() => openProject(p)}>{p.title}</button>
          ))}
        </div>
      )}

      <div className="sketchpad-toolbar">
        {TOOLS.map((t) => (
          <button key={t.id} className={'harmony-btn' + (tool === t.id ? ' active' : '')} onClick={() => setTool(t.id)}>{t.icon} {t.label}</button>
        ))}
        <button className={'harmony-btn' + (showGrid ? ' active' : '')} onClick={() => setShowGrid((g) => !g)}>🔳 Сітка</button>
        <span className="gfx-zoom">
          <button className="cl-mini-btn" onClick={() => setZoom((z) => ZOOM_STEPS[Math.max(0, ZOOM_STEPS.indexOf(z) - 1)])} title="Зменшити">−</button>
          <span className="gfx-zoom-value">{Math.round(zoom * 100)}%</span>
          <button className="cl-mini-btn" onClick={() => setZoom((z) => ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, ZOOM_STEPS.indexOf(z) + 1)])} title="Збільшити">+</button>
        </span>
      </div>

      <div className="gfx-workspace">
        <div className="gfx-canvas-col">
          <div className="gfx-canvas-wrap" style={{ width: displayW, height: displayH }}>
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              className="gfx-canvas"
              style={{ width: displayW, height: displayH, cursor: tool === 'select' ? 'default' : 'crosshair' }}
              onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
              onTouchStart={start} onTouchMove={move} onTouchEnd={end}
            />
          </div>
          <div className="gfx-quick-palette">
            <span className="gds-level-toolbar-label">Швидкий колір:</span>
            {QUICK_PALETTE.map((c) => (
              <button key={c} className="sketchpad-swatch" style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid var(--line)' : undefined }} onClick={() => applyQuickColor(c)} aria-label={c} title={selected ? `Застосувати ${c} до вибраного` : 'Спочатку вибери об’єкт'} />
            ))}
          </div>
          <LayersPanel
            objects={objects} selectedId={selectedId}
            onSelect={setSelectedId} onToggleVisible={toggleVisible} onToggleLock={toggleLock}
            onRename={renameObj} onDuplicate={duplicateObj} onDelete={deleteObj} onReorder={reorderObj}
          />
        </div>
        <div className="gfx-props-col">
          <div className="gfx-tabs">
            <button className={'gfx-tab' + (rightTab === 'design' ? ' active' : '')} onClick={() => setRightTab('design')}>Дизайн</button>
            <button className={'gfx-tab' + (rightTab === 'prototype' ? ' active' : '')} onClick={() => setRightTab('prototype')}>Прототип</button>
          </div>
          {rightTab === 'design' ? (
            <PropertiesPanel
              selected={drawSelected} canvasSize={canvasSize} bg={bg} showGrid={showGrid} gridColumns={gridColumns}
              onCanvasChange={(patch) => setCanvasSize((prev) => ({ ...prev, ...patch }))}
              onBgChange={setBg} onGridChange={setShowGrid} onGridColumnsChange={setGridColumns}
              onUpdate={updateObject} onImageFile={handleImageFile}
            />
          ) : (
            <div className="gfx-props">
              <p className="cl-section-title">Прототипування</p>
              <p className="cl-tab-desc">Переходи між екранами й інтерактивні стани — функція, яку «Graphic Design Studio» цього курсу чесно не підтримує: тут один редагований аркуш, а не кілька пов’язаних екранів із клікабельними переходами між ними. Для прототипування спробуй безкоштовний Figma.</p>
            </div>
          )}
        </div>
      </div>

      <div className="sketchpad-actions">
        {!project && <button className="cl-mini-btn" onClick={onClose}>Закрити</button>}
        <button className="harmony-btn" onClick={() => exportAs('png')}>⬇ PNG</button>
        <button className="harmony-btn" onClick={() => exportAs('jpg')}>⬇ JPG</button>
        <button className="harmony-btn" onClick={() => exportAs('svg')}>⬇ SVG</button>
        <button className="harmony-btn" onClick={() => exportAs('pdf')}>⬇ PDF</button>
        <button className="pf-add-btn" onClick={handleSaveToPortfolio}>Зберегти в портфоліо</button>
      </div>
      <LabToast message={toastApi.toast} />
    </div>
  )
}
