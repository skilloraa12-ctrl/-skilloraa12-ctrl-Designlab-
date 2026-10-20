// Модель даних вкладки «Практика» — ТЗ розділи 4 («Версії та розблокування»)
// і 6 («Дані й безпека»).
//
// Чесна адаптація до наявної архітектури: ТЗ пропонує окремі таблиці
// Supabase (practice_tasks/practice_projects/practice_snapshots) з RLS.
// Але в цьому проєкті НІЩО не зберігається в окремих таблицях — усі студії
// (Logo/Ad/3D/Graphic/Motion/UX/Game Art) пишуть у ОДИН jsonb-стовпець
// progress.data через ProgressContext (підтверджено читанням коду). Нова
// практика йде тим самим шляхом — practiceProjects у тому самому блобі,
// без нової таблиці й нової системи прав доступу, яку тут нема як реально
// розгорнути чи перевірити (немає доступу до бойового проєкту Supabase).
// practice_tasks із ТЗ теж не таблиця БД: самі завдання — статичні дані
// в коді (practiceTasks.js), за тим самим принципом, що й уроки в
// modules.js, а не контент із CMS.

export const VERSIONS = [
  { id: 'v1', label: 'Базова', minLevel: 1 },
  { id: 'v2', label: 'Стандартна', minLevel: 4 },
  { id: 'v3', label: 'Професійна', minLevel: 8 },
]

export function versionForLevel(level) {
  if (level >= 8) return 'v3'
  if (level >= 4) return 'v2'
  return 'v1'
}

export function versionRank(v) {
  return VERSIONS.findIndex((x) => x.id === v)
}

// Який рушій (editor) і профіль (profile) обслуговує кожен напрям — ТЗ
// розділ 1 «Відповідність напрямів редакторам». editorReady=false: рушій
// ще не збудований цього заходу — показуємо чесну заглушку «скоро», а не
// фейковий інструмент.
export const DIRECTION_EDITOR = {
  '3d-design': { editor: 'threeD', profile: '3d-design', editorReady: false },
  'game-art': { editor: 'threeD', profile: 'game-art', editorReady: false },
  'graphic-design': { editor: 'vector', profile: 'graphic', editorReady: true },
  'logo-design': { editor: 'vector', profile: 'logo', editorReady: true },
  'branding': { editor: 'vector', profile: 'branding', editorReady: true },
  'ux-design': { editor: 'flow', profile: 'ux', editorReady: false },
  'ui-design': { editor: 'flow', profile: 'ui', editorReady: false },
  'web-design': { editor: 'flow', profile: 'web', editorReady: false },
  'app-design': { editor: 'flow', profile: 'app', editorReady: false },
  'motion-design': { editor: 'motion', profile: 'motion', editorReady: false },
  'advertising-design': { editor: 'motion', profile: 'advertising', editorReady: false },
  'game-design': { editor: 'gameBoard', profile: 'game-design', editorReady: false },
}

export function createEmptyPracticeProject(task) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    taskId: task.taskId,
    lessonId: task.lessonId,
    editor: task.editor,
    profile: task.profile,
    version: 'v1',
    project: structuredClone(task.startProject || {}),
    status: 'draft', // draft | submitted | passed
    score: 0,
    attempts: 0,
    hintsUsed: 0,
    lastResults: [],
    snapshots: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function pushSnapshot(practiceProject) {
  const snap = { id: crypto.randomUUID(), project: structuredClone(practiceProject.project), createdAt: new Date().toISOString() }
  const snapshots = [snap, ...(practiceProject.snapshots || [])].slice(0, 10)
  return { ...practiceProject, snapshots }
}
