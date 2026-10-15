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
  // UI Design: третій напрямок, 24 підкатегорії. Не дублює Web/App Design
  // (ті вже покривають візуальний дизайн, компоненти й Figma для вебу й
  // мобільних застосунків) — натомість це поглиблена, платформо-незалежна
  // дисципліна інтерфейсів: interaction design, психологія сприйняття,
  // складні UI-патерни (таблиці, фільтри, дашборди, enterprise UI),
  // мікрокопірайтинг, евристики, крос-платформна консистентність,
  // доступність складних компонентів і юзабіліті-тестування. Id уроків —
  // зсув +10000 (10000 + order*100 + n), щоб гарантовано не перетинатись
  // з Web Design (order*100) і App Design (5000 + order*100).
  {
    id: 'ui-foundations', level: 'ui-design', order: 1, emoji: '🧭', title: 'Основи UI Design',
    desc: 'Що таке UI Design, різниця з UX і Visual Design, роль UI дизайнера',
    topics: ['Що таке UI Design', 'UI vs UX', 'UI vs Visual Design', 'UI Designer: роль і завдання', 'UI Design на перетині Web і App Design', 'Інструменти UI дизайнера', 'Мова інтерфейсу', 'Де закінчується UI і починається UX'],
  },
  {
    id: 'interaction-design', level: 'ui-design', order: 2, emoji: '🕹️', title: 'Interaction Design',
    desc: 'Принципи взаємодії: affordance, feedback, закони Фіттса й Хіка, пряма маніпуляція',
    topics: ['Affordance', 'Signifiers', 'Feedback', 'Mapping', "Fitts's Law", "Hick's Law", 'Direct Manipulation', 'Constraints', 'Discoverability'],
  },
  {
    id: 'perception-gestalt', level: 'ui-design', order: 3, emoji: '👁️', title: 'Сприйняття та Gestalt у глибину',
    desc: 'Принципи гештальт-психології та візуального сприйняття на рівні складних інтерфейсів',
    topics: ['Figure/Ground', 'Closure', 'Common Fate', 'Continuity', 'Similarity', 'Proximity (поглиблено)', 'Visual Weight', 'Perceptual Hierarchy'],
  },
  {
    id: 'cognitive-psychology-ui', level: 'ui-design', order: 4, emoji: '🧠', title: 'Когнітивна психологія для UI',
    desc: 'Робоча пам’ять, когнітивне навантаження, ментальні моделі та когнітивні викривлення в UI',
    topics: ['Working Memory', 'Cognitive Load', 'Mental Models', 'Recognition vs Recall', 'Progressive Disclosure', 'Choice Overload', 'Cognitive Biases в UI', 'Peak-End Rule'],
  },
  {
    id: 'information-architecture', level: 'ui-design', order: 5, emoji: '🗂️', title: 'Information Architecture',
    desc: 'Навігаційні моделі, таксономія, card sorting і findability',
    topics: ['Що таке IA', 'Navigation Models', 'Taxonomy', 'Card Sorting', 'Findability', 'Site Maps', 'Labeling Systems', 'Ментальні моделі в IA'],
  },
  {
    id: 'navigation-patterns', level: 'ui-design', order: 6, emoji: '🗺️', title: 'Складні навігаційні патерни',
    desc: 'Mega menu, командна палітра, глобальний пошук і складні випадки навігації',
    topics: ['Mega Menu', 'Command Palette', 'Global Search', 'Breadcrumbs (поглиблено)', 'Sidebar Navigation', 'Складні Tab-навігації', 'Contextual Navigation', 'Navigation Hierarchy'],
  },
  {
    id: 'data-tables', level: 'ui-design', order: 7, emoji: '📊', title: 'Таблиці даних',
    desc: 'Сортування, фільтрація, масові дії, inline-редагування та адаптивні таблиці',
    topics: ['Table Anatomy', 'Sorting', 'Filtering в таблиці', 'Bulk Actions', 'Inline Editing', 'Pagination vs Infinite Scroll', 'Responsive Tables', 'Sticky Headers/Columns'],
  },
  {
    id: 'search-filters', level: 'ui-design', order: 8, emoji: '🔍', title: 'Пошук і фільтри',
    desc: 'Autocomplete, faceted search, розширені фільтри й порожні результати пошуку',
    topics: ['Search UI', 'Autocomplete', 'Faceted Search', 'Advanced Filters', 'Search Results', 'Порожні результати пошуку', 'Search-as-you-type', 'Saved Filters'],
  },
  {
    id: 'advanced-forms', level: 'ui-design', order: 9, emoji: '📝', title: 'Складні форми',
    desc: 'Багатокрокові форми, умовні поля, валідація, автозбереження та wizards',
    topics: ['Multi-step Forms', 'Conditional Fields', 'Inline Validation', 'Form Wizards', 'Складні типи полів', 'Error Recovery', 'Autosave', 'Form Progress'],
  },
  {
    id: 'dashboards-dataviz', level: 'ui-design', order: 10, emoji: '📈', title: 'Дашборди та Data Viz в UI',
    desc: 'Layout дашбордів, KPI-віджети, вибір типу графіка та щільність даних',
    topics: ['Dashboard Layout', 'KPI Widgets', 'Вибір типу графіка', 'Data Density', 'Dashboard Hierarchy', 'Customizable Dashboards', 'Real-time Data в UI'],
  },
  {
    id: 'notifications-feedback', level: 'ui-design', order: 11, emoji: '🔔', title: 'Сповіщення та системний фідбек',
    desc: 'Toasts, банери, ієрархія алертів, і поглиблені empty/error/loading стани',
    topics: ['Toasts', 'Banners', 'Alerts Hierarchy', 'Badges', 'Empty States (поглиблено)', 'Error States (поглиблено)', 'Loading States (поглиблено)', 'Confirmation Patterns'],
  },
  {
    id: 'onboarding-adoption', level: 'ui-design', order: 12, emoji: '🎯', title: 'Онбординг і адопція фіч',
    desc: 'Coachmarks, tooltips, progressive disclosure і feature discovery',
    topics: ['Coachmarks', 'Tooltips', 'Progressive Disclosure в онбордингу', 'Empty States як навчання', 'Feature Discovery', 'Checklist Onboarding', 'Product Tours'],
  },
  {
    id: 'enterprise-saas-ui', level: 'ui-design', order: 13, emoji: '🏢', title: 'Enterprise & SaaS UI',
    desc: 'Permissions UI, архітектура налаштувань, адмін-панелі й multi-tenant інтерфейси',
    topics: ['Permissions UI', 'Roles & Access', 'Settings Architecture', 'Admin Panels', 'Multi-tenant UI', 'Bulk Operations UI', 'Enterprise Data Density'],
  },
  {
    id: 'dark-patterns-ethics', level: 'ui-design', order: 14, emoji: '⚖️', title: 'Dark Patterns та етика UI',
    desc: 'Маніпулятивні патерни, як їх розпізнати й уникнути, етичний дизайн',
    topics: ['Що таке Dark Pattern', 'Roach Motel', 'Confirmshaming', 'Forced Continuity', 'Hidden Costs', 'Етичний UI Design', 'Як розпізнати і уникнути'],
  },
  {
    id: 'ux-writing-microcopy', level: 'ui-design', order: 15, emoji: '✍️', title: 'UX Writing і мікрокопірайтинг',
    desc: 'Текст кнопок, повідомлення про помилки, тон голосу й копірайтинг в інтерфейсі',
    topics: ['Microcopy', 'Button Text', 'Error Messages', 'Empty State Copy', 'Tone of Voice', 'Onboarding Copy', 'Confirmation Copy', 'Локалізація тексту UI'],
  },
  {
    id: 'heuristics-critique', level: 'ui-design', order: 16, emoji: '🧪', title: 'Евристики та дизайн-критика',
    desc: '10 евристик Нільсена, евристична оцінка й фреймворки фідбеку',
    topics: ["Nielsen's 10 Heuristics", 'Heuristic Evaluation', 'Design Critique', 'Feedback Frameworks', 'Self-review Checklist', 'Peer Review'],
  },
  {
    id: 'cross-platform-consistency', level: 'ui-design', order: 17, emoji: '🔗', title: 'Крос-платформна консистентність',
    desc: 'Платформні конвенції, бренд проти платформи, токени крос-платформно',
    topics: ['Platform Conventions', 'iOS vs Android vs Web патерни', 'Brand vs Platform', 'Design Tokens крос-платформно', 'Responsive vs Adaptive vs Native'],
  },
  {
    id: 'desktop-software-ui', level: 'ui-design', order: 18, emoji: '🖥️', title: 'UI для десктопного ПЗ',
    desc: 'Menu bar, тулбари, багатовіконний UI, контекстні меню й клавіатурні шорткати',
    topics: ['Menu Bar', 'Toolbars', 'Multi-window UI', 'Context Menus', 'Keyboard Shortcuts', 'Desktop vs Web конвенції', 'Native Controls'],
  },
  {
    id: 'emerging-platforms-ui', level: 'ui-design', order: 19, emoji: '📡', title: 'UI для нових платформ',
    desc: 'TV/10-foot UI, voice UI, wearables, кіоски та великі екрани',
    topics: ['TV / 10-foot UI', 'Voice UI', 'Wearables UI', 'Kiosk UI', 'Large Display UI', 'Cross-device Continuity'],
  },
  {
    id: 'accessible-complex-ui', level: 'ui-design', order: 20, emoji: '♿', title: 'Доступність складних UI-компонентів',
    desc: 'ARIA-патерни, керування фокусом і скрінрідери для таблиць, модалок і data viz',
    topics: ['ARIA Patterns', 'Focus Management', 'Screen Reader для таблиць', 'Screen Reader для модалок', 'Keyboard Traps', 'Accessible Data Viz'],
  },
  {
    id: 'design-systems-scale', level: 'ui-design', order: 21, emoji: '🏛️', title: 'Дизайн-системи в масштабі',
    desc: 'Governance, крос-платформні токени, contribution model і документація',
    topics: ['Design System Governance', 'Токени крос-платформно', 'Contribution Model', 'Versioning', 'Documentation', 'Adoption Metrics'],
  },
  {
    id: 'usability-testing', level: 'ui-design', order: 22, emoji: '🧰', title: 'Юзабіліті-тестування для UI дизайнера',
    desc: '5-Second Test, first-click test, сценарії тестування й синтез результатів',
    topics: ['5-Second Test', 'First-Click Test', 'Usability Test Script', 'Moderated vs Unmoderated', 'Synthesizing Findings', 'Основи A/B-тестування'],
  },
  {
    id: 'ui-design-process-portfolio', level: 'ui-design', order: 23, emoji: '💼', title: 'Процес і портфоліо UI Designer',
    desc: 'Процес роботи UI дизайнера, складні UI-кейси в портфоліо та їх подача',
    topics: ['UI Design Process', 'Case Study для складного UI', 'Enterprise/SaaS кейс у портфоліо', 'Presentation складного UI-проєкту'],
  },
  {
    id: 'ui-final-project', level: 'ui-design', order: 24, emoji: '🚀', title: 'Фінальний UI проєкт',
    desc: 'Dashboard Project, Design System Project і повний UI Design Project',
    topics: ['Складна таблиця/дашборд з нуля', 'Dashboard Project', 'Design System Project', 'Повний UI Design Project'],
  },

  // Напрямок Game Design (level: 'game-design'). Окремий від App/UI Design —
  // тут предмет дизайну не екран чи інтерфейс, а правила, механіки й досвід
  // гри; UI-специфічні підкатегорії (hud-ingame-ui, game-menus-navigation)
  // свідомо беруть інший кут, ніж web-components.js/app-components.js, і
  // практичні завдання спираються на окремий Game Design Lab, а не на
  // загальний SketchPad.
  {
    id: 'game-design-basics', level: 'game-design', order: 1, emoji: '🎮', title: 'Основи Game Design',
    desc: 'Що таке Game Design, ролі в команді, гра проти іграшки й головоломки',
    topics: ['Що таке Game Design', 'Game Designer vs Level Designer vs Systems Designer', 'Game vs Toy vs Puzzle', 'Ключові питання дизайнера', 'Game Design vs Game Development'],
  },
  {
    id: 'game-design-process', level: 'game-design', order: 2, emoji: '🔄', title: 'Процес Game Design',
    desc: 'Ідея → прототип → плейтест → ітерація, пітчинг і скоуп проєкту',
    topics: ['Ideation', 'Прототипування', 'Плейтестинг', 'Ітерація', 'Пітч ідеї', 'Скоуп для джему vs студійного проєкту'],
  },
  {
    id: 'core-loop-mechanics', level: 'game-design', order: 3, emoji: '🔁', title: 'Core Loop та механіки',
    desc: 'Ядро гри, ігрові дієслова, механіки, правила, динаміки й естетика (MDA)',
    topics: ['Core Gameplay Loop', 'Game Verbs', 'Mechanics', 'MDA Framework', 'Mechanics vs Dynamics vs Aesthetics', 'Мінімально життєздатний loop'],
  },
  {
    id: 'rules-systems-design', level: 'game-design', order: 4, emoji: '⚙️', title: 'Правила та системний дизайн',
    desc: 'Формальні правила, emergent-поведінка, петлі зворотного зв’язку, системне мислення',
    topics: ['Формальні правила', 'Emergent Gameplay', 'Positive/Negative Feedback Loops', 'Системне мислення', 'Системи проти контенту'],
  },
  {
    id: 'player-psychology', level: 'game-design', order: 5, emoji: '🧠', title: 'Психологія гравця та мотивація',
    desc: 'Типи гравців за Бартлом, стан потоку, внутрішня й зовнішня мотивація',
    topics: ['Bartle Player Types', 'Flow State', 'Внутрішня vs зовнішня мотивація', 'Self-Determination Theory', 'Автономія, компетентність, причетність'],
  },
  {
    id: 'game-balance', level: 'game-design', order: 6, emoji: '⚖️', title: 'Баланс гри',
    desc: 'Симетрія/асиметрія, транзитивні й інтранзитивні відношення, криві сили',
    topics: ['Symmetry vs Asymmetry', 'Transitive/Intransitive Relationships', 'Rock-Paper-Scissors', 'Power Curves', 'Балансування через плейтести й дані', 'Dominant Strategy'],
  },
  {
    id: 'difficulty-progression', level: 'game-design', order: 7, emoji: '📈', title: 'Складність та прогресія',
    desc: 'Криві складності, темп, навчання механікам без текстових туторіалів',
    topics: ['Difficulty Curve', 'Pacing', 'Навчання через дію, не текст', 'Skill-based vs Grind-based Progression', 'Опції складності'],
  },
  {
    id: 'level-design-fundamentals', level: 'game-design', order: 8, emoji: '🗺️', title: 'Основи Level Design',
    desc: 'Принципи рівня, темп і потік у просторі, орієнтири, навчання через layout',
    topics: ['Принципи Level Design', 'Pacing і Flow у просторі', 'Landmarks і Wayfinding', 'Навчання механіці через розташування', 'Critical Path vs Дослідження'],
  },
  {
    id: 'game-genres-conventions', level: 'game-design', order: 9, emoji: '🕹️', title: 'Жанри та їхні конвенції',
    desc: 'Платформер, RPG, головоломка, шутер, стратегія — очікування гравця за жанром',
    topics: ['Platformer', 'RPG', 'Puzzle', 'FPS/Shooter', 'Strategy', 'Roguelike', 'Коли порушувати конвенції жанру'],
  },
  {
    id: 'narrative-design', level: 'game-design', order: 10, emoji: '📖', title: 'Наративний дизайн',
    desc: 'Сторітелінг у грі, середовищний наратив, розгалужена історія, ludo-narrative dissonance',
    topics: ['Сторітелінг у грі', 'Environmental Storytelling', 'Branching Narrative', 'Ludo-narrative Dissonance', 'Наратив у злагоді з механіками'],
  },
  {
    id: 'game-economy', level: 'game-design', order: 11, emoji: '💰', title: 'Економіка гри',
    desc: 'Валюти, sinks/faucets, крафтингові економіки, контроль інфляції',
    topics: ['Валюти', 'Sinks та Faucets', 'Крафтингова економіка', 'Контроль інфляції', 'Soft vs Hard Currency'],
  },
  {
    id: 'multiplayer-social-design', level: 'game-design', order: 12, emoji: '👥', title: 'Мультиплеєр і соціальний дизайн',
    desc: 'Конкуренція проти кооперації, matchmaking, соціальні механіки, запобігання грифінгу',
    topics: ['Competitive vs Cooperative Design', 'Matchmaking й skill rating', 'Соціальні механіки (гільдії, друзі, лідерборди)', 'Запобігання грифінгу'],
  },
  {
    id: 'monetization-f2p', level: 'game-design', order: 13, emoji: '💳', title: 'Монетизація та F2P',
    desc: 'IAP, battle pass, loot box і регуляція, етична монетизація проти dark patterns',
    topics: ['Типи IAP', 'Battle Pass', 'Loot Box і регуляція', 'Етична монетизація vs dark patterns у грі'],
  },
  {
    id: 'hud-ingame-ui', level: 'game-design', order: 14, emoji: '🎯', title: 'HUD та ігровий UI',
    desc: 'Diegetic/non-diegetic/meta/spatial UI, мінімальний HUD, читабельність під час дії',
    topics: ['Diegetic vs Non-diegetic vs Meta vs Spatial UI', 'Мінімальний HUD', 'Читабельність під час дії', 'Практика в Game Design Lab'],
  },
  {
    id: 'game-menus-navigation', level: 'game-design', order: 15, emoji: '📋', title: 'Меню та навігація в грі',
    desc: 'Головне меню, пауза, налаштування, інвентар, навігація контролером проти миші',
    topics: ['Головне меню', 'Pause Menu', 'Налаштування', 'Інвентар/екіпірування', 'Навігація контролером (D-pad/focus order)'],
  },
  {
    id: 'game-accessibility', level: 'game-design', order: 16, emoji: '♿', title: 'Доступність у іграх',
    desc: 'Колірна сліпота, субтитри, опції складності, перепризначення керування, укачування',
    topics: ['Colorblind Modes', 'Субтитри й підписи', 'Опції складності/асисту', 'Перепризначення керування', 'Motion Sickness'],
  },
  {
    id: 'game-design-documentation', level: 'game-design', order: 17, emoji: '📄', title: 'Game Design Document',
    desc: 'Структура GDD, one-pager, пітч-дек, живий документ проти фіксованого ТЗ',
    topics: ['Структура GDD', 'One-pager', 'Пітч-дек', 'Живий документ vs upfront-специфікація'],
  },
  {
    id: 'game-prototyping', level: 'game-design', order: 18, emoji: '🧪', title: 'Прототипування ігор',
    desc: 'Паперовий прототип, цифровий/ігровий рушій, швидка ітерація механіки в ізоляції',
    topics: ['Paper Prototyping', 'Цифрове/engine-прототипування', 'Швидка ітерація', 'Прототип механіки в ізоляції від контенту'],
  },
  {
    id: 'playtesting-iteration', level: 'game-design', order: 19, emoji: '👀', title: 'Плейтестинг та ітерація',
    desc: 'Методи плейтесту, що спостерігати проти що кажуть гравці, збір фідбеку',
    topics: ['Методи плейтестингу', 'Silent Observation vs Think-aloud', 'Що гравці роблять vs що кажуть', 'Збір і синтез фідбеку', 'Цикл ітерації'],
  },
  {
    id: 'game-feel-juice', level: 'game-design', order: 20, emoji: '✨', title: 'Game Feel та «соковитість»',
    desc: 'Відчуття гри, петлі фідбеку, screen shake, частинки, hit-stop, чутливість вводу',
    topics: ['Game Feel', 'Juiciness', 'Screen Shake', 'Частинки й VFX-фідбек', 'Hit-stop', 'Чутливість вводу'],
  },
  {
    id: 'level-design-practice', level: 'game-design', order: 21, emoji: '🏗️', title: 'Level Design — практика',
    desc: 'Практичні вправи з level design на рівні проєкту, а не окремого принципу',
    topics: ['Практичний level design', 'Застосування принципів у масштабі', 'Ревʼю рівня'],
  },
  {
    id: 'cross-platform-game-design', level: 'game-design', order: 22, emoji: '📱', title: 'Game Design на різних платформах',
    desc: 'Консоль/ПК/мобільний/VR — різниця в методах вводу, довжині сесії, конвенціях',
    topics: ['Консоль vs ПК vs Мобільний vs VR', 'Методи вводу', 'Довжина сесії', 'Розмір екрана', 'Платформні конвенції'],
  },
  {
    id: 'game-designer-career', level: 'game-design', order: 23, emoji: '💼', title: 'Кар’єра Game Designer',
    desc: 'Ролі в студії, вхід в індустрію, портфоліо з джемів і модів, інді проти студії',
    topics: ['Ролі в студії', 'Вхід в індустрію', 'Портфоліо з джемів/модів', 'Інді vs студійний шлях'],
  },
  {
    id: 'game-design-portfolio-final', level: 'game-design', order: 24, emoji: '🚀', title: 'Портфоліо та фінальний проєкт',
    desc: 'Повна ігрова система — механіки, баланс, HUD — як кейс для портфоліо',
    topics: ['Проєктування повної ігрової системи', 'Механіки + баланс + HUD разом', 'Пакування в кейс портфоліо'],
  },
  {
    id: 'graphic-design-basics', level: 'graphic-design', order: 1, emoji: '🎯', title: 'Основи графічного дизайну',
    desc: 'Що таке Graphic Design, де він використовується, дизайн-бриф, референси й мудборд',
    topics: ['Що таке Graphic Design', 'Де використовується графічний дизайн', 'Як працює графічний дизайнер', 'Види графічного дизайну', 'Візуальне повідомлення та комунікація', 'Цільова аудиторія', 'Дизайн-бриф', 'Референси та пошук ідей', 'Moodboard', 'Аналіз готових дизайнів'],
  },
  {
    id: 'graphic-composition', level: 'graphic-design', order: 2, emoji: '📐', title: 'Композиція та візуальна ієрархія',
    desc: 'Баланс, контраст, ритм, негативний простір, сітки й правило третин',
    topics: ['Що таке композиція', 'Основні композиційні принципи', 'Візуальна ієрархія', 'Баланс і симетрія', 'Асиметрія', 'Контраст', 'Ритм і повторення', 'Близькість і групування', 'Негативний простір', 'Вирівнювання', 'Відступи та пропорції', 'Композиційні сітки', 'Правило третин', 'Фокусна точка', 'Візуальна вага', 'Типові композиційні помилки'],
  },
  {
    id: 'graphic-color', level: 'graphic-design', order: 3, emoji: '🌈', title: 'Колір і теорія кольору',
    desc: 'Колірне коло, гармонії, RGB/HEX/HSL/CMYK, емоції кольору й контраст для читабельності',
    topics: ['Що таке колір', 'Колірне коло', 'Основні, вторинні та проміжні кольори', 'Теплі й холодні кольори', 'Відтінок, насиченість і світлота', 'Колірні гармонії', 'Комплементарні кольори', 'Аналогові палітри', 'Тріадні палітри', 'Монохромна палітра', 'Контраст кольорів', 'Емоційне сприйняття кольору', 'Колір у брендингу', 'RGB, HEX, HSL та CMYK', 'Підбір палітри для проєкту', 'Читабельність тексту на фоні'],
  },
  {
    id: 'graphic-typography', level: 'graphic-design', order: 4, emoji: '🔤', title: 'Типографіка',
    desc: 'Типи шрифтів, ієрархія заголовків, поєднання шрифтів, інтервали й читабельність',
    topics: ['Що таке типографіка', 'Типи шрифтів', 'Serif, Sans Serif, Display, Monospace', 'Шрифт і характер бренду', 'Розмір тексту', 'Насиченість і накреслення', 'Міжрядковий інтервал', 'Міжлітерний інтервал', 'Довжина рядка', 'Вирівнювання тексту', 'Ієрархія заголовків', 'Поєднання шрифтів', 'Читабельність', 'Робота з кирилицею', 'Типографічні помилки'],
  },
  {
    id: 'graphic-shapes', level: 'graphic-design', order: 5, emoji: '◼️', title: 'Форми, лінії та графічні елементи',
    desc: 'Геометричні й органічні форми, фігура/фон, патерни, прості піктограми',
    topics: ['Геометричні форми', 'Органічні форми', 'Лінії та контури', 'Силует', 'Фігура і фон', 'Прості декоративні елементи', 'Повторення та патерни', 'Створення простих піктограм', 'Візуальна узгодженість', 'Використання форм у композиції'],
  },
  {
    id: 'graphic-images', level: 'graphic-design', order: 6, emoji: '🖼️', title: 'Зображення, фото та колаж',
    desc: 'Растр/вектор, роздільна здатність, кадрування, шари, колаж, авторські права',
    topics: ['Роль зображення в дизайні', 'Вибір відповідного зображення', 'Растрова та векторна графіка', 'Роздільна здатність', 'Формати зображень', 'Кадрування', 'Композиція фотографії', 'Маски та обрізання', 'Прозорість', 'Шари', 'Колаж', 'Фотомонтаж', 'Текстури', 'Візуальна узгодженість зображень', 'Авторські права та ліцензії'],
  },
  {
    id: 'graphic-posters', level: 'graphic-design', order: 7, emoji: '📯', title: 'Постери та афіші',
    desc: 'Формат, візуальний акцент, інформаційна ієрархія, підготовка до експорту',
    topics: ['Призначення постера', 'Види постерів', 'Формат і розмір', 'Візуальний акцент', 'Заголовок і підзаголовок', 'Поєднання тексту та зображення', 'Колір і композиція', 'Інформаційна ієрархія', 'Афіша заходу', 'Рекламний постер', 'Культурний та інформаційний постер', 'Перевірка читабельності', 'Підготовка до експорту'],
  },
  {
    id: 'graphic-social-media', level: 'graphic-design', order: 8, emoji: '📱', title: 'Дизайн для соціальних мереж',
    desc: 'Формати платформ, безпечні зони, серії публікацій, єдина візуальна система',
    topics: ['Особливості цифрових форматів', 'Публікації та обкладинки', 'Рекламні креативи', 'Текст у малому форматі', 'Безпечні зони', 'Серії публікацій', 'Єдина візуальна система', 'Адаптація одного дизайну до різних форматів', 'Експорт для цифрових платформ'],
  },
  {
    id: 'graphic-logos', level: 'graphic-design', order: 9, emoji: '🏷️', title: 'Логотипи та фірмовий стиль',
    desc: 'Типи логотипів, принцип простоти, масштабованість, фірмова палітра й гайдлайн',
    topics: ['Призначення логотипа', 'Типи логотипів', 'Словесний знак', 'Символ і емблема', 'Монограма', 'Поєднання символу й тексту', 'Принцип простоти', 'Масштабованість', 'Чорно-білий варіант', 'Фірмова палітра', 'Фірмова типографіка', 'Візуальна система бренду', 'Правила використання логотипа', 'Гайдлайн'],
  },
  {
    id: 'graphic-vector', level: 'graphic-design', order: 10, emoji: '✒️', title: 'Векторна графіка та ілюстрація',
    desc: 'Опорні точки, булеві операції, трасування, флет-ілюстрація, SVG-експорт',
    topics: ['Що таке векторна графіка', 'Опорні точки та криві', 'Контури та заливка', 'Булеві операції', 'Трасування растрового зображення', 'Ілюстрація простими формами', 'Іконки та піктограми', 'Масштабування без втрати якості', 'Експорт векторної графіки', 'Професійні інструменти для вектора'],
  },
  {
    id: 'graphic-print', level: 'graphic-design', order: 11, emoji: '📖', title: 'Багатосторінкові та друковані матеріали',
    desc: 'Макет розвороту, сітка, обкладинка, виліт, CMYK, DPI, підготовка до друку',
    topics: ['Що таке багатосторінкові матеріали', 'Макет сторінки та розворот', 'Сітка для багатосторінкових документів', 'Єдність стилю на всіх сторінках', 'Обкладинка видання', 'Навігація всередині документа', 'Поля на виліт і обрізні мітки', 'Кольоровий режим CMYK для друку', 'Роздільна здатність для друку', 'Підготовка файлу до друку', 'Види паперу та оздоблення', 'Експорт багатосторінкового PDF'],
  },
  {
    id: 'graphic-packaging', level: 'graphic-design', order: 12, emoji: '📦', title: 'Паковання та рекламні матеріали',
    desc: 'Розгортка упаковки, функціональні зони, виділення на полиці, макети',
    topics: ['Призначення пакування', 'Розгортка упаковки', 'Функціональні зони упаковки', 'Вплив форми й матеріалу на дизайн', 'Рекламні матеріали поза пакуванням', 'Візуальна консистентність лінійки продуктів', 'Виділення на полиці', 'Макети упаковки (mockup)', 'Підготовка файлу з урахуванням розгортки'],
  },
  {
    id: 'graphic-infographics', level: 'graphic-design', order: 13, emoji: '📊', title: 'Інфографіка та візуалізація інформації',
    desc: 'Типи інфографіки, діаграми, ієрархія даних, колірне кодування, читабельність',
    topics: ['Що таке інфографіка', 'Типи інфографіки', 'Візуалізація даних', 'Ієрархія інформації', 'Іконки та символи для даних', 'Спрощення складної інформації', 'Кольорове кодування даних', 'Читабельність і послідовність сприйняття', 'Підготовка інфографіки до публікації'],
  },
  {
    id: 'graphic-process', level: 'graphic-design', order: 14, emoji: '🗂️', title: 'Професійний процес роботи',
    desc: 'Бриф, дослідження, презентація, фідбек, комунікація, юридичні аспекти',
    topics: ['Етапи роботи дизайнера над проєктом', 'Бриф і збір вимог від клієнта', 'Дослідження та аналіз конкурентів', 'Генерація ідей та ескізи', 'Презентація концепцій клієнту', 'Отримання та обробка фідбеку', 'Ревізії та ітерації', 'Фіналізація та підготовка файлів до здачі', 'Комунікація з клієнтом', 'Оцінка вартості роботи та дедлайни', 'Фриланс проти роботи в команді', 'Авторські права та передача прав'],
  },
  {
    id: 'graphic-portfolio', level: 'graphic-design', order: 15, emoji: '🏆', title: 'Портфоліо та підсумкові проєкти',
    desc: 'Відбір робіт, подання кейсу, персональний бренд, фінальні капстоун-проєкти',
    topics: ['Що таке дизайнерське портфоліо', 'Відбір найкращих робіт', 'Різноманітність проєктів у портфоліо', 'Подання кейсу (процес, не лише результат)', 'Структура й послідовність портфоліо', 'Онлайн-платформи для портфоліо', 'Персональний бренд дизайнера', 'Підсумкові капстоун-проєкти курсу'],
  },
  {
    id: 'branding-basics', level: 'branding', order: 1, emoji: '🏢', title: 'Основи брендингу',
    desc: 'Що таке бренд і брендинг, види брендів, приклади сильних і слабких',
    topics: ['Що таке бренд', 'Що таке брендинг', 'Відмінність бренду, брендингу та айдентики', 'Бренд і логотип — не одне й те саме', 'З чого складається бренд', 'Як бренд сприймають люди', 'Бренд у бізнесі та повсякденному житті', 'Види брендів', 'Особистий бренд', 'Продуктовий бренд', 'Корпоративний бренд', 'Бренд послуги', 'Приклади сильних і слабких брендів'],
  },
  {
    id: 'branding-brief-research', level: 'branding', order: 2, emoji: '🔍', title: 'Бриф і дослідження',
    desc: 'Бриф, аудиторія, конкурентний аналіз, референси, moodboard',
    topics: ['Що таке брендинг-бриф', 'Як збирати інформацію про замовника', 'Продукт або послуга', 'Бізнес-цілі', 'Цільова аудиторія', 'Потреби аудиторії', 'Проблеми клієнтів', 'Конкурентний аналіз', 'Аналіз категорії', 'Прямі та непрямі конкуренти', 'Аналіз сильних і слабких сторін', 'Дослідження ринку', 'Референси та джерела натхнення', 'Moodboard', 'Висновки з дослідження'],
  },
  {
    id: 'branding-strategy', level: 'branding', order: 3, emoji: '🎯', title: 'Бренд-стратегія',
    desc: 'Місія, візія, цінності, позиціонування, УЦП, архетипи, тон голосу',
    topics: ['Що таке бренд-стратегія', 'Місія бренду', 'Візія', 'Цінності', 'Позиціонування', 'Унікальна ціннісна пропозиція', 'Переваги бренду', 'Обіцянка бренду', 'Характер бренду', 'Архетипи брендів як інструмент концептуалізації', 'Емоційне сприйняття', 'Раціональні й емоційні переваги', 'Тон комунікації', 'Основне повідомлення', 'Стратегічна платформа бренду'],
  },
  {
    id: 'branding-naming', level: 'branding', order: 4, emoji: '🔤', title: 'Неймінг — створення назви',
    desc: 'Типи назв, критерії вдалої назви, перевірка домену й торговельних марок',
    topics: ['Що таке неймінг', 'Вимоги до назви', 'Описова назва', 'Асоціативна назва', 'Вигадане слово', 'Назва на основі особистого імені', 'Метафори та образи', 'Мовні асоціації', 'Легкість вимови', 'Запам’ятовуваність', 'Перевірка небажаних значень', 'Перевірка доступності домену', 'Попередній пошук торговельних марок', 'Вибір фінальної назви'],
  },
  {
    id: 'branding-concept', level: 'branding', order: 5, emoji: '💡', title: 'Концепція бренду',
    desc: 'Ідея, асоціативне поле, moodboard, візуальні напрямки, вибір концепції',
    topics: ['Що таке концепція', 'Ідея та образ бренду', 'Асоціативне поле', 'Ключові слова', 'Метафори', 'Moodboard', 'Візуальні напрямки', 'Концептуальні ескізи', 'Порівняння концепцій', 'Вибір напрямку', 'Перевірка відповідності стратегії'],
  },
  {
    id: 'branding-logo', level: 'branding', order: 6, emoji: '✒️', title: 'Логотип',
    desc: 'Типи логотипів, принципи простоти й масштабованості, охоронні поля',
    topics: ['Призначення логотипа', 'Типи логотипів', 'Логотип-словесний знак', 'Символ', 'Монограма', 'Комбінований знак', 'Емблема', 'Принцип простоти', 'Унікальність і впізнаваність', 'Масштабованість', 'Читабельність', 'Негативний простір', 'Чорно-білий логотип', 'Світла й темна версії', 'Вертикальна та горизонтальна композиції', 'Охоронні поля', 'Мінімальний розмір', 'Типові помилки логотипів'],
  },
  {
    id: 'branding-colors', level: 'branding', order: 7, emoji: '🎨', title: 'Кольорова система бренду',
    desc: 'Основний/додаткові/акцентні кольори, гармонії, контраст, HEX/RGB/HSL/CMYK',
    topics: ['Колір у брендингу', 'Основний колір', 'Додаткові кольори', 'Акцентні кольори', 'Нейтральна палітра', 'Колірні гармонії', 'Контраст', 'Сприйняття кольору в контексті', 'Кольори конкурентів', 'Унікальність палітри', 'HEX RGB HSL CMYK', 'Палітра для цифрових матеріалів', 'Палітра для друку', 'Світлі й темні версії', 'Правила використання кольорів'],
  },
  {
    id: 'branding-typography', level: 'branding', order: 8, emoji: '🔠', title: 'Типографічна система',
    desc: 'Шрифт логотипа, заголовків і тексту, поєднання, кирилиця/латиниця, ліцензії',
    topics: ['Роль типографіки в брендингу', 'Шрифт логотипа', 'Фірмовий шрифт заголовків', 'Шрифт основного тексту', 'Поєднання шрифтів', 'Ієрархія тексту', 'Читабельність', 'Кирилиця та латиниця', 'Ліцензії шрифтів', 'Типографічні правила бренду'],
  },
  {
    id: 'branding-visual-identity', level: 'branding', order: 9, emoji: '🧩', title: 'Графічна система та айдентика',
    desc: 'Фірмові форми, патерни, іконографіка, фотостиль, дизайн-система бренду',
    topics: ['Що таке візуальна айдентика', 'Відмінність логотипа від айдентики', 'Фірмові форми', 'Патерни', 'Іконографіка', 'Ілюстративний стиль', 'Фотостиль', 'Графічні рамки та елементи', 'Принципи композиції бренду', 'Система макетів', 'Узгодженість матеріалів', 'Побудова дизайн-системи бренду'],
  },
  {
    id: 'branding-voice', level: 'branding', order: 10, emoji: '💬', title: 'Голос і комунікація бренду',
    desc: 'Tone of Voice, словник бренду, ключові повідомлення, слоган',
    topics: ['Tone of Voice', 'Характер мовлення', 'Формальний і неформальний стиль', 'Словник бренду', 'Формулювання ключових повідомлень', 'Слоган', 'Комунікація з аудиторією', 'Приклади правильного та неправильного тону', 'Узгодженість текстів', 'Правила комунікації'],
  },
  {
    id: 'branding-media', level: 'branding', order: 11, emoji: '📦', title: 'Носії айдентики',
    desc: 'Візитка, паковання, банери, соцмережі, мерч, мокапи',
    topics: ['Візитка', 'Бланк і ділові матеріали', 'Паковання', 'Етикетка', 'Рекламний банер', 'Публікація для соцмереж', 'Обкладинка', 'Презентація', 'Вивіска', 'Мерч', 'Дизайн цифрових матеріалів', 'Система адаптації айдентики', 'Мокапи', 'Презентація застосування бренду'],
  },
  {
    id: 'branding-guidelines', level: 'branding', order: 12, emoji: '📘', title: 'Брендбук і гайдлайн',
    desc: 'Структура брендбуку, охоронні поля, заборони використання, експорт',
    topics: ['Що таке брендбук', 'Відмінність брендбуку від гайдлайну', 'Структура документа', 'Представлення бренду', 'Логотип і його версії', 'Охоронні поля', 'Мінімальний розмір', 'Заборонені способи використання', 'Кольорова палітра', 'Типографіка', 'Графічні елементи', 'Фотостиль', 'Tone of Voice', 'Приклади застосування', 'Експорт брендбуку'],
  },
  {
    id: 'branding-presentation', level: 'branding', order: 13, emoji: '🎤', title: 'Презентація бренду',
    desc: 'Структура презентації, обґрунтування рішень, передача замовнику',
    topics: ['Як презентувати концепцію', 'Структура презентації', 'Проблема та рішення', 'Пояснення стратегії', 'Обґрунтування логотипа', 'Демонстрація кольорів', 'Демонстрація типографіки', 'Мокапи', 'Презентація носіїв', 'Фінальна перевірка', 'Передача матеріалів замовнику'],
  },
  {
    id: 'branding-process', level: 'branding', order: 14, emoji: '🗂️', title: 'Робота з клієнтом і професійний процес',
    desc: 'Брифування, фідбек, правки, версійність, авторські права',
    topics: ['Отримання замовлення', 'Уточнення вимог', 'Брифування', 'Узгодження обсягу роботи', 'Презентація концепцій', 'Отримання фідбеку', 'Робота з правками', 'Версійність файлів', 'Передача вихідних матеріалів', 'Авторські права та ліцензії', 'Комунікація із замовником', 'Завершення проєкту'],
  },
  {
    id: 'branding-portfolio', level: 'branding', order: 15, emoji: '🏆', title: 'Портфоліо та підсумковий проєкт',
    desc: 'Відбір робіт, подання кейсу, персональний бренд, фінальний капстоун-проєкт',
    topics: ['Що таке портфоліо бренд-дизайнера', 'Відбір проєктів для портфоліо', 'Подання кейсу', 'Структура й послідовність портфоліо', 'Онлайн-платформи для портфоліо', 'Персональний бренд дизайнера', 'Капстоун-проєкт: вимоги', 'Капстоун: самоперевірка за чек-листом', 'Капстоун: опис проєкту для портфоліо', 'Завершення курсу'],
  },
  // Motion Design: 17 підкатегорій. Напрямок має власну Motion Design
// Studio (/motion-studio/:id — канвас+таймлайн+keyframes, реальні
// ефекти тінь/обведення, реальний локальний аудіо-прев'ю, реальний
// SVG/JSON-експорт) — практика ведеться там, а не в спільному Motion
// Lab. Для складнішого векторного редагування курс направляє в уже
// готову Graphic Design Studio.
{
  id: 'motion-basics', level: 'motion-design', order: 1, emoji: '🎬', title: 'Основи моушн-дизайну',
  desc: 'Що таке моушн-дизайн, де застосовується, роль у продукті й бренді',
  topics: ['Що таке моушн-дизайн', 'Відмінність від статичної графіки', 'Моушн у вебі та застосунках', 'Моушн у рекламі та відео', 'Моушн у брендингу', 'Моушн-дизайнер: роль і завдання', 'Формати моушн-графіки', 'Чесні межі цієї студії', 'Як улаштований цей курс'],
},
{
  id: 'motion-interface-tools', level: 'motion-design', order: 2, emoji: '🧰', title: 'Інтерфейс і інструменти студії',
  desc: '7 етапів, верхня панель, канва, виділення й панель властивостей',
  topics: ['7 етапів і спільний проєкт', 'Верхня панель і розмір канви', 'Панель інструментів і виділення на канвасі', 'Панель властивостей, таймлайн і «Підказка»'],
},
{
  id: 'motion-principles', level: 'motion-design', order: 3, emoji: '🧭', title: '12 принципів анімації',
  desc: 'Класичні принципи анімації, адаптовані для моушн-графіки',
  topics: ['Squash and Stretch', 'Anticipation', 'Staging', 'Straight Ahead vs Pose to Pose', 'Follow Through and Overlapping Action', 'Slow In and Slow Out', 'Arcs', 'Secondary Action', 'Timing', 'Exaggeration', 'Solid Drawing', 'Appeal'],
},
{
  id: 'motion-timing-easing', level: 'motion-design', order: 4, emoji: '📈', title: 'Таймінг, дистанція та easing',
  desc: 'Тривалість, крива прискорення, keyframes — технічна основа анімації',
  topics: ['Таймінг', 'Дистанція руху', 'Криві прискорення (easing)', 'Лінійний рух проти природного', 'Keyframes', 'Тривалість і затримка', 'Частота кадрів', 'Перевірка анімації в русі', 'Вибір easing для сценарію', 'Той самий рух, різний easing'],
},
{
  id: 'motion-keyframes-practice', level: 'motion-design', order: 5, emoji: '🔑', title: 'Ключові кадри й таймлайн на практиці',
  desc: 'Головний механізм студії: редагування в часі = ключовий кадр',
  topics: ['Редагування в часі створює ключовий кадр', '1 кадр проти 2+ кадрів', 'Незалежні властивості об’єкта', 'Читання таймлайна й треків', 'Практика: 3 кадри, 2 властивості, 2 easing'],
},
{
  id: 'motion-ui', level: 'motion-design', order: 6, emoji: '🖱️', title: 'UI-анімація та мікровзаємодії',
  desc: 'Переходи, стагер, scroll reveal, індикатори завантаження',
  topics: ['Мікровзаємодії', 'Переходи між станами', 'Hover та Focus анімації', 'Стагер (послідовна анімація списку)', 'Scroll-анімація', 'Індикатори завантаження', 'Анімація як зворотний зв’язок', 'Коли анімації занадто багато', 'Практика: мікровзаємодія в студії'],
},
{
  id: 'motion-typography', level: 'motion-design', order: 7, emoji: '🔤', title: 'Кінетична типографіка',
  desc: 'Анімація тексту: принципи, ритм, читабельність у русі',
  topics: ['Що таке кінетична типографіка', 'Ритм і темп тексту в русі', 'Анімація появи літер і слів', 'Синхронізація з озвученням', 'Читабельність тексту в русі', 'Типові помилки кінетичної типографіки', 'Практика: текстовий об’єкт у студії', 'Обведення тексту'],
},
{
  id: 'motion-shape-logo', level: 'motion-design', order: 8, emoji: '🔺', title: 'Фігури та графічні об’єкти',
  desc: 'Прямокутники, еліпси, точне керування формою в студії',
  topics: ['Анімація простих форм', 'Морфінг між формами', 'Анімовані іконки', 'Узгодженість з фірмовим стилем', 'Ручки проти точних чисел', 'Композиція з кількох фігур'],
},
{
  id: 'motion-masks-composition', level: 'motion-design', order: 9, emoji: '🗂️', title: 'Шари, z-порядок і композиція сцени',
  desc: 'Порядок об’єктів, фоновий шар, чесна межа без масок',
  topics: ['Z-порядок і порядок додавання', 'Фоновий шар на весь канвас', 'Чесна межа: немає масок і групування', 'Композиція сцени в часі'],
},
{
  id: 'motion-effects', level: 'motion-design', order: 10, emoji: '✨', title: 'Ефекти',
  desc: 'Реальна тінь і обведення — рендеряться на канвасі й в SVG',
  topics: ['Що повідомляє тінь', 'Практика з тінню й напрямком світла', 'Обведення: коли допомагає', 'Тінь + обведення + прозорість разом', 'Чесна межа: чого тут немає'],
},
{
  id: 'motion-logo-animation', level: 'motion-design', order: 11, emoji: '🪄', title: 'Поглиблена анімація логотипа',
  desc: 'Патерни reveal, інтро/аутро, on-brand темп і капстоун',
  topics: ['Патерни reveal логотипа', 'Інтро- та аутро-таймлайни', 'On-brand темп і колір', 'Капстоун: reveal з 2 об’єктів'],
},
{
  id: 'motion-storyboard', level: 'motion-design', order: 12, emoji: '🎞️', title: 'Сторіборд і препродакшн',
  desc: 'Розкадровка, аніматик, планування кадрів перед анімацією',
  topics: ['Що таке сторіборд', 'Розкадровка по кадрах', 'Аніматик', 'Композиція кадру в русі', 'Планування камери', 'Таймінг сцени на етапі розкадровки', 'Практика: кадри в реальній студії'],
},
{
  id: 'motion-ads-social', level: 'motion-design', order: 13, emoji: '📱', title: 'Реклама та соцмережі: формати й канви',
  desc: 'Квадрат/вертикаль/горизонталь, безпечні зони, одна ідея — кілька форматів',
  topics: ['Реальні канви й де їх використовувати', 'Безпечні зони композиції', 'Одна ідея — кілька форматів', 'Чесна межа для рекламної доставки'],
},
{
  id: 'motion-sound', level: 'motion-design', order: 14, emoji: '🔊', title: 'Звук і синхронізація',
  desc: 'Роль звуку в моушн-дизайні, реальний аудіо-прев’ю в студії',
  topics: ['Роль звуку в моушн-дизайні', 'Звукові ефекти для інтерфейсу', 'Синхронізація анімації з музикою', 'Озвучення та субтитри', 'Джерела безкоштовного звуку', 'Практика: реальний аудіофайл у студії', 'Ручна синхронізація без автосинку'],
},
{
  id: 'motion-tools-export', level: 'motion-design', order: 15, emoji: '🛠️', title: 'Інструменти та експорт',
  desc: 'Реальний SVG/JSON-експорт студії й передача у зовнішні інструменти',
  topics: ['Інструменти для 2D-анімації', 'Інструменти для UI-анімації', 'Lottie-анімації', 'Формати експорту (GIF, MP4, WebM)', 'Оптимізація файлу анімації', 'Вибір інструменту під задачу', 'Практика: реальний SVG/JSON-експорт', 'Передача в зовнішній інструмент'],
},
{
  id: 'motion-process', level: 'motion-design', order: 16, emoji: '🤝', title: 'Процес роботи та клієнт',
  desc: 'Бриф, рев’ю, рендер і передача фінальних файлів',
  topics: ['Бриф на анімацію', 'Аніматик для узгодження з клієнтом', 'Отримання фідбеку', 'Версійність рендерів', 'Передача фінальних файлів', 'Терміни й оцінка часу роботи'],
},
{
  id: 'motion-portfolio', level: 'motion-design', order: 17, emoji: '🏆', title: 'Портфоліо та підсумковий проєкт',
  desc: 'Моушн-рель, подання робіт, фінальний капстоун-проєкт',
  topics: ['Що таке моушн-рід (reel)', 'Відбір робіт для рілу', 'Структура й тривалість рілу', 'Платформи для публікації', 'Капстоун-проєкт: вимоги', 'Завершення курсу', 'Портфоліо з реального проєкту студії', 'Самоперевірка перед публікацією'],
},

// UX Design — 13 модулів, що буквально повторюють реальний UX-процес
// студії (UX_STAGES у uxProject.js): дослідження → аналіз → визначення
// проблеми → персона → user journey → IA → user flow → wireframe →
// прототип → тестування → ітерації → UX-кейс. Module.jsx відкриває
// кожен урок на відповідному етапі реальної UX Design Studio.
{
  id: 'ux-basics', level: 'ux-design', order: 1, emoji: '🧠', title: 'Основи UX Design',
  desc: 'Що таке UX, відмінність від UI, UX-процес і чесні межі студії',
  topics: ['Що таке UX Design', 'UX проти UI: де межа', 'UX у продуктовому процесі', 'Design Thinking і Double Diamond', '11 етапів UX-процесу студії', 'Чесні межі цієї студії', 'Як улаштований цей курс'],
},
{
  id: 'ux-research', level: 'ux-design', order: 2, emoji: '🔍', title: 'Дослідження користувачів',
  desc: 'Якісні й кількісні методи, інтерв’ю, опитування, Дослідницька лабораторія',
  topics: ['Якісні проти кількісних методів', 'Інтерв’ю з користувачами', 'Опитування й анкети', 'Конкурентний аналіз', 'Спостереження за користувачами', 'Чому дані позначають як навчальні', 'Практика в Дослідницькій лабораторії'],
},
{
  id: 'ux-analysis', level: 'ux-design', order: 3, emoji: '🧩', title: 'Аналіз даних дослідження',
  desc: 'Від сирих нотаток до інсайтів: синтез, патерни, affinity diagram',
  topics: ['Синтез результатів дослідження', 'Affinity diagram (групування за темами)', 'Пошук патернів і повторюваних тем', 'Jobs To Be Done', 'Перетворення спостережень на інсайти', 'Практика: інсайти в Дослідницькій лабораторії'],
},
{
  id: 'ux-problem', level: 'ux-design', order: 4, emoji: '🎯', title: 'Визначення проблеми',
  desc: 'Problem statement, How Might We, валідація проблеми даними',
  topics: ['Що таке чітке визначення проблеми', 'Структура problem statement', 'How Might We запитання', 'Валідація проблеми дослідницькими даними', 'Типові помилки у визначенні проблеми', 'Практика: Problem Statement у студії'],
},
{
  id: 'ux-persona', level: 'ux-design', order: 5, emoji: '👤', title: 'Персона користувача',
  desc: 'Структура персони, дані проти припущень, емпатія',
  topics: ['Що таке персона і навіщо вона', 'Поля персони: цілі, болі, контекст', 'Персона на основі даних проти вигаданої', 'Первинна й вторинна персона', 'Карта емпатії', 'Практика: Persona editor у студії'],
},
{
  id: 'ux-journey', level: 'ux-design', order: 6, emoji: '🗺️', title: 'User Journey Map',
  desc: 'Фази, дії, емоції, больові точки й можливості на карті подорожі',
  topics: ['Що таке User Journey Map', 'Фази й точки контакту', 'Емоційна крива подорожі', 'Больові точки й можливості', 'Пріоритизація знахідок', 'Багатоканальні подорожі', 'Практика: таблиця Journey у студії'],
},
{
  id: 'ux-ia', level: 'ux-design', order: 7, emoji: '🗂️', title: 'Інформаційна архітектура',
  desc: 'Карта сайту, card sorting, ієрархія й навігація',
  topics: ['Що таке інформаційна архітектура', 'Card sorting', 'Ієрархія та глибина структури', 'Навігація та labeling', 'Типові помилки IA', 'Практика: список рівнів IA у студії'],
},
{
  id: 'ux-flow', level: 'ux-design', order: 8, emoji: '🔀', title: 'User Flow',
  desc: 'Блоки, рішення, з’єднання та структурна валідація потоку',
  topics: ['Що таке User Flow', 'Типи блоків: старт/дія/рішення/завершення/помилка', 'Happy path проти edge cases', 'З’єднання блоків на канві', 'Структурна валідація: недосяжні блоки й тупики', 'Практика: інтерактивний User Flow Editor'],
},
{
  id: 'ux-wireframe', level: 'ux-design', order: 9, emoji: '📐', title: 'Wireframing',
  desc: 'Low-fidelity вайрфрейми, інструменти Wireframe Studio, кілька екранів',
  topics: ['Low-fidelity проти mid-fidelity', 'Чому вайрфрейм — чорно-білий', 'Інструменти Wireframe Studio', 'Кілька екранів і презети розмірів', 'Композиція елементів на екрані', 'Практика: багатоекранний Wireframe Studio'],
},
{
  id: 'ux-prototype', level: 'ux-design', order: 10, emoji: '🖱️', title: 'Прототипування',
  desc: 'Клікабельні переходи між екранами, рівні fidelity, прев’ю',
  topics: ['Що таке клікабельний прототип', 'Рівні fidelity прототипу', 'Призначення переходів між екранами', 'Тестування прототипу в Preview', 'Передача прототипу розробці', 'Практика: Prototype Studio з реальним кліком'],
},
{
  id: 'ux-testing', level: 'ux-design', order: 11, emoji: '🧪', title: 'Юзабіліті-тестування',
  desc: 'Методи тестування, сценарії завдань, чесні межі автоматичної оцінки',
  topics: ['Модеровані проти немодерованих тестів', 'Написання сценаріїв завдань', 'A/B тестування', 'Чому автоматика не оцінює поведінку реальних людей', 'Фіксація знахідок тестування', 'Практика: поле знахідок у студії'],
},
{
  id: 'ux-iteration', level: 'ux-design', order: 12, emoji: '✅', title: 'Ітерації та UX-аудит',
  desc: '10 евристик, чекліст UX Audit, пріоритизація виправлень',
  topics: ['Евристики Нільсена', 'Чекліст UX Audit', 'Пріоритизація виправлень за фідбеком', 'Документування «до/після» ітерації', 'Коли зупинити ітерації', 'Практика: UX Audit checklist у студії'],
},
{
  id: 'ux-case-portfolio', level: 'ux-design', order: 13, emoji: '📊', title: 'UX-кейс і портфоліо',
  desc: 'Структура кейсу, експорт, чесність без вигаданих користувачів',
  topics: ['Структура UX-кейсу', 'Що включити: від проблеми до висновків', 'Чому не можна вигадувати кейс', 'Експорт і публікація кейсу', 'Презентація UX-кейсу', 'Практика: автозведення в Presentation-етапі'],
},

// Game Art — повна програма Game Art Academy, Блоки A-K за ТЗ.
{
  id: 'game-art-basics', level: 'game-art', order: 1, emoji: '🎨', title: 'Основи Game Art',
  desc: 'Що таке Game Art, напрями, форма, силует, композиція, колір, читабельність',
  topics: ['Що таке Game Art', 'Роль Game Artist у розробці ігор', 'Напрями Game Art', '2D та 3D', 'Види графічних ресурсів', 'Стилі графіки', 'Основи художнього мислення', 'Геометричні та органічні форми', 'Силует', 'Композиція', 'Пропорції', 'Перспектива', 'Світло й тінь', 'Колір', 'Візуальна ієрархія', 'Візуальна читабельність', 'Робота з референсами', 'Аналіз стилю гри'],
},
{
  id: 'game-art-2d-digital', level: 'game-art', order: 2, emoji: '🖌️', title: 'Digital Art та 2D Game Art',
  desc: 'Растрова й векторна графіка, шари, пензлі, перші ігрові предмети й персонажі',
  topics: ['Растрова і векторна графіка', 'Робоче полотно', 'Роздільна здатність', 'Шари', 'Маски', 'Пензлі', 'Виділення і трансформації', 'Основи цифрового малювання', 'Створення ігрових предметів', 'Створення персонажів', 'Створення оточення', 'Підготовка спрайтів', 'Прозорість', 'Експорт зображень', 'Організація графічних ресурсів'],
},
{
  id: 'game-art-pixel-art', level: 'game-art', order: 3, emoji: '🟪', title: 'Pixel Art',
  desc: 'Піксельна сітка, обмежені палітри, тайли, спрайти й покадрова анімація',
  topics: ['Піксельна сітка', 'Обмежені палітри', 'Силует', 'Контури', 'Світло й тінь', 'Dithering', 'Тайли', 'Tileset', 'Tilemap', 'Персонажі', 'Предмети', 'Оточення', 'Sprite sheet', 'Покадрова анімація', 'Експорт ресурсів'],
},
{
  id: 'game-art-concept-character', level: 'game-art', order: 4, emoji: '🧑‍🎨', title: 'Concept Art та Character Design',
  desc: 'Moodboard, силуетні дослідження, анатомія, character sheet, дизайн істот',
  topics: ['Концептуальне мистецтво', 'Візуальний пошук', 'Moodboard', 'Thumbnail sketches', 'Силуетні дослідження', 'Форма і характер', 'Анатомія для художників', 'Пропорції персонажів', 'Обличчя й міміка', 'Одяг та аксесуари', 'Колірний дизайн', 'Character sheet', 'Дизайн істот', 'Дизайн фантастичних предметів', 'Концепція локацій', 'Презентація концепту'],
},
{
  id: 'game-art-3d-modeling', level: 'game-art', order: 5, emoji: '🧊', title: '3D Modeling',
  desc: 'Mesh, топологія, Hard Surface та Organic Modeling, Low/High Poly, Blender',
  topics: ['Основи тривимірного простору', 'Координати X, Y, Z', 'Вершини, ребра, полігони', 'Mesh', 'Object Mode та Edit Mode', 'Навігація в Blender', 'Примітиви', 'Переміщення, обертання, масштабування', 'Extrude', 'Inset', 'Bevel', 'Loop Cut', 'Основи топології', 'Hard Surface Modeling', 'Organic Modeling', 'Low Poly', 'High Poly', 'Нормалі', 'Модифікатори', 'Підготовка моделі', 'Pivot та origin', 'Експорт'],
},
{
  id: 'game-art-uv-texturing', level: 'game-art', order: 6, emoji: '🗺️', title: 'UV, Texturing та Materials',
  desc: 'UV-розгортка, PBR-карти, стилізовані й реалістичні матеріали, запікання',
  topics: ['Що таке текстура', 'UV-координати', 'UV-розгортка', 'UV islands', 'Texel density', 'Texture resolution', 'Albedo', 'Normal Map', 'Roughness', 'Metallic', 'Ambient Occlusion', 'PBR', 'Стилізовані матеріали', 'Реалістичні матеріали', 'Текстурування дерева', 'Текстурування металу', 'Текстурування каменю', 'Текстурування тканини', 'Запікання текстур', 'Усунення швів', 'Оптимізація', 'Експорт матеріалів'],
},
{
  id: 'game-art-environment', level: 'game-art', order: 7, emoji: '🏞️', title: 'Environment Art',
  desc: 'Дизайн локацій, модульне оточення, атмосфера, оптимізація сцени',
  topics: ['Дизайн ігрових локацій', 'Композиція середовища', 'Перспектива', 'Архітектурні форми', 'Природні об’єкти', 'Модульне оточення', 'Повторне використання ресурсів', 'Текстури середовища', 'Матеріали', 'Освітлення', 'Атмосфера', 'Діорами', 'Оптимізація сцени', 'Підготовка до інтеграції'],
},
{
  id: 'game-art-animation-vfx', level: 'game-art', order: 8, emoji: '🎞️', title: 'Animation та VFX',
  desc: 'Принципи анімації, sprite animation, rigging, частинки, магічні ефекти',
  topics: ['Принципи анімації', 'Timing і Spacing', 'Ключові кадри', 'Покадрова анімація', 'Sprite animation', 'Idle animation', 'Walk cycle', 'Jump animation', 'Rigging', 'Bones і Skeleton', 'Skinning', 'Основи 3D-анімації', 'Частинки', 'Дим', 'Вогонь', 'Іскри', 'Магічні ефекти', 'Експорт анімації'],
},
{
  id: 'game-art-pipeline', level: 'game-art', order: 9, emoji: '🛠️', title: 'Game Art Production Pipeline',
  desc: 'Повний шлях від блокінгу до імпорту в рушій: baking, naming, версіонування',
  topics: ['Що таке production pipeline', 'Отримання технічного завдання', 'Референси', 'Блокінг', 'High Poly та Low Poly workflow', 'UV', 'Baking', 'Texturing', 'Export', 'Import', 'Перевірка в ігровому рушії', 'Виправлення помилок', 'Оптимізація', 'Іменування файлів', 'Структура папок', 'Версіонування', 'Передача ресурсів команді'],
},
{
  id: 'game-art-engines', level: 'game-art', order: 10, emoji: '🎮', title: 'Game Engines',
  desc: 'Інтеграція Game Art в Unity, Unreal Engine і Godot — відмінності й практика',
  topics: ['Відмінності Unity, Unreal Engine та Godot', 'Створення тестового проєкту', 'Імпорт графічних ресурсів', 'Налаштування матеріалів', 'Розміщення об’єктів у сцені', 'Перевірка масштабу', 'Перевірка освітлення', 'Виявлення помилок інтеграції', 'Підготовка сцени', 'Основи продуктивності'],
},
{
  id: 'game-art-portfolio', level: 'game-art', order: 11, emoji: '🏆', title: 'Portfolio та Professional Workflow',
  desc: 'ArtStation, презентація робіт, texture breakdown, фідбек, підготовка до тестового',
  topics: ['Вимоги до портфоліо', 'Вибір спеціалізації', 'Відбір найкращих робіт', 'ArtStation', 'Презентація моделей', 'Рендери', 'Wireframe presentation', 'Texture breakdown', 'Показ процесу', 'Опис технічних рішень', 'Організація проєктів', 'Робота з фідбеком', 'Виправлення помилок', 'Авторське право', 'Командна робота', 'Підготовка до тестового завдання', 'Самостійне планування роботи'],
},

// Logo Design — повна програма напряму (напис уже був у directions.js
// без жодної підкатегорії; тепер напрям стає реальним).
{
  id: 'logo-basics', level: 'logo-design', order: 1, emoji: '🏷️', title: 'Основи Logo Design',
  desc: 'Що таке логотип, типи логотипів, роль у бренді, коли логотип працює',
  topics: ['Що таке логотип', 'Логотип vs бренд vs айдентика', 'Wordmark', 'Lettermark', 'Pictorial mark', 'Abstract mark', 'Mascot logo', 'Combination mark', 'Emblem', 'Історія та еволюція логотипів', 'Коли логотип «працює», а коли ні', 'Типові помилки новачків'],
},
{
  id: 'logo-research-brief', level: 'logo-design', order: 2, emoji: '🔍', title: 'Дослідження та бриф',
  desc: 'Креативний бриф, аналіз конкурентів, цільова аудиторія, напрямок пошуку',
  topics: ['Креативний бриф', 'Питання клієнту', 'Аналіз конкурентів у ніші', 'Цільова аудиторія', 'Позиціювання бренду', 'Ключові слова та асоціації', 'Moodboard для логотипа', 'Визначення напрямку пошуку'],
},
{
  id: 'logo-typography', level: 'logo-design', order: 3, emoji: '🔤', title: 'Типографіка для логотипів',
  desc: 'Вибір шрифту, кастомізація літер, кернінг, власний леттерінг',
  topics: ['Вибір гарнітури під характер бренду', 'Serif vs Sans vs Script vs Display', 'Кернінг і трекінг у назві', 'Модифікація стокового шрифту', 'Ліґатури', 'Основи власного леттерінгу', 'Читабельність назви бренду', 'Коли використовувати кастомний шрифт'],
},
{
  id: 'logo-marks-symbols', level: 'logo-design', order: 4, emoji: '✴️', title: 'Символи та знаки',
  desc: 'Візуальна метафора, рівні абстракції, дослідження іконографії',
  topics: ['Візуальна метафора в знаку', 'Буквальне vs абстрактне зображення', 'Рівні спрощення форми', 'Дослідження референсів іконографії', 'Унікальність і перевірка на схожість', 'Знак, що масштабується окремо від назви', 'Культурний контекст символів'],
},
{
  id: 'logo-geometry', level: 'logo-design', order: 5, emoji: '📐', title: 'Геометрична побудова',
  desc: 'Сітки, золотий перетин, модульні системи, побудова на колах і квадратах',
  topics: ['Побудова на сітці', 'Золотий перетин у логотипах', 'Модульні системи пропорцій', 'Побудова на колах і квадратах', 'Кут і радіус як стильові константи', 'Оптичні корекції (не математична точність)', 'Документування побудови для клієнта'],
},
{
  id: 'logo-color', level: 'logo-design', order: 6, emoji: '🎨', title: 'Колір у логотипі',
  desc: 'Психологія кольору, правило 1-2 кольорів, контраст, значення за індустріями',
  topics: ['Психологія кольору в брендингу', 'Чому логотип рідко використовує більше 2 кольорів', 'Контраст і доступність кольору', 'Колір за індустріями й очікування аудиторії', 'Основний і допоміжний колір', 'Тестування кольору на різних фонах'],
},
{
  id: 'logo-negative-space', level: 'logo-design', order: 7, emoji: '◐', title: 'Негативний простір',
  desc: 'Фігура-фон, прийоми прихованих форм, класичні приклади (FedEx-стиль)',
  topics: ['Фігура і фон', 'Прийоми прихованих форм у негативному просторі', 'Коли цей прийом доречний, а коли надуманий', 'Перевірка читабельності прихованої форми', 'Баланс між «розумно» і «зрозуміло з першого погляду'],
},
{
  id: 'logo-variations', level: 'logo-design', order: 8, emoji: '🧩', title: 'Варіації та адаптивність',
  desc: 'Основна/допоміжна версії, іконка окремо, адаптивні логотипи, перевірка масштабу',
  topics: ['Основна versus допоміжна версія', 'Горизонтальна й вертикальна компоновка', 'Версія «тільки знак» (favicon, аватар)', 'Адаптивні (responsive) логотипи', 'Перевірка на малих розмірах', 'Мінімальний розмір використання', 'Спрощення деталей для мікроформату'],
},
{
  id: 'logo-monochrome', level: 'logo-design', order: 9, emoji: '◼️', title: 'Монохром та інверсія',
  desc: 'Чорно-біла версія, інверсія для темного фону, тест на різних підкладках',
  topics: ['Чому логотип має працювати в один колір', 'Чорна версія', 'Біла (інвертована) версія', 'Відтінки сірого', 'Тестування на світлому й темному фоні', 'Тестування на фотографії/складному фоні', 'Що губиться при переході в монохром'],
},
{
  id: 'logo-application', level: 'logo-design', order: 10, emoji: '🖼️', title: 'Застосування логотипа',
  desc: 'Мокапи: візитівка, вивіска, іконка застосунку, мерч — перевірка в контексті',
  topics: ['Навіщо показувати логотип у реальному контексті', 'Візитівка й бланк', 'Вивіска й зовнішня реклама', 'Іконка застосунку', 'Упаковка та мерч', 'Соцмережі й аватарки', 'Вибір мокапів під індустрію клієнта'],
},
{
  id: 'logo-guidelines', level: 'logo-design', order: 11, emoji: '📖', title: 'Логобук та гайдлайни',
  desc: 'Захищений простір, мінімальний розмір, приклади неправильного використання',
  topics: ['Що таке логобук (brand guidelines)', 'Захищений (безпечний) простір навколо знака', 'Мінімальний розмір друку й екрана', 'Дозволені й заборонені модифікації', 'Приклади типового неправильного використання', 'Структура документа гайдлайнів', 'Передача файлів клієнту (формати, версії)'],
},
{
  id: 'logo-critique-redesign', level: 'logo-design', order: 12, emoji: '🔁', title: 'Критика та редизайн',
  desc: 'Аналіз чужих логотипів, типові помилки, кейси редизайну відомих брендів',
  topics: ['Як критикувати логотип по суті, а не «подобається/ні»', 'Чеклист для аналізу чужої роботи', 'Типові помилки початківців', 'Відомі кейси редизайну та чому вони відбулись', 'Коли редизайн виправданий, а коли шкодить бренду'],
},
{
  id: 'logo-client-presentation', level: 'logo-design', order: 13, emoji: '🗣️', title: 'Презентація клієнту',
  desc: 'Подача концепцій, обґрунтування рішень, робота з правками й запереченнями',
  topics: ['Структура презентації концепцій', 'Скільки варіантів показувати клієнту', 'Обґрунтування дизайн-рішень словами', 'Робота з суб’єктивним фідбеком («зробіть логотип більшим»)', 'Межа кількості ревізій', 'Коли відмовити клієнту в правці'],
},
{
  id: 'logo-portfolio', level: 'logo-design', order: 14, emoji: '🏆', title: 'Портфоліо логотипів',
  desc: 'Відбір робіт, кейс-презентація процесу, чесність у показі результату',
  topics: ['Вимоги до портфоліо логотипів', 'Відбір найсильніших робіт', 'Показ процесу (ескізи → фінал)', 'Структура кейсу одного логотипа', 'Чесність: не видавати навчальну роботу за реальне замовлення', 'Платформи для публікації (Behance, Dribbble)'],
},
]

export function getSubcategoriesByLevel(level) {
  return SUBCATEGORIES.filter((s) => s.level === level).sort((a, b) => a.order - b.order)
}

export function getSubcategory(id) {
  return SUBCATEGORIES.find((s) => s.id === id)
}
