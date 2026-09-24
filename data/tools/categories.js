// Категорії Інструментів дзеркалять існуючі "Напрямки дизайну" з Home.jsx
// (directions.js) — той самий поділ, який уже знайомий користувачу з Головної.
export const TOOLS_CATEGORIES = [
  { id: 'web-design', ua: 'Web Design', desc: 'Сайти та вебсторінки' },
  { id: 'app-design', ua: 'App Design', desc: 'Мобільні застосунки' },
  { id: 'ui-design', ua: 'UI Design', desc: 'Інтерфейси цифрових продуктів' },
  { id: 'ux-design', ua: 'UX Design', desc: 'Логіку та досвід користування' },
  { id: 'game-design', ua: 'Game Design', desc: 'Правила та механіки гри' },
  { id: 'game-art', ua: 'Game Art', desc: 'Візуальну частину гри' },
  { id: 'graphic-design', ua: 'Graphic Design', desc: 'Візуальні матеріали' },
  { id: 'logo-design', ua: 'Logo Design', desc: 'Логотипи' },
  { id: 'branding', ua: 'Branding', desc: "Цілісну айдентику бренду" },
  { id: 'advertising-design', ua: 'Advertising Design', desc: 'Рекламні матеріали' },
  { id: 'motion-design', ua: 'Motion Design', desc: 'Анімовану графіку' },
  { id: '3d-design', ua: '3D Design', desc: "Тривимірні об'єкти та сцени" },
]

export function getToolsCategory(id) {
  return TOOLS_CATEGORIES.find((c) => c.id === id)
}
