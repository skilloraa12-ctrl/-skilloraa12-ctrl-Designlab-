// Color vision deficiency simulation, using the Machado/Oliveira/Fernandes
// (2009) linear-RGB transform matrices at full severity. Approximate but
// grounded in real published coefficients, not a decorative filter.

import { hexToRgb, rgbToHex, srgbToLinear, linearToSrgb, relativeLuminance, clamp } from '../colorMath.js'

const MATRICES = {
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
}

export const CVD_TYPES = {
  none: 'Норма',
  protanopia: 'Протанопія',
  deuteranopia: 'Дейтеранопія',
  tritanopia: 'Тританопія',
  achromatopsia: 'Ахроматопсія',
}

export const CVD_DESCRIPTIONS = {
  none: 'Звичайний зір без дальтонізму.',
  protanopia: 'Відсутня чутливість до червоного — червоний і зелений важко розрізнити.',
  deuteranopia: 'Відсутня чутливість до зеленого — найпоширеніша форма дальтонізму.',
  tritanopia: 'Відсутня чутливість до синього — синій і жовтий важко розрізнити. Рідкісна форма.',
  achromatopsia: 'Повна відсутність кольорового зору — світ виглядає у відтінках сірого.',
}

function clamp01(x) {
  return clamp(x, 0, 1)
}

export function simulateColorBlindness(hex, type) {
  if (!type || type === 'none') return hex
  const { r, g, b } = hexToRgb(hex)
  if (type === 'achromatopsia') {
    const l = relativeLuminance(r, g, b)
    const v = linearToSrgb(l)
    return rgbToHex(v, v, v)
  }
  const m = MATRICES[type]
  if (!m) return hex
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b)
  const rr = clamp01(rl * m[0] + gl * m[1] + bl * m[2])
  const gg = clamp01(rl * m[3] + gl * m[4] + bl * m[5])
  const bb = clamp01(rl * m[6] + gl * m[7] + bl * m[8])
  return rgbToHex(linearToSrgb(rr), linearToSrgb(gg), linearToSrgb(bb))
}
