// Pure helpers for Composition Lab: rule of thirds, golden ratio/spiral,
// symmetry mirroring, and visual-balance torque math. No DOM, no React.

export const PHI = (1 + Math.sqrt(5)) / 2 // ≈ 1.618

// --- Rule of thirds ---
export const THIRDS_LINES = [1 / 3, 2 / 3]
export const POWER_POINTS = [
  { x: 1 / 3, y: 1 / 3 }, { x: 2 / 3, y: 1 / 3 },
  { x: 1 / 3, y: 2 / 3 }, { x: 2 / 3, y: 2 / 3 },
]

export function nearestPowerPoint(x, y) {
  let best = null
  let bestDist = Infinity
  for (const p of POWER_POINTS) {
    const d = Math.hypot(p.x - x, p.y - y)
    if (d < bestDist) { bestDist = d; best = p }
  }
  return { point: best, distance: bestDist }
}

// --- Golden ratio grid ---
export const GOLDEN_LINES = [1 - 1 / PHI, 1 / PHI] // ≈ [0.382, 0.618]

// --- Golden (logarithmic) spiral ---
// Equiangular spiral that grows by a factor of PHI every quarter turn —
// the continuous-curve approximation of the classic Fibonacci-square spiral.
export function buildGoldenSpiralPoints(turns) {
  const b = Math.log(PHI) / (Math.PI / 2)
  const totalAngle = turns * 2 * Math.PI
  const step = Math.PI / 60
  const points = []
  for (let theta = 0; theta <= totalAngle; theta += step) {
    const r = Math.exp(b * theta)
    points.push([r * Math.cos(theta), r * Math.sin(theta)])
  }
  return points
}

export function spiralToSvgPath(points, paddingFrac = 0.04) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const w = maxX - minX
  const h = maxY - minY
  const pad = Math.max(w, h) * paddingFrac
  const viewBox = `${minX - pad} ${minY - pad} ${w + 2 * pad} ${h + 2 * pad}`
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ')
  return { d, viewBox }
}

// --- Symmetry painter ---
export const SYMMETRY_AXES = [
  { key: 'vertical', label: 'Вертикальна' },
  { key: 'horizontal', label: 'Горизонтальна' },
  { key: 'both', label: 'Обидві (4 квадранти)' },
]

export function mirrorCells(row, col, rows, cols, axis) {
  const out = []
  const mRow = rows - 1 - row
  const mCol = cols - 1 - col
  if (axis === 'vertical' || axis === 'both') out.push([row, mCol])
  if (axis === 'horizontal' || axis === 'both') out.push([mRow, col])
  if (axis === 'both') out.push([mRow, mCol])
  return out
}

// --- Negative space ---
// A single uniform padding (%) around a square content block approximates
// how much of the frame is "breathing room" vs. content. Not a precise
// design metric — a rough, teachable proxy for a very real intuition.
export function negativeSpaceRatio(paddingPct) {
  const contentFrac = Math.max(0, (100 - 2 * paddingPct) / 100)
  const contentArea = contentFrac * contentFrac
  const spaceRatio = 1 - contentArea
  let rating
  if (spaceRatio < 0.15) rating = 'cramped'
  else if (spaceRatio < 0.55) rating = 'balanced'
  else if (spaceRatio < 0.8) rating = 'airy'
  else rating = 'empty'
  return { spaceRatio, rating }
}

export const NEGATIVE_SPACE_LABELS = {
  cramped: { label: 'Занадто щільно', hint: 'Контент впирається в краї — немає місця "видихнути". Додайте padding.' },
  balanced: { label: 'Збалансовано', hint: 'Типове співвідношення для карток і секцій контенту.' },
  airy: { label: 'Просторо (airy)', hint: 'Багато повітря навколо — підходить для преміальних брендів, hero-секцій.' },
  empty: { label: 'Порожньо', hint: 'Контенту замало відносно простору — переконайтесь, що це навмисний мінімалізм, а не випадковість.' },
}

// --- Visual balance ---
// Each item: { x: signed distance from center (-1..1), weight: 0..1 }.
// Torque = x * weight, summed; net torque near 0 means balanced.
export function calcBalance(items) {
  const torque = items.reduce((sum, it) => sum + it.x * it.weight, 0)
  const maxAbs = items.reduce((sum, it) => sum + Math.abs(it.x) * it.weight, 0) || 1
  const tiltDeg = (torque / maxAbs) * 20 // scale to a readable visual tilt
  return { torque, balanced: Math.abs(torque) < 0.05, tiltDeg }
}
