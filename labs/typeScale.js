// Pure helpers for Typography Lab: modular type scales, web-safe font
// stacks (no external font loading — same self-hosted-only principle as
// the rest of the site), and CSS/JSON export builders.

export const FONT_STACKS = {
  sans: { label: 'Sans (System UI)', css: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
  serif: { label: 'Serif (Georgia)', css: "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif" },
  times: { label: 'Times New Roman', css: "'Times New Roman', Times, serif" },
  arial: { label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  verdana: { label: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  trebuchet: { label: 'Trebuchet MS', css: "'Trebuchet MS', sans-serif" },
  mono: { label: 'Monospace', css: "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace" },
  courier: { label: 'Courier New', css: "'Courier New', Courier, monospace" },
}

export const RATIOS = [
  { key: '1.125', label: 'Major Second', value: 1.125 },
  { key: '1.2', label: 'Minor Third', value: 1.2 },
  { key: '1.25', label: 'Major Third', value: 1.25 },
  { key: '1.333', label: 'Perfect Fourth', value: 1.333 },
  { key: '1.5', label: 'Perfect Fifth', value: 1.5 },
  { key: '1.618', label: 'Golden Ratio', value: 1.618 },
]

export const STEPS = [
  { key: 'xs', label: 'XS', exp: -2 },
  { key: 'sm', label: 'SM', exp: -1 },
  { key: 'base', label: 'Base', exp: 0 },
  { key: 'lg', label: 'LG', exp: 1 },
  { key: 'xl', label: 'XL', exp: 2 },
  { key: '2xl', label: '2XL', exp: 3 },
  { key: '3xl', label: '3XL', exp: 4 },
  { key: '4xl', label: '4XL', exp: 5 },
  { key: '5xl', label: '5XL', exp: 6 },
]

export function computeScale(baseSize, ratio) {
  return STEPS.map((s) => {
    const px = baseSize * Math.pow(ratio, s.exp)
    return { ...s, px: Math.round(px * 100) / 100, rem: Math.round((px / 16) * 1000) / 1000 }
  })
}

export const TRACKING_PRESETS = [
  { label: 'Щільний', value: -0.02 },
  { label: 'Звичайний', value: 0 },
  { label: 'Широкий', value: 0.05 },
  { label: 'Дуже широкий', value: 0.15 },
]

export function buildCssVariables({ fontFamily, baseSize, ratio, scale, lineHeightHeading, lineHeightBody, headingTracking, labelTracking }) {
  const lines = [
    ':root {',
    `  --font-family: ${FONT_STACKS[fontFamily].css};`,
    `  --fs-base: ${baseSize}px;`,
    ...scale.map((s) => `  --fs-${s.key}: ${s.rem}rem; /* ${s.px}px */`),
    `  --lh-heading: ${lineHeightHeading};`,
    `  --lh-body: ${lineHeightBody};`,
    `  --tracking-heading: ${headingTracking}em;`,
    `  --tracking-label: ${labelTracking}em;`,
    '}',
  ]
  return lines.join('\n')
}

export function buildCssSnippet({ scale, lineHeightHeading, lineHeightBody, headingTracking, labelTracking }) {
  const h1 = scale.find((s) => s.key === '4xl')
  const h2 = scale.find((s) => s.key === '3xl')
  const h3 = scale.find((s) => s.key === 'xl')
  const base = scale.find((s) => s.key === 'base')
  const small = scale.find((s) => s.key === 'sm')
  return [
    `body { font-family: var(--font-family); font-size: var(--fs-base); line-height: var(--lh-body); }`,
    ``,
    `h1 { font-size: var(--fs-4xl); line-height: var(--lh-heading); letter-spacing: var(--tracking-heading); } /* ${h1.px}px */`,
    `h2 { font-size: var(--fs-3xl); line-height: var(--lh-heading); letter-spacing: var(--tracking-heading); } /* ${h2.px}px */`,
    `h3 { font-size: var(--fs-xl); line-height: var(--lh-heading); } /* ${h3.px}px */`,
    ``,
    `p { font-size: var(--fs-base); line-height: var(--lh-body); } /* ${base.px}px */`,
    ``,
    `.eyebrow { font-size: var(--fs-sm); letter-spacing: var(--tracking-label); text-transform: uppercase; } /* ${small.px}px */`,
  ].join('\n')
}
