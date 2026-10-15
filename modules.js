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
import { LESSONS as uiFinalProject } from './lessons/ui-final-project.js'
import { LESSONS as gameDesignBasics } from './lessons/game-design-basics.js'
import { LESSONS as gameDesignProcess } from './lessons/game-design-process.js'
import { LESSONS as coreLoopMechanics } from './lessons/core-loop-mechanics.js'
import { LESSONS as rulesSystemsDesign } from './lessons/rules-systems-design.js'
import { LESSONS as playerPsychology } from './lessons/player-psychology.js'
import { LESSONS as gameBalance } from './lessons/game-balance.js'
import { LESSONS as difficultyProgression } from './lessons/difficulty-progression.js'
import { LESSONS as levelDesignFundamentals } from './lessons/level-design-fundamentals.js'
import { LESSONS as gameGenresConventions } from './lessons/game-genres-conventions.js'
import { LESSONS as narrativeDesign } from './lessons/narrative-design.js'
import { LESSONS as gameEconomy } from './lessons/game-economy.js'
import { LESSONS as multiplayerSocialDesign } from './lessons/multiplayer-social-design.js'
import { LESSONS as monetizationF2p } from './lessons/monetization-f2p.js'
import { LESSONS as hudIngameUi } from './lessons/hud-ingame-ui.js'
import { LESSONS as gameMenusNavigation } from './lessons/game-menus-navigation.js'
import { LESSONS as gameAccessibility } from './lessons/game-accessibility.js'
import { LESSONS as gameDesignDocumentation } from './lessons/game-design-documentation.js'
import { LESSONS as gamePrototyping } from './lessons/game-prototyping.js'
import { LESSONS as playtestingIteration } from './lessons/playtesting-iteration.js'
import { LESSONS as gameFeelJuice } from './lessons/game-feel-juice.js'
import { LESSONS as levelDesignPractice } from './lessons/level-design-practice.js'
import { LESSONS as crossPlatformGameDesign } from './lessons/cross-platform-game-design.js'
import { LESSONS as gameDesignerCareer } from './lessons/game-designer-career.js'
import { LESSONS as gameDesignPortfolioFinal } from './lessons/game-design-portfolio-final.js'
import { LESSONS as graphicDesignBasics } from './lessons/graphic-design-basics.js'
import { LESSONS as graphicComposition } from './lessons/graphic-composition.js'
import { LESSONS as graphicColor } from './lessons/graphic-color.js'
import { LESSONS as graphicTypography } from './lessons/graphic-typography.js'
import { LESSONS as graphicShapes } from './lessons/graphic-shapes.js'
import { LESSONS as graphicImages } from './lessons/graphic-images.js'
import { LESSONS as graphicPosters } from './lessons/graphic-posters.js'
import { LESSONS as graphicSocialMedia } from './lessons/graphic-social-media.js'
import { LESSONS as graphicLogos } from './lessons/graphic-logos.js'
import { LESSONS as graphicVector } from './lessons/graphic-vector.js'
import { LESSONS as graphicPrint } from './lessons/graphic-print.js'
import { LESSONS as graphicPackaging } from './lessons/graphic-packaging.js'
import { LESSONS as graphicInfographics } from './lessons/graphic-infographics.js'
import { LESSONS as graphicProcess } from './lessons/graphic-process.js'
import { LESSONS as graphicPortfolio } from './lessons/graphic-portfolio.js'
import { LESSONS as brandingBasics } from './lessons/branding-basics.js'
import { LESSONS as brandingBriefResearch } from './lessons/branding-brief-research.js'
import { LESSONS as brandingStrategy } from './lessons/branding-strategy.js'
import { LESSONS as brandingNaming } from './lessons/branding-naming.js'
import { LESSONS as brandingConcept } from './lessons/branding-concept.js'
import { LESSONS as brandingLogo } from './lessons/branding-logo.js'
import { LESSONS as brandingColors } from './lessons/branding-colors.js'
import { LESSONS as brandingTypography } from './lessons/branding-typography.js'
import { LESSONS as brandingVisualIdentity } from './lessons/branding-visual-identity.js'
import { LESSONS as brandingVoice } from './lessons/branding-voice.js'
import { LESSONS as brandingMedia } from './lessons/branding-media.js'
import { LESSONS as brandingGuidelines } from './lessons/branding-guidelines.js'
import { LESSONS as brandingPresentation } from './lessons/branding-presentation.js'
import { LESSONS as brandingProcess } from './lessons/branding-process.js'
import { LESSONS as brandingPortfolio } from './lessons/branding-portfolio.js'
import { LESSONS as motionBasics } from './lessons/motion-basics.js'
import { LESSONS as motionBasics2 } from './lessons/motion-basics-2.js'
import { LESSONS as motionInterfaceTools } from './lessons/motion-interface-tools.js'
import { LESSONS as motionPrinciples } from './lessons/motion-principles.js'
import { LESSONS as motionTimingEasing } from './lessons/motion-timing-easing.js'
import { LESSONS as motionTimingEasing2 } from './lessons/motion-timing-easing-2.js'
import { LESSONS as motionKeyframesPractice } from './lessons/motion-keyframes-practice.js'
import { LESSONS as motionUi } from './lessons/motion-ui.js'
import { LESSONS as motionUi2 } from './lessons/motion-ui-2.js'
import { LESSONS as motionTypography } from './lessons/motion-typography.js'
import { LESSONS as motionTypography2 } from './lessons/motion-typography-2.js'
import { LESSONS as motionShapeLogo } from './lessons/motion-shape-logo.js'
import { LESSONS as motionShapeLogo2 } from './lessons/motion-shape-logo-2.js'
import { LESSONS as motionMasksComposition } from './lessons/motion-masks-composition.js'
import { LESSONS as motionEffects } from './lessons/motion-effects.js'
import { LESSONS as motionLogoAnimation } from './lessons/motion-logo-animation.js'
import { LESSONS as motionStoryboard } from './lessons/motion-storyboard.js'
import { LESSONS as motionStoryboard2 } from './lessons/motion-storyboard-2.js'
import { LESSONS as motionAdsSocial } from './lessons/motion-ads-social.js'
import { LESSONS as motionSound } from './lessons/motion-sound.js'
import { LESSONS as motionSound2 } from './lessons/motion-sound-2.js'
import { LESSONS as motionToolsExport } from './lessons/motion-tools-export.js'
import { LESSONS as motionToolsExport2 } from './lessons/motion-tools-export-2.js'
import { LESSONS as motionProcess } from './lessons/motion-process.js'
import { LESSONS as motionPortfolio } from './lessons/motion-portfolio.js'
import { LESSONS as motionPortfolio2 } from './lessons/motion-portfolio-2.js'
import { LESSONS as uxDesignBasics } from './lessons/ux-basics.js'
import { LESSONS as uxDesignResearch } from './lessons/ux-research.js'
import { LESSONS as uxDesignAnalysis } from './lessons/ux-analysis.js'
import { LESSONS as uxDesignProblem } from './lessons/ux-problem.js'
import { LESSONS as uxDesignPersona } from './lessons/ux-persona.js'
import { LESSONS as uxDesignJourney } from './lessons/ux-journey.js'
import { LESSONS as uxDesignIa } from './lessons/ux-ia.js'
import { LESSONS as uxDesignFlow } from './lessons/ux-flow.js'
import { LESSONS as uxDesignWireframe } from './lessons/ux-wireframe.js'
import { LESSONS as uxDesignPrototype } from './lessons/ux-prototype.js'
import { LESSONS as uxDesignTesting } from './lessons/ux-testing.js'
import { LESSONS as uxDesignIteration } from './lessons/ux-iteration.js'
import { LESSONS as uxDesignCasePortfolio } from './lessons/ux-case-portfolio.js'
import { LESSONS as gameArtBasics } from './lessons/game-art-basics.js'
import { LESSONS as gameArt2dDigital } from './lessons/game-art-2d-digital.js'
import { LESSONS as gameArtPixelArt } from './lessons/game-art-pixel-art.js'
import { LESSONS as gameArtConceptCharacter } from './lessons/game-art-concept-character.js'
import { LESSONS as gameArt3dModeling } from './lessons/game-art-3d-modeling.js'
import { LESSONS as gameArtUvTexturing } from './lessons/game-art-uv-texturing.js'
import { LESSONS as gameArtEnvironment } from './lessons/game-art-environment.js'
import { LESSONS as gameArtAnimationVfx } from './lessons/game-art-animation-vfx.js'
import { LESSONS as gameArtPipeline } from './lessons/game-art-pipeline.js'
import { LESSONS as gameArtEngines } from './lessons/game-art-engines.js'
import { LESSONS as gameArtPortfolio } from './lessons/game-art-portfolio.js'
import { LESSONS as logoBasics } from './lessons/logo-basics.js'
import { LESSONS as logoResearchBrief } from './lessons/logo-research-brief.js'
import { LESSONS as logoTypography } from './lessons/logo-typography.js'
import { LESSONS as logoMarksSymbols } from './lessons/logo-marks-symbols.js'
import { LESSONS as logoGeometry } from './lessons/logo-geometry.js'
import { LESSONS as logoColor } from './lessons/logo-color.js'
import { LESSONS as logoNegativeSpace } from './lessons/logo-negative-space.js'
import { LESSONS as logoVariations } from './lessons/logo-variations.js'
import { LESSONS as logoMonochrome } from './lessons/logo-monochrome.js'

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
  ...uiFinalProject,
  ...gameDesignBasics,
  ...gameDesignProcess,
  ...coreLoopMechanics,
  ...rulesSystemsDesign,
  ...playerPsychology,
  ...gameBalance,
  ...difficultyProgression,
  ...levelDesignFundamentals,
  ...gameGenresConventions,
  ...narrativeDesign,
  ...gameEconomy,
  ...multiplayerSocialDesign,
  ...monetizationF2p,
  ...hudIngameUi,
  ...gameMenusNavigation,
  ...gameAccessibility,
  ...gameDesignDocumentation,
  ...gamePrototyping,
  ...playtestingIteration,
  ...gameFeelJuice,
  ...levelDesignPractice,
  ...crossPlatformGameDesign,
  ...gameDesignerCareer,
  ...gameDesignPortfolioFinal,
  ...graphicDesignBasics,
  ...graphicComposition,
  ...graphicColor,
  ...graphicTypography,
  ...graphicShapes,
  ...graphicImages,
  ...graphicPosters,
  ...graphicSocialMedia,
  ...graphicLogos,
  ...graphicVector,
  ...graphicPrint,
  ...graphicPackaging,
  ...graphicInfographics,
  ...graphicProcess,
  ...graphicPortfolio,
  ...brandingBasics,
  ...brandingBriefResearch,
  ...brandingStrategy,
  ...brandingNaming,
  ...brandingConcept,
  ...brandingLogo,
  ...brandingColors,
  ...brandingTypography,
  ...brandingVisualIdentity,
  ...brandingVoice,
  ...brandingMedia,
  ...brandingGuidelines,
  ...brandingPresentation,
  ...brandingProcess,
  ...brandingPortfolio,
  ...motionBasics,
  ...motionBasics2,
  ...motionInterfaceTools,
  ...motionPrinciples,
  ...motionTimingEasing,
  ...motionTimingEasing2,
  ...motionKeyframesPractice,
  ...motionUi,
  ...motionUi2,
  ...motionTypography,
  ...motionTypography2,
  ...motionShapeLogo,
  ...motionShapeLogo2,
  ...motionMasksComposition,
  ...motionEffects,
  ...motionLogoAnimation,
  ...motionStoryboard,
  ...motionStoryboard2,
  ...motionAdsSocial,
  ...motionSound,
  ...motionSound2,
  ...motionToolsExport,
  ...motionToolsExport2,
  ...motionProcess,
  ...motionPortfolio,
  ...motionPortfolio2,
  ...uxDesignBasics,
  ...uxDesignResearch,
  ...uxDesignAnalysis,
  ...uxDesignProblem,
  ...uxDesignPersona,
  ...uxDesignJourney,
  ...uxDesignIa,
  ...uxDesignFlow,
  ...uxDesignWireframe,
  ...uxDesignPrototype,
  ...uxDesignTesting,
  ...uxDesignIteration,
  ...uxDesignCasePortfolio,
  ...gameArtBasics,
  ...gameArt2dDigital,
  ...gameArtPixelArt,
  ...gameArtConceptCharacter,
  ...gameArt3dModeling,
  ...gameArtUvTexturing,
  ...gameArtEnvironment,
  ...gameArtAnimationVfx,
  ...gameArtPipeline,
  ...gameArtEngines,
  ...gameArtPortfolio,
  ...logoBasics,
  ...logoResearchBrief,
  ...logoTypography,
  ...logoMarksSymbols,
  ...logoGeometry,
  ...logoColor,
  ...logoNegativeSpace,
  ...logoVariations,
  ...logoMonochrome,
]

export function getModule(id) {
  return MODULES.find((m) => m.id === Number(id))
}
