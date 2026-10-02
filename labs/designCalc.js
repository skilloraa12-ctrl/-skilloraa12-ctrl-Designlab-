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

// --- Readability / line length ---
// The CSS `ch` unit is defined as the width of the "0" character in the
// current font — which happens to make "Nch" a near-literal way to say
// "about N characters wide", so no real conversion is needed for the CSS
// value itself. The px estimate is the commonly-cited rule of thumb that
// an average character (across a typical paragraph, mixed-width font) is
// roughly half the font-size wide.
export function estimateLineWidthPx(cpl, fontSizePx, avgCharRatio = 0.5) {
  return cpl * fontSizePx * avgCharRatio
}

export function readabilityRating(cpl) {
  if (cpl < 45) return { key: 'narrow', label: 'Занадто вузько', hint: 'Рядки короткі — очі "стрибають" на новий рядок занадто часто, це втомлює при довгому читанні.' }
  if (cpl <= 75) return { key: 'ideal', label: 'Оптимально (45–75 символів)', hint: 'Класичний орієнтир для комфортного читання суцільного тексту.' }
  return { key: 'wide', label: 'Занадто широко', hint: 'Довгі рядки ускладнюють візуальний перехід на наступний рядок — око може "загубити" місце.' }
}

// --- Column grid math ---
// Classic print/web layout formula: split a container into N equal
// columns separated by a fixed gutter, inset by a side margin on each
// edge. Distinct from Grid Lab (which previews a grid visually over a
// mockup) — this is the raw arithmetic for a design brief or dev handoff.
export function calcColumnWidth({ containerWidth, columns, gutter, margin }) {
  const usable = containerWidth - margin * 2 - gutter * (columns - 1)
  const columnWidth = columns > 0 ? usable / columns : 0
  return { columnWidth, usable }
}
