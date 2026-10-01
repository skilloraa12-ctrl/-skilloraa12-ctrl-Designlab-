// Pure data/helpers for Wireframe Lab: block catalogs and array reordering.
// No DOM, no React.

export const SECTION_TYPES = [
  { key: 'header', icon: '▭', label: 'Header', heightPx: 48 },
  { key: 'nav', icon: '☰', label: 'Навігація', heightPx: 36 },
  { key: 'hero', icon: '▬', label: 'Hero', heightPx: 140 },
  { key: 'content', icon: '▤', label: 'Контент', heightPx: 100 },
  { key: 'sidebar', icon: '▥', label: 'Сайдбар', heightPx: 100 },
  { key: 'gallery', icon: '▦', label: 'Галерея', heightPx: 90 },
  { key: 'cta', icon: '▮', label: 'CTA-блок', heightPx: 70 },
  { key: 'footer', icon: '▭', label: 'Footer', heightPx: 56 },
]

export const FIELD_TYPES = [
  { key: 'text', icon: '◻', label: 'Текстове поле' },
  { key: 'textarea', icon: '▭', label: 'Багаторядкове поле' },
  { key: 'select', icon: '▾', label: 'Випадаючий список' },
  { key: 'checkbox', icon: '☑', label: 'Чекбокс' },
  { key: 'radio', icon: '◉', label: 'Радіогрупа' },
  { key: 'button', icon: '▬', label: 'Кнопка' },
]

export const PAGE_TEMPLATES = [
  { key: 'landing', icon: '🚀', label: 'Лендінг', sections: ['header', 'hero', 'content', 'gallery', 'cta', 'footer'] },
  { key: 'dashboard', icon: '📊', label: 'Дашборд', sections: ['header', 'nav', 'sidebar', 'content', 'content'] },
  { key: 'article', icon: '📰', label: 'Стаття блогу', sections: ['header', 'hero', 'content', 'sidebar', 'footer'] },
  { key: 'login', icon: '🔐', label: 'Логін', sections: ['header', 'content', 'footer'] },
]

export function moveItem(arr, index, dir) {
  const next = [...arr]
  const target = index + dir
  if (target < 0 || target >= next.length) return arr
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
