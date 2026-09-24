// Напрямки дизайну, показані на Головній. `id` збігається зі slug-ами
// category в data/tools/tools.js та level у modules.js/levels.js для
// консистентності між Інструменти й Академією. Уроки в Академії поки що
// є лише для Web Design (id: 'web-design') — інші напрямки залишаються
// декоративними картками, доки не отримають реальний вміст.
export const DIRECTIONS = [
  { id: 'web-design', emoji: '🌐', name: 'Web Design', desc: 'Сайти та вебсторінки' },
  { id: 'app-design', emoji: '📱', name: 'App Design', desc: 'Мобільні застосунки' },
  { id: 'ui-design', emoji: '🧩', name: 'UI Design', desc: 'Інтерфейси цифрових продуктів' },
  { id: 'ux-design', emoji: '🧠', name: 'UX Design', desc: 'Логіку та досвід користування' },
  { id: 'game-design', emoji: '🎮', name: 'Game Design', desc: 'Правила та механіки гри' },
  { id: 'game-art', emoji: '🎨', name: 'Game Art', desc: 'Візуальну частину гри' },
  { id: 'graphic-design', emoji: '🖌️', name: 'Graphic Design', desc: 'Візуальні матеріали' },
  { id: 'logo-design', emoji: '🏷️', name: 'Logo Design', desc: 'Логотипи' },
  { id: 'branding', emoji: '🏢', name: 'Branding', desc: 'Цілісну айдентику бренду' },
  { id: 'advertising-design', emoji: '📢', name: 'Advertising Design', desc: 'Рекламні матеріали' },
  { id: 'motion-design', emoji: '🎬', name: 'Motion Design', desc: 'Анімовану графіку' },
  { id: '3d-design', emoji: '🧊', name: '3D Design', desc: "Тривимірні об'єкти та сцени" },
]
