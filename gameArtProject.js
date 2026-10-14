// Єдина модель проєкту Game Art Academy — той самий принцип "одного
// спільного проєкту", що й у brandProject.js/motionProject.js/uxProject.js:
// ліва панель (асети), moodboard, review-робоча область і версії
// читають і пишуть той самий запис через ProgressContext.saveGameArtProject.
//
// Чесна межа (явна вимога ТЗ, розділ 6): версії знизу — НЕ фіктивні
// v1.0/v1.1/v2.0. Запис у versions[] зʼявляється лише тоді, коли
// користувач сам натискає «Зберегти версію» — це реальний знімок
// поточного стану проєкту, а не вигадана історія.

export const ASSET_KINDS = [
  { key: 'concepts2d', emoji: '🖼️', label: '2D-концепти' },
  { key: 'models3d', emoji: '🧊', label: '3D-моделі' },
  { key: 'textures', emoji: '🎨', label: 'PBR-текстури' },
  { key: 'requirements', emoji: '📋', label: 'Вимоги проєкту' },
]

export const REVIEW_RUBRIC_2D = [
  'Силует', 'Композиція', 'Колір', 'Читабельність', 'Чистота виконання', 'Відповідність завданню',
]
export const REVIEW_RUBRIC_CHARACTER = [
  'Пропорції', 'Виразність', 'Силует', 'Кольорове рішення', 'Візуальна цілісність', 'Відповідність концепції',
]
export const REVIEW_RUBRIC_3D = [
  'Форма', 'Пропорції', 'Топологія', 'UV', 'Матеріали', 'Текстури', 'Освітлення', 'Технічна готовність', 'Оптимізація',
]
export const REVIEW_RUBRIC_ASSET = [
  'Правильний формат', 'Структура файлів', 'Назви', 'Масштаб', 'Правильність експорту', 'Результат імпорту', 'Відповідність ТЗ',
]
export const RUBRIC_SETS = [
  { key: '2d', label: '2D-робота', items: REVIEW_RUBRIC_2D },
  { key: 'character', label: 'Персонаж', items: REVIEW_RUBRIC_CHARACTER },
  { key: '3d', label: '3D-модель', items: REVIEW_RUBRIC_3D },
  { key: 'asset', label: 'Ігровий ресурс (експорт)', items: REVIEW_RUBRIC_ASSET },
]

export const SELF_SCORE_OPTIONS = ['Потребує роботи', 'Непогано', 'Відмінно']

function makeAsset(kind) {
  // pixelData зберігає реальний малюнок, зроблений прямо у вбудованому
  // Pixel Art Editor для 2D-концептів (не лише посилання на зовнішній
  // файл) — { size, pixels }, той самий формат, що й /labs/pixel-art.
  return { id: crypto.randomUUID(), kind, title: '', note: '', imageDataUrl: null, pixelData: null }
}

export function createEmptyGameArtProject(name) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name || 'Новий проєкт Game Art',
    createdAt: now,
    updatedAt: now,
    assets: { concepts2d: [], models3d: [], textures: [], requirements: [] },
    moodboard: { items: [] },
    review: {
      rubricSet: '2d',
      items: REVIEW_RUBRIC_2D.map((criterion) => ({ id: crypto.randomUUID(), criterion, selfScore: '', note: '' })),
      comments: [],
    },
    versions: [],
  }
}

export function makeEmptyAsset(kind) {
  return makeAsset(kind)
}
