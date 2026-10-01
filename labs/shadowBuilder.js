// Pure helpers for Shadow & Light Lab: box-shadow string builders and a
// small library of real, commonly-cited CSS shadow presets.

export function hexToRgba(hex, opacity) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export function layerToCss(layer) {
  const color = hexToRgba(layer.color, layer.opacity)
  return `${layer.inset ? 'inset ' : ''}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${color}`
}

export function buildBoxShadowCss(layers) {
  return layers.map(layerToCss).join(',\n  ')
}

let layerIdCounter = 0
export function makeLayer(partial = {}) {
  layerIdCounter += 1
  return {
    id: `layer-${Date.now()}-${layerIdCounter}`,
    x: 0, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.25, inset: false,
    ...partial,
  }
}

// Values match the widely-published Material Design elevation shadow
// recipes (two stacked layers per level: a tight "key" shadow + a soft
// "ambient" one).
export const PRESETS = [
  {
    id: 'material-1', label: 'Material · 1dp',
    layers: [
      { x: 0, y: 1, blur: 2, spread: 0, color: '#000000', opacity: 0.24 },
      { x: 0, y: 1, blur: 3, spread: 0, color: '#000000', opacity: 0.12 },
    ],
  },
  {
    id: 'material-3', label: 'Material · 3dp',
    layers: [
      { x: 0, y: 3, blur: 6, spread: 0, color: '#000000', opacity: 0.23 },
      { x: 0, y: 10, blur: 20, spread: 0, color: '#000000', opacity: 0.19 },
    ],
  },
  {
    id: 'material-5', label: 'Material · 5dp',
    layers: [
      { x: 0, y: 10, blur: 10, spread: 0, color: '#000000', opacity: 0.22 },
      { x: 0, y: 19, blur: 38, spread: 0, color: '#000000', opacity: 0.30 },
    ],
  },
  {
    id: 'floating', label: 'Floating',
    layers: [
      { x: 0, y: 20, blur: 40, spread: -4, color: '#000000', opacity: 0.12 },
    ],
  },
  {
    id: 'layered', label: 'Layered',
    layers: [
      { x: 0, y: 1, blur: 2, spread: 0, color: '#000000', opacity: 0.24 },
      { x: 0, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.16 },
      { x: 0, y: 16, blur: 32, spread: 0, color: '#000000', opacity: 0.12 },
    ],
  },
  {
    id: 'inset', label: 'Inset (заглиблення)',
    layers: [
      { x: 0, y: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.2, inset: true },
    ],
  },
]
