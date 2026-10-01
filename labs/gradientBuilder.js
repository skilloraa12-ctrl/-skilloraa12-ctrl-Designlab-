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

// Ready-made gradient presets — each one a full {type, angle, shape, stops}
// config that can replace the lab's current state in one click.
export const GRADIENT_PRESETS = [
  { key: 'sunset', icon: '🌅', label: 'Sunset', type: 'linear', angle: 135, stops: [{ color: '#FF9966', pos: 0 }, { color: '#FF5E62', pos: 50 }, { color: '#9D50BB', pos: 100 }] },
  { key: 'ocean', icon: '🌊', label: 'Ocean', type: 'linear', angle: 120, stops: [{ color: '#2193B0', pos: 0 }, { color: '#6DD5ED', pos: 100 }] },
  { key: 'mint', icon: '🌿', label: 'Mint', type: 'linear', angle: 100, stops: [{ color: '#00B09B', pos: 0 }, { color: '#96C93D', pos: 100 }] },
  { key: 'purpleHaze', icon: '🔮', label: 'Purple Haze', type: 'linear', angle: 60, stops: [{ color: '#654EA3', pos: 0 }, { color: '#EAAFC8', pos: 100 }] },
  { key: 'fire', icon: '🔥', label: 'Fire', type: 'radial', shape: 'circle', stops: [{ color: '#FFE000', pos: 0 }, { color: '#E0373E', pos: 60 }, { color: '#3A0E0E', pos: 100 }] },
  { key: 'aurora', icon: '🌌', label: 'Aurora', type: 'conic', angle: 0, stops: [{ color: '#00C9FF', pos: 0 }, { color: '#92FE9D', pos: 33 }, { color: '#FF61D2', pos: 66 }, { color: '#00C9FF', pos: 100 }] },
  { key: 'mono', icon: '◐', label: 'Monochrome', type: 'linear', angle: 180, stops: [{ color: '#17171A', pos: 0 }, { color: '#F5F5F7', pos: 100 }] },
  { key: 'candy', icon: '🍬', label: 'Candy', type: 'radial', shape: 'ellipse', stops: [{ color: '#FFAFBD', pos: 0 }, { color: '#FFC3A0', pos: 100 }] },
]
