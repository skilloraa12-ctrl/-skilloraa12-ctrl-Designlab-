// Pure helpers for Gradient Lab: CSS string builders for linear/radial/
// conic gradients from a shared "stops" shape ({ color, pos }[], pos in %).

export function sortStops(stops) {
  return [...stops].sort((a, b) => a.pos - b.pos)
}

export function stopsToCssList(stops) {
  return sortStops(stops).map((s) => `${s.color} ${s.pos}%`).join(', ')
}

export function buildLinearCss({ angle, stops }) {
  return `linear-gradient(${angle}deg, ${stopsToCssList(stops)})`
}

export function buildRadialCss({ shape, stops }) {
  return `radial-gradient(${shape} at center, ${stopsToCssList(stops)})`
}

export function buildConicCss({ angle, stops }) {
  return `conic-gradient(from ${angle}deg at center, ${stopsToCssList(stops)})`
}

export const RADIAL_SHAPES = [
  { key: 'circle', label: 'Circle' },
  { key: 'ellipse', label: 'Ellipse' },
]

let stopIdCounter = 0
export function makeStop(color, pos) {
  stopIdCounter += 1
  return { id: `stop-${Date.now()}-${stopIdCounter}`, color, pos }
}

export function defaultStops() {
  return [makeStop('#3E37E0', 0), makeStop('#6B62FF', 100)]
}
