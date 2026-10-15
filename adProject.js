// Модель проєкту Advertising Design Studio — той самий принцип "одного
// спільного проєкту", що й у logoProject.js/gameArtProject.js:
// Advertising Design Studio читає й пише той самий запис через
// ProgressContext.saveAdProject.
//
// На відміну від логотипа (векторний знак), рекламне оголошення — це
// композиція з фонового зображення/кольору, заголовка, основного тексту,
// кнопки CTA і логотипа-плями, зібрана під конкретний стандартний
// формат (банер, соцмережі, друк, OOH) — тому ad-елемент має рамку
// формату (adSize) як першочергову властивість, а не довільний розмір
// полотна.
//
// Чесна межа: A/B-варіанти — реальні окремі знімки composиції (variants[]),
// які студент сам створює кнопкою «Додати варіант»; студія не вигадує
// статистику кліків чи конверсії, яких не було.

export const AD_SIZES = [
  { key: 'banner-300x250', label: 'Банер 300×250 (Medium Rectangle)', w: 300, h: 250 },
  { key: 'banner-728x90', label: 'Банер 728×90 (Leaderboard)', w: 728, h: 90 },
  { key: 'banner-160x600', label: 'Банер 160×600 (Skyscraper)', w: 160, h: 600 },
  { key: 'social-square', label: 'Соцмережі — квадрат 1080×1080', w: 1080, h: 1080 },
  { key: 'social-story', label: 'Соцмережі — історія 1080×1920', w: 1080, h: 1920 },
  { key: 'social-feed', label: 'Соцмережі — стрічка 1080×1350', w: 1080, h: 1350 },
  { key: 'print-a4', label: 'Друк — A4 портрет', w: 595, h: 842 },
  { key: 'ooh-billboard', label: 'OOH — білборд (широкий)', w: 1200, h: 500 },
]

export const REVIEW_RUBRIC_AD = [
  'Привертає увагу за 3 секунди', 'Чітка рекламна ідея', 'Читабельний CTA', 'Відповідає бренд-гайдлайнам', 'Адаптований під формат', 'Технічно готовий до публікації',
]

export const SELF_SCORE_OPTIONS = ['Потребує роботи', 'Непогано', 'Відмінно']

let elementCounter = 0
function nextElementId() {
  elementCounter += 1
  return `ad-el-${Date.now()}-${elementCounter}`
}

export function makeDefaultElement(type, x = 40, y = 40) {
  const base = { id: nextElementId(), type, x, y, rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1 }
  if (type === 'headline') return { ...base, width: 240, height: 48, text: 'Заголовок', fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 28, fill: '#111111' }
  if (type === 'body') return { ...base, width: 240, height: 60, text: 'Основний текст оголошення', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, fill: '#333333' }
  if (type === 'cta') return { ...base, width: 140, height: 40, text: 'Дізнатися більше', fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 14, fill: '#ffffff', ctaBg: '#ff5a1f' }
  if (type === 'shape') return { ...base, width: 100, height: 100, shapeType: 'rect' }
  if (type === 'logoMark') return { ...base, width: 60, height: 60, shapeType: 'circle', fill: '#2e6dff' }
  return base
}

export function createEmptyAdProject(name) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name || 'Новий рекламний проєкт',
    createdAt: now,
    updatedAt: now,
    adSize: 'social-square',
    canvasBg: '#ffffff',
    elements: [],
    requirements: [],
    review: {
      items: REVIEW_RUBRIC_AD.map((criterion) => ({ id: crypto.randomUUID(), criterion, selfScore: '', note: '' })),
      comments: [],
    },
    variants: [],
    versions: [],
  }
}

export function makeEmptyRequirement() {
  return { id: crypto.randomUUID(), title: '', note: '', done: false }
}

// Яка робоча область Advertising Design Studio відкривається для
// підкатегорії — спільне для Module.jsx (кнопка «Відкрити Advertising
// Design Studio») і самої студії (ліве дерево треків), щоб дві копії
// мапи не розійшлися.
export const AD_SUBCAT_SECTION = {
  'ad-basics': 'builder',
  'ad-brief-strategy': 'requirements',
  'ad-copywriting': 'builder',
  'ad-composition': 'builder',
  'ad-print': 'formats',
  'ad-digital-banners': 'formats',
  'ad-social-ads': 'formats',
  'ad-ooh': 'formats',
  'ad-campaign-concept': 'variants',
  'ad-cta-conversion': 'builder',
  'ad-brand-consistency': 'builder',
  'ad-seasonal-promo': 'variants',
  'ad-critique': 'review',
  'ad-portfolio': 'review',
}
