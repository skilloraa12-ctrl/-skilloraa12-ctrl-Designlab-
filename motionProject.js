// Єдина модель проєкту Motion Design Studio — усі етапи майстерні
// (Ідея, Розкадровка, Анімація, Ефекти, Звук, Експорт, Презентація)
// читають і пишуть той самий запис за id (та сама логіка, що й
// brandProject.js для Branding Studio), тож зміна тривалості сцени на
// етапі Анімації одразу видно в підсумку Презентації.

export const MOTION_STAGES = [
  { id: 'idea', emoji: '💡', label: 'Ідея' },
  { id: 'storyboard', emoji: '🎞️', label: 'Розкадровка' },
  { id: 'animation', emoji: '🎬', label: 'Анімація' },
  { id: 'effects', emoji: '✨', label: 'Ефекти' },
  { id: 'sound', emoji: '🔊', label: 'Звук' },
  { id: 'export', emoji: '📤', label: 'Експорт' },
  { id: 'presentation', emoji: '🗣️', label: 'Презентація' },
]

export const CANVAS_PRESETS = [
  { id: 'landscape', label: 'Горизонтально (16:9)', w: 960, h: 540 },
  { id: 'square', label: 'Квадрат (1:1)', w: 640, h: 640 },
  { id: 'portrait', label: 'Вертикально (9:16)', w: 405, h: 720 },
]

export function createEmptyMotionProject(name) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name || 'Новий моушн-проєкт',
    createdAt: now,
    updatedAt: now,
    canvas: { w: 960, h: 540 },
    fps: 30,
    duration: 3000,
    objects: [],
    idea: { goal: '', scenario: '', audience: '', format: '', channel: '' },
    storyboard: { frames: [] },
    effects: { notes: '' },
    sound: { concept: '', syncNotes: '' },
    presentation: { slides: [] },
  }
}
