// Pure helpers for Pattern Lab. Dots and lines are plain CSS
// background-image tricks (no image file needed); waves and geometric
// triangles are generated as real tiled SVG, like Grid Lab's isometric
// grid, since there's no equally simple reliable CSS-only recipe for them.

export function buildDotsCss({ size, spacing, color, bg }) {
  return [
    `background-color: ${bg};`,
    `background-image: radial-gradient(circle, ${color} ${size}px, transparent ${size}px);`,
    `background-size: ${spacing}px ${spacing}px;`,
  ].join('\n')
}

export function buildStripesCss({ width, gap, angle, color, bg }) {
  const period = width + gap
  return [
    `background-color: ${bg};`,
    `background-image: repeating-linear-gradient(`,
    `  ${angle}deg,`,
    `  ${color} 0px,`,
    `  ${color} ${width}px,`,
    `  transparent ${width}px,`,
    `  transparent ${period}px`,
    `);`,
  ].join('\n')
}

function round(n) {
  return Math.round(n * 100) / 100
}

export function buildWaveSvg({ wavelength, amplitude, strokeWidth, color, bg, cols, rows }) {
  const w = wavelength * cols
  const patternH = amplitude * 2 + strokeWidth * 2
  const h = patternH * rows
  const d = `M0,${round(amplitude + strokeWidth)} C${round(wavelength / 4)},${round(strokeWidth)} ${round((wavelength * 3) / 4)},${round(amplitude * 2 + strokeWidth)} ${round(wavelength)},${round(amplitude + strokeWidth)}`
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round(w)}" height="${round(h)}" viewBox="0 0 ${round(w)} ${round(h)}">`,
    bg ? `<rect width="100%" height="100%" fill="${bg}" />` : '',
    `<defs>`,
    `<pattern id="wave" width="${round(wavelength)}" height="${round(patternH)}" patternUnits="userSpaceOnUse">`,
    `<path d="${d}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" />`,
    `</pattern>`,
    `</defs>`,
    `<rect width="100%" height="100%" fill="url(#wave)" />`,
    `</svg>`,
  ].filter(Boolean).join('\n')
}

export function buildTrianglesSvg({ cellSize, cols, rows, colorA, colorB, bg }) {
  const w = cellSize * cols
  const h = cellSize * rows
  const polys = []
  for (let ry = 0; ry < rows; ry++) {
    for (let rx = 0; rx < cols; rx++) {
      const x0 = rx * cellSize, y0 = ry * cellSize
      const x1 = x0 + cellSize, y1 = y0 + cellSize
      const flip = (rx + ry) % 2 === 0
      polys.push(`<polygon points="${x0},${y0} ${x1},${y0} ${x0},${y1}" fill="${flip ? colorA : colorB}" />`)
      polys.push(`<polygon points="${x1},${y0} ${x1},${y1} ${x0},${y1}" fill="${flip ? colorB : colorA}" />`)
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    ...polys,
    `</svg>`,
  ].join('\n')
}
