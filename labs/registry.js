// Catalog of every planned Design Lab. Built incrementally - only entries
// with status 'available' have a real, working route; everything else is
// a transparent roadmap item shown on /labs so people know what's coming
// (never a clickable button that leads nowhere).

export const LAB_CATEGORIES = [
  { id: 'visual', label: 'Visual' },
  { id: 'layout', label: 'Layout' },
  { id: 'typography', label: 'Typography' },
  { id: 'uiux', label: 'UI / UX' },
  { id: 'branding', label: 'Branding' },
  { id: 'motion3d', label: 'Motion / 3D' },
  { id: 'data', label: 'Data' },
  { id: 'print', label: 'Print' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'systems', label: 'Systems' },
  { id: 'production', label: 'Production' },
  { id: 'advanced', label: 'Advanced' },
]

export const LABS = [
  { id: 'color', route: '/labs/color', icon: '🎨', title: 'Color Lab', desc: 'Кольори, палітри, гармонії, градієнти, контраст і превʼю в реальних макетах.', category: 'visual', tools: 14, status: 'available' },
  { id: 'shape', route: '/labs/shape', icon: '🔷', title: 'Shape & Vector Lab', desc: 'Фігури, трансформації, булеві операції, редагування шляхів, SVG.', category: 'visual', tools: 5, status: 'soon' },
  { id: 'brush', route: '/labs/brush', icon: '🖌️', title: 'Brush Lab', desc: 'Кистьовий рушій: олівець, чорнило, акварель, аерограф, власні пресети кистей.', category: 'visual', tools: 4, status: 'soon' },
  { id: 'drawing', route: '/labs/drawing', icon: '✏️', title: 'Drawing Lab', desc: 'Малювання з шарами, історією дій та експортом.', category: 'visual', tools: 5, status: 'soon' },
  { id: 'grid', route: '/labs/grid', icon: '📐', title: 'Grid Lab', desc: 'Колонкові, модульні, базові та ізометричні сітки з експортом у CSS.', category: 'layout', tools: 4, status: 'soon' },
  { id: 'layout', route: '/labs/layout', icon: '🧩', title: 'Layout Lab', desc: 'Фрейми, контейнери, секції та готові пресети макетів.', category: 'layout', tools: 4, status: 'soon' },
  { id: 'typography', route: '/labs/typography', icon: '🔤', title: 'Typography Lab', desc: 'Типографічні шкали, міжрядковий інтервал, трекінг, превʼю в контексті.', category: 'typography', tools: 5, status: 'soon' },
  { id: 'image', route: '/labs/image', icon: '🖼️', title: 'Image Lab', desc: 'Кадрування, корекція кольору, ефекти та експорт зображень.', category: 'visual', tools: 5, status: 'soon' },
  { id: 'texture', route: '/labs/texture', icon: '🧱', title: 'Texture Lab', desc: 'Генерація й редагування текстур: папір, шум, тканина, метал.', category: 'visual', tools: 4, status: 'soon' },
  { id: 'pattern', route: '/labs/pattern', icon: '🔳', title: 'Pattern Lab', desc: 'Патерни: крапки, лінії, хвилі, геометрія — з експортом у SVG/CSS.', category: 'visual', tools: 4, status: 'soon' },
  { id: 'light', route: '/labs/light', icon: '🌑', title: 'Shadow & Light Lab', desc: 'Тіні, світло, готові CSS-пресети (material, floating, layered).', category: 'visual', tools: 4, status: 'soon' },
  { id: 'gradient', route: '/labs/gradient', icon: '🌈', title: 'Gradient Lab', desc: 'Лінійні, радіальні й конічні градієнти з кількома точками.', category: 'visual', tools: 3, status: 'soon' },
  { id: 'contrast', route: '/labs/contrast', icon: '♿', title: 'Contrast & Accessibility Lab', desc: 'Перевірка контрасту WCAG для тексту, іконок, станів і фокусу.', category: 'accessibility', tools: 4, status: 'soon' },
  { id: 'motion', route: '/labs/motion', icon: '🎞️', title: 'Motion Lab', desc: 'CSS-анімації: fade, slide, spring, keyframes з живим превʼю.', category: 'motion3d', tools: 4, status: 'soon' },
  { id: 'components', route: '/labs/components', icon: '🧩', title: 'Component Lab', desc: 'UI-компоненти в усіх станах: default, hover, focus, disabled.', category: 'uiux', tools: 5, status: 'soon' },
  { id: 'responsive', route: '/labs/responsive', icon: '📱', title: 'Responsive Lab', desc: 'Порівняння дизайну на різних viewport одночасно.', category: 'uiux', tools: 3, status: 'soon' },
  { id: 'accessibility', route: '/labs/accessibility', icon: '♿', title: 'Accessibility Lab', desc: 'Перевірка інтерфейсу: контраст, фокус, розмір цілей, ієрархія заголовків.', category: 'accessibility', tools: 6, status: 'soon' },
  { id: 'composition', route: '/labs/composition', icon: '🧠', title: 'Composition Lab', desc: 'Правило третин, золотий перетин, симетрія, візуальний баланс.', category: 'layout', tools: 4, status: 'soon' },
  { id: 'ratio', route: '/labs/ratio', icon: '📏', title: 'Ratio Lab', desc: 'Розрахунок співвідношень сторін: 16:9, A4, золотий перетин тощо.', category: 'production', tools: 3, status: 'soon' },
  { id: '3d', route: '/labs/3d', icon: '🧊', title: '3D Lab', desc: 'Легкі 3D-обʼєкти в браузері: позиція, обертання, матеріали.', category: 'motion3d', tools: 3, status: 'soon' },
  { id: 'ui-preview', route: '/labs/ui-preview', icon: '🖥️', title: 'UI Preview Lab', desc: 'Побудова живого превʼю інтерфейсу з готових шаблонів.', category: 'uiux', tools: 5, status: 'soon' },
  { id: 'wireframe', route: '/labs/wireframe', icon: '🧭', title: 'Wireframe Lab', desc: 'Швидкі каркаси інтерфейсу: секції, форми, картки.', category: 'uiux', tools: 4, status: 'soon' },
  { id: 'user-flow', route: '/labs/user-flow', icon: '🔀', title: 'User Flow Lab', desc: 'Схеми користувацьких сценаріїв: екрани, дії, рішення.', category: 'uiux', tools: 4, status: 'soon' },
  { id: 'information-architecture', route: '/labs/information-architecture', icon: '🗺️', title: 'Information Architecture Lab', desc: 'Sitemap, ієрархія сторінок і категорій.', category: 'uiux', tools: 3, status: 'soon' },
  { id: 'ux-writing', route: '/labs/ux-writing', icon: '✍️', title: 'UX Writing Lab', desc: 'Текст інтерфейсу: кнопки, підказки, помилки, порожні стани.', category: 'uiux', tools: 4, status: 'soon' },
  { id: 'ux-audit', route: '/labs/ux-audit', icon: '🧠', title: 'UX Audit Lab', desc: 'Перевірка інтерфейсу за конкретними критеріями UX.', category: 'uiux', tools: 5, status: 'soon' },
  { id: 'logo', route: '/labs/logo', icon: '🏷️', title: 'Logo Lab', desc: 'Побудова логотипу: сітка, пропорції, safe area, мінімальний розмір.', category: 'branding', tools: 4, status: 'soon' },
  { id: 'brand', route: '/labs/brand', icon: '🎨', title: 'Brand Lab', desc: 'Міні брендбук: кольори, типографіка, компоненти, токени.', category: 'branding', tools: 5, status: 'soon' },
  { id: 'data-viz', route: '/labs/data-viz', icon: '📊', title: 'Data Visualization Lab', desc: 'Графіки: bar, line, pie, radar — з перевіркою читабельності.', category: 'data', tools: 5, status: 'soon' },
  { id: 'editorial', route: '/labs/editorial', icon: '📰', title: 'Editorial Lab', desc: 'Верстка журналу, статті, буклету: колонки, поля, базова лінія.', category: 'print', tools: 4, status: 'soon' },
  { id: 'poster', route: '/labs/poster', icon: '🪧', title: 'Poster Lab', desc: 'Композиція постера: заголовок, зображення, ієрархія, кольори.', category: 'print', tools: 4, status: 'soon' },
  { id: 'game', route: '/labs/game', icon: '🎮', title: 'Game Design Lab', desc: 'Ігровий UI: HUD, шкали здоровʼя, інвентар, меню.', category: 'advanced', tools: 4, status: 'soon' },
  { id: 'storyboard', route: '/labs/storyboard', icon: '🎬', title: 'Storyboard Lab', desc: 'Кадри розкадровки з описом дії, камери й діалогів.', category: 'advanced', tools: 3, status: 'soon' },
  { id: 'critique', route: '/labs/critique', icon: '🧠', title: 'Design Critique Lab', desc: 'Оцінка композиції за конкретними, описовими критеріями.', category: 'advanced', tools: 4, status: 'soon' },
  { id: 'pixel', route: '/labs/pixel', icon: '🔍', title: 'Pixel Precision Lab', desc: 'Піксельна сітка, лінійки, точні координати й відстані.', category: 'production', tools: 4, status: 'soon' },
  { id: 'calculator', route: '/labs/calculator', icon: '🧮', title: 'Design Calculator Lab', desc: 'px↔rem, aspect ratio, типографічні шкали, DPI/PPI.', category: 'production', tools: 6, status: 'soon' },
  { id: 'design-system', route: '/labs/design-system', icon: '🧩', title: 'Design System Lab', desc: 'Токени кольору, типографіки, spacing, radius і тіней з усіх Labs.', category: 'systems', tools: 6, status: 'soon' },
  { id: 'export', route: '/labs/export', icon: '🛠️', title: 'Export & Production Lab', desc: 'Підготовка дизайну до Web/Mobile/Print/Social з оптимізацією файлів.', category: 'production', tools: 4, status: 'soon' },
  { id: 'design-qa', route: '/labs/design-qa', icon: '🔬', title: 'Professional Design QA Lab', desc: 'Перевірка вирівнювання, відступів, контрасту, консистентності.', category: 'advanced', tools: 5, status: 'soon' },
]

export function getLab(id) {
  return LABS.find((l) => l.id === id)
}
