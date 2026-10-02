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

function clamp255(n) {
  return Math.max(0, Math.min(255, Math.round(n)))
}
function mix(hex, amount) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const target = amount > 0 ? 255 : 0
  const t = Math.abs(amount)
  const mixed = [r, g, b].map((c) => clamp255(c + (target - c) * t))
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

// Neumorphism (aka "soft UI"): a single background color and two
// box-shadow layers derived from it — a lighter "highlight" on the side
// facing the light, and a darker "shadow" on the opposite side. The
// element appears to be pressed into or raised from the same surface
// it sits on, rather than floating above a different-colored background.
export function buildNeumorphicCss({ bg, distance, blur, intensity, inset }) {
  const lightColor = mix(bg, intensity)
  const darkColor = mix(bg, -intensity)
  const i = inset ? 'inset ' : ''
  const shadow = `${i}${distance}px ${distance}px ${blur}px ${darkColor},\n  ${i}-${distance}px -${distance}px ${blur}px ${lightColor}`
  return { css: `background: ${bg};\nborder-radius: 20px;\nbox-shadow: ${shadow};`, shadow, lightColor, darkColor }
}

export function buildTextShadowCss({ x, y, blur, color, opacity }) {
  return `${x}px ${y}px ${blur}px ${hexToRgba(color, opacity)}`
}

// A couple of well-known text-shadow "recipes" — crisp drop shadow,
// 1980s-style neon glow (stacked same-color blurs), and an embossed look.
export const TEXT_SHADOW_PRESETS = [
  { id: 'crisp', label: 'Чіткий', x: 1, y: 1, blur: 1, color: '#000000', opacity: 0.4 },
  { id: 'soft', label: 'Мʼякий', x: 0, y: 2, blur: 6, color: '#000000', opacity: 0.3 },
  { id: 'glow', label: 'Неоновий glow', x: 0, y: 0, blur: 16, color: '#3E37E0', opacity: 0.9 },
  { id: 'emboss', label: 'Рельєф', x: 0, y: -1, blur: 0, color: '#FFFFFF', opacity: 0.5 },
]
