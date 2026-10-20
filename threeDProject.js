// Єдина модель проєкту 3D Design Academy — той самий принцип "одного
// спільного проєкту", що й у gameArtProject.js/logoProject.js/adProject.js:
// 3D Design Studio читає й пише той самий запис через
// ProgressContext.saveThreeDProject.
//
// На відміну від Game Art Studio (яка посилається на 3D Lab для реальної
// 3D-роботи), 3D Design Studio має власний повноцінний редактор з анімацією
// (ThreeDAnimEditor.jsx, /3d-design-studio/:id/editor) — окремий від 3D Lab,
// що й далі лишається незмінним інструментом для Game Art та інших напрямків.
// `anim` нижче — реальна, редагована сцена з ключовими кадрами трансформації
// для кількох обʼєктів одночасно, а не просто нотатка/знімок.

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
  // note лишається вільним текстовим полем (референси, опис матеріалу,
  // технічні вимоги) — сама 3D-сцена з анімацією живе окремо в полі `anim`,
  // редагованому через ThreeDAnimEditor, а не тут.
  return { id: crypto.randomUUID(), kind, title: '', note: '', imageDataUrl: null }
}

export const LIGHT_TYPES = ['pointLight', 'spotLight']

const LIGHT_DEFAULTS = {
  pointLight: { color: '#ffe9b0', intensity: 1.2, distance: 0, decay: 2 },
  spotLight: { color: '#ffe9b0', intensity: 1.5, distance: 0, decay: 2, angle: 35, penumbra: 0.3 },
}

// Один обʼєкт анімованої сцени: примітив (чи точкове/прожекторне світло) +
// базова трансформація/матеріал (використовується, коли на обʼєкті ще немає
// жодного ключового кадру) і список ключових кадрів (кожен — { time (сек),
// position, rotation (°), scale, easing }). Світло анімується тим самим
// механізмом ключових кадрів, що й геометрія — лише замість `material` у
// нього `light` (color/intensity/distance/decay, + angle/penumbra для
// прожектора), а напрямок прожектора задається тим самим полем rotation.
export function makeAnimObject(type = 'box', idFn = () => crypto.randomUUID()) {
  const isLight = LIGHT_TYPES.includes(type)
  return {
    id: idFn(),
    name: null,
    type,
    position: isLight ? { x: 0, y: 2, z: 0 } : { x: 0, y: 0.65, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    material: isLight ? null : { color: '#3E37E0', metalness: 0.2, roughness: 0.5, wireframe: false, opacity: 1 },
    light: isLight ? { ...LIGHT_DEFAULTS[type] } : null,
    keyframes: [],
  }
}

export function makeKeyframeFromObject(obj, time) {
  return {
    time,
    position: { ...obj.position },
    rotation: { ...obj.rotation },
    scale: { ...obj.scale },
    easing: 'linear',
  }
}

export function createEmptyAnimScene() {
  return { duration: 5, fps: 30, objects: [] }
}

export function createEmptyThreeDProject(name) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name || 'Новий 3D-проєкт',
    createdAt: now,
    updatedAt: now,
    assets: { objects: [], materials: [], requirements: [] },
    anim: createEmptyAnimScene(),
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
