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
]

export function getSubcategoriesByLevel(level) {
  return SUBCATEGORIES.filter((s) => s.level === level).sort((a, b) => a.order - b.order)
}

export function getSubcategory(id) {
  return SUBCATEGORIES.find((s) => s.id === id)
}
