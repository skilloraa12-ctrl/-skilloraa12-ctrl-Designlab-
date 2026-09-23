// Pure color math: format conversions, harmony/shade generation, contrast,
// naming. No dependencies - every Color Lab tab is built from these.

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

// ---------- HEX <-> RGB ----------

export function hexToRgb(hex) {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(n)) return { r: 0, g: 0, b: 0 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex(r, g, b) {
  const toHex = (x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

export function isValidHex(hex) {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim())
}

// ---------- RGB <-> HSL ----------

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

export function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 }
}

export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

// ---------- RGB <-> HSV/HSB (same model, two names) ----------

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s: s * 100, v: v * 100 }
}

export function hsvToRgb(h, s, v) {
  s /= 100; v /= 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r1 = 0, g1 = 0, b1 = 0
  if (h < 60) [r1, g1, b1] = [c, x, 0]
  else if (h < 120) [r1, g1, b1] = [x, c, 0]
  else if (h < 180) [r1, g1, b1] = [0, c, x]
  else if (h < 240) [r1, g1, b1] = [0, x, c]
  else if (h < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 }
}

// ---------- RGB <-> CMYK ----------

export function rgbToCmyk(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const k = 1 - Math.max(r, g, b)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)
  return { c: c * 100, m: m * 100, y: y * 100, k: k * 100 }
}

export function cmykToRgb(c, m, y, k) {
  c /= 100; m /= 100; y /= 100; k /= 100
  const r = 255 * (1 - c) * (1 - k)
  const g = 255 * (1 - m) * (1 - k)
  const b = 255 * (1 - y) * (1 - k)
  return { r, g, b }
}

// ---------- RGB <-> LAB (via XYZ, sRGB D65) ----------

export function srgbToLinear(c) {
  c /= 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function linearToSrgb(c) {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return clamp(v * 255, 0, 255)
}

// D65 reference white
const XN = 95.047, YN = 100.0, ZN = 108.883

export function rgbToXyz(r, g, b) {
  const rl = srgbToLinear(r) * 100, gl = srgbToLinear(g) * 100, bl = srgbToLinear(b) * 100
  return {
    x: rl * 0.4124 + gl * 0.3576 + bl * 0.1805,
    y: rl * 0.2126 + gl * 0.7152 + bl * 0.0722,
    z: rl * 0.0193 + gl * 0.1192 + bl * 0.9505,
  }
}

export function xyzToRgb(x, y, z) {
  x /= 100; y /= 100; z /= 100
  const rl = x * 3.2406 + y * -1.5372 + z * -0.4986
  const gl = x * -0.9689 + y * 1.8758 + z * 0.0415
  const bl = x * 0.0557 + y * -0.204 + z * 1.057
  return { r: linearToSrgb(rl), g: linearToSrgb(gl), b: linearToSrgb(bl) }
}

function fXyz(t) {
  return t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116)
}
function fXyzInv(t) {
  return t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787
}

export function xyzToLab(x, y, z) {
  const fx = fXyz(x / XN), fy = fXyz(y / YN), fz = fXyz(z / ZN)
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

export function labToXyz(l, a, b) {
  const fy = (l + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  return { x: fXyzInv(fx) * XN, y: fXyzInv(fy) * YN, z: fXyzInv(fz) * ZN }
}

export function rgbToLab(r, g, b) {
  const xyz = rgbToXyz(r, g, b)
  return xyzToLab(xyz.x, xyz.y, xyz.z)
}

export function labToRgb(l, a, b) {
  const xyz = labToXyz(l, a, b)
  return xyzToRgb(xyz.x, xyz.y, xyz.z)
}

// ---------- LAB <-> LCH ----------

export function labToLch(l, a, b) {
  const c = Math.sqrt(a * a + b * b)
  let h = Math.atan2(b, a) * (180 / Math.PI)
  if (h < 0) h += 360
  return { l, c, h }
}

export function lchToLab(l, c, h) {
  const rad = h * (Math.PI / 180)
  return { l, a: c * Math.cos(rad), b: c * Math.sin(rad) }
}

export function rgbToLch(r, g, b) {
  const lab = rgbToLab(r, g, b)
  return labToLch(lab.l, lab.a, lab.b)
}

// ---------- HWB ----------

export function rgbToHwb(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b)
  return { h, w: (1 - s / 100) * v, b: 100 - v }
}

export function hwbToRgb(h, w, bl) {
  w /= 100; bl /= 100
  if (w + bl >= 1) {
    const gray = (w / (w + bl)) * 255
    return { r: gray, g: gray, b: gray }
  }
  const v = 1 - bl
  const s = v === 0 ? 0 : 1 - w / v
  return hsvToRgb(h, s * 100, v * 100)
}

// ---------- HEXA (hex + alpha) ----------

export function rgbaToHexa(r, g, b, a) {
  const toHex = (x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')
  const alphaHex = clamp(Math.round(a * 255), 0, 255).toString(16).padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(b) + alphaHex
}

// ---------- OKLab / OKLCH (Björn Ottosson, perceptually uniform) ----------

export function rgbToOklab(r, g, b) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  return {
    l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  }
}

export function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_
  const rl = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  return { r: linearToSrgb(rl), g: linearToSrgb(gl), b: linearToSrgb(bl) }
}

export function oklabToOklch(L, a, b) {
  const c = Math.sqrt(a * a + b * b)
  let h = Math.atan2(b, a) * (180 / Math.PI)
  if (h < 0) h += 360
  return { l: L, c, h }
}

export function oklchToOklab(L, c, h) {
  const rad = h * (Math.PI / 180)
  return { l: L, a: c * Math.cos(rad), b: c * Math.sin(rad) }
}

export function rgbToOklch(r, g, b) {
  const lab = rgbToOklab(r, g, b)
  return oklabToOklch(lab.l, lab.a, lab.b)
}

export function oklchToRgb(l, c, h) {
  const lab = oklchToOklab(l, c, h)
  return oklabToRgb(lab.l, lab.a, lab.b)
}

// ---------- WCAG contrast ----------

export function relativeLuminance(r, g, b) {
  const [rl, gl, bl] = [r, g, b].map((c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

export function contrastRatio(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB)
  const la = relativeLuminance(a.r, a.g, a.b)
  const lb = relativeLuminance(b.r, b.g, b.b)
  const lighter = Math.max(la, lb), darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

export function wcagLevel(ratio, isLargeText = false) {
  return {
    aa: ratio >= (isLargeText ? 3 : 4.5),
    aaa: ratio >= (isLargeText ? 4.5 : 7),
  }
}

// ---------- Warm/cool, light/dark ----------

export function isLight(hex) {
  const { r, g, b } = hexToRgb(hex)
  return relativeLuminance(r, g, b) > 0.35
}

export function isWarm(hex) {
  const { r, g, b } = hexToRgb(hex)
  const { h } = rgbToHsl(r, g, b)
  return h < 90 || h > 270
}

// ---------- Named color ----------

const NAMED_COLORS = [
  ['Red', '#FF0000'], ['Crimson', '#DC143C'], ['Maroon', '#800000'], ['Coral', '#FF7F50'],
  ['Salmon', '#FA8072'], ['Orange', '#FFA500'], ['Amber', '#FFBF00'], ['Gold', '#FFD700'],
  ['Yellow', '#FFFF00'], ['Olive', '#808000'], ['Lime', '#00FF00'], ['Green', '#008000'],
  ['Forest Green', '#228B22'], ['Teal', '#008080'], ['Cyan', '#00FFFF'], ['Turquoise', '#40E0D0'],
  ['Sky Blue', '#87CEEB'], ['Blue', '#0000FF'], ['Navy', '#000080'], ['Indigo', '#4B0082'],
  ['Violet', '#8A2BE2'], ['Purple', '#800080'], ['Magenta', '#FF00FF'], ['Pink', '#FFC0CB'],
  ['Hot Pink', '#FF69B4'], ['Brown', '#A52A2A'], ['Chocolate', '#D2691E'], ['Tan', '#D2B48C'],
  ['Beige', '#F5F5DC'], ['White', '#FFFFFF'], ['Silver', '#C0C0C0'], ['Gray', '#808080'],
  ['Charcoal', '#36454F'], ['Black', '#000000'], ['Mint', '#98FF98'], ['Lavender', '#E6E6FA'],
  ['Peach', '#FFE5B4'], ['Mustard', '#FFDB58'], ['Burgundy', '#800020'], ['Slate', '#708090'],
]

export function nearestColorName(hex) {
  const { r, g, b } = hexToRgb(hex)
  let best = NAMED_COLORS[0], bestDist = Infinity
  for (const entry of NAMED_COLORS) {
    const c = hexToRgb(entry[1])
    const dist = (r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2
    if (dist < bestDist) { bestDist = dist; best = entry }
  }
  return best[0]
}

// ---------- Harmonies ----------

export const HARMONY_TYPES = {
  complementary: { label: 'Компліментарна', desc: 'Два кольори навпроти на колірному колі - максимальний контраст, привертає увагу (CTA-кнопки, акценти).' },
  analogous: { label: 'Аналогова', desc: 'Сусідні кольори на колі - спокійна, гармонійна палітра для фонів і великих поверхонь.' },
  triadic: { label: 'Тріадна', desc: 'Три кольори через 120° - збалансований контраст, часто у брендингу та ілюстрації.' },
  tetradic: { label: 'Тетрадна', desc: 'Чотири кольори у формі прямокутника - багата палітра, потребує одного домінантного кольору.' },
  square: { label: 'Квадратна', desc: 'Чотири кольори рівномірно через 90° - для складних UI з кількома рівнозначними акцентами.' },
  split: { label: 'Split-complementary', desc: 'Базовий колір + два сусіди його доповняльного - контраст компліментарної, але м’якіше.' },
  doubleComplementary: { label: 'Подвійна компліментарна', desc: 'Дві пари доповняльних кольорів - насичено, використовуйте обережно.' },
  monochromatic: { label: 'Монохромна', desc: 'Один відтінок у різній світлості/насиченості - безпечно для типографіки й UI-станів.' },
}

export function harmonyHues(baseHue, type) {
  const b = ((baseHue % 360) + 360) % 360
  switch (type) {
    case 'complementary': return [b, (b + 180) % 360]
    case 'analogous': return [(b - 30 + 360) % 360, b, (b + 30) % 360]
    case 'triadic': return [b, (b + 120) % 360, (b + 240) % 360]
    case 'tetradic': return [b, (b + 60) % 360, (b + 180) % 360, (b + 240) % 360]
    case 'square': return [b, (b + 90) % 360, (b + 180) % 360, (b + 270) % 360]
    case 'split': return [b, (b + 150) % 360, (b + 210) % 360]
    case 'doubleComplementary': return [b, (b + 30) % 360, (b + 180) % 360, (b + 210) % 360]
    case 'monochromatic': return [b]
    default: return [b]
  }
}

export function paletteFromHues(hues, type, s = 62, l = 50) {
  if (type === 'monochromatic') {
    return [20, 35, 50, 65, 80].map((ll) => hslToHex(hues[0], s, ll))
  }
  return hues.map((h) => hslToHex(h, s, l))
}

// ---------- Shades / tints / tones (50-950 scale) ----------

export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const SHADE_LIGHTNESS = [97, 93, 86, 76, 64, 50, 42, 34, 26, 18, 11]

export function shadeScale(hex) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s } = rgbToHsl(r, g, b)
  const scale = {}
  SHADE_STEPS.forEach((step, i) => {
    // Keep saturation a touch lower at the extremes for a more natural curve
    const satAdjust = i === 0 || i === SHADE_STEPS.length - 1 ? s * 0.7 : s
    scale[step] = hslToHex(h, clamp(satAdjust, 0, 100), SHADE_LIGHTNESS[i])
  })
  return scale
}

export function lighter(hex, amount = 15) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  return hslToHex(h, s, clamp(l + amount, 0, 100))
}
export function darker(hex, amount = 15) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  return hslToHex(h, s, clamp(l - amount, 0, 100))
}
export function muted(hex, amount = 25) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  return hslToHex(h, clamp(s - amount, 0, 100), l)
}

// ---------- Semantic palette (Primary/Secondary/.../Info) ----------

export function semanticPalette(baseHex) {
  const { r, g, b } = hexToRgb(baseHex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const dark = l < 50
  return {
    primary: baseHex,
    secondary: hslToHex((h + 200) % 360, clamp(s - 10, 0, 100), l),
    accent: hslToHex((h + 150) % 360, clamp(s + 10, 0, 100), clamp(l + 5, 0, 100)),
    background: dark ? hslToHex(h, clamp(s * 0.25, 0, 100), 8) : hslToHex(h, clamp(s * 0.15, 0, 100), 98),
    surface: dark ? hslToHex(h, clamp(s * 0.25, 0, 100), 13) : hslToHex(h, clamp(s * 0.1, 0, 100), 100),
    text: dark ? hslToHex(h, 8, 95) : hslToHex(h, 15, 12),
    muted: dark ? hslToHex(h, 8, 60) : hslToHex(h, 8, 45),
    border: dark ? hslToHex(h, 10, 22) : hslToHex(h, 12, 88),
    success: hslToHex(142, 60, dark ? 45 : 38),
    warning: hslToHex(38, 85, dark ? 55 : 48),
    error: hslToHex(4, 72, dark ? 58 : 50),
    info: hslToHex(205, 70, dark ? 55 : 48),
  }
}

export const SEMANTIC_LABELS = {
  primary: 'Primary', secondary: 'Secondary', accent: 'Accent', background: 'Background',
  surface: 'Surface', text: 'Text', muted: 'Muted', border: 'Border',
  success: 'Success', warning: 'Warning', error: 'Error', info: 'Info',
}

// ---------- Light/Dark theme pair ----------

export function themePair(baseHex) {
  const { r, g, b } = hexToRgb(baseHex)
  const { h, s } = rgbToHsl(r, g, b)
  const build = (dark) => ({
    primary: hslToHex(h, s, dark ? 62 : 45),
    accent: hslToHex((h + 150) % 360, clamp(s + 10, 0, 100), dark ? 65 : 48),
    background: dark ? hslToHex(h, clamp(s * 0.2, 0, 100), 9) : hslToHex(h, clamp(s * 0.1, 0, 100), 98),
    surface: dark ? hslToHex(h, clamp(s * 0.2, 0, 100), 14) : hslToHex(h, clamp(s * 0.08, 0, 100), 100),
    text: dark ? hslToHex(h, 8, 94) : hslToHex(h, 15, 13),
    border: dark ? hslToHex(h, 10, 24) : hslToHex(h, 12, 87),
  })
  return { light: build(false), dark: build(true) }
}

// ---------- Simple dominant-color extraction (histogram bucket) ----------

export function extractDominantColors(imageData, count = 6) {
  const buckets = new Map()
  const step = 32 // bucket width per channel (0-255 -> 8 buckets/channel)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    const r = Math.floor(data[i] / step) * step
    const g = Math.floor(data[i + 1] / step) * step
    const b = Math.floor(data[i + 2] / step) * step
    const key = `${r},${g},${b}`
    const entry = buckets.get(key)
    if (entry) {
      entry.count++
      entry.rSum += data[i]; entry.gSum += data[i + 1]; entry.bSum += data[i + 2]
    } else {
      buckets.set(key, { count: 1, rSum: data[i], gSum: data[i + 1], bSum: data[i + 2] })
    }
  }
  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, count)
  return sorted.map((e) => rgbToHex(e.rSum / e.count, e.gSum / e.count, e.bSum / e.count))
}

// ---------- Gradient CSS/SVG ----------

export function gradientCss(type, angle, stops) {
  const stopStr = stops.map((s) => `${s.color}${s.opacity < 100 ? Math.round(s.opacity * 2.55).toString(16).padStart(2, '0') : ''} ${s.pos}%`).join(', ')
  if (type === 'linear') return `linear-gradient(${angle}deg, ${stopStr})`
  if (type === 'radial') return `radial-gradient(circle, ${stopStr})`
  return `conic-gradient(from ${angle}deg, ${stopStr})`
}

export function gradientSvg(type, angle, stops, width = 400, height = 160) {
  const id = 'g1'
  const stopDefs = stops.map((s) => `<stop offset="${s.pos}%" stop-color="${s.color}" stop-opacity="${s.opacity / 100}" />`).join('')
  let defTag
  if (type === 'radial') {
    defTag = `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">${stopDefs}</radialGradient>`
  } else {
    const rad = (angle * Math.PI) / 180
    const x1 = 50 - 50 * Math.cos(rad), y1 = 50 - 50 * Math.sin(rad)
    const x2 = 50 + 50 * Math.cos(rad), y2 = 50 + 50 * Math.sin(rad)
    defTag = `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stopDefs}</linearGradient>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${defTag}</defs><rect width="100%" height="100%" fill="url(#${id})" /></svg>`
}
