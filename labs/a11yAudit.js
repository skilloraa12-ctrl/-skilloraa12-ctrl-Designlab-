// Pure helpers for Accessibility Lab: checks that complement (not repeat)
// Contrast & Accessibility Lab's contrast-ratio math — target size, heading
// hierarchy, alt text, form labels, flash/motion safety, and a general
// WCAG quick-checklist. No DOM, no React.

export const TARGET_MIN_AA = 24 // WCAG 2.5.8 (Level AA) minimum target size
export const TARGET_MIN_AAA = 44 // WCAG 2.5.5 (Level AAA) recommended target size

export function checkTargetSize(w, h) {
  const smallest = Math.min(w, h)
  return {
    passAA: smallest >= TARGET_MIN_AA,
    passAAA: smallest >= TARGET_MIN_AAA,
    smallest,
  }
}

export function validateHeadings(levels) {
  const issues = []
  let h1Count = 0
  let prevLevel = 0
  levels.forEach((lvl, i) => {
    if (lvl === 1) h1Count++
    if (prevLevel > 0 && lvl > prevLevel + 1) {
      issues.push({ index: i, message: `Пропущено рівень між H${prevLevel} і H${lvl}` })
    }
    prevLevel = lvl
  })
  if (levels.length > 0 && h1Count === 0) issues.push({ index: -1, message: 'Немає жодного H1 на сторінці' })
  if (h1Count > 1) issues.push({ index: -1, message: `Знайдено ${h1Count} заголовків H1 — рекомендовано рівно один` })
  return issues
}

const GENERIC_ALT = /^(image|img|photo|picture|picture of|photo of|зображення|фото|малюнок)\.?$/i

export function validateAlt(img) {
  const issues = []
  const alt = img.alt.trim()
  if (img.type === 'decorative') {
    if (alt !== '') issues.push('Декоративне зображення має мати порожній alt="" (щоб скрінрідер його пропустив)')
  } else {
    if (alt === '') issues.push('Інформативне зображення потребує опису в alt')
    else if (GENERIC_ALT.test(alt)) issues.push('Занадто загальний alt-текст — опишіть, що саме зображено')
    else if (alt.length > 125) issues.push('Alt-текст задовгий (>125 символів) — скоротіть до суті')
  }
  return issues
}

export function checkFlashSafety(hz) {
  const safe = hz <= 3
  return {
    safe,
    message: safe
      ? 'Безпечно за WCAG 2.3.1 (не більше 3 спалахів/сек)'
      : 'Перевищує поріг 3 спалахи/сек — ризик фотосенситивних нападів',
  }
}

// Simulates the browser's actual Tab order: elements with a positive
// tabindex are visited first, in ascending order (ties broken by DOM
// order), then elements with tabindex 0 (or none) in plain DOM order.
// tabindex="-1" removes an element from the Tab sequence entirely
// (it's still focusable via JS, just not via keyboard Tab).
export function computeTabOrder(items) {
  const focusable = items.filter((it) => it.tabindex !== -1)
  const positive = focusable
    .filter((it) => it.tabindex > 0)
    .sort((a, b) => a.tabindex - b.tabindex || items.indexOf(a) - items.indexOf(b))
  const zero = focusable.filter((it) => !(it.tabindex > 0))
  return [...positive, ...zero]
}

export function tabOrderIssues(items) {
  const issues = []
  if (items.some((it) => it.tabindex > 0)) {
    issues.push('Позитивний tabindex знайдено — Tab-порядок більше не відповідає порядку елементів у DOM/на екрані.')
  }
  const negativeCount = items.filter((it) => it.tabindex === -1).length
  if (negativeCount === items.length) {
    issues.push('Усі елементи виключені з Tab-порядку (tabindex="-1") — клавіатурою до них не дістатись.')
  }
  return issues
}

// CSS "order" (flex/grid) changes the VISUAL position of an element
// without moving it in the DOM — but screen readers (and Tab, by
// default) still follow DOM order, not visual order. A mismatch between
// DOM position and visual position is a common, easy-to-miss bug: sighted
// mouse users see one sequence, screen-reader/keyboard users experience
// another.
export function visualOrder(items) {
  return [...items]
    .map((it, domIndex) => ({ ...it, domIndex }))
    .sort((a, b) => a.order - b.order || a.domIndex - b.domIndex)
}

export function readingOrderIssues(items) {
  const visual = visualOrder(items)
  const issues = []
  visual.forEach((it, visualIndex) => {
    if (it.domIndex !== visualIndex) {
      issues.push(`«${it.name}» видно ${visualIndex + 1}-м за рахунком, але в DOM (і для скрінрідера) він ${it.domIndex + 1}-й — порядок не збігається.`)
    }
  })
  return issues
}

export const CHECKLIST_ITEMS = [
  { id: 'lang', group: 'Структура', label: 'У <html> вказано атрибут lang' },
  { id: 'landmarks', group: 'Структура', label: 'Є landmark-теги: header, nav, main, footer' },
  { id: 'skip-link', group: 'Структура', label: 'Є "skip to content" посилання для клавіатури' },
  { id: 'keyboard', group: 'Навігація', label: 'Усі дії доступні тільки з клавіатури (без миші)' },
  { id: 'focus-visible', group: 'Навігація', label: 'Фокус видно на кожному інтерактивному елементі' },
  { id: 'tab-order', group: 'Навігація', label: 'Порядок Tab відповідає візуальному порядку' },
  { id: 'alt-text', group: 'Контент', label: 'У всіх інформативних зображень є alt-текст' },
  { id: 'form-labels', group: 'Контент', label: 'У кожного поля форми є <label>' },
  { id: 'error-text', group: 'Контент', label: 'Помилки форм описані текстом, не лише кольором' },
  { id: 'reduced-motion', group: 'Рух і час', label: 'Анімації поважають prefers-reduced-motion' },
  { id: 'no-autoplay', group: 'Рух і час', label: 'Немає автовідтворення звуку/відео без контролю' },
  { id: 'reflow', group: 'Адаптивність', label: 'Контент адаптується до зуму 200% без втрати функцій' },
  { id: 'touch-targets', group: 'Адаптивність', label: 'Інтерактивні елементи ≥24×24px' },
]
