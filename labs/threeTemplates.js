// Ready-made multi-object compositions for 3D Lab's "Шаблони" tab. Each
// part only lists what differs from makeObject()'s defaults (position/
// rotation/scale/material overrides + an optional name); Lab3D.jsx merges
// each part onto a freshly made object of that primitive type.
//
// Positions are hand-computed so parts actually sit flush against each
// other (e.g. a wall's top exactly meets the roof's base) rather than
// floating or clipping — every Y here accounts for that primitive's own
// half-height once its scale is applied.
export const TEMPLATES = [
  {
    id: 'house',
    icon: '🏠',
    label: 'Будиночок',
    parts: [
      { type: 'box', name: 'Стіни', position: { x: 0, y: 0.5, z: 0 }, scale: { x: 1.4, y: 1, z: 1.2 }, material: { color: '#D8C4A0' } },
      { type: 'cone', name: 'Дах', position: { x: 0, y: 1.39, z: 0 }, scale: { x: 1.7, y: 0.6, z: 1.5 }, material: { color: '#B3453B' } },
      { type: 'box', name: 'Двері', position: { x: 0, y: 0.25, z: 0.63 }, scale: { x: 0.26, y: 0.5, z: 0.06 }, material: { color: '#4A3220' } },
      { type: 'box', name: 'Вікно (ліве)', position: { x: -0.4, y: 0.65, z: 0.63 }, scale: { x: 0.18, y: 0.18, z: 0.05 }, material: { color: '#BEE3F8' } },
      { type: 'box', name: 'Вікно (праве)', position: { x: 0.4, y: 0.65, z: 0.63 }, scale: { x: 0.18, y: 0.18, z: 0.05 }, material: { color: '#BEE3F8' } },
    ],
  },
  {
    id: 'person',
    icon: '🧍',
    label: 'Людина',
    parts: [
      { type: 'box', name: 'Нога (ліва)', position: { x: -0.15, y: 0.4, z: 0 }, scale: { x: 0.25, y: 0.8, z: 0.25 }, material: { color: '#2B2B33' } },
      { type: 'box', name: 'Нога (права)', position: { x: 0.15, y: 0.4, z: 0 }, scale: { x: 0.25, y: 0.8, z: 0.25 }, material: { color: '#2B2B33' } },
      { type: 'box', name: 'Тулуб', position: { x: 0, y: 1.2, z: 0 }, scale: { x: 0.6, y: 0.8, z: 0.35 }, material: { color: '#3E63DD' } },
      { type: 'box', name: 'Рука (ліва)', position: { x: -0.42, y: 1.2, z: 0 }, scale: { x: 0.2, y: 0.7, z: 0.2 }, material: { color: '#E8B98C' } },
      { type: 'box', name: 'Рука (права)', position: { x: 0.42, y: 1.2, z: 0 }, scale: { x: 0.2, y: 0.7, z: 0.2 }, material: { color: '#E8B98C' } },
      { type: 'sphere', name: 'Голова', position: { x: 0, y: 1.925, z: 0 }, scale: { x: 0.5, y: 0.5, z: 0.5 }, material: { color: '#E8B98C' } },
    ],
  },
  {
    id: 'plant',
    icon: '🌳',
    label: 'Рослина',
    parts: [
      { type: 'cylinder', name: 'Горщик', position: { x: 0, y: 0.21, z: 0 }, scale: { x: 0.5, y: 0.35, z: 0.5 }, material: { color: '#B5651D' } },
      { type: 'cylinder', name: 'Стебло', position: { x: 0, y: 0.96, z: 0 }, scale: { x: 0.08, y: 0.9, z: 0.08 }, material: { color: '#6B4226' } },
      { type: 'sphere', name: 'Листя (центр)', position: { x: 0, y: 1.5, z: 0 }, scale: { x: 0.5, y: 0.35, z: 0.5 }, material: { color: '#4C9A4C' } },
      { type: 'sphere', name: 'Листя (ліве)', position: { x: -0.32, y: 1.32, z: 0 }, scale: { x: 0.4, y: 0.3, z: 0.4 }, material: { color: '#5AAE5A' } },
      { type: 'sphere', name: 'Листя (праве)', position: { x: 0.32, y: 1.32, z: 0 }, scale: { x: 0.4, y: 0.3, z: 0.4 }, material: { color: '#5AAE5A' } },
    ],
  },
  {
    id: 'toy',
    icon: '🧸',
    label: 'Іграшка',
    parts: [
      { type: 'box', name: 'Основа', position: { x: 0, y: 0.175, z: 0 }, scale: { x: 0.9, y: 0.35, z: 0.9 }, material: { color: '#E0523E' } },
      { type: 'sphere', name: 'Середина', position: { x: 0, y: 0.71, z: 0 }, scale: { x: 0.55, y: 0.55, z: 0.55 }, material: { color: '#E8B23E' } },
      { type: 'cone', name: 'Верх', position: { x: 0, y: 1.36, z: 0 }, scale: { x: 0.45, y: 0.45, z: 0.45 }, material: { color: '#3E63DD' } },
    ],
  },
]
