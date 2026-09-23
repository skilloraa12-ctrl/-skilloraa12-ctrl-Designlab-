// Довідник categories, from the ТЗ. `topics` is the spec's own topic list
// for that category - shown as a reference of what the category eventually
// covers, independent of how many real lessons exist there today (see
// lessons.js - only Color and Typography have real lessons so far).

export const GUIDE_CATEGORIES = [
  { id: 'design-foundations', en: 'Design Foundations', ua: 'Основи дизайну', topics: ['Що таке дизайн', 'Елементи дизайну', 'Принципи дизайну', 'Композиція', 'Візуальна ієрархія', 'Gestalt', 'Balance', 'Contrast', 'Rhythm', 'Proportion'] },
  { id: 'color', en: 'Color', ua: 'Колір', topics: ['Основи кольору', 'Color Theory', 'Color Systems', 'Harmonies', 'Palette', 'Contrast', 'Accessibility', 'Color Management'] },
  { id: 'typography', en: 'Typography', ua: 'Типографіка', topics: ['Основи типографіки', 'Font vs Typeface', 'Classification', 'Hierarchy', 'Spacing', 'Pairing', 'Web Typography'] },
  { id: 'graphic-design', en: 'Graphic Design', ua: 'Графічний дизайн', topics: ['Composition', 'Grid', 'Layout', 'Poster', 'Editorial', 'Print'] },
  { id: 'ui-design', en: 'UI Design', ua: 'UI-дизайн', topics: ['UI Fundamentals', 'Components', 'States', 'Forms', 'Navigation', 'Responsive Design', 'Design Systems'] },
  { id: 'ux-design', en: 'UX Design', ua: 'UX-дизайн', topics: ['UX Fundamentals', 'Research', 'Personas', 'User Journey', 'Information Architecture', 'User Flow', 'Wireframes', 'Prototypes', 'Testing'] },
  { id: 'branding', en: 'Branding', ua: 'Брендинг', topics: ['Brand Strategy', 'Identity', 'Logo', 'Typography', 'Color', 'Guidelines', 'Applications'] },
  { id: 'motion', en: 'Motion', ua: 'Моушн-дизайн', topics: ['Animation Fundamentals', 'Timing', 'Easing', 'Motion Principles', 'UI Motion', 'Lottie', 'Rive'] },
  { id: '3d', en: '3D', ua: '3D-дизайн', topics: ['Modeling', 'Materials', 'Textures', 'Lighting', 'Rendering'] },
  { id: 'ai-design', en: 'AI Design', ua: 'AI-дизайн', topics: ['AI Fundamentals', 'Prompt Design', 'AI Image', 'AI Video', 'AI UI', 'AI UX', 'Responsible AI'] },
]

export function getGuideCategory(id) {
  return GUIDE_CATEGORIES.find((c) => c.id === id)
}
