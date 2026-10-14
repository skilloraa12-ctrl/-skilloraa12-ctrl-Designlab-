// Єдина модель проєкту UX Design Studio — усі етапи майстерні (той самий
// принцип «одного спільного проєкту», що й у motionProject.js/
// brandProject.js): кожен інструмент читає й пише той самий запис за id,
// тож персона, створена на етапі «Персона», одразу видна в автозведенні
// UX-кейсу на етапі «Презентація» без окремих копій даних.

export const UX_STAGES = [
  { id: 'research', emoji: '🔍', label: 'Дослідження' },
  { id: 'persona', emoji: '👤', label: 'Персона' },
  { id: 'journey', emoji: '🗺️', label: 'User Journey' },
  { id: 'problem', emoji: '🎯', label: 'Проблема' },
  { id: 'ia', emoji: '🗂️', label: 'Інформ. архітектура' },
  { id: 'flow', emoji: '🔀', label: 'User Flow' },
  { id: 'wireframe', emoji: '📐', label: 'Wireframes' },
  { id: 'prototype', emoji: '🖱️', label: 'Прототип' },
  { id: 'testing', emoji: '🧪', label: 'Тестування' },
  { id: 'audit', emoji: '✅', label: 'UX Audit' },
  { id: 'presentation', emoji: '📊', label: 'UX-кейс' },
]

export const AUDIT_CHECKLIST_TEMPLATE = [
  'Чи зрозуміло, де перебуває користувач?',
  'Чи зрозумілі назви кнопок?',
  'Чи логічна навігація?',
  'Чи помітні основні дії?',
  'Чи зрозуміло, що відбувається після натискання?',
  'Чи передбачені помилки?',
  'Чи є зрозумілий зворотний зв’язок?',
  'Чи працює сценарій без тупиків?',
  'Чи враховані доступність і читабельність?',
  'Чи відповідає рішення дослідженим потребам?',
]

export function createEmptyUxProject(name) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name || 'Новий UX-проєкт',
    createdAt: now,
    updatedAt: now,
    research: { goal: '', questions: [], notes: [], insights: [] },
    persona: { name: '', context: '', goals: '', needs: '', motivation: '', painPoints: '', barriers: '', scenarios: '', sources: '' },
    journey: { rows: [] },
    problem: { symptom: '', statement: '', hmw: '', successCriteria: '' },
    ia: { nodes: [] },
    flow: { blocks: [], edges: [] },
    wireframe: { screens: [] },
    prototype: { links: [], startScreenId: null },
    testing: { scenario: '', tasks: [], findings: [] },
    audit: { items: AUDIT_CHECKLIST_TEMPLATE.map((label) => ({ id: crypto.randomUUID(), label, checked: false, note: '' })) },
    presentation: { summary: '', conclusions: '' },
  }
}
