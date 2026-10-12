// Єдина модель брендингового проєкту для Branding Studio — усі
// інструменти майстерні (BrandBriefBuilder, BrandStrategyCanvas,
// NamingWorkshop, MoodboardBuilder, ...) читають і записують той самий
// об'єкт через ProgressContext.saveBrandProject({ id, ...patch }), що
// зберігає лише перелічені поля (merge), не перезаписуючи решту —
// див. коментар біля saveBrandProject у ProgressContext.jsx.

// 12 етапів роботи над брендом (ліва панель BrandingStudio, п.3.2 ТЗ).
export const BRAND_STAGES = [
  { id: 'brief', emoji: '📋', label: 'Бриф' },
  { id: 'research', emoji: '🔍', label: 'Дослідження' },
  { id: 'strategy', emoji: '🎯', label: 'Стратегія' },
  { id: 'naming', emoji: '🔤', label: 'Назва' },
  { id: 'concept', emoji: '💡', label: 'Концепція' },
  { id: 'logo', emoji: '🏷️', label: 'Логотип' },
  { id: 'palette', emoji: '🎨', label: 'Палітра' },
  { id: 'typography', emoji: '🔠', label: 'Типографіка' },
  { id: 'graphicElements', emoji: '◼️', label: 'Графічні елементи' },
  { id: 'mediaApplications', emoji: '📦', label: 'Носії бренду' },
  { id: 'guidelines', emoji: '📖', label: 'Брендбук' },
  { id: 'presentation', emoji: '🖥️', label: 'Презентація' },
]

// Критерії оцінки варіантів назви (п. 6.3 ТЗ).
export const NAMING_CRITERIA = [
  { id: 'strategyFit', label: 'Відповідність стратегії' },
  { id: 'memorability', label: 'Запам’ятовуваність' },
  { id: 'pronunciation', label: 'Вимова' },
  { id: 'uniqueness', label: 'Унікальність концепції' },
  { id: 'audienceFit', label: 'Відповідність аудиторії' },
  { id: 'usability', label: 'Зручність у комунікації' },
]

// 12 архетипів бренду (Юнгіанська модель, стандартний інструмент
// стратегії бренду — модуль 3, урок "Архетипи брендів") — підказка
// для Strategy Canvas, не автоматичний генератор стратегії.
export const BRAND_ARCHETYPES = [
  { id: 'innocent', label: 'Невинний', desc: 'Простота, оптимізм, чесність' },
  { id: 'explorer', label: 'Шукач', desc: 'Свобода, відкриття нового, незалежність' },
  { id: 'sage', label: 'Мудрець', desc: 'Знання, аналіз, істина' },
  { id: 'hero', label: 'Герой', desc: 'Мужність, досягнення, подолання труднощів' },
  { id: 'outlaw', label: 'Бунтар', desc: 'Виклик нормам, руйнування стереотипів, свобода від правил' },
  { id: 'magician', label: 'Чарівник', desc: 'Трансформація, бачення, перетворення можливого' },
  { id: 'regular', label: 'Звичайна людина', desc: 'Приналежність, простота, реалізм' },
  { id: 'lover', label: 'Коханець', desc: 'Пристрасть, близькість, естетика' },
  { id: 'jester', label: 'Блазень', desc: 'Гумор, легкість, радість моменту' },
  { id: 'caregiver', label: 'Турботливий', desc: 'Піклування, щедрість, співчуття' },
  { id: 'ruler', label: 'Правитель', desc: 'Контроль, лідерство, престиж' },
  { id: 'creator', label: 'Творець', desc: 'Уява, інновація, самовираження' },
]

export function createEmptyBrandProject(name) {
  const now = new Date().toISOString()
  return {
    id: null,
    name: name || 'Новий бренд',
    brief: {
      businessName: '', businessType: '', product: '', description: '', mission: '',
      businessGoals: '', targetAudience: '', audienceNeeds: '', competitors: '',
      advantages: '', brandCharacter: '', desiredPerception: '', constraints: '', notes: '',
    },
    research: { competitorTable: [], marketNotes: '', conclusions: '' },
    strategy: {
      mission: '', vision: '', values: '', positioning: '', uvp: '', benefits: '',
      promise: '', character: '', archetype: '', emotionalPerception: '',
      rationalBenefits: '', emotionalBenefits: '', toneOfVoice: '', mainMessage: '',
    },
    naming: { candidates: [], chosenId: null },
    moodboard: { items: [] },
    concepts: [],
    logos: [],
    palette: { primary: [], secondary: [], accent: [], neutral: [] },
    typography: { logoFont: '', headingFont: '', bodyFont: '', rules: '' },
    graphicElements: { shapes: '', patterns: '', iconography: '', photoStyle: '', notes: '' },
    mediaApplications: [],
    brandAssets: { logoImage: null },
    guidelines: { pages: {}, exportedAt: null },
    presentation: { slides: [] },
    learningProgress: {},
    createdAt: now,
    updatedAt: now,
  }
}
