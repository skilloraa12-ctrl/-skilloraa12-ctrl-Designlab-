// Pure helpers for Contrast & Accessibility Lab, built on top of the
// WCAG math already in colorMath.js (contrastRatio, wcagLevel) rather
// than duplicating it.
import { hexToRgb, rgbToHsl, hslToHex, contrastRatio } from '../colorMath.js'

// Non-text elements (icons, UI component borders/states, focus
// indicators) use a flat 3:1 AA threshold — WCAG 1.4.11 / 2.4.11 — there
// is no AAA tier defined for this one, unlike body text.
export function nonTextLevel(ratio) {
  return { aa: ratio >= 3 }
}

export function adjustLightness(hex, deltaPercent) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const nextL = Math.max(0, Math.min(100, l + deltaPercent))
  return hslToHex(h, s, nextL)
}

export const STATE_DEFS = [
  { key: 'hover', label: 'Hover', delta: -10 },
  { key: 'focus', label: 'Focus', delta: -15 },
  { key: 'active', label: 'Active', delta: -20 },
  { key: 'disabled', label: 'Disabled', delta: 30 },
]

export { contrastRatio }
