// Pure helpers for Motion Lab: transition/keyframe/easing/stagger CSS
// generation and cubic-bezier sampling for curve visualization. No DOM.

export const TRANSITION_TYPES = [
  { key: 'fade', label: 'Fade' },
  { key: 'slide', label: 'Slide' },
  { key: 'scale', label: 'Scale' },
  { key: 'slideFade', label: 'Slide + Fade' },
]

export function transitionStyle(type, direction, visible) {
  const hiddenTransform = {
    up: 'translateY(24px)', down: 'translateY(-24px)',
    left: 'translateX(24px)', right: 'translateX(-24px)',
  }[direction] || 'translateY(24px)'
  if (type === 'fade') return { opacity: visible ? 1 : 0 }
  if (type === 'slide') return { transform: visible ? 'translate(0,0)' : hiddenTransform }
  if (type === 'scale') return { opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.6)' }
  return { opacity: visible ? 1 : 0, transform: visible ? 'translate(0,0)' : hiddenTransform }
}

export function buildTransitionCss({ type, direction, durationMs, delayMs, easing }) {
  const fromStyle = transitionStyle(type, direction, false)
  const toStyle = transitionStyle(type, direction, true)
  const props = Object.keys(toStyle)
  const lines = [
    `.anim-el {`,
    ...props.map((p) => `  ${p === 'opacity' ? 'opacity' : 'transform'}: ${fromStyle[p]};`),
    `  transition: ${props.map((p) => (p === 'opacity' ? 'opacity' : 'transform')).join(', ')} ${durationMs}ms ${easing} ${delayMs}ms;`,
    `}`,
    `.anim-el.is-visible {`,
    ...props.map((p) => `  ${p === 'opacity' ? 'opacity' : 'transform'}: ${toStyle[p]};`),
    `}`,
  ]
  return lines.join('\n')
}

export const EASING_PRESETS = [
  { key: 'linear', label: 'Linear', css: 'linear', p: [0, 0, 1, 1] },
  { key: 'ease', label: 'Ease', css: 'ease', p: [0.25, 0.1, 0.25, 1] },
  { key: 'easeIn', label: 'Ease In', css: 'ease-in', p: [0.42, 0, 1, 1] },
  { key: 'easeOut', label: 'Ease Out', css: 'ease-out', p: [0, 0, 0.58, 1] },
  { key: 'easeInOut', label: 'Ease In-Out', css: 'ease-in-out', p: [0.42, 0, 0.58, 1] },
  { key: 'spring', label: 'Spring (overshoot)', css: 'cubic-bezier(0.34, 1.56, 0.64, 1)', p: [0.34, 1.56, 0.64, 1] },
  { key: 'bounceOut', label: 'Bounce Out', css: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', p: [0.68, -0.55, 0.27, 1.55] },
]

// Samples the cubic-bezier progress curve (x(t), y(t)) for t in [0,1],
// with control points (0,0), (p1x,p1y), (p2x,p2y), (1,1) — the same
// definition CSS cubic-bezier() easing uses.
export function sampleCubicBezier([p1x, p1y, p2x, p2y], steps = 40) {
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t
    const x = 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t
    const y = 3 * mt * mt * t * p1y + 3 * mt * t * t * p2y + t * t * t
    points.push([x, y])
  }
  return points
}

export function defaultKeyframeSteps() {
  return [
    { id: 1, pct: 0, opacity: 0, x: 0, y: 30, scale: 0.8, rotate: 0 },
    { id: 2, pct: 60, opacity: 1, x: 0, y: -6, scale: 1.05, rotate: 3 },
    { id: 3, pct: 100, opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 },
  ]
}

export function buildKeyframesCss(steps, name = 'customAnim') {
  const sorted = [...steps].sort((a, b) => a.pct - b.pct)
  const body = sorted.map((s) => (
    `  ${s.pct}% { opacity: ${s.opacity}; transform: translate(${s.x}px, ${s.y}px) scale(${s.scale}) rotate(${s.rotate}deg); }`
  )).join('\n')
  return `@keyframes ${name} {\n${body}\n}`
}

export function staggerDelays(count, baseDelayMs) {
  return Array.from({ length: count }, (_, i) => i * baseDelayMs)
}

// Real-world scroll-triggered reveal: unlike the other tabs (triggered by a
// button click), this one needs a tiny bit of JS, because CSS alone has no
// "element entered the viewport" event. IntersectionObserver is the
// standard, low-cost way to do it without a scroll-event listener.
export function buildScrollRevealSnippet({ type, direction, durationMs, threshold, repeat }) {
  const css = buildTransitionCss({ type, direction, durationMs, delayMs: 0, easing: 'ease-out' })
  const js = [
    `const io = new IntersectionObserver((entries) => {`,
    `  entries.forEach((entry) => {`,
    `    entry.target.classList.toggle('is-visible', entry.isIntersecting);`,
    repeat
      ? `    // repeat = true: класс знімається, коли елемент виходить з екрана`
      : `    if (entry.isIntersecting) io.unobserve(entry.target); // показали один раз — досить`,
    `  });`,
    `}, { threshold: ${threshold} });`,
    ``,
    `document.querySelectorAll('.anim-el').forEach((el) => io.observe(el));`,
  ].join('\n')
  return `${css}\n\n/* JS: */\n${js}`
}
