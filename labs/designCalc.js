// Pure helpers for Design Calculator Lab: unit and number conversions that
// come up constantly in design/dev handoff, each one distinct from what
// Typography Lab (type scales) and Ratio Lab (aspect ratios) already cover.

export function pxToRem(px, rootPx) {
  return rootPx === 0 ? 0 : px / rootPx
}
export function remToPx(rem, rootPx) {
  return rem * rootPx
}

// --- DPI / PPI ---
// Given pixel dimensions and a physical size, compute the resulting DPI;
// or given pixel dimensions and a target DPI, compute the max physical size.
export function calcDpi(pixels, physicalInches) {
  return physicalInches === 0 ? 0 : pixels / physicalInches
}
export function calcMaxPrintInches(pixels, targetDpi) {
  return targetDpi === 0 ? 0 : pixels / targetDpi
}
export const CM_PER_INCH = 2.54

// --- Fluid typography (CSS clamp()) ---
// Standard linear-interpolation formula (as used by tools like utopia.fyi):
// a font that scales smoothly between minPx at minVw and maxPx at maxVw.
export function buildClamp({ minPx, maxPx, minVw, maxVw, rootPx }) {
  const slope = (maxPx - minPx) / (maxVw - minVw)
  const yIntersection = -minVw * slope + minPx
  const minRem = minPx / rootPx
  const maxRem = maxPx / rootPx
  const yRem = yIntersection / rootPx
  const vwPart = (slope * 100).toFixed(4)
  const css = `clamp(${minRem.toFixed(3)}rem, ${yRem.toFixed(3)}rem + ${vwPart}vw, ${maxRem.toFixed(3)}rem)`
  return { slope, yIntersection, css }
}

// --- File size & download time ---
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB']
export function formatBytes(bytes) {
  if (bytes <= 0) return '0 B'
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 2)} ${SIZE_UNITS[i]}`
}
export function downloadSeconds(bytes, mbps) {
  if (mbps <= 0) return 0
  const bits = bytes * 8
  const bitsPerSecond = mbps * 1_000_000
  return bits / bitsPerSecond
}

// --- Animation duration <-> frames ---
export function msToFrames(ms, fps) {
  return Math.round((ms / 1000) * fps)
}
export function framesToMs(frames, fps) {
  return fps === 0 ? 0 : (frames / fps) * 1000
}

// --- Spacing scale ---
export function generateSpacingScale(base, ratio, steps, mode) {
  const out = []
  for (let i = 0; i < steps; i++) {
    const value = mode === 'geometric' ? base * Math.pow(ratio, i) : base * (1 + ratio * i)
    out.push(Math.round(value * 100) / 100)
  }
  return out
}
