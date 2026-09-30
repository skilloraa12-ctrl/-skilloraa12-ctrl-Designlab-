// Pure helpers for Grid Lab: CSS snippet builders for column/modular/
// baseline grids, and an SVG builder for the isometric grid (a CSS-only
// isometric background is a fragile, hard-to-read gradient trick, so an
// actual tiled SVG pattern is both simpler to get right and easier to
// export/reuse as-is).

export const ASPECTS = [
  { key: '1:1', label: 'Квадрат (1:1)', value: '1 / 1' },
  { key: '4:3', label: '4:3', value: '4 / 3' },
  { key: '3:2', label: '3:2', value: '3 / 2' },
  { key: '16:9', label: '16:9', value: '16 / 9' },
]

export function buildColumnGridCss({ columns, gutter, margin, maxWidth }) {
  return [
    `.container {`,
    `  max-width: ${maxWidth}px;`,
    `  margin: 0 auto;`,
    `  padding: 0 ${margin}px;`,
    `  display: grid;`,
    `  grid-template-columns: repeat(${columns}, 1fr);`,
    `  gap: ${gutter}px;`,
    `}`,
  ].join('\n')
}

export function buildModularGridCss({ columns, rows, gap, aspect }) {
  return [
    `.modules {`,
    `  display: grid;`,
    `  grid-template-columns: repeat(${columns}, 1fr);`,
    `  grid-template-rows: repeat(${rows}, 1fr);`,
    `  gap: ${gap}px;`,
    `}`,
    `.modules > * {`,
    `  aspect-ratio: ${aspect};`,
    `}`,
  ].join('\n')
}

export function buildBaselineGridCss({ baseline, multiple }) {
  const lineHeight = baseline * multiple
  return [
    `:root {`,
    `  --baseline: ${baseline}px;`,
    `}`,
    `body {`,
    `  line-height: calc(var(--baseline) * ${multiple}); /* ${lineHeight}px */`,
    `}`,
    `/* Візуальна перевірка вирівнювання (прибери в продакшені) */`,
    `.baseline-debug {`,
    `  background-image: repeating-linear-gradient(`,
    `    to bottom,`,
    `    transparent 0,`,
    `    transparent calc(var(--baseline) - 1px),`,
    `    rgba(255, 60, 60, 0.35) var(--baseline)`,
    `  );`,
    `}`,
  ].join('\n')
}

// Two families of lines at +30°/-30° from horizontal, tiled across a
// viewBox, forming a rhombus (diamond) isometric grid — the same layout
// used by isometric graph paper and most 2.5D pixel-art/game-design grids.
function round(n) {
  return Math.round(n * 100) / 100
}

export function buildIsometricSvg({ cellSize, cols, rows, stroke = '#8a8a99' }) {
  const w = cols * cellSize
  const h = rows * cellSize
  const tan30 = Math.tan(Math.PI / 6)
  const dx = h / tan30 // horizontal run of a 30° line spanning the full height
  const margin = Math.ceil(dx / cellSize) + 1
  const lines = []
  for (let k = -margin; k <= cols + margin; k++) {
    const x0 = k * cellSize
    lines.push(`<line x1="${round(x0)}" y1="0" x2="${round(x0 + dx)}" y2="${round(h)}" />`)
    lines.push(`<line x1="${round(x0)}" y1="0" x2="${round(x0 - dx)}" y2="${round(h)}" />`)
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round(w)}" height="${round(h)}" viewBox="0 0 ${round(w)} ${round(h)}">`,
    `<g stroke="${stroke}" stroke-width="1" opacity="0.6">`,
    ...lines,
    `</g>`,
    `</svg>`,
  ].join('\n')
}
