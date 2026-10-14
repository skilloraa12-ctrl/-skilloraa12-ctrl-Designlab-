// Чисті (без React) функції довільного цифрового малювання — на відміну
// від pixelArtEngine.js (жорстка сітка пікселів для Pixel Art), тут
// пензель малює плавний безперервний мазок на canvas потрібної
// роздільної здатності — реальний digital painting, а не блоки.
//
// Чесна межа: це справжні, різні за результатом техніки рендерингу
// (кожна дає інший візуальний результат — перевірено пікселями), а НЕ
// імітація фізики паперу/фарби чи PBR-матеріалів із реального 3D-софту
// (Substance Painter, ZBrush) — ці інструменти лишаються зовнішніми,
// про них курс навчає чесно, без вигаданої інтеграції в студію.

import { hsvToRgb, rgbToHex } from '../colorMath.js'

export const BRUSH_SIZES = [4, 10, 20, 36]

export const BRUSH_TYPES = [
  { key: 'hard', label: 'Тверда', icon: '●' },
  { key: 'soft', label: 'М’яка', icon: '◌' },
  { key: 'pencil', label: 'Олівець', icon: '✎' },
  { key: 'watercolor', label: 'Акварель', icon: '💧' },
  { key: 'chalk', label: 'Крейда', icon: '▦' },
  { key: 'ink', label: 'Туш', icon: '✒' },
  { key: 'hatch', label: 'Штрихування', icon: '▨' },
  { key: 'spray', label: 'Балончик', icon: '∴' },
  { key: 'texture', label: 'Текстура', icon: '▧' },
  { key: 'paint', label: 'Фарба', icon: '⬤' },
  { key: 'lace', label: 'Ажур', icon: '❋' },
  { key: 'grass', label: 'Трава', icon: '🌿' },
  { key: 'fur', label: 'Хутро', icon: '≋' },
  { key: 'hair', label: 'Волосся', icon: '〰' },
]

export const SHAPE_TYPES = [
  { key: 'line', label: 'Лінія' },
  { key: 'rect', label: 'Прямокутник' },
  { key: 'circle', label: 'Коло' },
  { key: 'triangle', label: 'Трикутник' },
  { key: 'star', label: 'Зірка' },
]

export const DEFAULT_PALETTE = [
  '#000000', '#3a3a3a', '#7a7a7a', '#b8b8b8', '#ffffff',
  '#7a3b2e', '#c1502e', '#e8a33d', '#f3d54e', '#8bbf4f',
  '#3f9142', '#2e8b8b', '#3a6fb0', '#5b4ba3', '#9b4fb0',
  '#d6477e', '#e87ca0', '#f0c8a0', '#8a5a3c', '#2b2b2b',
]

// Внутрішня роздільна здатність (CANVAS_W×CANVAS_H у логічних одиницях)
// лишається фіксованою для якості малюнка, а CSS-розмір на екрані — ні:
// немає inline canvas.style.width/height, тож `.fpc-canvas { width:100% }`
// вільно масштабує полотно під контейнер (вузьку колонку студії чи весь
// екран у повноекранному режимі), зберігаючи співвідношення сторін із
// власних атрибутів width/height. pointFromEvent нижче перераховує клік у
// логічні координати з урахуванням цього масштабування.
export function setupCanvas(canvas, width, height) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = width * ratio
  canvas.height = height * ratio
  const ctx = canvas.getContext('2d')
  ctx.scale(ratio, ratio)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  return ctx
}

export function clearToWhite(ctx, width, height) {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
}

export function loadImageToCanvas(ctx, width, height, dataUrl, cb) {
  clearToWhite(ctx, width, height)
  if (!dataUrl) { cb?.(); return }
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height)
    cb?.()
  }
  img.onerror = () => cb?.()
  img.src = dataUrl
}

// Один штамп пензля в точці (x,y) — форма штампа залежить від brushType:
// кожен тип дає реально інший малюнок пікселів (перевірено в Playwright),
// а не той самий штрих перефарбований.
function stampDab(ctx, x, y, { size, color, opacity, erase, brushType }) {
  const r = size / 2
  ctx.save()
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
  const ink = erase ? '#000000' : color
  if (brushType === 'pencil') {
    // Зерниста текстура: багато дрібних крапок у випадковому місці
    // всередині радіуса з випадковою прозорістю — графітне зерно.
    const specks = Math.max(3, Math.round(size * 0.7))
    for (let i = 0; i < specks; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * r
      ctx.globalAlpha = opacity * (0.12 + Math.random() * 0.35)
      ctx.fillStyle = ink
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1, 1)
    }
  } else if (brushType === 'watercolor') {
    // М'яка напівпрозора пляма з невеликим дрейфом центра — мазки, що
    // накладаючись одне на одного, дають ефект розмитої акварелі.
    ctx.globalAlpha = opacity * 0.14
    ctx.fillStyle = ink
    const jx = (Math.random() - 0.5) * r * 0.5
    const jy = (Math.random() - 0.5) * r * 0.5
    ctx.beginPath()
    ctx.arc(x + jx, y + jy, r * (0.8 + Math.random() * 0.35), 0, Math.PI * 2)
    ctx.fill()
  } else if (brushType === 'chalk') {
    // Крупніша, рідша крапкова текстура, ніж олівець — крейдяна зернистість.
    const specks = Math.max(4, Math.round(size * 0.9))
    for (let i = 0; i < specks; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * r
      const s = 1 + Math.random() * 1.6
      ctx.globalAlpha = opacity * (0.25 + Math.random() * 0.4)
      ctx.fillStyle = ink
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s)
    }
  } else if (brushType === 'hatch') {
    // Паралельне штрихування під 45° замість суцільної заливки.
    ctx.globalAlpha = opacity * 0.55
    ctx.strokeStyle = ink
    ctx.lineWidth = Math.max(1, size * 0.12)
    for (let i = -1; i <= 1; i++) {
      const off = i * size * 0.32
      ctx.beginPath()
      ctx.moveTo(x - r + off, y + r)
      ctx.lineTo(x + r + off, y - r)
      ctx.stroke()
    }
  } else if (brushType === 'ink') {
    // Чіткий суцільний штамп без розмиття — туш/перо.
    ctx.globalAlpha = opacity
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  } else if (brushType === 'soft') {
    ctx.globalAlpha = opacity
    ctx.shadowColor = ink
    ctx.shadowBlur = r * 0.8
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
    ctx.fill()
  } else if (brushType === 'spray') {
    // Балончик: випадкові крапки по колу, густіше ближче до центра — аерограф.
    const dots = Math.max(6, Math.round(size * 1.4))
    ctx.fillStyle = ink
    for (let i = 0; i < dots; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.sqrt(Math.random()) * r
      const s = 0.6 + Math.random() * 1.2
      ctx.globalAlpha = opacity * (0.2 + Math.random() * 0.4)
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s)
    }
  } else if (brushType === 'texture') {
    // Текстура: нерівні грудкуваті плями випадкової форми — зерно полотна/штукатурки.
    const blobs = Math.max(4, Math.round(size * 0.35))
    ctx.fillStyle = ink
    for (let i = 0; i < blobs; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * r * 0.8
      const br = r * (0.18 + Math.random() * 0.35)
      ctx.globalAlpha = opacity * (0.25 + Math.random() * 0.35)
      ctx.beginPath()
      ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, br, br * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (brushType === 'paint') {
    // Фарба/гуаш: густий непрозорий мазок із ледь помітними світлішими й
    // темнішими крапками пігменту — нерівномірність густої фарби.
    ctx.globalAlpha = opacity
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    const flecks = Math.max(2, Math.round(size * 0.25))
    for (let i = 0; i < flecks; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * r * 0.75
      const s = r * (0.15 + Math.random() * 0.25)
      ctx.globalAlpha = opacity * 0.18
      ctx.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#000000'
      ctx.beginPath()
      ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (brushType === 'lace') {
    // Ажур: розетка з дрібних крапок навколо центра — мереживний візерунок.
    ctx.fillStyle = ink
    const petals = 6
    const pr = r * 0.8
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2
      ctx.globalAlpha = opacity * 0.85
      ctx.beginPath()
      ctx.arc(x + Math.cos(a) * pr, y + Math.sin(a) * pr, Math.max(1, r * 0.14), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = opacity * 0.6
    ctx.beginPath()
    ctx.arc(x, y, Math.max(1, r * 0.12), 0, Math.PI * 2)
    ctx.fill()
  } else if (brushType === 'grass') {
    // Трава: кілька тонких вигнутих стеблинок, здебільшого вгору з розкидом.
    const blades = Math.max(2, Math.round(size * 0.3))
    ctx.strokeStyle = ink
    ctx.lineCap = 'round'
    for (let i = 0; i < blades; i++) {
      const baseA = -Math.PI / 2 + (Math.random() - 0.5) * 1.4
      const len = r * (0.7 + Math.random() * 0.9)
      const bx = x + (Math.random() - 0.5) * r * 0.6
      const by = y + (Math.random() - 0.5) * r * 0.6
      const lean = (Math.random() - 0.5) * 0.6
      ctx.globalAlpha = opacity * (0.5 + Math.random() * 0.4)
      ctx.lineWidth = Math.max(0.6, size * 0.05)
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.quadraticCurveTo(
        bx + Math.cos(baseA) * len * 0.5,
        by + Math.sin(baseA) * len * 0.5,
        bx + Math.cos(baseA + lean) * len,
        by + Math.sin(baseA + lean) * len
      )
      ctx.stroke()
    }
  } else if (brushType === 'fur') {
    // Хутро: багато коротких тонких ворсинок у різні боки — пухнаста текстура.
    const hairs = Math.max(5, Math.round(size * 0.6))
    ctx.strokeStyle = ink
    ctx.lineCap = 'round'
    for (let i = 0; i < hairs; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * r * 0.5
      const len = r * (0.3 + Math.random() * 0.5)
      const sx = x + Math.cos(a) * d
      const sy = y + Math.sin(a) * d
      ctx.globalAlpha = opacity * (0.3 + Math.random() * 0.4)
      ctx.lineWidth = Math.max(0.5, size * 0.04)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len)
      ctx.stroke()
    }
  } else if (brushType === 'hair') {
    // Волосся: довші хвилясті пасма, впорядкованіші й витягнутіші, ніж хутро.
    const strands = Math.max(2, Math.round(size * 0.22))
    ctx.strokeStyle = ink
    ctx.lineCap = 'round'
    for (let i = 0; i < strands; i++) {
      const a = (Math.random() - 0.5) * 0.9 - Math.PI / 2
      const len = r * (1.4 + Math.random() * 1.1)
      const sx = x + (Math.random() - 0.5) * r * 0.7
      const sy = y + (Math.random() - 0.5) * r * 0.7
      const wig = (Math.random() - 0.5) * len * 0.35
      ctx.globalAlpha = opacity * (0.4 + Math.random() * 0.35)
      ctx.lineWidth = Math.max(0.5, size * 0.035)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.quadraticCurveTo(
        sx + Math.cos(a) * len * 0.5 + wig,
        sy + Math.sin(a) * len * 0.5,
        sx + Math.cos(a) * len,
        sy + Math.sin(a) * len
      )
      ctx.stroke()
    }
  } else {
    // 'hard' — чіткий круглий штамп, базовий пензель.
    ctx.globalAlpha = opacity
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// Відстань між штампами вздовж мазка — своя для кожного типу пензля, щоб
// великі мотиви (ажур, волосся) лишались окремими, а не зливались у пляму.
const STEP_MULT = {
  spray: 0.2,
  texture: 0.3,
  lace: 0.9,
  grass: 0.4,
  fur: 0.3,
  hair: 0.55,
}

// Мазок від (x0,y0) до (x1,y1): для твердого/м'якого пензля — швидкий
// суцільний path-стрік; для текстурних пензлів — серія штампів уздовж
// лінії (справжнє stamping, та сама техніка, що й у реальних
// растрових редакторах для текстурних кистей).
export function strokeSegment(ctx, x0, y0, x1, y1, opts) {
  const { size, brushType = 'hard' } = opts
  if (brushType === 'hard' || brushType === 'soft') {
    const { color, opacity, erase } = opts
    ctx.save()
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
    ctx.globalAlpha = opacity
    ctx.strokeStyle = color
    ctx.lineWidth = size
    if (brushType === 'soft') {
      ctx.shadowColor = erase ? '#000000' : color
      ctx.shadowBlur = size * 0.4
    }
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.restore()
    return
  }
  const dist = Math.hypot(x1 - x0, y1 - y0)
  const stepMult = STEP_MULT[brushType] ?? 0.16
  const step = Math.max(1, size * stepMult)
  const count = Math.max(1, Math.ceil(dist / step))
  for (let i = 0; i <= count; i++) {
    const t = i / count
    stampDab(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, opts)
  }
}

export function dot(ctx, x, y, opts) {
  strokeSegment(ctx, x, y, x + 0.01, y + 0.01, opts)
}

// ---------- Фігури (shapes) ----------

export function drawShape(ctx, type, x0, y0, x1, y1, { color, opacity, filled, lineWidth }) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  const w = x1 - x0, h = y1 - y0
  ctx.beginPath()
  if (type === 'line') {
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
  } else if (type === 'rect') {
    ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(w), Math.abs(h))
  } else if (type === 'circle') {
    const rx = Math.abs(w) / 2, ry = Math.abs(h) / 2
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  } else if (type === 'triangle') {
    ctx.moveTo(cx, y0)
    ctx.lineTo(x1, y1)
    ctx.lineTo(x0, y1)
    ctx.closePath()
  } else if (type === 'star') {
    const spikes = 5
    const outerR = Math.max(Math.abs(w), Math.abs(h)) / 2
    const innerR = outerR * 0.42
    let rot = -Math.PI / 2
    const step = Math.PI / spikes
    ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
    for (let i = 0; i < spikes; i++) {
      rot += step
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
      rot += step
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
    }
    ctx.closePath()
  }
  if (type !== 'line') {
    if (filled) ctx.fill()
    ctx.stroke()
  } else {
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  ctx.restore()
}

// ---------- Текст ----------

export function drawText(ctx, text, x, y, { color, opacity, fontSize, rotation, scaleX, scaleY, fontFamily }) {
  if (!text) return
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(scaleX, scaleY)
  ctx.font = `${fontSize}px ${fontFamily || 'sans-serif'}`
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

// ---------- Кольорове коло (hue/saturation wheel + окремий повзунок Value) ----------

export function drawColorWheel(canvas, size) {
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  const cx = size / 2, cy = size / 2, R = size / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      const idx = (y * size + x) * 4
      if (d > R) { img.data[idx + 3] = 0; continue }
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI
      if (angle < 0) angle += 360
      const sat = Math.min(100, (d / R) * 100)
      const { r, g, b } = hsvToRgb(angle, sat, 100)
      img.data[idx] = r
      img.data[idx + 1] = g
      img.data[idx + 2] = b
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

export function pickFromWheel(size, localX, localY) {
  const cx = size / 2, cy = size / 2, R = size / 2
  const dx = localX - cx, dy = localY - cy
  const d = Math.min(R, Math.sqrt(dx * dx + dy * dy))
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI
  if (angle < 0) angle += 360
  return { hue: angle, sat: (d / R) * 100 }
}

export function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v)
  return rgbToHex(Math.round(r), Math.round(g), Math.round(b))
}

export function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/png')
}

// Переводить клієнтські координати курсора в логічні координати полотна
// (0..logicalWidth / 0..logicalHeight), незалежно від того, яким реально
// є CSS-розмір canvas на екрані зараз (вузька колонка студії чи весь
// екран — рендерений розмір може бути геть іншим за внутрішню роздільну
// здатність).
export function pointFromEvent(canvas, e, logicalWidth, logicalHeight) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = logicalWidth / rect.width
  const scaleY = logicalHeight / rect.height
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
}
