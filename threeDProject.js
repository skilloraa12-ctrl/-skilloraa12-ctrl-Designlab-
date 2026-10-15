// Єдина модель проєкту 3D Design Academy — той самий принцип "одного
// спільного проєкту", що й у gameArtProject.js/logoProject.js/adProject.js:
// 3D Design Studio читає й пише той самий запис через
// ProgressContext.saveThreeDProject.
//
// Чесна межа: 3D Design Studio НЕ дублює 3D Lab (реальний Three.js-рушій
// на /labs/3d) як окремий, гірший рушій усередині себе — побудова самих
// 3D-сцен відбувається в 3D Lab (той самий інструмент, що й у треку
// 3D-моделей Game Art Studio), а 3D Design Studio зберігає реальний
// знімок результату (JSON сцени Three.js, за потреби — скріншот) разом
// з обліком матеріалів/текстур, вимогами, рев'ю та версіями — так само,
// як Game Art Studio вже робить для свого треку 3D-моделей.

export const ASSET_KINDS = [
  { key: 'objects', emoji: '🧊', label: '3D-об\'єкти та сцени' },
  { key: 'materials', emoji: '🎨', label: 'Матеріали та текстури' },
  { key: 'requirements', emoji: '📋', label: 'Вимоги проєкту' },
]

export const REVIEW_RUBRIC_3D = [
  'Топологія й чистота сітки', 'Пропорції та масштаб', 'UV-розгортка', 'Матеріали та текстури', 'Освітлення та композиція', 'Технічна готовність до експорту',
]

export const SELF_SCORE_OPTIONS = ['Потребує роботи', 'Непогано', 'Відмінно']

function makeAsset(kind) {
  // note зберігає реальний JSON-знімок сцени з 3D Lab (вкладка «Експорт»)
  // чи опис стану роботи — той самий підхід, що й у models3d-треку Game
  // Art Studio, а не вигаданий окремий 3D-рушій усередині цієї студії.
  return { id: crypto.randomUUID(), kind, title: '', note: '', imageDataUrl: null }
}

export function createEmptyThreeDProject(name) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name || 'Новий 3D-проєкт',
    createdAt: now,
    updatedAt: now,
    assets: { objects: [], materials: [], requirements: [] },
    review: {
      rubricSet: '3d',
      items: REVIEW_RUBRIC_3D.map((criterion) => ({ id: crypto.randomUUID(), criterion, selfScore: '', note: '' })),
      comments: [],
    },
    versions: [],
  }
}

export function makeEmptyAsset(kind) {
  return makeAsset(kind)
}

// Яка робоча область 3D Design Studio відкривається для підкатегорії —
// спільне для Module.jsx (кнопка «Відкрити 3D Design Studio») і самої
// студії (ліве дерево треків), щоб дві копії мапи не розійшлися.
export const THREED_SUBCAT_SECTION = {
  '3d-basics': 'objects',
  '3d-primitives-modeling': 'objects',
  '3d-topology': 'objects',
  '3d-modeling-techniques': 'objects',
  '3d-uv-unwrapping': 'materials',
  '3d-materials-pbr': 'materials',
  '3d-texturing': 'materials',
  '3d-lighting': 'objects',
  '3d-camera-composition': 'objects',
  '3d-scene-composition': 'objects',
  '3d-rendering-export': 'requirements',
  '3d-animation-basics': 'objects',
  '3d-practical-applications': 'objects',
  '3d-critique-portfolio': 'review',
}
