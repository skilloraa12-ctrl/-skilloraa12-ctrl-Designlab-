// Підкатегорії (модулі) всередині напрямку дизайну — рівень між
// directions.js (Web Design, UI Design, ...) і окремими уроками з
// modules.js. `level` = slug напрямку (той самий, що в levels.js).
// `id` кожної підкатегорії використовується в уроках (modules.js:
// поле subcategory) і в маршруті /academy/:subcategory.
//
// Web Design: повний список 39 підкатегорій з ТЗ. Реальні уроки поки що
// є лише у 'web-design-core' (модулі 1-4 з modules.js) — решта показані
// чесно як "У розробці" (той самий підхід, що в GuideHome.jsx для
// категорій Довідника без уроків), а не фейкові порожні сторінки.
export const SUBCATEGORIES = [
  { id: 'web-design-core', level: 'web-design', order: 1, emoji: '🌐', title: 'Web Design Core', desc: 'Фундамент Web Design: що таке веб, як він працює, роль дизайнера' },
  { id: 'types-of-websites', level: 'web-design', order: 2, emoji: '🏗️', title: 'Types of Websites', desc: 'Типи вебпроєктів: лендінг, портфоліо, e-commerce, SaaS та інші' },
  { id: 'web-design-strategy', level: 'web-design', order: 3, emoji: '🎯', title: 'Web Design Strategy', desc: 'Мета сайту, бізнес- і користувацькі цілі, KPI' },
  { id: 'audience-users', level: 'web-design', order: 4, emoji: '👤', title: 'Audience & Users', desc: 'Цільова аудиторія, персони, потреби користувачів' },
  { id: 'ux-research-for-web', level: 'web-design', order: 5, emoji: '🔎', title: 'UX Research for Web', desc: 'Дослідження саме для вебпроєктів: аналітика, юзабіліті-тести' },
  { id: 'information-architecture', level: 'web-design', order: 6, emoji: '🗺️', title: 'Information Architecture', desc: 'Структура сайту: sitemap, категорії, ієрархія контенту' },
  { id: 'web-navigation', level: 'web-design', order: 7, emoji: '🧭', title: 'Web Navigation', desc: 'Меню, breadcrumbs, пошук, мобільна навігація' },
  { id: 'user-flows-for-web', level: 'web-design', order: 8, emoji: '🔄', title: 'User Flows for Web', desc: 'Сценарії користувача: реєстрація, покупка, пошук' },
  { id: 'wireframing', level: 'web-design', order: 9, emoji: '🧱', title: 'Wireframing', desc: 'Проєктування структури сторінок від low- до high-fidelity' },
  { id: 'web-layout', level: 'web-design', order: 10, emoji: '📐', title: 'Web Layout', desc: 'Структура сторінки: контейнери, відступи, візуальна ієрархія' },
  { id: 'web-grid', level: 'web-design', order: 11, emoji: '📏', title: 'Web Grid', desc: 'Сітки: колонки, gutters, breakpoints, CSS Grid і Flexbox' },
  { id: 'responsive-web-design', level: 'web-design', order: 12, emoji: '📱', title: 'Responsive Web Design', desc: 'Адаптивність під desktop, tablet, mobile' },
  { id: 'visual-web-design', level: 'web-design', order: 13, emoji: '🎨', title: 'Visual Web Design', desc: 'Композиція, контраст, баланс, візуальна система вебу' },
  { id: 'color-for-web', level: 'web-design', order: 14, emoji: '🌈', title: 'Color for Web', desc: 'Колірні системи, семантичні кольори, світла й темна теми' },
  { id: 'typography-for-web', level: 'web-design', order: 15, emoji: '🔤', title: 'Typography for Web', desc: 'Шрифти, розміри, ієрархія тексту для вебу' },
  { id: 'ui-for-web', level: 'web-design', order: 16, emoji: '🖥️', title: 'UI for Web', desc: 'Кнопки, поля, картки та інші UI-компоненти сайту' },
  { id: 'web-ui-states', level: 'web-design', order: 17, emoji: '🔄', title: 'Web UI States', desc: 'Стани компонентів: hover, focus, disabled, помилка' },
  { id: 'web-interaction-design', level: 'web-design', order: 18, emoji: '🖱️', title: 'Web Interaction Design', desc: 'Клік, скрол, drag & drop, мікровзаємодії' },
  { id: 'motion-for-web', level: 'web-design', order: 19, emoji: '🎞️', title: 'Motion for Web', desc: 'CSS-анімації, переходи, easing, продуктивність' },
  { id: 'web-accessibility', level: 'web-design', order: 20, emoji: '♿', title: 'Web Accessibility', desc: 'WCAG, контраст, клавіатурна навігація, скрінрідери' },
  { id: 'ux-writing-for-web', level: 'web-design', order: 21, emoji: '✍️', title: 'UX Writing for Web', desc: 'CTA, підписи форм, повідомлення про помилки' },
  { id: 'images-media-for-web', level: 'web-design', order: 22, emoji: '🖼️', title: 'Images & Media for Web', desc: 'Формати зображень, адаптивні медіа, lazy loading' },
  { id: 'web-page-design', level: 'web-design', order: 23, emoji: '📄', title: 'Web Page Design', desc: 'Типові сторінки: головна, про нас, контакти, 404' },
  { id: 'landing-page-design', level: 'web-design', order: 24, emoji: '🚀', title: 'Landing Page Design', desc: 'Структура лендінгу: hero, переваги, соцдовід, CTA' },
  { id: 'ecommerce-web-design', level: 'web-design', order: 25, emoji: '🛒', title: 'E-commerce Web Design', desc: 'Каталог, картка товару, кошик, оформлення замовлення' },
  { id: 'web-standards', level: 'web-design', order: 26, emoji: '🌐', title: 'Web Standards', desc: 'Семантичний HTML, сумісність браузерів, технічні обмеження' },
  { id: 'web-performance', level: 'web-design', order: 27, emoji: '⚡', title: 'Web Performance', desc: 'Оптимізація ваги сторінки, Core Web Vitals' },
  { id: 'seo-for-web-designers', level: 'web-design', order: 28, emoji: '🔎', title: 'SEO for Web Designers', desc: 'Що дизайнер має знати про пошукову оптимізацію' },
  { id: 'security-privacy-design', level: 'web-design', order: 29, emoji: '🔐', title: 'Security & Privacy Design', desc: 'Логін, 2FA, згода на cookies, небезпечні дії' },
  { id: 'international-web-design', level: 'web-design', order: 30, emoji: '🌍', title: 'International Web Design', desc: 'Багатомовність, RTL, локалізація макетів' },
  { id: 'themes-dark-mode', level: 'web-design', order: 31, emoji: '🌙', title: 'Themes & Dark Mode', desc: 'Світла й темна тема, токени кольору' },
  { id: 'web-design-systems', level: 'web-design', order: 32, emoji: '🧩', title: 'Web Design Systems', desc: 'Дизайн-токени, компоненти, документація' },
  { id: 'web-design-testing', level: 'web-design', order: 33, emoji: '🧪', title: 'Web Design Testing', desc: 'Юзабіліті-, accessibility- і responsive-тестування' },
  { id: 'web-analytics-conversion', level: 'web-design', order: 34, emoji: '📊', title: 'Web Analytics & Conversion', desc: 'Метрики, конверсія, воронка, A/B-тести' },
  { id: 'web-ux-ui-audit', level: 'web-design', order: 35, emoji: '🔬', title: 'Web UX/UI Audit', desc: 'Аудит наявного сайту: usability, візуал, доступність' },
  { id: 'design-handoff', level: 'web-design', order: 36, emoji: '📁', title: 'Design Handoff', desc: 'Передача макета розробнику: специфікації, токени, ассети' },
  { id: 'web-design-development', level: 'web-design', order: 37, emoji: '💻', title: 'Web Design → Development', desc: 'Як дизайн реалізується в HTML/CSS/JS' },
  { id: 'professional-web-design-workflow', level: 'web-design', order: 38, emoji: '🏗️', title: 'Professional Web Design Workflow', desc: 'Повний процес від брифу до запуску' },
  { id: 'web-design-projects', level: 'web-design', order: 39, emoji: '🏆', title: 'Web Design Projects', desc: 'Практичні проєкти: від візитки до повного сайту' },
]

export function getSubcategoriesByLevel(level) {
  return SUBCATEGORIES.filter((s) => s.level === level).sort((a, b) => a.order - b.order)
}

export function getSubcategory(id) {
  return SUBCATEGORIES.find((s) => s.id === id)
}
