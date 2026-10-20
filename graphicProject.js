// Модель спільного проєкту Graphic Design Studio — той самий принцип
// "одного спільного проєкту на весь напрямок", що й у logoProject.js/
// adProject.js/threeDProject.js: Graphic Design Studio читає й пише той
// самий запис через ProgressContext.saveGraphicProject.
//
// saveGraphicProject (ProgressContext.jsx) замінює запис цілком за id
// (не мерджить поля сам), тому onPatch тут завжди зберігає { ...project,
// ...patch }, а не сам patch — інакше часткове оновлення стерло б решту
// полів проєкту.
//
// Полотно (canvasW/canvasH/bg/objects) редагує вже наявний, повноцінний
// растрово-векторний редактор GraphicDesignStudio.jsx (фігури, текст,
// зображення, іконки, пензель, шари, undo/redo, експорт PNG/JPG/SVG/PDF)
// — ця модель лише додає те, чого йому бракувало як окремому напрямку:
// перевірку форматів, палітру з контрастом, вимоги, рев'ю, версії.

export const GRAPHIC_FORMATS = [
  { key: 'social-square', label: 'Соцмережі — квадрат 1080×1080', w: 1080, h: 1080 },
  { key: 'social-story', label: 'Соцмережі — історія 1080×1920', w: 1080, h: 1920 },
  { key: 'social-feed', label: 'Соцмережі — стрічка 1080×1350', w: 1080, h: 1350 },
  { key: 'poster-a3', label: 'Постер A3 портрет', w: 842, h: 1191 },
  { key: 'poster-a4', label: 'Постер A4 портрет', w: 595, h: 842 },
  { key: 'flyer-a5', label: 'Листівка A5', w: 420, h: 595 },
  { key: 'business-card', label: 'Візитка 90×50мм', w: 340, h: 189 },
  { key: 'banner-wide', label: 'Банер (широкий)', w: 1200, h: 500 },
]

export const REVIEW_RUBRIC_GRAPHIC = [
  'Візуальна ієрархія', 'Композиція і баланс', 'Відповідність кольоровій палітрі', 'Типографіка читабельна', 'Відповідає формату', 'Технічно готово до експорту',
]

export const SELF_SCORE_OPTIONS = ['Потребує роботи', 'Непогано', 'Відмінно']

export function createEmptyGraphicProject(name) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: name || 'Новий графічний проєкт',
    createdAt: now,
    updatedAt: now,
    canvasW: 1080,
    canvasH: 1080,
    bg: '#ffffff',
    objects: [],
    palette: ['#1a1a1a', '#ffffff', '#2e6dff', '#ff5a1f'],
    requirements: [],
    review: {
      items: REVIEW_RUBRIC_GRAPHIC.map((criterion) => ({ id: crypto.randomUUID(), criterion, selfScore: '', note: '' })),
      comments: [],
    },
    versions: [],
  }
}

export function makeEmptyRequirement() {
  return { id: crypto.randomUUID(), title: '', note: '', done: false }
}

// Яка робоча область Graphic Design Studio відкривається для підкатегорії
// — спільне для Module.jsx (кнопка «Відкрити Graphic Design Studio») і
// самої студії (ліве дерево треків), щоб дві копії мапи не розійшлися.
export const GRAPHIC_SUBCAT_SECTION = {
  'graphic-design-basics': 'builder',
  'graphic-composition': 'builder',
  'graphic-color': 'palette',
  'graphic-typography': 'builder',
  'graphic-shapes': 'builder',
  'graphic-images': 'builder',
  'graphic-posters': 'formats',
  'graphic-social-media': 'formats',
  'graphic-logos': 'builder',
  'graphic-vector': 'builder',
  'graphic-print': 'formats',
  'graphic-packaging': 'formats',
  'graphic-infographics': 'builder',
  'graphic-process': 'requirements',
  'graphic-portfolio': 'review',
}
