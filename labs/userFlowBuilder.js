// Pure data/helpers for User Flow Lab: node catalogs, ready-made flow
// templates, array reordering, and journey-map point plotting.

export const NODE_TYPES = [
  { key: 'start', icon: '▶', label: 'Старт' },
  { key: 'screen', icon: '▭', label: 'Екран' },
  { key: 'action', icon: '⚡', label: 'Дія' },
  { key: 'end', icon: '⏹', label: 'Кінець' },
]

export const FLOW_TEMPLATES = [
  { key: 'onboarding', icon: '👋', label: 'Онбординг', steps: ['start', 'screen', 'screen', 'action', 'end'] },
  { key: 'checkout', icon: '🛒', label: 'Чекаут', steps: ['start', 'screen', 'action', 'screen', 'action', 'end'] },
  { key: 'login', icon: '🔐', label: 'Логін', steps: ['start', 'screen', 'action', 'end'] },
  { key: 'reset', icon: '🔁', label: 'Скидання пароля', steps: ['start', 'screen', 'action', 'screen', 'end'] },
]

// Only "Екран"/"Дія" nodes realistically need error/empty/loading states —
// "Старт" and "Кінець" are terminal markers, not states that load data or
// can fail.
export const EDGE_CASE_NODE_TYPES = ['screen', 'action']
export const EDGE_CASE_KEYS = ['loading', 'empty', 'error']

// Coverage = how many of (relevant node × edge-case type) combinations are
// marked as designed. A flow that's fully covered for the happy path but
// 0% here still has three undesigned states per screen waiting to surprise
// either the developer (who has to guess) or the user (who hits a blank
// screen with no explanation).
export function edgeCaseCoverage(items, covered) {
  const relevant = items.filter((it) => EDGE_CASE_NODE_TYPES.includes(it.type))
  const total = relevant.length * EDGE_CASE_KEYS.length
  let done = 0
  for (const it of relevant) {
    for (const key of EDGE_CASE_KEYS) {
      if (covered[it.id]?.[key]) done += 1
    }
  }
  return { relevant, total, done, pct: total > 0 ? (done / total) * 100 : 0 }
}

export function moveItem(arr, index, dir) {
  const next = [...arr]
  const target = index + dir
  if (target < 0 || target >= next.length) return arr
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

// Scales stage mood values (moodMin..moodMax) into an SVG-ready polyline
// across a W x H box. Returns points with pixel coords plus an SVG path.
export function buildJourneyPlot(stages, W, H, moodMin = -2, moodMax = 2) {
  const n = stages.length
  const stepX = n > 1 ? W / (n - 1) : 0
  const points = stages.map((s, i) => {
    const x = n > 1 ? i * stepX : W / 2
    const t = (s.mood - moodMin) / (moodMax - moodMin)
    const y = H - t * H
    return { x, y, mood: s.mood, label: s.label }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return { path, points }
}

// Conversion funnel: each step has a continueRate (0..1) — the share of
// the PREVIOUS step's audience that proceeds. Returns cumulative % of the
// original 100 remaining at each step, plus which step lost the most
// people (the step with the lowest continueRate).
export function computeFunnel(steps) {
  let remaining = 100
  let worstIndex = -1
  let worstRate = 1
  const rows = steps.map((s, i) => {
    const before = remaining
    remaining = remaining * s.continueRate
    if (i > 0 && s.continueRate < worstRate) { worstRate = s.continueRate; worstIndex = i }
    return { ...s, before, after: remaining, lostPct: before - remaining }
  })
  return { rows, finalPct: remaining, worstIndex }
}
