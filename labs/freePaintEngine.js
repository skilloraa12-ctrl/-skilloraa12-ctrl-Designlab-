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
  { key: 'neon', label: 'Неон', icon: '⚡' },
]

// Варіанти (підтипи) кожного пензля — обирається рядком під типами
// пензлів. Кожен варіант реально змінює рендеринг (множники розміру/
// прозорості/розкиду, інший візерунок чи фіксований колір матеріалу),
// а не просто перейменовує той самий штрих.
export const BRUSH_VARIANTS = {
  hard: [
    { key: 'thin', label: 'Тонка', sizeMul: 0.45 },
    { key: 'medium', label: 'Середня', sizeMul: 0.85 },
    { key: 'thick', label: 'Товста', sizeMul: 1.4 },
    { key: 'cartoon', label: 'Мультяшний контур', sizeMul: 1.15, outline: true },
  ],
  soft: [
    { key: 'light', label: 'Легка', alphaMul: 0.45, blurMul: 0.7 },
    { key: 'medium', label: 'Середня', alphaMul: 0.85, blurMul: 1 },
    { key: 'wide', label: 'Широка', sizeMul: 1.7, blurMul: 1.1 },
    { key: 'airbrush', label: 'Аерограф', alphaMul: 0.3, blurMul: 2.4 },
  ],
  pencil: [
    { key: 'hb', label: 'HB', alphaMul: 0.55 },
    { key: '2b', label: '2B', alphaMul: 0.95, speckMul: 1.5 },
    { key: 'colored', label: 'Кольоровий', softEdge: true },
    { key: 'mechanical', label: 'Механічний', sizeMul: 0.5, speckMul: 0.4 },
  ],
  watercolor: [
    { key: 'wetfill', label: 'Мокра заливка', alphaMul: 0.28, spreadMul: 1.3 },
    { key: 'gradient', label: 'Градієнт', gradient: true },
    { key: 'grainy', label: 'Зерниста', grainy: true },
    { key: 'wetwet', label: 'По вологому', alphaMul: 0.12, spreadMul: 1.9 },
  ],
  chalk: [
    { key: 'coarse', label: 'Груба', speckMul: 1.5, speckSize: 1.7 },
    { key: 'pastel', label: 'Пастель', alphaMul: 0.5 },
    { key: 'charcoal', label: 'Вугілля', alphaMul: 0.95, speckSize: 0.75 },
    { key: 'wax', label: 'Воскова', alphaMul: 0.8, speckMul: 0.6, speckSize: 2.2 },
  ],
  ink: [
    { key: 'pen', label: 'Перо', widthVary: true },
    { key: 'liner', label: 'Лайнер', sizeMul: 0.55 },
    { key: 'brush', label: 'Кисть', widthVary: true, sizeMul: 1.3 },
    { key: 'drybrush', label: 'Суха кисть', dry: true },
  ],
  hatch: [
    { key: 'diagonal', label: 'Діагональне', angleDeg: 45 },
    { key: 'cross', label: 'Перехресне', cross: true },
    { key: 'vertical', label: 'Вертикальне', angleDeg: 90 },
    { key: 'freehand', label: 'Від руки', angleDeg: 45, jitter: true },
  ],
  spray: [
    { key: 'normal', label: 'Звичайний' },
    { key: 'thinNozzle', label: 'Тонке сопло', spreadMul: 0.5, dotMul: 0.6 },
    { key: 'wide', label: 'Широкий', spreadMul: 1.7 },
    { key: 'drips', label: 'З патьоками', drips: true },
  ],
  texture: [
    { key: 'paper', label: 'Папір' },
    { key: 'linear', label: 'Лінійний растр', linear: true },
    { key: 'grain', label: 'Зерно', fine: true },
    { key: 'squares', label: 'Квадрати', squares: true },
  ],
  paint: [
    { key: 'oil', label: 'Масло' },
    { key: 'gouache', label: 'Гуаш', flat: true },
    { key: 'acrylic', label: 'Акрил', glossy: true },
    { key: 'relief', label: 'Рельєфний мазок', relief: true },
  ],
  lace: [
    { key: 'leaves', label: 'Листочки', shape: 'leaf' },
    { key: 'chevron', label: 'Шеврон', shape: 'chevron' },
    { key: 'mesh', label: 'Сітка-кружалець', shape: 'mesh' },
    { key: 'rhombus', label: 'Ромби', shape: 'rhombus' },
    { key: 'waves', label: 'Хвилі', shape: 'wave' },
  ],
  grass: [
    { key: 'lawn', label: 'Газон', lenMul: 0.55, densMul: 1.3 },
    { key: 'tall', label: 'Висока', lenMul: 1.9 },
    { key: 'flowers', label: 'З квітами', flowers: true },
    { key: 'autumn', label: 'Осіння', autumn: true },
  ],
  fur: [
    { key: 'ginger', label: 'Руде', fixedColor: '#c1662b' },
    { key: 'silky', label: 'Довге шовковисте', lenMul: 1.9, silky: true },
    { key: 'gray', label: 'Сіре', fixedColor: '#9a9a9a' },
    { key: 'fluffyWhite', label: 'Пухнасте біле', fixedColor: '#f0f0f0' },
    { key: 'tiger', label: 'Тигрове', tiger: true },
  ],
  hair: [
    { key: 'straight', label: 'Пряме' },
    { key: 'lightWave', label: 'Легка хвиля', waveMul: 0.6 },
    { key: 'wavy', label: 'Хвилясте', waveMul: 1.4 },
    { key: 'curly', label: 'Кучеряве', curl: true, curlSize: 1 },
    { key: 'smallCurls', label: 'Дрібні кучері', curl: true, curlSize: 0.5 },
  ],
  neon: [
    { key: 'green', label: 'Зелений', fixedColor: '#39ff8a' },
    { key: 'pink', label: 'Рожевий', fixedColor: '#ff3fb0' },
    { key: 'blue', label: 'Блакитний', fixedColor: '#39c8ff' },
    { key: 'tube', label: 'Трубка', tube: true },
    { key: 'electric', label: 'Електрика', jitterLine: true },
  ],
}

export function getVariant(brushType, variantKey) {
  const list = BRUSH_VARIANTS[brushType]
  if (!list) return {}
  return list.find((v) => v.key === variantKey) || list[0]
}

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
function stampDab(ctx, x, y, { size, color, opacity, erase, brushType, dirAngle, variant: variantKey }) {
  const variant = getVariant(brushType, variantKey)
  const r = (size * (variant.sizeMul ?? 1)) / 2
  const opacityMul = variant.alphaMul ?? 1
  ctx.save()
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
  const ink = erase ? '#000000' : (variant.fixedColor || color)
  if (brushType === 'pencil') {
    // Зерниста текстура: багато дрібних крапок у випадковому місці
    // всередині радіуса з випадковою прозорістю — графітне зерно.
    if (variant.softEdge) {
      ctx.globalAlpha = opacity * opacityMul * 0.1
      ctx.fillStyle = ink
      ctx.beginPath()
      ctx.arc(x, y, r * 0.9, 0, Math.PI * 2)
      ctx.fill()
    }
    const specks = Math.max(3, Math.round(size * 0.7 * (variant.speckMul ?? 1)))
    for (let i = 0; i < specks; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * r
      ctx.globalAlpha = opacity * opacityMul * (0.12 + Math.random() * 0.35)
      ctx.fillStyle = ink
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1, 1)
    }
  } else if (brushType === 'watercolor') {
    // М'яка напівпрозора пляма з невеликим дрейфом центра — мазки, що
    // накладаючись одне на одного, дають ефект розмитої акварелі.
    const spreadMul = variant.spreadMul ?? 1
    if (variant.gradient) {
      ctx.globalAlpha = opacity * opacityMul * 0.1
      ctx.fillStyle = ink
      ctx.beginPath()
      ctx.arc(x, y, r * 1.1 * spreadMul, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = opacity * opacityMul * 0.22
      ctx.beginPath()
      ctx.arc(x, y, r * 0.55, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.globalAlpha = opacity * opacityMul * 0.14
      ctx.fillStyle = ink
      const jx = (Math.random() - 0.5) * r * 0.5
      const jy = (Math.random() - 0.5) * r * 0.5
      ctx.beginPath()
      ctx.arc(x + jx, y + jy, r * spreadMul * (0.8 + Math.random() * 0.35), 0, Math.PI * 2)
      ctx.fill()
    }
    if (variant.grainy) {
      const specks = Math.max(3, Math.round(size * 0.4))
      ctx.fillStyle = ink
      for (let i = 0; i < specks; i++) {
        const a = Math.random() * Math.PI * 2
        const d = Math.random() * r
        ctx.globalAlpha = opacity * 0.15
        ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1, 1)
      }
    }
  } else if (brushType === 'chalk') {
    // Крупніша, рідша крапкова текстура, ніж олівець — крейдяна зернистість.
    const speckSize = variant.speckSize ?? 1
    const specks = Math.max(4, Math.round(size * 0.9 * (variant.speckMul ?? 1)))
    for (let i = 0; i < specks; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * r
      const s = (1 + Math.random() * 1.6) * speckSize
      ctx.globalAlpha = opacity * opacityMul * (0.25 + Math.random() * 0.4)
      ctx.fillStyle = ink
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s)
    }
  } else if (brushType === 'hatch') {
    // Штрихування: один чи два набори паралельних ліній під заданим
    // кутом — «Перехресне» додає другий набір упоперек першого.
    const angle = ((variant.angleDeg ?? 45) * Math.PI) / 180
    ctx.strokeStyle = ink
    ctx.lineWidth = Math.max(1, size * 0.12)
    const drawSet = (ang) => {
      const dx = Math.cos(ang), dy = Math.sin(ang)
      const offA = ang + Math.PI / 2
      for (let i = -1; i <= 1; i++) {
        const jitter = variant.jitter ? (Math.random() - 0.5) * size * 0.15 : 0
        const off = i * size * 0.32 + jitter
        ctx.globalAlpha = opacity * 0.55 * (variant.jitter ? (0.7 + Math.random() * 0.3) : 1)
        ctx.beginPath()
        ctx.moveTo(x - dx * r + Math.cos(offA) * off, y - dy * r + Math.sin(offA) * off)
        ctx.lineTo(x + dx * r + Math.cos(offA) * off, y + dy * r + Math.sin(offA) * off)
        ctx.stroke()
      }
    }
    drawSet(angle)
    if (variant.cross) drawSet(angle + Math.PI / 2)
  } else if (brushType === 'ink') {
    // Чіткий суцільний штамп; «Перо»/«Кисть» злегка варіюють товщину за
    // штампом (імітація натиску), «Суха кисть» — рвана зерниста текстура.
    if (variant.dry) {
      const specks = Math.max(6, Math.round(size * 1.1))
      ctx.fillStyle = ink
      for (let i = 0; i < specks; i++) {
        const a = Math.random() * Math.PI * 2
        const d = Math.random() * r
        const s = 0.8 + Math.random() * 1.4
        ctx.globalAlpha = opacity * (0.3 + Math.random() * 0.5)
        ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s)
      }
    } else {
      const rr = variant.widthVary ? r * (0.7 + Math.random() * 0.5) : r
      ctx.globalAlpha = opacity
      ctx.fillStyle = ink
      ctx.beginPath()
      ctx.arc(x, y, rr, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (brushType === 'soft') {
    ctx.globalAlpha = opacity * opacityMul
    ctx.shadowColor = ink
    ctx.shadowBlur = r * 0.8 * (variant.blurMul ?? 1)
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
    ctx.fill()
  } else if (brushType === 'spray') {
    // Балончик: випадкові крапки по колу, густіше ближче до центра — аерограф.
    const spreadMul = variant.spreadMul ?? 1
    const dotMul = variant.dotMul ?? 1
    const dots = Math.max(6, Math.round(size * 1.4))
    ctx.fillStyle = ink
    for (let i = 0; i < dots; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.sqrt(Math.random()) * r * spreadMul
      const s = (0.6 + Math.random() * 1.2) * dotMul
      ctx.globalAlpha = opacity * (0.2 + Math.random() * 0.4)
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s)
    }
    if (variant.drips && Math.random() < 0.08) {
      const dripLen = r * (1.5 + Math.random() * 2)
      ctx.globalAlpha = opacity * 0.5
      ctx.strokeStyle = ink
      ctx.lineWidth = 1 + Math.random()
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + dripLen)
      ctx.stroke()
    }
  } else if (brushType === 'texture') {
    // Текстура: нерівні грудкуваті плями (папір/зерно) або впорядкований
    // лінійний/квадратний растр — геть інший принцип розкладки.
    if (variant.linear) {
      ctx.strokeStyle = ink
      ctx.lineWidth = Math.max(0.6, size * 0.03)
      const lines = Math.max(3, Math.round(size * 0.3))
      for (let i = 0; i < lines; i++) {
        const off = (i / lines - 0.5) * r * 2
        ctx.globalAlpha = opacity * (0.2 + Math.random() * 0.3)
        ctx.beginPath()
        ctx.moveTo(x - r, y + off)
        ctx.lineTo(x + r, y + off + (Math.random() - 0.5) * 2)
        ctx.stroke()
      }
    } else if (variant.squares) {
      const n = Math.max(3, Math.round(size * 0.25))
      ctx.fillStyle = ink
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const d = Math.random() * r * 0.8
        const s = r * (0.12 + Math.random() * 0.18)
        ctx.globalAlpha = opacity * (0.2 + Math.random() * 0.3)
        ctx.fillRect(x + Math.cos(a) * d - s / 2, y + Math.sin(a) * d - s / 2, s, s)
      }
    } else {
      const fine = variant.fine
      const blobs = Math.max(4, Math.round(size * (fine ? 0.6 : 0.35)))
      ctx.fillStyle = ink
      for (let i = 0; i < blobs; i++) {
        const a = Math.random() * Math.PI * 2
        const d = Math.random() * r * 0.8
        const br = r * (fine ? 0.08 + Math.random() * 0.14 : 0.18 + Math.random() * 0.35)
        ctx.globalAlpha = opacity * (0.25 + Math.random() * 0.35)
        ctx.beginPath()
        ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, br, br * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (brushType === 'paint') {
    // Фарба/гуаш: кілька витягнутих уздовж мазка еліпсів із напрямком
    // ворсу пензля — читається як рельєфні гребені густої фарби, а не
    // рівне коло з випадковими цятками. «Гуаш» — пласкіше, «Акрил» — з
    // глянцевим відблиском, «Рельєфний мазок» — товщі гребені.
    const dir = dirAngle ?? 0
    const ridges = variant.relief ? 4 : (variant.flat ? 1 : 3)
    for (let i = 0; i < ridges; i++) {
      const off = (i - (ridges - 1) / 2) * r * 0.5
      const perp = dir + Math.PI / 2
      const ox = x + Math.cos(perp) * off
      const oy = y + Math.sin(perp) * off
      ctx.globalAlpha = opacity * (variant.flat ? 0.95 : (0.75 + Math.random() * 0.2))
      ctx.fillStyle = ink
      ctx.save()
      ctx.translate(ox, oy)
      ctx.rotate(dir)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * (0.55 + Math.random() * 0.15), r * (variant.relief ? 0.48 : 0.4), 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    ctx.globalAlpha = opacity * (variant.relief ? 0.22 : 0.14)
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.ellipse(x + r * 0.15, y + r * 0.25, r * 0.85, r * 0.5, dir, 0, Math.PI * 2)
    ctx.fill()
    if (variant.glossy) {
      ctx.globalAlpha = opacity * 0.25
      ctx.fillStyle = '#ffffff'
      ctx.save()
      ctx.translate(x - r * 0.2, y - r * 0.3)
      ctx.rotate(dir)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.3, r * 0.1, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  } else if (brushType === 'lace') {
    // Ажур: кілька справжніх мереживних мотивів — фестони-«сітка»,
    // листочки, шеврон-зигзаг, ромби чи суцільна хвиля — а не крапки.
    const dir = dirAngle ?? 0
    const perp = dir + Math.PI / 2
    const shape = variant.shape || 'mesh'
    ctx.strokeStyle = ink
    ctx.fillStyle = ink
    ctx.lineWidth = Math.max(0.8, r * 0.12)
    if (shape === 'leaf') {
      const side = Math.random() < 0.5 ? 1 : -1
      const lx = x + Math.cos(perp) * r * 0.5 * side
      const ly = y + Math.sin(perp) * r * 0.5 * side
      ctx.globalAlpha = opacity * 0.85
      ctx.save()
      ctx.translate(lx, ly)
      ctx.rotate(dir)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.5, r * 0.22, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else if (shape === 'chevron') {
      const w = r * 0.55
      ctx.globalAlpha = opacity * 0.85
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(dir) * w + Math.cos(perp) * w, y - Math.sin(dir) * w + Math.sin(perp) * w)
      ctx.lineTo(x, y)
      ctx.lineTo(x - Math.cos(dir) * w - Math.cos(perp) * w, y - Math.sin(dir) * w - Math.sin(perp) * w)
      ctx.stroke()
    } else if (shape === 'rhombus') {
      const s = r * 0.34
      ctx.globalAlpha = opacity * 0.85
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(dir)
      ctx.beginPath()
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.7, 0)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    } else if (shape === 'wave') {
      ctx.globalAlpha = opacity * 0.9
      const amp = r * 0.5 * (Math.random() > 0.5 ? 1 : -1)
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(dir) * r, y - Math.sin(dir) * r)
      ctx.quadraticCurveTo(x + Math.cos(perp) * amp, y + Math.sin(perp) * amp, x + Math.cos(dir) * r, y + Math.sin(dir) * r)
      ctx.stroke()
    } else {
      // mesh/«сітка-кружалець» — ряд з'єднаних дрібних дуг-фестонів з
      // акцентним вузликом між ними.
      const scallopR = Math.max(1.5, r * 0.45)
      ctx.globalAlpha = opacity * 0.85
      ctx.beginPath()
      ctx.arc(x, y, scallopR, perp, perp + Math.PI)
      ctx.stroke()
      ctx.globalAlpha = opacity * 0.9
      ctx.beginPath()
      ctx.arc(x + Math.cos(perp + Math.PI / 2) * scallopR * 1.05, y + Math.sin(perp + Math.PI / 2) * scallopR * 1.05, Math.max(1, r * 0.1), 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (brushType === 'grass') {
    // Трава: звужені стеблинки-клини, що ростуть угору з розкидом і
    // легким вигином — не однакові лінії, а форма справжньої травинки.
    // «З квітами» додає зрідка квіткову розетку на вершині, «Осіння» —
    // теплу змінну палітру замість єдиного кольору пензля.
    const lenMul = variant.lenMul ?? 1
    const blades = Math.max(2, Math.round(size * 0.22 * (variant.densMul ?? 1)))
    for (let i = 0; i < blades; i++) {
      const baseA = -Math.PI / 2 + (Math.random() - 0.5) * 1.1
      const len = r * (0.9 + Math.random() * 1.1) * lenMul
      const bx = x + (Math.random() - 0.5) * r * 0.7
      const by = y + r * 0.35 + Math.random() * r * 0.2
      const curve = (Math.random() - 0.5) * len * 0.45
      let bladeInk = ink
      if (variant.autumn) {
        const pal = ['#c1662b', '#d99a2b', '#b4472e', '#8a6a2a']
        bladeInk = pal[Math.floor(Math.random() * pal.length)]
      }
      ctx.globalAlpha = opacity * (0.6 + Math.random() * 0.35)
      ctx.fillStyle = bladeInk
      drawTaperedBlade(ctx, bx, by, baseA, len, Math.max(1, size * 0.1), curve)
      if (variant.flowers && Math.random() < 0.12) {
        const tipX = bx + Math.cos(baseA) * len
        const tipY = by + Math.sin(baseA) * len
        ctx.globalAlpha = opacity * 0.85
        ctx.fillStyle = '#f2d24b'
        for (let p = 0; p < 5; p++) {
          const pa = (p / 5) * Math.PI * 2
          ctx.beginPath()
          ctx.arc(tipX + Math.cos(pa) * r * 0.12, tipY + Math.sin(pa) * r * 0.12, Math.max(0.8, r * 0.07), 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  } else if (brushType === 'fur') {
    // Хутро: густі короткі звужені ворсинки, що лежать упоперек мазка.
    // Іменовані колірні варіанти (руде/сіре/біле) фіксують свій відтінок
    // матеріалу; «Тигрове» чергує смугасте забарвлення за позицією.
    const dir = (dirAngle ?? -Math.PI / 2) + Math.PI / 2
    const lenMul = variant.lenMul ?? 1
    const hairs = Math.max(6, Math.round(size * 0.55))
    for (let i = 0; i < hairs; i++) {
      const a = dir + (Math.random() - 0.5) * (variant.silky ? 0.7 : 1.3)
      const len = r * (0.45 + Math.random() * 0.55) * lenMul
      const d = (Math.random() - 0.5) * r * 1.1
      const perp0 = dir - Math.PI / 2
      const sx = x + Math.cos(perp0) * d
      const sy = y + Math.sin(perp0) * d
      const curve = (Math.random() - 0.5) * len * (variant.silky ? 0.15 : 0.3)
      let hairInk = ink
      if (variant.tiger) {
        hairInk = Math.sin((x + y) * 0.25 + d * 0.4) > 0.15 ? '#2a1a0a' : (ink || '#c1662b')
      }
      ctx.fillStyle = hairInk
      ctx.globalAlpha = opacity * (variant.silky ? (0.45 + Math.random() * 0.25) : (0.35 + Math.random() * 0.3))
      drawTaperedBlade(ctx, sx, sy, a, len, Math.max(0.6, size * 0.045), curve)
    }
  } else if (brushType === 'hair') {
    // Волосся: небагато довгих плавних пасм, що течуть уздовж напрямку
    // мазка, плюс тонкий світліший блиск на кожному. «Кучеряве»/«Дрібні
    // кучері» замінюють плавний вигин на кілька хвиль уздовж пасма.
    const dir = dirAngle ?? -Math.PI / 2
    const strands = Math.max(2, Math.round(size * 0.14))
    const waveMul = variant.waveMul ?? 1
    for (let i = 0; i < strands; i++) {
      const a = dir + (Math.random() - 0.5) * 0.35
      const len = r * (1.8 + Math.random() * 1.3)
      const off = (Math.random() - 0.5) * r * 1.2
      const perp = dir + Math.PI / 2
      const sx = x + Math.cos(perp) * off
      const sy = y + Math.sin(perp) * off
      ctx.lineCap = 'round'
      ctx.strokeStyle = ink
      ctx.globalAlpha = opacity * (0.55 + Math.random() * 0.3)
      ctx.lineWidth = Math.max(0.6, size * 0.03)
      if (variant.curl) {
        const curlSize = variant.curlSize ?? 1
        const humps = 3
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        for (let h = 1; h <= humps; h++) {
          const t = h / humps
          const bendSide = h % 2 === 0 ? 1 : -1
          const cx2 = sx + Math.cos(a) * len * (t - 0.5 / humps) + Math.cos(perp) * r * 0.5 * curlSize * bendSide
          const cy2 = sy + Math.sin(a) * len * (t - 0.5 / humps) + Math.sin(perp) * r * 0.5 * curlSize * bendSide
          const ex = sx + Math.cos(a) * len * t
          const ey = sy + Math.sin(a) * len * t
          ctx.quadraticCurveTo(cx2, cy2, ex, ey)
        }
        ctx.stroke()
      } else {
        const curve = (Math.random() - 0.5) * len * 0.3 * waveMul
        const tipX = sx + Math.cos(a) * len
        const tipY = sy + Math.sin(a) * len
        const midX = sx + Math.cos(a) * len * 0.5 + Math.cos(perp) * curve
        const midY = sy + Math.sin(a) * len * 0.5 + Math.sin(perp) * curve
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.quadraticCurveTo(midX, midY, tipX, tipY)
        ctx.stroke()
        ctx.strokeStyle = '#ffffff'
        ctx.globalAlpha = opacity * 0.18
        ctx.lineWidth = Math.max(0.4, size * 0.012)
        ctx.beginPath()
        ctx.moveTo(sx + Math.cos(perp) * 0.6, sy + Math.sin(perp) * 0.6)
        ctx.quadraticCurveTo(midX + Math.cos(perp) * 0.6, midY + Math.sin(perp) * 0.6, tipX, tipY)
        ctx.stroke()
      }
    }
  } else if (brushType === 'neon') {
    // Неон: яскраве світне ядро з розмитим сяйвом навколо (shadowBlur),
    // а не просто насичений колір без glow.
    ctx.globalAlpha = opacity
    ctx.shadowColor = ink
    ctx.shadowBlur = r * (variant.tube ? 1.6 : 2.2)
    ctx.fillStyle = ink
    let px = x, py = y
    if (variant.jitterLine) {
      px += (Math.random() - 0.5) * r * 0.4
      py += (Math.random() - 0.5) * r * 0.4
    }
    ctx.beginPath()
    ctx.arc(px, py, r * (variant.tube ? 0.55 : 0.35), 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.globalAlpha = opacity * 0.9
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(px, py, r * 0.14, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // 'hard' — чіткий круглий штамп, базовий пензель (fallback; зазвичай
    // hard/soft ідуть швидким path-шляхом у strokeSegment нижче).
    ctx.globalAlpha = opacity * opacityMul
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
  const { size, brushType = 'hard', variant: variantKey } = opts
  if (brushType === 'hard' || brushType === 'soft') {
    const { color, opacity, erase } = opts
    const variant = getVariant(brushType, variantKey)
    const w = size * (variant.sizeMul ?? 1)
    const a = opacity * (variant.alphaMul ?? 1)
    ctx.save()
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
    if (variant.outline) {
      // «Мультяшний контур»: товстіша темна обведена лінія під кольоровим
      // мазком — як обведені контури в мультиплікаційному малюнку.
      ctx.globalAlpha = Math.min(1, a * 1.2)
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = w * 1.5
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }
    ctx.globalAlpha = a
    ctx.strokeStyle = erase ? color : (variant.fixedColor || color)
    ctx.lineWidth = w
    if (brushType === 'soft') {
      ctx.shadowColor = erase ? '#000000' : (variant.fixedColor || color)
      ctx.shadowBlur = size * 0.4 * (variant.blurMul ?? 1)
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
