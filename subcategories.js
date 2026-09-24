// Підкатегорії (модулі) всередині напрямку дизайну — рівень між
// directions.js (Web Design, UI Design, ...) і окремими уроками з
// modules.js. `level` = slug напрямку (той самий, що в levels.js).
// `id` кожної підкатегорії використовується в уроках (modules.js:
// поле subcategory) і в маршруті /academy/:direction/:subcategory.
//
// Web Design: 24 підкатегорії. Кожна містить `topics` — офіційний перелік
// тем цієї підкатегорії (з ТЗ). Реальні уроки поки що написані лише для
// 'web-design-basics' (модулі 1-4 з modules.js, покривають частину тем
// підкатегорії 1) — решта тем і підкатегорій чесно показані як заплановані
// (список тем без посилань) або "У розробці", а не фейкові порожні уроки.
export const SUBCATEGORIES = [
  {
    id: 'web-design-basics', level: 'web-design', order: 1, emoji: '🌐', title: 'Основи Web Design',
    desc: 'Що таке веб-дизайн, як працює веб, типи сайтів і сторінок, роль дизайнера',
    topics: ['Що таке Web Design', 'Як працює веб', 'Типи вебсайтів', 'Типи вебсторінок', 'Структура вебсайту', 'Етапи створення вебсайту', 'Web Designer: роль і завдання', 'Design → Development'],
  },
  {
    id: 'visual-design-basics', level: 'web-design', order: 2, emoji: '🎨', title: 'Основи візуального дизайну',
    desc: 'Візуальна ієрархія, баланс, контраст, ритм і інші базові принципи композиції',
    topics: ['Visual Design', 'Visual Hierarchy', 'Balance', 'Contrast', 'Alignment', 'Proximity', 'Repetition', 'Scale', 'Proportion', 'Rhythm', 'Whitespace', 'Visual Flow'],
  },
  {
    id: 'composition-layout', level: 'web-design', order: 3, emoji: '📐', title: 'Композиція та Layout',
    desc: 'Сітки, колонки, контейнери, відступи та структура сторінки',
    topics: ['Composition', 'Layout', 'Grid Systems', 'Columns', 'Containers', 'Spacing', 'Margins', 'Padding', 'Alignment', 'Content Width', 'Page Structure', 'Responsive Layout'],
  },
  {
    id: 'color', level: 'web-design', order: 4, emoji: '🌈', title: 'Колір',
    desc: 'Теорія кольору, колірне коло, палітри, градієнти та контраст для доступності',
    topics: ['Color Theory', 'Color Wheel', 'Hue', 'Saturation', 'Brightness', 'Tint', 'Shade', 'Tone', 'Color Harmonies', 'Color Palettes', 'Gradients', 'Color Systems', 'Contrast', 'Accessibility'],
  },
  {
    id: 'typography', level: 'web-design', order: 5, emoji: '🔤', title: 'Типографіка',
    desc: 'Шрифти, вага, розмір, міжрядковий інтервал та типографічні системи',
    topics: ['Typography', 'Typeface', 'Font', 'Serif', 'Sans Serif', 'Font Weight', 'Font Size', 'Line Height', 'Letter Spacing', 'Typography Hierarchy', 'Font Pairing', 'Web Fonts', 'Typography Systems'],
  },
  {
    id: 'visual-assets', level: 'web-design', order: 6, emoji: '🖼️', title: 'Візуальні матеріали',
    desc: 'Зображення, ілюстрації, іконки, SVG, патерни та оптимізація графіки',
    topics: ['Images', 'Photography', 'Illustrations', 'Icons', 'SVG', 'Shapes', 'Patterns', 'Backgrounds', 'Shadows', 'Borders', 'Web Graphics', 'Image Optimization'],
  },
  {
    id: 'website-structure', level: 'web-design', order: 7, emoji: '🏗️', title: 'Структура вебсайту',
    desc: 'Header, навігація, hero, секції, картки, footer, CTA та пагінація',
    topics: ['Header', 'Navigation', 'Hero', 'Sections', 'Content', 'Cards', 'Sidebar', 'Footer', 'CTA', 'Breadcrumbs', 'Pagination', 'Search'],
  },
  {
    id: 'web-components', level: 'web-design', order: 8, emoji: '🧩', title: 'Web Components',
    desc: 'Кнопки, поля, форми, таби, акордеони, модалки та стани UI',
    topics: ['Buttons', 'Links', 'Inputs', 'Forms', 'Checkboxes', 'Radio Buttons', 'Select', 'Dropdown', 'Tabs', 'Accordion', 'Modal', 'Tooltip', 'Cards', 'Navigation Components', 'UI States'],
  },
  {
    id: 'responsive-web-design', level: 'web-design', order: 9, emoji: '📱', title: 'Responsive Web Design',
    desc: 'Адаптивність під mobile, tablet, desktop, breakpoints, mobile first',
    topics: ['Responsive Design', 'Mobile', 'Tablet', 'Desktop', 'Breakpoints', 'Mobile First', 'Fluid Design', 'Adaptive Design', 'Responsive Typography', 'Responsive Images', 'Responsive Layout', 'Container Queries'],
  },
  {
    id: 'design-systems', level: 'web-design', order: 10, emoji: '🧱', title: 'Components & Design Systems',
    desc: 'Анатомія компонентів, варіанти, стани, дизайн-токени та бібліотеки компонентів',
    topics: ['Components', 'Component Anatomy', 'Variants', 'States', 'Component Properties', 'Design Tokens', 'Color System', 'Typography System', 'Spacing System', 'Design System', 'Component Library'],
  },
  {
    id: 'wireframing', level: 'web-design', order: 11, emoji: '📝', title: 'Wireframing',
    desc: 'Проєктування структури сторінок від low- до high-fidelity',
    topics: ['Що таке Wireframe', 'Low-Fidelity', 'Mid-Fidelity', 'High-Fidelity', 'Page Wireframe', 'Layout Planning', 'Responsive Wireframe'],
  },
  {
    id: 'prototyping', level: 'web-design', order: 12, emoji: '🕹️', title: 'Prototyping',
    desc: 'User flow, взаємодії, стани та клікабельні прототипи',
    topics: ['Що таке Prototype', 'User Flow', 'Navigation', 'Interactions', 'States', 'Transitions', 'Clickable Prototype', 'Interactive Prototype'],
  },
  {
    id: 'motion-animation', level: 'web-design', order: 13, emoji: '🎞️', title: 'Motion & Animation',
    desc: 'Принципи анімації, hover/focus/active стани, мікровзаємодії, переходи',
    topics: ['Motion Design', 'Animation Principles', 'Hover', 'Focus', 'Active', 'Loading', 'Microinteractions', 'Transitions', 'Page Transitions', 'Scroll Animation'],
  },
  {
    id: 'accessibility', level: 'web-design', order: 14, emoji: '♿', title: 'Accessibility',
    desc: 'Контраст кольору, клавіатурна навігація, доступні форми й компоненти',
    topics: ['Що таке Accessibility', 'Color Contrast', 'Typography & Readability', 'Keyboard Navigation', 'Focus', 'Color Blindness', 'Accessible Forms', 'Accessible Components', 'Visual Accessibility'],
  },
  {
    id: 'figma-basics', level: 'web-design', order: 15, emoji: '🟣', title: 'Figma — основи',
    desc: 'Інтерфейс Figma: файли, сторінки, фрейми, шари, фігури та експорт',
    topics: ['Figma Interface', 'Files', 'Pages', 'Frames', 'Layers', 'Groups', 'Shapes', 'Text', 'Images', 'Components', 'Assets', 'Export'],
  },
  {
    id: 'figma-layout', level: 'web-design', order: 16, emoji: '📏', title: 'Figma — Layout',
    desc: 'Auto Layout, constraints, сітки та адаптивні фрейми',
    topics: ['Auto Layout', 'Constraints', 'Grids', 'Layout Grids', 'Responsive Frames', 'Spacing', 'Alignment', 'Components', 'Variants'],
  },
  {
    id: 'figma-design-system', level: 'web-design', order: 17, emoji: '🎛️', title: 'Figma — Design System',
    desc: 'Стилі, змінні, компоненти, варіанти та дизайн-токени в Figma',
    topics: ['Styles', 'Variables', 'Color Variables', 'Typography Styles', 'Spacing', 'Components', 'Variants', 'Component Properties', 'Design Tokens', 'Libraries'],
  },
  {
    id: 'figma-prototype', level: 'web-design', order: 18, emoji: '🔗', title: 'Figma — Prototype',
    desc: 'Prototype Mode, з’єднання, тригери, дії, оверлеї та скрол',
    topics: ['Prototype Mode', 'Connections', 'Interactions', 'Triggers', 'Actions', 'Animations', 'Overlays', 'Scroll', 'Interactive Components'],
  },
  {
    id: 'figma-web-design', level: 'web-design', order: 19, emoji: '💻', title: 'Figma — Web Design',
    desc: 'Створення веб-макетів у Figma: desktop, tablet, mobile, Dev Mode',
    topics: ['Створення Web Layout', 'Desktop Design', 'Tablet Design', 'Mobile Design', 'Responsive Design', 'Landing Page', 'Multi-Page Website', 'Web Components', 'Design System', 'Developer Handoff', 'Dev Mode'],
  },
  {
    id: 'tech-minimum', level: 'web-design', order: 20, emoji: '⚙️', title: 'Мінімум технічних знань',
    desc: 'HTML/CSS/JS-основи, DOM, DevTools, Git — рівень, потрібний дизайнеру',
    topics: ['HTML — основи для дизайнера', 'CSS — основи для дизайнера', 'JavaScript — що потрібно знати дизайнеру', 'DOM — що це', 'Browser DevTools', 'Git / GitHub', 'Web Browsers', 'Web Standards', 'Web Performance'],
  },
  {
    id: 'design-to-development', level: 'web-design', order: 21, emoji: '🔄', title: 'Design → Development',
    desc: 'Передача макета розробнику: вимірювання, стани, ассети, Figma Dev Mode',
    topics: ['Передача макета', 'Measurements', 'Spacing', 'Colors', 'Typography', 'Assets', 'Components', 'States', 'Responsive Behavior', 'Developer Handoff', 'Figma Dev Mode'],
  },
  {
    id: 'website-types-practice', level: 'web-design', order: 22, emoji: '🗂️', title: 'Типи вебсайтів — практика',
    desc: 'Лендінги, портфоліо, e-commerce, SaaS, блоги та інші типи сайтів на практиці',
    topics: ['Landing Page', 'Portfolio', 'Business Website', 'Corporate Website', 'E-commerce', 'Blog', 'News Website', 'SaaS Website', 'Personal Website', 'Educational Website', 'Documentation Website', 'Multi-Page Website'],
  },
  {
    id: 'real-projects', level: 'web-design', order: 23, emoji: '🚀', title: 'Реальні проєкти',
    desc: 'Практичні проєкти: від простого лендінгу до повного Web Design Project',
    topics: ['Простий Landing Page', 'Responsive Landing Page', 'Portfolio', 'Business Website', 'E-commerce', 'SaaS Website', 'Multi-Page Website', 'Повний Web Design Project'],
  },
  {
    id: 'web-designer-portfolio', level: 'web-design', order: 24, emoji: '💼', title: 'Web Designer Portfolio',
    desc: 'Структура портфоліо, case study, презентація процесу та фінальний проєкт',
    topics: ['Структура портфоліо', 'Case Study', 'Presentation', 'Design Process', 'Figma Presentation', 'Project Description', 'Developer Handoff', 'Final Project'],
  },
]

export function getSubcategoriesByLevel(level) {
  return SUBCATEGORIES.filter((s) => s.level === level).sort((a, b) => a.order - b.order)
}

export function getSubcategory(id) {
  return SUBCATEGORIES.find((s) => s.id === id)
}
