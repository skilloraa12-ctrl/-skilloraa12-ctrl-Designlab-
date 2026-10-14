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

// Одна звужена «травинка/волосинка»: заповнена форма від основи (ширша)
// до вістря (вузька), із легким вигином — на відміну від рівномірної лінії
// це справжній конус, який читається як окрема ворсинка/стеблинка, а не
// намистинки штрихів, що зливаються в суцільну пляму.
function drawTaperedBlade(ctx, bx, by, angle, len, baseWidth, curveAmount) {
  const tipX = bx + Math.cos(angle) * len
  const tipY = by + Math.sin(angle) * len
  const perp = angle + Math.PI / 2
  const midX = bx + Math.cos(angle) * len * 0.55 + Math.cos(perp) * curveAmount
  const midY = by + Math.sin(angle) * len * 0.55 + Math.sin(perp) * curveAmount
  const hw = baseWidth / 2
  ctx.beginPath()
  ctx.moveTo(bx - Math.cos(perp) * hw, by - Math.sin(perp) * hw)
  ctx.quadraticCurveTo(
    midX - Math.cos(perp) * hw * 0.35, midY - Math.sin(perp) * hw * 0.35,
    tipX, tipY
  )
  ctx.quadraticCurveTo(
    midX + Math.cos(perp) * hw * 0.35, midY + Math.sin(perp) * hw * 0.35,
    bx + Math.cos(perp) * hw, by + Math.sin(perp) * hw
  )
  ctx.closePath()
  ctx.fill()
}

// Один штамп пензля в точці (x,y) — форма штампа залежить від brushType:
// кожен тип дає реально інший малюнок пікселів (перевірено в Playwright),
// а не той самий штрих перефарбований.
function stampDab(ctx, x, y, { size, color, opacity, erase, brushType, dirAngle }) {
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
    // Фарба/гуаш: кілька витягнутих уздовж мазка еліпсів із напрямком
    // ворсу пензля — читається як рельєфні гребені густої фарби, а не
    // рівне коло з випадковими цятками.
    const dir = dirAngle ?? 0
    const ridges = 3
    for (let i = 0; i < ridges; i++) {
      const off = (i - (ridges - 1) / 2) * r * 0.5
      const perp = dir + Math.PI / 2
      const ox = x + Math.cos(perp) * off
      const oy = y + Math.sin(perp) * off
      ctx.globalAlpha = opacity * (0.75 + Math.random() * 0.2)
      ctx.fillStyle = ink
      ctx.save()
      ctx.translate(ox, oy)
      ctx.rotate(dir)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * (0.55 + Math.random() * 0.15), r * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    // темніша тінь знизу-збоку для відчуття товщини мазка
    ctx.globalAlpha = opacity * 0.14
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.ellipse(x + r * 0.15, y + r * 0.25, r * 0.85, r * 0.5, dir, 0, Math.PI * 2)
    ctx.fill()
  } else if (brushType === 'lace') {
    // Ажур: ряд з'єднаних дрібних дуг (фестонів) з акцентними вузликами
    // між ними — справжній мереживний край, а не розкидані крапки.
    const perp = (dirAngle ?? 0) + Math.PI / 2
    const scallopR = Math.max(1.5, r * 0.45)
    ctx.strokeStyle = ink
    ctx.fillStyle = ink
    ctx.lineWidth = Math.max(0.8, r * 0.1)
    ctx.globalAlpha = opacity * 0.85
    ctx.beginPath()
    ctx.arc(x, y, scallopR, perp, perp + Math.PI)
    ctx.stroke()
    ctx.globalAlpha = opacity * 0.9
    ctx.beginPath()
    ctx.arc(x + Math.cos(perp + Math.PI / 2) * scallopR * 1.05, y + Math.sin(perp + Math.PI / 2) * scallopR * 1.05, Math.max(1, r * 0.1), 0, Math.PI * 2)
    ctx.fill()
  } else if (brushType === 'grass') {
    // Трава: звужені стеблинки-клини, що ростуть угору з розкидом і
    // легким вигином — не однакові лінії, а форма справжньої травинки.
    const blades = Math.max(2, Math.round(size * 0.22))
    ctx.fillStyle = ink
    for (let i = 0; i < blades; i++) {
      const baseA = -Math.PI / 2 + (Math.random() - 0.5) * 1.1
      const len = r * (0.9 + Math.random() * 1.1)
      const bx = x + (Math.random() - 0.5) * r * 0.7
      const by = y + r * 0.35 + Math.random() * r * 0.2
      const curve = (Math.random() - 0.5) * len * 0.45
      ctx.globalAlpha = opacity * (0.6 + Math.random() * 0.35)
      drawTaperedBlade(ctx, bx, by, baseA, len, Math.max(1, size * 0.1), curve)
    }
  } else if (brushType === 'fur') {
    // Хутро: густі короткі звужені ворсинки, що лежать упоперек мазка
    // (як шерсть, яку «розчісує» рух пензля), з невеликим розкидом кутів.
    const dir = (dirAngle ?? -Math.PI / 2) + Math.PI / 2
    const hairs = Math.max(6, Math.round(size * 0.55))
    ctx.fillStyle = ink
    for (let i = 0; i < hairs; i++) {
      const a = dir + (Math.random() - 0.5) * 1.3
      const len = r * (0.45 + Math.random() * 0.55)
      const d = (Math.random() - 0.5) * r * 1.1
      const perp0 = dir - Math.PI / 2
      const sx = x + Math.cos(perp0) * d
      const sy = y + Math.sin(perp0) * d
      const curve = (Math.random() - 0.5) * len * 0.3
      ctx.globalAlpha = opacity * (0.35 + Math.random() * 0.3)
      drawTaperedBlade(ctx, sx, sy, a, len, Math.max(0.6, size * 0.045), curve)
    }
  } else if (brushType === 'hair') {
    // Волосся: небагато довгих плавних пасм, що течуть уздовж напрямку
    // мазка з м'яким вигином, плюс тонкий світліший блиск на кожному —
    // чітко відрізняється від густого радіального хутра чи трави.
    const dir = dirAngle ?? -Math.PI / 2
    const strands = Math.max(2, Math.round(size * 0.14))
    for (let i = 0; i < strands; i++) {
      const a = dir + (Math.random() - 0.5) * 0.35
      const len = r * (1.8 + Math.random() * 1.3)
      const off = (Math.random() - 0.5) * r * 1.2
      const perp = dir + Math.PI / 2
      const sx = x + Math.cos(perp) * off
      const sy = y + Math.sin(perp) * off
      const curve = (Math.random() - 0.5) * len * 0.3
      const tipX = sx + Math.cos(a) * len
      const tipY = sy + Math.sin(a) * len
      const midX = sx + Math.cos(a) * len * 0.5 + Math.cos(perp) * curve
      const midY = sy + Math.sin(a) * len * 0.5 + Math.sin(perp) * curve
      ctx.lineCap = 'round'
      ctx.strokeStyle = ink
      ctx.globalAlpha = opacity * (0.55 + Math.random() * 0.3)
      ctx.lineWidth = Math.max(0.6, size * 0.03)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.quadraticCurveTo(midX, midY, tipX, tipY)
      ctx.stroke()
      // тонкий світліший блиск уздовж тієї ж дуги, трохи зміщений
      ctx.strokeStyle = '#ffffff'
      ctx.globalAlpha = opacity * 0.18
      ctx.lineWidth = Math.max(0.4, size * 0.012)
      ctx.beginPath()
      ctx.moveTo(sx + Math.cos(perp) * 0.6, sy + Math.sin(perp) * 0.6)
      ctx.quadraticCurveTo(midX + Math.cos(perp) * 0.6, midY + Math.sin(perp) * 0.6, tipX, tipY)
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
  paint: 0.22,
  lace: 0.85,
  grass: 0.32,
  fur: 0.22,
  hair: 0.45,
}

// Типи, чия форма залежить від напрямку мазка (фарба лягає вздовж руху
// пензля, хутро «розчісується» мазком, волосся й ажур течуть за лінією).
const DIR_AWARE = new Set(['paint', 'lace', 'grass', 'fur', 'hair'])

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
  const dirOpts = DIR_AWARE.has(brushType)
    ? { ...opts, dirAngle: dist > 0.5 ? Math.atan2(y1 - y0, x1 - x0) : (opts.dirAngle ?? -Math.PI / 2) }
    : opts
  for (let i = 0; i <= count; i++) {
    const t = i / count
    stampDab(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, dirOpts)
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
