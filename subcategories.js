// Підкатегорії (модулі) всередині напрямку дизайну — рівень між
// directions.js (Web Design, UI Design, ...) і окремими уроками з
// modules.js. `level` = slug напрямку (той самий, що в levels.js).
// `id` кожної підкатегорії використовується в уроках (modules.js:
// поле subcategory) і в маршруті /academy/:direction/:subcategory.
//
// Web Design: 24 підкатегорії. Кожна містить `topics` — офіційний перелік
// тем цієї підкатегорії (з ТЗ). Усі 24 підкатегорії Web Design мають
// написані уроки (modules.js). App Design: ще 24 підкатегорії, дзеркальні
// до Web Design за структурою, але адаптовані під мобільний дизайн —
// реальні уроки поки написані лише для 'app-design-basics', решта тем і
// підкатегорій чесно показані як заплановані (список тем без посилань),
// а не фейкові порожні уроки.
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
    id: 'accessibility', level: 'web-design', order: 14, emoji: '🔓', title: 'Accessibility',
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
  // App Design: 24 підкатегорії, дзеркально до Web Design, але адаптовані
  // під мобільний дизайн (жести, safe area, таб-бар, iOS/Android
  // гайдлайни тощо) там, де це принципово відрізняється від вебу.
  // Реальні уроки поки написані лише для 'app-design-basics' — решта
  // показана як заплановані теми, поки не отримають власний файл у lessons/.
  {
    id: 'app-design-basics', level: 'app-design', order: 1, emoji: '📱', title: 'Основи App Design',
    desc: 'Що таке дизайн застосунків, як працюють мобільні застосунки, типи застосунків і екранів, роль дизайнера',
    topics: ['Що таке App Design', 'Як працюють мобільні застосунки', 'Типи застосунків', 'Типи екранів', 'Структура застосунку', 'Етапи створення застосунку', 'App Designer: роль і завдання', 'Design → Development'],
  },
  {
    id: 'app-visual-design-basics', level: 'app-design', order: 2, emoji: '🎨', title: 'Основи візуального дизайну',
    desc: 'Візуальна ієрархія, баланс, контраст, ритм і інші базові принципи композиції',
    topics: ['Visual Design', 'Visual Hierarchy', 'Balance', 'Contrast', 'Alignment', 'Proximity', 'Repetition', 'Scale', 'Proportion', 'Rhythm', 'Whitespace', 'Visual Flow'],
  },
  {
    id: 'app-composition-layout', level: 'app-design', order: 3, emoji: '📐', title: 'Композиція та Layout',
    desc: '8pt-сітка, safe area, контейнери, відступи та структура екрана',
    topics: ['Composition', 'Layout', '8pt Grid System', 'Safe Area', 'Margins', 'Padding', 'Alignment', 'Content Width', 'Screen Structure', 'Adaptive Layout'],
  },
  {
    id: 'app-color', level: 'app-design', order: 4, emoji: '🌈', title: 'Колір',
    desc: 'Теорія кольору, колірне коло, палітри, Dark Mode та контраст для доступності',
    topics: ['Color Theory', 'Color Wheel', 'Hue', 'Saturation', 'Brightness', 'Tint', 'Shade', 'Tone', 'Color Harmonies', 'Color Palettes', 'Dark Mode', 'Color Systems', 'Contrast', 'Accessibility'],
  },
  {
    id: 'app-typography', level: 'app-design', order: 5, emoji: '🔤', title: 'Типографіка',
    desc: 'Шрифти, системні шрифти iOS/Android, розмір, інтервали та типографічні системи',
    topics: ['Typography', 'Typeface', 'System Fonts (SF/Roboto)', 'Font Weight', 'Font Size', 'Dynamic Type', 'Line Height', 'Letter Spacing', 'Typography Hierarchy', 'Font Pairing', 'Typography Systems'],
  },
  {
    id: 'app-visual-assets', level: 'app-design', order: 6, emoji: '🖼️', title: 'Візуальні матеріали',
    desc: 'App Icon, splash screen, ілюстрації, іконки, SVG та ресурси різних щільностей екрана',
    topics: ['App Icon', 'Splash Screen', 'Images', 'Illustrations', 'Icons', 'SVG', 'Shapes', 'Patterns', 'Shadows & Elevation', '@2x/@3x Assets', 'Image Optimization'],
  },
  {
    id: 'app-screens-structure', level: 'app-design', order: 7, emoji: '🏗️', title: 'Структура екранів',
    desc: 'Status bar, навігація, таб-бар, списки, картки, empty states, onboarding',
    topics: ['Status Bar', 'Navigation Bar', 'Tab Bar', 'Bottom Navigation', 'Screens', 'Lists', 'Cards', 'Empty States', 'Onboarding', 'CTA'],
  },
  {
    id: 'app-components', level: 'app-design', order: 8, emoji: '🧩', title: 'App Components',
    desc: 'Кнопки, поля, свічі, пікери, боттом-шити, табси та стани UI',
    topics: ['Buttons', 'Inputs', 'Forms', 'Switches', 'Checkboxes', 'Radio Buttons', 'Pickers', 'Tabs', 'Bottom Sheet', 'Modal', 'Tooltip', 'Cards', 'UI States'],
  },
  {
    id: 'app-adaptive-design', level: 'app-design', order: 9, emoji: '📲', title: 'Adaptive Design',
    desc: 'Адаптивність під різні розміри екранів, orientation, safe area, Dark Mode',
    topics: ['Adaptive Design', 'Phone Sizes', 'Tablet', 'Foldables', 'Screen Density', 'Safe Area', 'Portrait / Landscape', 'Dark Mode', 'Dynamic Type'],
  },
  {
    id: 'app-design-systems', level: 'app-design', order: 10, emoji: '🧱', title: 'Components & Design Systems',
    desc: 'Анатомія компонентів, варіанти, стани, дизайн-токени та бібліотеки компонентів',
    topics: ['Components', 'Component Anatomy', 'Variants', 'States', 'Component Properties', 'Design Tokens', 'Color System', 'Typography System', 'Spacing System', 'Design System', 'Component Library'],
  },
  {
    id: 'app-wireframing', level: 'app-design', order: 11, emoji: '📝', title: 'Wireframing',
    desc: 'Проєктування структури екранів від low- до high-fidelity',
    topics: ['Що таке Wireframe', 'Low-Fidelity', 'Mid-Fidelity', 'High-Fidelity', 'Screen Wireframe', 'Flow Planning', 'Adaptive Wireframe'],
  },
  {
    id: 'app-prototyping', level: 'app-design', order: 12, emoji: '🕹️', title: 'Prototyping',
    desc: 'User flow, жести, взаємодії, стани та клікабельні прототипи',
    topics: ['Що таке Prototype', 'User Flow', 'Navigation', 'Gesture Interactions', 'Interactions', 'States', 'Transitions', 'Clickable Prototype', 'Interactive Prototype'],
  },
  {
    id: 'app-motion-animation', level: 'app-design', order: 13, emoji: '🎞️', title: 'Motion & Animation',
    desc: 'Принципи анімації, переходи між екранами, haptics, мікровзаємодії',
    topics: ['Motion Design', 'Animation Principles', 'Screen Transitions', 'Gesture Animations', 'Haptics', 'Loading', 'Microinteractions', 'Scroll Animation'],
  },
  {
    id: 'app-accessibility', level: 'app-design', order: 14, emoji: '🔓', title: 'Accessibility',
    desc: 'Контраст кольору, розмір зони дотику, VoiceOver/TalkBack, доступні компоненти',
    topics: ['Що таке Accessibility', 'Color Contrast', 'Touch Target Size', 'Typography & Readability', 'VoiceOver / TalkBack', 'Color Blindness', 'Accessible Components', 'Visual Accessibility'],
  },
  {
    id: 'app-figma-basics', level: 'app-design', order: 15, emoji: '🟣', title: 'Figma — основи',
    desc: 'Інтерфейс Figma: файли, сторінки, фрейми, шари, фігури та експорт',
    topics: ['Figma Interface', 'Files', 'Pages', 'Frames', 'Layers', 'Groups', 'Shapes', 'Text', 'Images', 'Components', 'Assets', 'Export'],
  },
  {
    id: 'app-figma-layout', level: 'app-design', order: 16, emoji: '📏', title: 'Figma — Layout',
    desc: 'Auto Layout, constraints, сітки та адаптивні мобільні фрейми',
    topics: ['Auto Layout', 'Constraints', 'Grids', 'Layout Grids', 'Adaptive Frames', 'Spacing', 'Alignment', 'Components', 'Variants'],
  },
  {
    id: 'app-figma-design-system', level: 'app-design', order: 17, emoji: '🎛️', title: 'Figma — Design System',
    desc: 'Стилі, змінні, компоненти, варіанти та дизайн-токени в Figma',
    topics: ['Styles', 'Variables', 'Color Variables', 'Typography Styles', 'Spacing', 'Components', 'Variants', 'Component Properties', 'Design Tokens', 'Libraries'],
  },
  {
    id: 'app-figma-prototype', level: 'app-design', order: 18, emoji: '🔗', title: 'Figma — Prototype',
    desc: 'Prototype Mode, жести, тригери, дії, оверлеї та скрол',
    topics: ['Prototype Mode', 'Connections', 'Gesture Triggers', 'Interactions', 'Actions', 'Animations', 'Overlays', 'Scroll', 'Interactive Components'],
  },
  {
    id: 'app-figma-app-design', level: 'app-design', order: 19, emoji: '📱', title: 'Figma — App Design',
    desc: 'Створення мобільних макетів у Figma: iOS, Android, навігаційні патерни, Dev Mode',
    topics: ['Створення Mobile Layout', 'iOS Design', 'Android Design', 'Tablet Design', 'Navigation Patterns', 'Onboarding Flow', 'Design System', 'Developer Handoff', 'Dev Mode'],
  },
  {
    id: 'app-tech-minimum', level: 'app-design', order: 20, emoji: '⚙️', title: 'Мінімум технічних знань',
    desc: 'Native vs Cross-platform, iOS/Android гайдлайни, DevTools, Git — рівень, потрібний дизайнеру',
    topics: ['Native vs Cross-platform — основи для дизайнера', 'iOS Human Interface Guidelines', 'Material Design Guidelines', 'Що таке API для дизайнера', 'Git / GitHub', 'App Store / Google Play — основи', 'Web Standards для застосунків', 'Performance для дизайнера'],
  },
  {
    id: 'app-design-to-development', level: 'app-design', order: 21, emoji: '🔄', title: 'Design → Development',
    desc: 'Передача макета розробнику: вимірювання, стани, ассети, Figma Dev Mode',
    topics: ['Передача макета', 'Measurements', 'Spacing', 'Colors', 'Typography', 'Assets (@1x/@2x/@3x)', 'Components', 'States', 'Adaptive Behavior', 'Developer Handoff', 'Figma Dev Mode'],
  },
  {
    id: 'app-types-practice', level: 'app-design', order: 22, emoji: '🗂️', title: 'Типи застосунків — практика',
    desc: 'Соцмережі, e-commerce, фітнес, фінанси, стрімінг та інші типи застосунків на практиці',
    topics: ['Social App', 'E-commerce App', 'Fitness App', 'Banking App', 'Productivity App', 'Streaming App', 'Messaging App', 'Travel App', 'Food Delivery App', 'Education App', 'Health App', 'Onboarding Flow'],
  },
  {
    id: 'app-real-projects', level: 'app-design', order: 23, emoji: '🚀', title: 'Реальні проєкти',
    desc: 'Практичні проєкти: від простого екрана до повного App Design Project',
    topics: ['Простий екран застосунку', 'Onboarding Flow', 'Profile Screen', 'Banking App', 'E-commerce App', 'Social App', 'Multi-Screen Flow', 'Повний App Design Project'],
  },
  {
    id: 'app-designer-portfolio', level: 'app-design', order: 24, emoji: '💼', title: 'App Designer Portfolio',
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
