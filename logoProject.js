// Модель проєкту Logo Design Studio — той самий принцип "одного спільного
// проєкту", що й у gameArtProject.js/brandProject.js: Logo Design Studio
// читає й пише той самий запис через ProgressContext.saveLogoProject.
//
// На відміну від растрового полотна Game Art Studio, логотип — векторні
// фігури й текст (elements[]), бо саме так реально будуються логотипи і
// саме так їх можна чесно експортувати в SVG (справжній масштабований
// файл, а не растровий знімок).
//
// Чесна межа: версії — реальні знімки elements[], що з'являються лише
// коли студент сам натискає «Зберегти версію», не вигадана історія.

export const REVIEW_RUBRIC_LOGO = [
  'Унікальність', 'Простота', 'Доречність бренду', 'Масштабованість', 'Запам’ятовуваність', 'Працює в один колір',
]

export const SELF_SCORE_OPTIONS = ['Потребує роботи', 'Непогано', 'Відмінно']

let elementCounter = 0
function nextElementId() {
  elementCounter += 1
  return `el-${Date.now()}-${elementCounter}`
}

export function makeDefaultElement(type, x = 200, y = 200) {
  const base = { id: nextElementId(), type, x, y, rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1 }
  if (type === 'circle') return { ...base, width: 120, height: 120 }
  if (type === 'rect') return { ...base, width: 140, height: 90, rx: 0 }
  if (type === 'triangle') return { ...base, width: 130, height: 120 }
  if (type === 'polygon') return { ...base, width: 120, height: 120, sides: 6 }
  if (type === 'line') return { ...base, width: 160, height: 0, strokeWidth: 6, stroke: '#1a1a1a' }
  if (type === 'text') return { ...base, width: 200, height: 40, text: 'LOGO', fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 36 }
  return base
}

export function createEmptyLogoProject(name) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name || 'Новий проєкт логотипа',
    createdAt: now,
    updatedAt: now,
    elements: [],
    canvasBg: '#ffffff',
    requirements: [],
    review: {
      items: REVIEW_RUBRIC_LOGO.map((criterion) => ({ id: crypto.randomUUID(), criterion, selfScore: '', note: '' })),
      comments: [],
    },
    versions: [],
  }
}

export function makeEmptyRequirement() {
  return { id: crypto.randomUUID(), title: '', note: '', done: false }
}

// Яка робоча область Logo Design Studio відкривається для підкатегорії —
// спільне для Module.jsx (кнопка «Відкрити Logo Design Studio») і самої
// студії (ліве дерево треків), щоб дві копії мапи не розійшлися.
export const LOGO_SUBCAT_SECTION = {
  'logo-basics': 'builder',
  'logo-research-brief': 'builder',
  'logo-typography': 'builder',
  'logo-marks-symbols': 'builder',
  'logo-geometry': 'builder',
  'logo-color': 'variations',
  'logo-negative-space': 'builder',
  'logo-variations': 'scale',
  'logo-monochrome': 'variations',
  'logo-application': 'scale',
  'logo-guidelines': 'requirements',
  'logo-critique-redesign': 'review',
  'logo-client-presentation': 'review',
  'logo-portfolio': 'review',
}
