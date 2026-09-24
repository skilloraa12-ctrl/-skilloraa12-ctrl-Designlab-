// MODULES збирається з окремих файлів у lessons/ — по одному файлу на
// підкатегорію (subcategories.js), щоб кожен файл був невеликим і його
// можна було писати/переглядати незалежно. Назва MODULES історична,
// концептуально це окремі уроки всередині підкатегорії.
//
// Поля кожного уроку: id (унікальний, ідентифікатор блоку підкатегорії *
// 100 + порядковий номер, щоб гарантовано не перетинались між файлами),
// level (slug напрямку, напр. 'web-design'), subcategory (slug
// підкатегорії з subcategories.js), theory (розгорнуте пояснення),
// keyPoints (принципи), mistakes (типові помилки), topics (перелік тем),
// practice (завдання або null), selfCheck (критерії самоперевірки
// практики, якщо вона є), quiz (міні-тест).
//
// Ієрархія: напрямок (directions.js) → підкатегорія (subcategories.js,
// 24 штуки для Web Design) → уроки (файли в lessons/).
//
// Усі 24 підкатегорії Web Design мають написані уроки (96 уроків
// загалом). Якщо в майбутньому додасться підкатегорія без власного
// файлу в lessons/ (новий напрямок дизайну), AcademySubcategory чесно
// покаже заплановані теми (список, не посилання) замість фейкового
// порожнього уроку, поки для неї не буде написано реальний вміст.
import { LESSONS as webDesignBasics } from './lessons/web-design-basics.js'
import { LESSONS as visualDesignBasics } from './lessons/visual-design-basics.js'
import { LESSONS as compositionLayout } from './lessons/composition-layout.js'
import { LESSONS as color } from './lessons/color.js'
import { LESSONS as typography } from './lessons/typography.js'
import { LESSONS as visualAssets } from './lessons/visual-assets.js'
import { LESSONS as websiteStructure } from './lessons/website-structure.js'
import { LESSONS as webComponents } from './lessons/web-components.js'
import { LESSONS as responsiveWebDesign } from './lessons/responsive-web-design.js'
import { LESSONS as designSystems } from './lessons/design-systems.js'
import { LESSONS as wireframing } from './lessons/wireframing.js'
import { LESSONS as prototyping } from './lessons/prototyping.js'
import { LESSONS as motionAnimation } from './lessons/motion-animation.js'
import { LESSONS as accessibility } from './lessons/accessibility.js'
import { LESSONS as figmaBasics } from './lessons/figma-basics.js'
import { LESSONS as figmaLayout } from './lessons/figma-layout.js'
import { LESSONS as figmaDesignSystem } from './lessons/figma-design-system.js'
import { LESSONS as figmaPrototype } from './lessons/figma-prototype.js'
import { LESSONS as figmaWebDesign } from './lessons/figma-web-design.js'
import { LESSONS as techMinimum } from './lessons/tech-minimum.js'
import { LESSONS as designToDevelopment } from './lessons/design-to-development.js'
import { LESSONS as websiteTypesPractice } from './lessons/website-types-practice.js'
import { LESSONS as realProjects } from './lessons/real-projects.js'
import { LESSONS as webDesignerPortfolio } from './lessons/web-designer-portfolio.js'

export const MODULES = [
  ...webDesignBasics,
  ...visualDesignBasics,
  ...compositionLayout,
  ...color,
  ...typography,
  ...visualAssets,
  ...websiteStructure,
  ...webComponents,
  ...responsiveWebDesign,
  ...designSystems,
  ...wireframing,
  ...prototyping,
  ...motionAnimation,
  ...accessibility,
  ...figmaBasics,
  ...figmaLayout,
  ...figmaDesignSystem,
  ...figmaPrototype,
  ...figmaWebDesign,
  ...techMinimum,
  ...designToDevelopment,
  ...websiteTypesPractice,
  ...realProjects,
  ...webDesignerPortfolio,
]

export function getModule(id) {
  return MODULES.find((m) => m.id === Number(id))
}
