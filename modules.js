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
// загалом). App Design: поки написана лише 'app-design-basics' (id
// 5101-5108 — діапазон з зсувом +5000, щоб гарантовано не перетинатись
// із Web Design, замість order*100). Якщо в майбутньому додасться
// підкатегорія без власного файлу в lessons/, AcademySubcategory чесно
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
import { LESSONS as appDesignBasics } from './lessons/app-design-basics.js'
import { LESSONS as appVisualDesignBasics } from './lessons/app-visual-design-basics.js'
import { LESSONS as appCompositionLayout } from './lessons/app-composition-layout.js'
import { LESSONS as appColor } from './lessons/app-color.js'
import { LESSONS as appTypography } from './lessons/app-typography.js'
import { LESSONS as appVisualAssets } from './lessons/app-visual-assets.js'
import { LESSONS as appScreensStructure } from './lessons/app-screens-structure.js'
import { LESSONS as appComponents } from './lessons/app-components.js'
import { LESSONS as appAdaptiveDesign } from './lessons/app-adaptive-design.js'
import { LESSONS as appDesignSystems } from './lessons/app-design-systems.js'
import { LESSONS as appWireframing } from './lessons/app-wireframing.js'
import { LESSONS as appPrototyping } from './lessons/app-prototyping.js'
import { LESSONS as appMotionAnimation } from './lessons/app-motion-animation.js'
import { LESSONS as appAccessibility } from './lessons/app-accessibility.js'
import { LESSONS as appFigmaBasics } from './lessons/app-figma-basics.js'
import { LESSONS as appFigmaLayout } from './lessons/app-figma-layout.js'
import { LESSONS as appFigmaDesignSystem } from './lessons/app-figma-design-system.js'
import { LESSONS as appFigmaPrototype } from './lessons/app-figma-prototype.js'
import { LESSONS as appFigmaAppDesign } from './lessons/app-figma-app-design.js'
import { LESSONS as appTechMinimum } from './lessons/app-tech-minimum.js'
import { LESSONS as appDesignToDevelopment } from './lessons/app-design-to-development.js'
import { LESSONS as appTypesPractice } from './lessons/app-types-practice.js'
import { LESSONS as appRealProjects } from './lessons/app-real-projects.js'
import { LESSONS as appDesignerPortfolio } from './lessons/app-designer-portfolio.js'
import { LESSONS as uiFoundations } from './lessons/ui-foundations.js'
import { LESSONS as interactionDesign } from './lessons/interaction-design.js'
import { LESSONS as perceptionGestalt } from './lessons/perception-gestalt.js'
import { LESSONS as cognitivePsychologyUi } from './lessons/cognitive-psychology-ui.js'
import { LESSONS as informationArchitecture } from './lessons/information-architecture.js'
import { LESSONS as navigationPatterns } from './lessons/navigation-patterns.js'
import { LESSONS as dataTables } from './lessons/data-tables.js'
import { LESSONS as searchFilters } from './lessons/search-filters.js'
import { LESSONS as advancedForms } from './lessons/advanced-forms.js'
import { LESSONS as dashboardsDataviz } from './lessons/dashboards-dataviz.js'
import { LESSONS as notificationsFeedback } from './lessons/notifications-feedback.js'
import { LESSONS as onboardingAdoption } from './lessons/onboarding-adoption.js'
import { LESSONS as enterpriseSaasUi } from './lessons/enterprise-saas-ui.js'
import { LESSONS as darkPatternsEthics } from './lessons/dark-patterns-ethics.js'
import { LESSONS as uxWritingMicrocopy } from './lessons/ux-writing-microcopy.js'
import { LESSONS as heuristicsCritique } from './lessons/heuristics-critique.js'
import { LESSONS as crossPlatformConsistency } from './lessons/cross-platform-consistency.js'
import { LESSONS as desktopSoftwareUi } from './lessons/desktop-software-ui.js'
import { LESSONS as emergingPlatformsUi } from './lessons/emerging-platforms-ui.js'
import { LESSONS as accessibleComplexUi } from './lessons/accessible-complex-ui.js'
import { LESSONS as designSystemsScale } from './lessons/design-systems-scale.js'
import { LESSONS as usabilityTesting } from './lessons/usability-testing.js'
import { LESSONS as uiDesignProcessPortfolio } from './lessons/ui-design-process-portfolio.js'

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
  ...appDesignBasics,
  ...appVisualDesignBasics,
  ...appCompositionLayout,
  ...appColor,
  ...appTypography,
  ...appVisualAssets,
  ...appScreensStructure,
  ...appComponents,
  ...appAdaptiveDesign,
  ...appDesignSystems,
  ...appWireframing,
  ...appPrototyping,
  ...appMotionAnimation,
  ...appAccessibility,
  ...appFigmaBasics,
  ...appFigmaLayout,
  ...appFigmaDesignSystem,
  ...appFigmaPrototype,
  ...appFigmaAppDesign,
  ...appTechMinimum,
  ...appDesignToDevelopment,
  ...appTypesPractice,
  ...appRealProjects,
  ...appDesignerPortfolio,
  ...uiFoundations,
  ...interactionDesign,
  ...perceptionGestalt,
  ...cognitivePsychologyUi,
  ...informationArchitecture,
  ...navigationPatterns,
  ...dataTables,
  ...searchFilters,
  ...advancedForms,
  ...dashboardsDataviz,
  ...notificationsFeedback,
  ...onboardingAdoption,
  ...enterpriseSaasUi,
  ...darkPatternsEthics,
  ...uxWritingMicrocopy,
  ...heuristicsCritique,
  ...crossPlatformConsistency,
  ...desktopSoftwareUi,
  ...emergingPlatformsUi,
  ...accessibleComplexUi,
  ...designSystemsScale,
  ...usabilityTesting,
  ...uiDesignProcessPortfolio,
]

export function getModule(id) {
  return MODULES.find((m) => m.id === Number(id))
}
