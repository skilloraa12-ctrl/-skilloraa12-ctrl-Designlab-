import { useState, useRef, useEffect } from 'react'
import { synthesizeSpeechWav } from './piperTts.js'

// Той самий захист, що й у mentorFeedback.js: мережевий збій під час
// завантаження голосової моделі іноді не відхиляється з помилкою, а просто
// зависає без відповіді — звичайний try/catch це не ловить. Обмежуємо
// таймаутом, щоб огляд не застряг на "завантажую" назавжди.
function withTimeout(promise, ms = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут озвучення')), ms)),
  ])
}

// Ключові слова сцени визначають, ЯКА картинка малюється — щоб урок
// запам'ятовувався не лише на слух/читанням, а й візуально: коли йдеться
// про кнопку, на екрані кнопка; коли про зображення — іконка картинки;
// коли про колір — палітра; коли про домен/адресу — рядок браузера. Не
// просто одна й та сама картинка сайту на всі сцени поспіль.
const FOCUS_RULES = [
  // Поняття, специфічні для App Design (мобільний дизайн), перевіряються
  // ПЕРШИМИ — вони вужчі й конкретніші за старі вебо-орієнтовані слова
  // нижче (напр. "навігаційна архітектура" не повинно впасти в "header"
  // лише тому, що там теж є "навігац", а "cross-platform" не повинно
  // впасти в "form" через те, що "платформа" містить підрядок "форм").
  { id: 'api-client-server', words: ['api', 'client', 'клієнт (застосунок)', 'запит', 'response', 'офлайн-кеш', 'json'] },
  { id: 'app-type', words: ['native app', 'cross-platform', 'hybrid app', 'pwa', 'нативний застосунок', 'типи застосунків'] },
  { id: 'screen-type', words: ['onboarding', 'типи екранів', 'empty state', 'detail screen', 'login / sign up', 'profile / settings'] },
  { id: 'navigation', words: ['tab-bar', 'таб-бар', 'навігаційна архітектура', 'navigation architecture', 'схеми навігації', 'stack-based', 'drawer navigation', 'modal flow'] },
  { id: 'process-stages', words: ['етапи створення застосунку', 'app store submission', 'brief (бриф)', 'research (дослідження)'] },
  { id: 'role-handoff', words: ['app designer: роль', 'ux designer', 'ios developer', 'android developer', 'cross-platform developer'] },
  { id: 'dev-layers', words: ['ui layer', 'logic layer', 'data layer', 'swiftui', 'jetpack compose', 'react native', 'flutter'] },
  { id: 'safe-area', words: ['safe area', 'безпечна зона', 'виїмка камери', 'dynamic island', 'home indicator', 'заокруглені кути корпусу'] },
  { id: 'screen-structure', words: ['screen structure', 'структура екрана', 'ієрархію екранів', 'рівня навігації', 'своя власна версія app bar'] },
  { id: 'checkbox-radio', words: ['checkbox', 'чекбокс', 'radio button', 'радіокнопка', 'indeterminate'] },
  { id: 'picker', words: ['picker', 'пікер', 'scroll wheel', 'колесо прокрутки'] },
  { id: 'bottom-sheet', words: ['bottom sheet', 'нижня панель', 'drag-to-dismiss'] },
  { id: 'ui-states-screen', words: ['ui states', 'стани інтерфейсу', 'skeleton screen', 'offline-стан', 'success-стан', 'offline стани'] },
  { id: 'design-system-component', words: ['майстер-компонент', 'майстер-елемент', 'master component', 'variant', 'component library', 'бібліотека компонентів', 'sub-layers', 'component anatomy', 'анатомія компонента', 'component properties', 'властивості компонента'] },
  { id: 'motion-transition', words: ['motion design', 'моушн-дизайн', 'animation principles', 'принципи анімації', 'easing', 'anticipation', 'screen transitions', 'переходи між екранами', 'push/pop', 'modal presentation'] },
  { id: 'haptic-feedback', words: ['haptic', 'тактильний відгук', 'light impact', 'heavy impact', 'notification feedback'] },
  { id: 'microinteraction-motion', words: ['microinteraction', 'мікровзаємод', 'pull-to-refresh', 'gesture animation', 'анімації жестів', 'scroll animation', 'parallax', 'sticky header'] },
  { id: 'figma-tool-ui', words: ['layers panel', 'design panel', 'assets panel', 'export panel', 'canvas', 'main component', 'toolbar', 'figma interface', 'frame — контейнер', 'group (ctrl', 'не обтинає вміст', 'назвами за замовчуванням', 'проєкт із файлом'] },
  { id: 'figma-prototype-ui', words: ['connection', 'interactions панель', 'prototype mode', 'navigate to', 'open overlay', 'swap overlay', 'close overlay', 'set variable', 'gesture triggers', 'interactive components'] },
  { id: 'git-collab', words: ['pull request', 'система контролю версій', 'git-репозитор', 'github —'] },
  { id: 'store-submission', words: ['app store review', 'google play console', 'app store (apple)', 'google play (android)'] },
  { id: 'trust-verification', words: ['ставкою довіри', 'kyc', 'грошову транзакцію', 'грошова транзакці', 'біометричн'] },
  { id: 'content-carousel', words: ['горизонтальних каруселей', 'горизонтальну карусель', 'продовжити перегляд', 'resume'] },
  { id: 'streak-progress', words: ['streak', 'серію днів', 'прогрес-бар курсу', 'графік динаміки'] },
  { id: 'live-order-tracking', words: ['order tracking', 'відстеження замовлення', 'курʼєр'] },
  { id: 'portfolio-device-frame', words: ['device frame', 'силует телефону', 'силуеті телефону'] },
  { id: 'portfolio-file-prep', words: ['чернетковий простір', 'самостійна презентація', '«presentation»', '«overview»'] },
  { id: 'handoff-showcase', words: ['навику developer handoff', 'навику handoff', 'акуратно названих шарів'] },
  { id: 'ui-signifier', words: ['signifier', 'сигніфікатор'] },
  { id: 'ui-feedback', words: ['feedback'] },
  { id: 'ui-mapping', words: ['mapping', 'напрямком дії', 'напрямку руху контролу'] },
  { id: 'fitts-law', words: ['fitts', 'закон фіттса', 'закону фіттса'] },
  { id: 'hicks-law', words: ['hick', 'закон хіка', 'закону хіка'] },
  { id: 'ui-discoverability', words: ['discoverability', 'здатність до виявлення'] },
  { id: 'gestalt-common-fate', words: ['common fate', 'спільна доля', 'спільну долю'] },
  { id: 'gestalt-continuity', words: ['continuity', 'вирівняної осі', 'уявній осі'] },
  { id: 'gestalt-proximity', words: ['proximity'] },
  { id: 'gestalt-perceptual-hierarchy', words: ['perceptual hierarchy', 'перцептивна ієрархія', 'перцептивної ієрархії'] },
  { id: 'cognitive-load-types', words: ['cognitive load', 'intrinsic', 'extraneous'] },
  { id: 'cognitive-bias-ui', words: ['cognitive bias', 'когнітивні викривлення', 'якірний ефект', 'anchoring'] },
  { id: 'peak-end-rule', words: ['peak-end', 'правило піку'] },
  { id: 'ia-structure-tree', words: ['information architecture', 'ia передує', 'категорії, ієрархія'] },
  { id: 'nav-model-diagram', words: ['ієрархічна модель', 'матрична модель', 'лінійна модель', 'мережева модель', 'navigation model'] },
  { id: 'taxonomy-tags', words: ['taxonomy', 'таксономі'] },
  { id: 'card-sorting-grouping', words: ['card sorting'] },
  { id: 'findability-search', words: ['findability', 'знаходжуваність'] },
  { id: 'sitemap-diagram', words: ['site map', 'карта сайту', 'карта продукту'] },
  { id: 'labeling-tag', words: ['labeling system', 'системи найменування'] },
  { id: 'mega-menu-columns', words: ['mega menu', 'мега-меню'] },
  { id: 'command-palette-search', words: ['command palette', 'командна палітра', 'fuzzy search'] },
  { id: 'global-search-results', words: ['global search', 'глобальний пошук'] },
  { id: 'breadcrumb-attribute', words: ['attribute-based', 'location-based'] },
  { id: 'scrollable-tabs', words: ['scrollable tabs', 'активна вкладка'] },
  { id: 'nav-hierarchy-levels', words: ['primary navigation', 'secondary navigation', 'tertiary navigation', 'navigation hierarchy'] },
  { id: 'table-filter-chips', words: ['filtering у таблиці', 'активних фільтрів'] },
  { id: 'table-sort-indicator', words: ['sorting', 'без сортування', 'активного сортування'] },
  { id: 'table-bulk-select', words: ['bulk actions', 'масові дії'] },
  { id: 'table-inline-edit', words: ['inline editing'] },
  { id: 'table-pagination', words: ['pagination', 'infinite scroll'] },
  { id: 'table-responsive-card', words: ['responsive tables', 'card transformation', 'column priority'] },
  { id: 'faceted-search-counts', words: ['faceted search', 'фасетний пошук', 'лічильник доступних результатів', 'опцією фасету'] },
  { id: 'saved-filters-list', words: ['saved filters', 'збережені фільтри', 'збережений фільтр'] },
  { id: 'conditional-field-toggle', words: ['conditional fields', 'умовні поля', 'умовне поле', 'умовного поля'] },
  { id: 'autosave-indicator', words: ['autosave', 'автозбереження'] },
  { id: 'error-recovery-message', words: ['error recovery', 'відновлення після помилки'] },
  { id: 'inline-validation-state', words: ['inline validation', 'валідація на кожну'] },
  { id: 'chart-type-selector', words: ['тип графіка', 'типу графіка', 'line chart', 'bar chart'] },
  { id: 'hero-metric-emphasis', words: ['hero metric', 'головна метрика', 'найважливіша метрика', 'найважливішу метрику'] },
  { id: 'kpi-trend-comparison', words: ['без порівняння з попереднім періодом'] },
  { id: 'data-ink-chartjunk', words: ['chartjunk', 'data-ink'] },
  { id: 'dashboard-empty-canvas', words: ['порожній дашборд', 'drag-and-drop rearrangement'] },
  { id: 'realtime-live-indicator', words: ['real-time data', 'timestamp'] },
  { id: 'toast-notification', words: ['toast —', 'toast-сповіщення'] },
  { id: 'banner-persistent', words: ['banner —', 'кілька banner одночасно'] },
  { id: 'alerts-severity-levels', words: ['alerts hierarchy', 'не кричати вовк'] },
  { id: 'badge-count-indicator', words: ['badge —', 'number badge', 'не прибирають чи не оновлюють badge'] },
  { id: 'error-message-specificity', words: ['якісне повідомлення про помилку', 'щось пішло не так'] },
  { id: 'perceived-performance-loading', words: ['perceived performance', 'сприйнята швидкість', 'flash of loading state'] },
  { id: 'confirmation-dialog-pattern', words: ['confirmation pattern', 'клацати двічі', 'confirmation fatigue'] },
  { id: 'coachmark-spotlight-overlay', words: ['coachmark', 'spotlight/dimming'] },
  { id: 'onboarding-tooltip-badge', words: ['навчальний tooltip', 'educational tooltip'] },
  { id: 'progressive-disclosure-tiers', words: ['progressive disclosure в онбордингу', 'front-loading'] },
  { id: 'demo-content-preview', words: ['демонстраційна картка'] },
  { id: 'feature-discovery-badge', words: ['feature discovery', 'new» badge'] },
  { id: 'checklist-progress-steps', words: ['ефект зейгарник'] },
  { id: 'product-tour-steps', words: ['product tour', 'пропустити тур'] },
  { id: 'permission-gated-element', words: ['permissions ui', 'show-disabled', 'системної логіки вибору підходу'] },
  { id: 'role-permission-matrix', words: ['permission matrix', 'roles & access', 'custom-ролі', 'матрицю ролей'] },
  { id: 'settings-sidebar-nav', words: ['settings architecture', 'organization settings', 'organization-рівня', 'бічне дерево категорій'] },
  { id: 'admin-panel-table', words: ['admin panel'] },
  { id: 'workspace-switcher', words: ['workspace switcher', 'multi-tenant ui', 'робочий простір недостатньо візуально виразним'] },
  { id: 'bulk-progress-async', words: ['bulk operations ui', 'partial failure', 'фонової асинхронної обробки'] },
  { id: 'density-toggle-enterprise', words: ['enterprise data density', 'user-configurable density', 'тим самим рівнем просторості'] },
  { id: 'roach-motel-trap', words: ['roach motel'] },
  { id: 'forced-continuity-billing', words: ['forced continuity', 'автоматичним списанням'] },
  { id: 'hidden-costs-checkout', words: ['hidden costs', 'базову» ціну товару'] },
  { id: 'ethical-design-balance', words: ['етичний ui design', 'friction symmetry'] },
  { id: 'plain-explanation-test', words: ['тест прямого пояснення', 'plain explanation test'] },
  { id: 'microcopy-word-choice', words: ['мікрокопі'] },
  { id: 'button-text-verb-first', words: ['verb-first'] },
  { id: 'error-tone-neutral', words: ['звинувачувальний тон', 'системний жаргон напряму'] },
  { id: 'voice-tone-shift', words: ['voice (базова особистість бренду)', 'голос не зникає, тон зсувається'] },
  { id: 'onboarding-benefit-first', words: ['технічний механізм функції замість'] },
  { id: 'confirmation-copy-specific', words: ['узагальнене «підтвердити» на кнопці дії'] },
  { id: 'nielsen-heuristics-list', words: ['nielsen', 'евристик'] },
  { id: 'independent-reviewers-severity', words: ['heuristic evaluation', 'рейтинг серйозності'] },
  { id: 'feedback-sandwich-sbi', words: ['situation-behavior-impact', 'i like, i wish, what if'] },
  { id: 'self-review-checklist-items', words: ['self-review checklist', 'сліпа зона автора'] },
  { id: 'reviewer-rotation-gate', words: ['ротація рецензентів', 'peer review'] },
  { id: 'menu-bar-completeness', words: ['menu bar'] },
  { id: 'multi-window-doc-utility', words: ['multi-window ui', 'document windows'] },
  { id: 'sacred-shortcuts-lock', words: ['священні» скорочення', 'священне» скорочення'] },
  { id: 'unsaved-changes-indicator', words: ['незбережених змін'] },
  { id: 'native-vs-custom-control', words: ['native control —', 'native controls'] },
  { id: 'voice-ui-conversation', words: ['voice ui'] },
  { id: 'kiosk-public-terminal', words: ['kiosk ui', 'auto-reset to idle'] },
  { id: 'tabletop-orientation', words: ['large display ui', 'інтерактивний стіл'] },
  { id: 'continue-where-left-off', words: ['продовжити з того місця', 'continue where you left off'] },
  { id: 'aria-attribute-widget', words: ['accessible rich internet applications', 'aria не змінює', 'три категорії атрибутів', 'role="button"'] },
  { id: 'roving-tabindex-widget', words: ['roving tabindex', 'композитного віджета окремо фокусованим'] },
  { id: 'table-header-scope', words: ['th scope', 'доступна структура таблиці даних'] },
  { id: 'dialog-aria-modal', words: ['role="dialog"', 'aria-modal', 'доступна реалізація модального вікна', 'aria-labelledby чи aria-label'] },
  { id: 'keyboard-trap-bug', words: ['keyboard trap (wcag', 'preventdefault() на події tab'] },
  { id: 'design-system-steward', words: ['governance дизайн-системи', 'розпорядник» (steward)'] },
  { id: 'token-tier-structure', words: ['мапування на нижчому рівні', 'примітивні токени (сирі'] },
  { id: 'contribution-pr-model', words: ['contribution model —'] },
  { id: 'changelog-migration', words: ['людиночитний changelog', 'без збільшення major-версії'] },
  { id: 'component-docs-example', words: ['якісна документація компонента поєднує', 'без одночасно готової докум'] },
  { id: 'coverage-usage-metrics', words: ['adoption metrics —', 'design system coverage'] },
  { id: 'five-second-glance', words: ['цінний для hero-секцій', 'замінник повноцінного юзабіліті-тестування'] },
  { id: 'first-click-heatmap', words: ['правильний перший клік значно'] },
  { id: 'test-script-intro', words: ['usability test script —'] },
  { id: 'moderated-live-session', words: ['критичний компроміс moderated', 'обирають moderated-тестування'] },
  { id: 'affinity-theme-clusters', words: ['synthesizing findings —', 'універсальний патерн (проблема в кількох'] },
  { id: 'ab-test-split-traffic', words: ['a/b-тестування принципово', 'a/b-тест випадково розподіляє', 'a/b-тест відповідає на', 'завершують a/b-тест занадто рано'] },
  { id: 'ui-process-audit', words: ['процес роботи над складним ui', 'без попереднього аудиту реаль'] },
  { id: 'edge-case-demo', words: ['граничних випадків (10 000 записів'] },
  { id: 'enterprise-case-audience', words: ['enterprise/saas-кейс у портфоліо', 'рецензент enterprise/saas-кейсу', 'релевантні метрики enterprise-кейсу'] },
  { id: 'complex-ui-walkthrough', words: ['презентація складного ui вимагає', 'рецензент складного ui-кейсу', 'представляють складний ui-проєкт як простий лінійний наратив'] },
  { id: 'capstone-realistic-domain', words: ['конкретний реалістичний домен'] },
  { id: 'capstone-happy-path-gap', words: ['щасливим шляхом'] },
  { id: 'capstone-design-system-scope', words: ['ui-орієнтованої дизайн-системи', 'композитний віджет'] },
  { id: 'capstone-full-integration', words: ['усіх 24 підкатегорій', 'обов’язкова структура:'] },
  { id: 'capstone-disjointed-screens', words: ['неузгоджених екранів'] },
  { id: 'game-design-discipline', words: ['дисципліна проєктування правил', 'проєктує правила, механіки', 'інший предмет роботи, ніж', 'ототожнюють game design виключно'] },
  { id: 'game-roles-split', words: ['узагальнена назва ролі', 'level designer проєктує конкретний простір', 'компонують рівень інтуїтивно'] },
  { id: 'game-toy-puzzle-game', words: ['три терміни часто плутають', 'toy — система без заданої мети', 'puzzle має фіксовану мету', 'називають «грою» будь-яку інтерактивну'] },
  { id: 'game-key-questions', words: ['перш ніж малювати рівень чи писати документ', 'перше питання завжди про гравця', 'центральна дія гри (ядро) має бути цікавою'] },
  { id: 'game-design-vs-dev', words: ['суміжні, але окремі дисципліни', 'технічна реалізація (програмування, рушій', 'вважають, що game designer обов’язково має вміти'] },
  { id: 'game-ideation-divergent', words: ['головна пастка — плутати «думку» з «концепцією»', 'концепція (жанр + центральна дія + мета) — не одне й те саме', 'дивергентний етап (багато варіантів без критики'] },
  { id: 'game-playtest-silent', words: ['плейтест — перевірка на людях, які не автор гри', 'головне правило — мовчати під час сесії', 'підказують гравцю під час сесії замість того'] },
  { id: 'game-pitch-hook', words: ['пітч відповідає: що гравець робить (ядро)', 'починають пітч з опису сетингу чи сюжету'] },
  { id: 'game-scope-jam-studio', words: ['на джемі одна доведена механіка завжди краще', 'планують на джем кілька механік одночасно'] },
  { id: 'button', words: ['кнопк', 'cta', 'заклик до дії', 'натисн'] },
  { id: 'image', words: ['зображен', 'картинк', 'фото', 'ілюстрац', 'іконк'] },
  { id: 'color', words: ['колір', 'кольор', 'палітр', 'контраст', 'відтінок'] },
  { id: 'typography', words: ['шрифт', 'типограф', 'текст', 'абзац', 'заголовок тексту'] },
  { id: 'header', words: ['шапк', 'header', 'логотип', 'навігац', 'меню'] },
  { id: 'footer', words: ['підвал', 'footer', 'контакти сайту'] },
  { id: 'form', words: ['форм', 'поле вводу', 'реєстрац', 'підписк'] },
  { id: 'layout', words: ['макет', 'композиц', 'сітк', 'grid', 'вирівнюван', 'відступ'] },
  { id: 'wireframe', words: ['wireframe', 'прототип', 'скелет сторінки'] },
]

function detectFocus(text, level) {
  const norm = (text || '').toLowerCase()
  for (const rule of FOCUS_RULES) {
    if (rule.words.some((w) => norm.includes(w))) return rule.id
  }
  // Запасний варіант теж має відповідати напрямку: загальний макет сайту
  // доречний лише для Web Design, для App Design — нейтральна картинка
  // екрана застосунку (status bar + контент + таб-бар), для Game Design —
  // ігровий вʼюпорт з HUD, а не сайт чи застосунок.
  if (level === 'app-design') return 'app-shell'
  if (level === 'game-design') return 'game-hud'
  return 'site'
}

// Короткий (~15с) анімований огляд уроку — БЕЗ жодного платного відео-API.
// Замість того, щоб генерувати й хостити окремий AI-відеофайл на кожен із
// 254 уроків вручну (дорого, впирається в ліміти, не масштабується),
// "ролик" збирається з уже наявних даних уроку (title/theory/keyPoints/
// mistakes) і озвучується вже вбудованим у сайт безкоштовним голосом
// (Piper TTS, той самий, що й кнопка «Прослухати теорію»). Працює
// однаково для будь-якого уроку без жодної ручної роботи.
function buildScenes(module) {
  const scenes = []
  const hook = (module.theory || '').match(/^.+?[.!?](?=\s|$)/)
  const hookText = hook ? hook[0].trim() : module.title
  scenes.push({ kind: 'intro', caption: hookText, focus: detectFocus(hookText + ' ' + module.title, module.level) })
  for (const kp of (module.keyPoints || []).slice(0, 2)) {
    scenes.push({ kind: 'point', caption: kp, focus: detectFocus(kp, module.level) })
  }
  if (module.mistakes && module.mistakes[0]) {
    scenes.push({ kind: 'mistake', caption: module.mistakes[0], focus: detectFocus(module.mistakes[0], module.level) })
  }
  return scenes
}

function Frame({ alert, children }) {
  return (
    <svg viewBox="0 0 200 260" className="lesson-reel-mockup">
      <rect x="10" y="10" width="180" height="240" rx="10" fill="#1c1c22" stroke="#3a3a44" />
      <rect x="10" y="10" width="180" height="26" rx="10" fill="#26262e" />
      <circle cx="24" cy="23" r="4" fill="#e0523e" />
      <circle cx="38" cy="23" r="4" fill="#c8912b" />
      <circle cx="52" cy="23" r="4" fill="#2fa36b" />
      <rect x="66" y="18" width="100" height="10" rx="5" fill="#3a3a44" />
      {children}
    </svg>
  )
}

function BrowserMockup({ focus, alert }) {
  const accent = alert ? '#e0523e' : '#2fa36b'

  if (focus === 'button') {
    return (
      <Frame>
        <rect x="20" y="60" width="160" height="70" rx="4" fill="#2a2a34" />
        <rect x="55" y="150" width="90" height="38" rx="19" fill={accent} />
        <text x="72" y="174" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#17171a">Кнопка</text>
      </Frame>
    )
  }
  if (focus === 'image') {
    return (
      <Frame>
        <rect x="30" y="58" width="140" height="110" rx="6" fill="#2a2a34" stroke="#3a3a44" />
        <circle cx="62" cy="88" r="10" fill="#c8912b" />
        <path d="M 40 153 L 80 108 L 105 133 L 130 98 L 160 153 Z" fill="#3a3a44" />
        <rect x="55" y="186" width="90" height="10" rx="5" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'color') {
    return (
      <Frame>
        <rect x="20" y="56" width="35" height="120" rx="4" fill="#3e37e0" />
        <rect x="58" y="56" width="35" height="120" rx="4" fill="#e0523e" />
        <rect x="96" y="56" width="35" height="120" rx="4" fill="#c8912b" />
        <rect x="134" y="56" width="35" height="120" rx="4" fill="#2fa36b" />
        <rect x="20" y="186" width="160" height="10" rx="5" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'typography') {
    return (
      <Frame>
        <text x="30" y="80" fontFamily="serif" fontSize="34" fontWeight="bold" fill="#e8e8ec">Aa</text>
        <rect x="30" y="98" width="130" height="8" rx="4" fill="#5a5a66" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="30" y={118 + i * 16} width={140 - i * 18} height="7" rx="3.5" fill="#3a3a44" />
        ))}
      </Frame>
    )
  }
  if (focus === 'header') {
    return (
      <Frame>
        <rect x="20" y="46" width="160" height="30" rx="4" fill={accent} opacity="0.9" />
        <circle cx="35" cy="61" r="7" fill="#17171a" />
        <rect x="120" y="55" width="16" height="6" rx="3" fill="#17171a" />
        <rect x="140" y="55" width="16" height="6" rx="3" fill="#17171a" />
        <rect x="160" y="55" width="12" height="6" rx="3" fill="#17171a" />
        <rect x="20" y="86" width="160" height="80" rx="4" fill="#2a2a34" opacity="0.6" />
      </Frame>
    )
  }
  if (focus === 'footer') {
    return (
      <Frame>
        <rect x="20" y="50" width="160" height="120" rx="4" fill="#2a2a34" opacity="0.4" />
        <rect x="20" y="182" width="160" height="40" rx="4" fill={accent} opacity="0.85" />
        <circle cx="45" cy="202" r="6" fill="#17171a" />
        <circle cx="65" cy="202" r="6" fill="#17171a" />
        <circle cx="85" cy="202" r="6" fill="#17171a" />
      </Frame>
    )
  }
  if (focus === 'form') {
    return (
      <Frame>
        <rect x="30" y="54" width="140" height="22" rx="4" fill="#2a2a34" stroke="#3a3a44" />
        <rect x="30" y="84" width="140" height="22" rx="4" fill="#2a2a34" stroke="#3a3a44" />
        <rect x="65" y="120" width="70" height="26" rx="13" fill={accent} />
        <text x="80" y="137" fontFamily="sans-serif" fontSize="9" fontWeight="bold" fill="#17171a">Готово</text>
      </Frame>
    )
  }
  if (focus === 'layout') {
    return (
      <Frame>
        <rect x="20" y="50" width="160" height="26" rx="3" fill="#2a2a34" />
        <rect x="20" y="82" width="48" height="90" rx="3" fill="#2a2a34" />
        <rect x="74" y="82" width="48" height="90" rx="3" fill={accent} opacity="0.85" />
        <rect x="128" y="82" width="52" height="90" rx="3" fill="#2a2a34" />
        <rect x="20" y="178" width="160" height="16" rx="3" fill="#2a2a34" />
      </Frame>
    )
  }
  if (focus === 'wireframe') {
    return (
      <Frame>
        <rect x="20" y="46" width="160" height="150" rx="4" fill="none" stroke="#5a5a66" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x="32" y="58" width="60" height="10" rx="2" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
        <rect x="32" y="80" width="136" height="50" rx="2" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
        <rect x="32" y="140" width="65" height="40" rx="2" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
        <rect x="103" y="140" width="65" height="40" rx="2" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
      </Frame>
    )
  }
  if (focus === 'api-client-server') {
    return (
      <Frame>
        <rect x="22" y="80" width="56" height="50" rx="6" fill="#2a2a34" stroke="#3a3a44" />
        <text x="30" y="109" fontFamily="sans-serif" fontSize="9" fill="#e8e8ec">Client</text>
        <rect x="122" y="80" width="56" height="50" rx="6" fill="#2a2a34" stroke="#3a3a44" />
        <text x="130" y="109" fontFamily="sans-serif" fontSize="9" fill="#e8e8ec">Server</text>
        <path d="M 80 96 L 120 96" stroke={accent} strokeWidth="2.5" />
        <path d="M 114 90 L 122 96 L 114 102" fill="none" stroke={accent} strokeWidth="2.5" />
        <text x="84" y="92" fontFamily="sans-serif" fontSize="7" fill={accent}>request</text>
        <path d="M 120 118 L 80 118" stroke="#8a8a9a" strokeWidth="2" />
        <path d="M 86 112 L 80 118 L 86 124" fill="none" stroke="#8a8a9a" strokeWidth="2" />
        <text x="84" y="134" fontFamily="sans-serif" fontSize="7" fill="#8a8a9a">response: JSON</text>
      </Frame>
    )
  }
  if (focus === 'app-type') {
    return (
      <Frame>
        {['Native', 'Cross-platform', 'Hybrid', 'PWA'].map((label, i) => (
          <g key={label}>
            <rect x={20 + (i % 2) * 80} y={50 + Math.floor(i / 2) * 70} width="70" height="56" rx="6" fill="#2a2a34" stroke={i === 0 ? accent : '#3a3a44'} strokeWidth={i === 0 ? 2 : 1.5} />
            <text x={28 + (i % 2) * 80} y={78 + Math.floor(i / 2) * 70} fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#e8e8ec">{label}</text>
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'screen-type') {
    return (
      <Frame>
        <rect x="20" y="50" width="70" height="50" rx="6" fill="#2a2a34" />
        <text x="28" y="79" fontFamily="sans-serif" fontSize="8" fill="#8a8a9a">Onboarding</text>
        <rect x="100" y="50" width="70" height="50" rx="6" fill="#2a2a34" />
        <text x="110" y="79" fontFamily="sans-serif" fontSize="8" fill="#8a8a9a">Home</text>
        <rect x="20" y="112" width="70" height="50" rx="6" fill="#2a2a34" />
        <text x="28" y="141" fontFamily="sans-serif" fontSize="8" fill="#8a8a9a">Detail</text>
        <rect x="100" y="112" width="70" height="50" rx="6" fill="#2a2a34" opacity="0.5" />
        <text x="110" y="141" fontFamily="sans-serif" fontSize="8" fill="#8a8a9a">Empty</text>
      </Frame>
    )
  }
  if (focus === 'navigation') {
    return (
      <Frame>
        <rect x="20" y="46" width="160" height="110" rx="4" fill="#2a2a34" opacity="0.6" />
        <rect x="20" y="166" width="160" height="34" rx="6" fill="#26262e" />
        {[44, 100, 156].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="183" r="7" fill={i === 0 ? accent : '#3a3a44'} />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'process-stages') {
    return (
      <Frame>
        {['Brief', 'Research', 'Design', 'Dev', 'Launch'].map((label, i) => (
          <g key={label}>
            <circle cx={36 + i * 32} cy="100" r="12" fill={i === 4 ? accent : '#2a2a34'} stroke="#3a3a44" />
            {i < 4 && <path d={`M ${48 + i * 32} 100 L ${56 + i * 32} 100`} stroke="#5a5a66" strokeWidth="2" />}
            <text x={16 + i * 32} y="128" fontFamily="sans-serif" fontSize="6.5" fill="#8a8a9a">{label}</text>
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'role-handoff') {
    return (
      <Frame>
        <rect x="20" y="92" width="48" height="40" rx="6" fill="#2a2a34" stroke="#3a3a44" />
        <text x="26" y="115" fontFamily="sans-serif" fontSize="7" fill="#e8e8ec">UX</text>
        <path d="M 68 112 L 78 112" stroke={accent} strokeWidth="2" />
        <rect x="80" y="92" width="48" height="40" rx="6" fill="#2a2a34" stroke={accent} strokeWidth="2" />
        <text x="86" y="115" fontFamily="sans-serif" fontSize="7" fill="#e8e8ec">App Design</text>
        <path d="M 128 112 L 138 112" stroke={accent} strokeWidth="2" />
        <rect x="140" y="92" width="40" height="40" rx="6" fill="#2a2a34" stroke="#3a3a44" />
        <text x="144" y="115" fontFamily="sans-serif" fontSize="7" fill="#e8e8ec">iOS/Android</text>
      </Frame>
    )
  }
  if (focus === 'dev-layers') {
    return (
      <Frame>
        {['UI Layer', 'Logic Layer', 'Data Layer', 'Backend + DB'].map((label, i) => (
          <g key={label}>
            <rect x="24" y={52 + i * 34} width="152" height="26" rx="5" fill="#2a2a34" stroke={i === 0 ? accent : '#3a3a44'} />
            <text x="32" y={69 + i * 34} fontFamily="sans-serif" fontSize="8" fill="#e8e8ec">{label}</text>
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'safe-area') {
    return (
      <Frame>
        <rect x="20" y="44" width="160" height="156" rx="6" fill="#2a2a34" opacity="0.5" />
        <rect x="70" y="44" width="60" height="16" rx="8" fill="#17171a" />
        <rect x="20" y="44" width="160" height="156" rx="6" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="3 3" transform="translate(6,8) scale(0.94)" />
        <rect x="70" y="190" width="60" height="5" rx="2.5" fill={accent} />
        <text x="30" y="130" fontFamily="sans-serif" fontSize="8" fill="#8a8a9a">Safe Area</text>
      </Frame>
    )
  }
  if (focus === 'screen-structure') {
    return (
      <Frame>
        <rect x="20" y="46" width="160" height="24" rx="4" fill="#2a2a34" stroke={accent} strokeWidth="1.5" />
        <circle cx="34" cy="58" r="5" fill={accent} />
        <text x="46" y="62" fontFamily="sans-serif" fontSize="8" fill="#e8e8ec">Екран 2</text>
        <path d="M 180 90 L 20 90" stroke="#5a5a66" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="40" y="100" width="120" height="22" rx="4" fill="#26262e" opacity="0.7" />
        <text x="48" y="115" fontFamily="sans-serif" fontSize="7" fill="#8a8a9a">Екран 1 (попередній)</text>
        <rect x="20" y="138" width="160" height="40" rx="4" fill="#2a2a34" opacity="0.5" />
      </Frame>
    )
  }
  if (focus === 'checkbox-radio') {
    return (
      <Frame>
        <rect x="30" y="60" width="26" height="26" rx="5" fill={accent} />
        <path d="M 37 73 L 43 80 L 56 64" fill="none" stroke="#17171a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="80" y="60" width="90" height="10" rx="5" fill="#3a3a44" />
        <circle cx="43" cy="130" r="13" fill="none" stroke={accent} strokeWidth="3" />
        <circle cx="43" cy="130" r="6" fill={accent} />
        <rect x="80" y="124" width="90" height="10" rx="5" fill="#3a3a44" />
        <circle cx="43" cy="170" r="13" fill="none" stroke="#3a3a44" strokeWidth="3" />
        <rect x="80" y="164" width="70" height="10" rx="5" fill="#2a2a34" />
      </Frame>
    )
  }
  if (focus === 'picker') {
    return (
      <Frame>
        <rect x="55" y="92" width="90" height="36" rx="6" fill={accent} opacity="0.25" />
        <rect x="20" y="54" width="160" height="1.5" fill="#3a3a44" />
        <rect x="20" y="186" width="160" height="1.5" fill="#3a3a44" />
        <text x="72" y="72" fontFamily="sans-serif" fontSize="11" fill="#5a5a66">11</text>
        <text x="68" y="114" fontFamily="sans-serif" fontSize="15" fontWeight="bold" fill="#e8e8ec">12</text>
        <text x="72" y="156" fontFamily="sans-serif" fontSize="11" fill="#5a5a66">13</text>
        <text x="72" y="180" fontFamily="sans-serif" fontSize="9" fill="#3a3a44">14</text>
      </Frame>
    )
  }
  if (focus === 'bottom-sheet') {
    return (
      <Frame>
        <rect x="20" y="46" width="160" height="200" rx="4" fill="#2a2a34" opacity="0.35" />
        <rect x="20" y="118" width="160" height="128" rx="14" fill="#26262e" stroke={accent} strokeWidth="1.5" />
        <rect x="80" y="130" width="40" height="5" rx="2.5" fill="#5a5a66" />
        <rect x="36" y="150" width="128" height="10" rx="5" fill="#3a3a44" />
        <rect x="36" y="170" width="90" height="8" rx="4" fill="#3a3a44" />
        <rect x="36" y="200" width="128" height="30" rx="8" fill={accent} opacity="0.85" />
      </Frame>
    )
  }
  if (focus === 'ui-states-screen') {
    return (
      <Frame>
        {['Loading', 'Error', 'Empty', 'Offline'].map((label, i) => (
          <g key={label}>
            <rect x={20 + (i % 2) * 80} y={50 + Math.floor(i / 2) * 70} width="70" height="56" rx="6" fill="#2a2a34" stroke={i === 1 ? accent : '#3a3a44'} strokeWidth={i === 1 ? 2 : 1.5} />
            <text x={28 + (i % 2) * 80} y={78 + Math.floor(i / 2) * 70} fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#e8e8ec">{label}</text>
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'design-system-component') {
    return (
      <Frame>
        <rect x="62" y="44" width="76" height="34" rx="6" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="4 3" />
        <text x="72" y="65" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill={accent}>Master</text>
        <path d="M 100 78 L 100 92 M 100 92 L 44 92 L 44 108 M 100 92 L 100 108 M 100 92 L 156 92 L 156 108" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
        {[44, 100, 156].map((x) => (
          <g key={x}>
            <rect x={x - 26} y="108" width="52" height="30" rx="5" fill="#2a2a34" stroke="#3a3a44" />
            <text x={x - 20} y="127" fontFamily="sans-serif" fontSize="7" fill="#8a8a9a">Instance</text>
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'motion-transition') {
    return (
      <Frame>
        <rect x="18" y="60" width="64" height="100" rx="6" fill="#2a2a34" opacity="0.5" />
        <rect x="118" y="60" width="64" height="100" rx="6" fill="#2a2a34" stroke={accent} strokeWidth="2" />
        <path d="M 86 110 L 112 110" stroke={accent} strokeWidth="2.5" strokeDasharray="4 3" />
        <path d="M 104 102 L 114 110 L 104 118" fill="none" stroke={accent} strokeWidth="2.5" />
        <rect x="128" y="76" width="44" height="8" rx="4" fill="#8a8a9a" />
        <rect x="128" y="92" width="30" height="8" rx="4" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'haptic-feedback') {
    return (
      <Frame>
        <rect x="76" y="50" width="48" height="90" rx="10" fill="#2a2a34" stroke="#3a3a44" strokeWidth="2" />
        <circle cx="100" cy="122" r="4" fill="#5a5a66" />
        <path d="M 60 70 Q 50 95 60 120" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 46 62 Q 30 95 46 128" fill="none" stroke={accent} strokeWidth="2" opacity="0.6" strokeLinecap="round" />
        <path d="M 140 70 Q 150 95 140 120" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 154 62 Q 170 95 154 128" fill="none" stroke={accent} strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'microinteraction-motion') {
    return (
      <Frame>
        <circle cx="100" cy="100" r="34" fill="none" stroke="#3a3a44" strokeWidth="2" strokeDasharray="5 4" />
        <path d="M 100 66 A 34 34 0 1 1 72 118" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M 64 112 L 72 118 L 80 110" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 93 93 L 100 100 L 107 86" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'figma-prototype-ui') {
    return (
      <Frame>
        <rect x="18" y="58" width="56" height="90" rx="4" fill="#2a2a34" stroke="#3a3a44" />
        <circle cx="74" cy="103" r="5" fill={accent} />
        <rect x="126" y="58" width="56" height="90" rx="4" fill="#1c1c22" stroke={accent} strokeWidth="2" strokeDasharray="3 3" />
        <path d="M 79 103 C 100 103, 100 103, 121 103" fill="none" stroke={accent} strokeWidth="2.5" />
        <path d="M 112 95 L 123 103 L 112 111" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="28" y="70" width="36" height="8" rx="4" fill="#5a5a66" />
        <rect x="136" y="70" width="36" height="8" rx="4" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'figma-tool-ui') {
    return (
      <Frame>
        <rect x="20" y="46" width="42" height="160" rx="4" fill="#26262e" stroke="#3a3a44" />
        <rect x="28" y="56" width="26" height="6" rx="3" fill="#5a5a66" />
        <rect x="28" y="70" width="26" height="6" rx="3" fill={accent} opacity="0.8" />
        <rect x="28" y="84" width="26" height="6" rx="3" fill="#5a5a66" />
        <rect x="68" y="46" width="68" height="160" rx="4" fill="#1c1c22" stroke="#3a3a44" strokeDasharray="3 3" />
        <rect x="86" y="100" width="32" height="40" rx="3" fill="#2a2a34" stroke={accent} />
        <rect x="142" y="46" width="38" height="160" rx="4" fill="#26262e" stroke="#3a3a44" />
        <rect x="150" y="56" width="22" height="6" rx="3" fill="#5a5a66" />
        <rect x="150" y="70" width="22" height="6" rx="3" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'git-collab') {
    return (
      <Frame>
        <circle cx="50" cy="56" r="7" fill="#5a5a66" />
        <circle cx="50" cy="146" r="7" fill="#5a5a66" />
        <circle cx="130" cy="101" r="7" fill={accent} />
        <path d="M 50 63 L 50 139" fill="none" stroke="#3a3a44" strokeWidth="2.5" />
        <path d="M 50 95 C 50 101, 60 101, 130 101" fill="none" stroke={accent} strokeWidth="2.5" />
        <rect x="104" y="60" width="64" height="24" rx="12" fill="#26262e" stroke={accent} strokeWidth="1.5" />
        <rect x="114" y="68" width="44" height="8" rx="4" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'store-submission') {
    return (
      <Frame>
        <rect x="68" y="42" width="64" height="118" rx="10" fill="#2a2a34" stroke="#3a3a44" strokeWidth="2" />
        <rect x="80" y="54" width="40" height="40" rx="8" fill={accent} opacity="0.85" />
        <rect x="80" y="104" width="40" height="7" rx="3.5" fill="#5a5a66" />
        <rect x="80" y="117" width="26" height="6" rx="3" fill="#3a3a44" />
        <circle cx="146" cy="56" r="20" fill="#1c1c22" stroke={accent} strokeWidth="2" />
        <path d="M 137 56 L 144 63 L 157 48" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'trust-verification') {
    return (
      <Frame>
        <path d="M 100 38 L 142 52 L 142 100 C 142 128, 124 148, 100 158 C 76 148, 58 128, 58 100 L 58 52 Z" fill="#2a2a34" stroke={accent} strokeWidth="2.5" />
        <path d="M 82 98 L 95 112 L 120 82" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'content-carousel') {
    return (
      <Frame>
        <rect x="18" y="66" width="48" height="68" rx="6" fill="#26262e" opacity="0.6" />
        <rect x="76" y="58" width="56" height="84" rx="6" fill={accent} opacity="0.9" />
        <rect x="142" y="66" width="40" height="68" rx="6" fill="#26262e" opacity="0.6" />
        <path d="M 10 100 L 2 100" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
        <path d="M 190 100 L 198 100" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'streak-progress') {
    return (
      <Frame>
        <rect x="28" y="96" width="144" height="12" rx="6" fill="#2a2a34" />
        <rect x="28" y="96" width="98" height="12" rx="6" fill={accent} />
        <path d="M 150 140 C 142 128, 148 116, 158 110 C 156 120, 162 122, 166 116 C 170 128, 164 138, 154 142 Z" fill={accent} opacity="0.85" />
      </Frame>
    )
  }
  if (focus === 'live-order-tracking') {
    return (
      <Frame>
        <path d="M 32 150 C 70 150, 60 70, 100 70 C 140 70, 130 50, 168 50" fill="none" stroke="#3a3a44" strokeWidth="3" strokeDasharray="6 5" />
        <circle cx="32" cy="150" r="6" fill="#5a5a66" />
        <circle cx="168" cy="50" r="6" fill="#5a5a66" />
        <circle cx="100" cy="70" r="8" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'portfolio-device-frame') {
    return (
      <Frame>
        <rect x="68" y="36" width="64" height="128" rx="14" fill="#1c1c22" stroke={accent} strokeWidth="2.5" />
        <rect x="76" y="48" width="48" height="90" rx="4" fill="#2a2a34" />
        <rect x="92" y="144" width="16" height="5" rx="2.5" fill="#5a5a66" />
        <rect x="88" y="60" width="32" height="30" rx="4" fill={accent} opacity="0.75" />
        <rect x="88" y="98" width="32" height="6" rx="3" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'portfolio-file-prep') {
    return (
      <Frame>
        <rect x="24" y="48" width="152" height="104" rx="6" fill="#26262e" stroke="#3a3a44" strokeWidth="1.5" />
        <rect x="24" y="48" width="152" height="20" rx="6" fill="#1c1c22" />
        <circle cx="36" cy="58" r="4" fill={accent} />
        <rect x="48" y="55" width="50" height="6" rx="3" fill="#5a5a66" />
        <rect x="40" y="82" width="120" height="46" rx="4" fill="#1c1c22" stroke={accent} strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="52" y="94" width="50" height="22" rx="3" fill={accent} opacity="0.6" />
        <path d="M 142 98 L 148 104 L 158 90" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'handoff-showcase') {
    return (
      <Frame>
        <rect x="30" y="50" width="140" height="100" rx="6" fill="#26262e" stroke="#3a3a44" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="42" y={66 + i * 26} width="90" height="14" rx="3" fill="#1c1c22" />
            <rect x="48" y={70 + i * 26} width="60" height="6" rx="3" fill="#5a5a66" />
            <path d={`M 150 ${70 + i * 26} L 154 ${74 + i * 26} L 162 ${64 + i * 26}`} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'ui-signifier') {
    return (
      <Frame>
        <circle cx="130" cy="100" r="22" fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="4 4" />
        <path d="M 56 100 L 98 100" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M 88 90 L 98 100 L 88 110" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="130" cy="100" r="6" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'ui-feedback') {
    return (
      <Frame>
        <circle cx="100" cy="100" r="10" fill={accent} />
        <circle cx="100" cy="100" r="24" fill="none" stroke={accent} strokeWidth="2" opacity="0.6" />
        <circle cx="100" cy="100" r="38" fill="none" stroke={accent} strokeWidth="2" opacity="0.35" />
        <circle cx="100" cy="100" r="52" fill="none" stroke={accent} strokeWidth="2" opacity="0.15" />
      </Frame>
    )
  }
  if (focus === 'ui-mapping') {
    return (
      <Frame>
        <rect x="40" y="96" width="120" height="8" rx="4" fill="#2a2a34" />
        <circle cx="128" cy="100" r="10" fill={accent} />
        <path d="M 142 100 L 158 100" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 150 92 L 158 100 L 150 108" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="128" y="56" width="10" height="28" rx="3" fill={accent} opacity="0.85" />
        <rect x="108" y="64" width="10" height="20" rx="3" fill="#3a3a44" />
        <rect x="88" y="70" width="10" height="14" rx="3" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'fitts-law') {
    return (
      <Frame>
        <circle cx="48" cy="100" r="6" fill="#5a5a66" />
        <circle cx="140" cy="100" r="26" fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="4 3" />
        <path d="M 54 100 L 112 100" fill="none" stroke="#3a3a44" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="140" cy="100" r="5" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'hicks-law') {
    return (
      <Frame>
        <circle cx="46" cy="100" r="6" fill={accent} />
        {[-40, -14, 12, 38].map((dy, i) => (
          <g key={dy}>
            <path d={`M 52 100 L 150 ${100 + dy}`} fill="none" stroke="#3a3a44" strokeWidth="2" />
            <circle cx="152" cy={100 + dy} r="7" fill={i === 1 ? accent : '#5a5a66'} opacity={i === 1 ? 1 : 0.6} />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'ui-discoverability') {
    return (
      <Frame>
        <rect x="56" y="70" width="88" height="60" rx="6" fill="#26262e" stroke="#3a3a44" />
        <rect x="76" y="92" width="24" height="24" rx="4" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="128" cy="100" r="16" fill="none" stroke={accent} strokeWidth="2.5" />
        <path d="M 139 111 L 150 122" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'gestalt-common-fate') {
    return (
      <Frame>
        {[64, 100, 136].map((cy) => (
          <g key={cy}>
            <circle cx="70" cy={cy} r="9" fill={accent} opacity="0.9" />
            <path d={`M 84 ${cy} L 118 ${cy}`} fill="none" stroke={accent} strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
            <path d={`M 108 ${cy - 5} L 118 ${cy} L 108 ${cy + 5}`} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </g>
        ))}
        <circle cx="140" cy="64" r="9" fill={accent} opacity="0.9" />
        <circle cx="140" cy="100" r="9" fill={accent} opacity="0.9" />
        <circle cx="140" cy="136" r="9" fill={accent} opacity="0.9" />
      </Frame>
    )
  }
  if (focus === 'gestalt-continuity') {
    return (
      <Frame>
        <path d="M 30 100 L 170 100" fill="none" stroke="#3a3a44" strokeWidth="2" strokeDasharray="3 4" />
        {[38, 74, 110, 146, 162].map((cx) => (
          <circle key={cx} cx={cx} cy="100" r="7" fill={accent} opacity="0.85" />
        ))}
      </Frame>
    )
  }
  if (focus === 'gestalt-proximity') {
    return (
      <Frame>
        {[62, 78, 94].map((cx) => (
          <circle key={cx} cx={cx} cy="100" r="8" fill={accent} />
        ))}
        {[138, 160].map((cx) => (
          <circle key={cx} cx={cx} cy="100" r="8" fill="#5a5a66" />
        ))}
        <path d="M 46 100 L 110 100" fill="none" stroke="#3a3a44" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.5" />
        <path d="M 126 100 L 174 100" fill="none" stroke="#3a3a44" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.3" />
      </Frame>
    )
  }
  if (focus === 'gestalt-perceptual-hierarchy') {
    return (
      <Frame>
        <circle cx="100" cy="100" r="30" fill={accent} opacity="0.9" />
        <circle cx="48" cy="60" r="12" fill={accent} opacity="0.35" />
        <circle cx="156" cy="70" r="10" fill={accent} opacity="0.25" />
        <circle cx="54" cy="148" r="9" fill={accent} opacity="0.2" />
        <circle cx="152" cy="144" r="8" fill={accent} opacity="0.15" />
      </Frame>
    )
  }
  if (focus === 'cognitive-load-types') {
    return (
      <Frame>
        <path d="M 100 48 C 70 48, 50 72, 50 100 C 50 118, 58 134, 72 144 L 128 144 C 142 134, 150 118, 150 100 C 150 72, 130 48, 100 48 Z" fill="#26262e" stroke="#3a3a44" strokeWidth="2" />
        <path d="M 60 118 A 40 40 0 0 1 140 118" fill="none" stroke="#3a3a44" strokeWidth="6" strokeLinecap="round" />
        <path d="M 60 118 A 40 40 0 0 1 128 90" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <path d="M 100 118 L 118 94" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="118" r="5" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'cognitive-bias-ui') {
    return (
      <Frame>
        <rect x="56" y="64" width="88" height="56" rx="8" fill="#26262e" stroke="#3a3a44" strokeWidth="2" />
        <rect x="72" y="78" width="40" height="10" rx="3" fill="#5a5a66" opacity="0.6" />
        <path d="M 70 83 L 114 83" fill="none" stroke="#8a8a94" strokeWidth="2" />
        <rect x="72" y="98" width="56" height="14" rx="4" fill={accent} opacity="0.9" />
      </Frame>
    )
  }
  if (focus === 'peak-end-rule') {
    return (
      <Frame>
        <path d="M 30 140 C 55 136, 65 70, 90 68 C 110 66, 115 128, 140 108 C 155 96, 160 60, 172 50" fill="none" stroke="#3a3a44" strokeWidth="2.5" />
        <circle cx="90" cy="68" r="6" fill={accent} opacity="0.7" />
        <circle cx="172" cy="50" r="7" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'ia-structure-tree') {
    return (
      <Frame>
        <circle cx="100" cy="52" r="10" fill={accent} />
        <path d="M 100 62 L 100 80 M 100 80 L 56 100 M 100 80 L 100 100 M 100 80 L 144 100" fill="none" stroke="#3a3a44" strokeWidth="2" />
        <circle cx="56" cy="108" r="8" fill="#5a5a66" />
        <circle cx="100" cy="108" r="8" fill="#5a5a66" />
        <circle cx="144" cy="108" r="8" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'nav-model-diagram') {
    return (
      <Frame>
        <circle cx="66" cy="70" r="7" fill={accent} />
        <circle cx="134" cy="70" r="7" fill={accent} opacity="0.7" />
        <circle cx="100" cy="118" r="7" fill={accent} opacity="0.5" />
        <circle cx="50" cy="128" r="7" fill={accent} opacity="0.4" />
        <circle cx="150" cy="128" r="7" fill={accent} opacity="0.4" />
        <path d="M 66 70 L 134 70 M 66 70 L 100 118 M 134 70 L 100 118 M 100 118 L 50 128 M 100 118 L 150 128" fill="none" stroke="#3a3a44" strokeWidth="1.5" />
      </Frame>
    )
  }
  if (focus === 'taxonomy-tags') {
    return (
      <Frame>
        <rect x="40" y="62" width="58" height="24" rx="12" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="70" y="86" width="58" height="24" rx="12" fill="#26262e" stroke={accent} strokeWidth="2" opacity="0.85" />
        <rect x="102" y="110" width="58" height="24" rx="12" fill="#26262e" stroke={accent} strokeWidth="2" opacity="0.7" />
        <rect x="52" y="70" width="34" height="8" rx="4" fill="#5a5a66" />
        <rect x="82" y="94" width="34" height="8" rx="4" fill="#5a5a66" />
        <rect x="114" y="118" width="34" height="8" rx="4" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'card-sorting-grouping') {
    return (
      <Frame>
        <rect x="26" y="60" width="66" height="78" rx="6" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="4 3" />
        <rect x="38" y="70" width="42" height="18" rx="3" fill="#26262e" stroke="#3a3a44" />
        <rect x="38" y="94" width="42" height="18" rx="3" fill="#26262e" stroke="#3a3a44" />
        <rect x="108" y="46" width="66" height="60" rx="6" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="4 3" />
        <rect x="120" y="56" width="42" height="18" rx="3" fill="#26262e" stroke="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'findability-search') {
    return (
      <Frame>
        <rect x="52" y="56" width="70" height="52" rx="6" fill="#26262e" stroke="#3a3a44" />
        <path d="M 62 70 L 112 70 M 62 82 L 100 82 M 62 94 L 108 94" fill="none" stroke="#5a5a66" strokeWidth="3" strokeLinecap="round" />
        <circle cx="130" cy="118" r="18" fill="none" stroke={accent} strokeWidth="3" />
        <path d="M 142 130 L 156 144" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'sitemap-diagram') {
    return (
      <Frame>
        <rect x="80" y="44" width="40" height="22" rx="4" fill={accent} opacity="0.9" />
        <path d="M 100 66 L 100 82 M 100 82 L 48 100 M 100 82 L 100 100 M 100 82 L 152 100" fill="none" stroke="#3a3a44" strokeWidth="2" />
        <rect x="30" y="100" width="36" height="20" rx="4" fill="#26262e" stroke="#3a3a44" />
        <rect x="82" y="100" width="36" height="20" rx="4" fill="#26262e" stroke="#3a3a44" />
        <rect x="134" y="100" width="36" height="20" rx="4" fill="#26262e" stroke="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'labeling-tag') {
    return (
      <Frame>
        <path d="M 54 70 L 110 70 L 140 100 L 110 130 L 54 130 Z" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <circle cx="76" cy="100" r="6" fill={accent} />
        <rect x="92" y="94" width="34" height="12" rx="4" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'mega-menu-columns') {
    return (
      <Frame>
        <rect x="24" y="52" width="152" height="96" rx="6" fill="#26262e" stroke="#3a3a44" />
        {[36, 90, 144].map((x) => (
          <g key={x}>
            <rect x={x} y="64" width="40" height="8" rx="3" fill={accent} opacity="0.85" />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={x} y={80 + i * 16} width="34" height="7" rx="3" fill="#5a5a66" />
            ))}
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'command-palette-search') {
    return (
      <Frame>
        <rect x="36" y="64" width="128" height="34" rx="8" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <circle cx="54" cy="81" r="6" fill="none" stroke="#5a5a66" strokeWidth="2" />
        <path d="M 59 86 L 64 91" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
        <rect x="74" y="77" width="56" height="8" rx="3" fill="#5a5a66" />
        <rect x="140" y="72" width="18" height="18" rx="4" fill="#1c1c22" stroke="#5a5a66" strokeWidth="1.5" />
      </Frame>
    )
  }
  if (focus === 'global-search-results') {
    return (
      <Frame>
        <rect x="46" y="44" width="108" height="22" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <circle cx="60" cy="55" r="5" fill="none" stroke="#5a5a66" strokeWidth="2" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="46" y={78 + i * 24} width="30" height="7" rx="3" fill={accent} opacity="0.7" />
            <rect x="46" y={88 + i * 24} width="108" height="6" rx="3" fill="#3a3a44" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'breadcrumb-attribute') {
    return (
      <Frame>
        {[{ x: 30, w: 36 }, { x: 74, w: 46 }, { x: 128, w: 44 }].map((c, i) => (
          <g key={i}>
            <rect x={c.x} y="92" width={c.w} height="22" rx="11" fill="#26262e" stroke={accent} strokeWidth="1.5" opacity={1 - i * 0.15} />
            <rect x={c.x + 10} y="99" width={c.w - 26} height="7" rx="3" fill="#5a5a66" />
            <circle cx={c.x + c.w - 10} cy="103" r="5" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'scrollable-tabs') {
    return (
      <Frame>
        <rect x="20" y="88" width="160" height="28" rx="4" fill="#1c1c22" />
        {[30, 66, 102].map((x, i) => (
          <rect key={x} x={x} y="94" width="30" height="16" rx="4" fill={i === 1 ? accent : '#3a3a44'} opacity={i === 1 ? 1 : 0.7} />
        ))}
        <path d="M 150 102 L 172 102" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M 165 96 L 172 102 L 165 108" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'nav-hierarchy-levels') {
    return (
      <Frame>
        <rect x="30" y="48" width="140" height="20" rx="4" fill={accent} opacity="0.9" />
        <rect x="50" y="78" width="100" height="16" rx="4" fill={accent} opacity="0.55" />
        <rect x="70" y="104" width="60" height="13" rx="4" fill={accent} opacity="0.3" />
      </Frame>
    )
  }
  if (focus === 'table-sort-indicator') {
    return (
      <Frame>
        <rect x="30" y="56" width="140" height="22" rx="4" fill="#26262e" stroke="#3a3a44" />
        <rect x="42" y="64" width="50" height="7" rx="3" fill="#5a5a66" />
        <path d="M 108 62 L 113 68 L 118 62 M 108 72 L 113 66 L 118 72" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="42" y={90 + i * 16} width="120" height="8" rx="3" fill="#3a3a44" opacity={1 - i * 0.2} />
        ))}
      </Frame>
    )
  }
  if (focus === 'table-filter-chips') {
    return (
      <Frame>
        <path d="M 40 56 L 90 56 L 70 80 L 70 102 L 60 98 L 60 80 Z" fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" />
        {[{ x: 102, w: 34 }, { x: 140, w: 34 }].map((c, i) => (
          <g key={i}>
            <rect x={c.x} y="60" width={c.w} height="18" rx="9" fill="#26262e" stroke={accent} strokeWidth="1.5" />
            <rect x={c.x + 8} y="66" width={c.w - 20} height="6" rx="3" fill="#5a5a66" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'table-bulk-select') {
    return (
      <Frame>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="34" y={58 + i * 24} width="16" height="16" rx="3" fill={i < 2 ? accent : '#26262e'} stroke={i < 2 ? accent : '#5a5a66'} strokeWidth="2" />
            {i < 2 && <path d={`M 38 ${66 + i * 24} L 41 ${69 + i * 24} L 47 ${62 + i * 24}`} fill="none" stroke="#17171a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="60" y={62 + i * 24} width="110" height="8" rx="3" fill="#3a3a44" />
          </g>
        ))}
        <rect x="124" y="130" width="46" height="18" rx="9" fill={accent} opacity="0.9" />
      </Frame>
    )
  }
  if (focus === 'table-inline-edit') {
    return (
      <Frame>
        <rect x="40" y="76" width="120" height="30" rx="5" fill="#26262e" stroke={accent} strokeWidth="2.5" strokeDasharray="3 3" />
        <rect x="52" y="86" width="60" height="10" rx="3" fill="#5a5a66" />
        <path d="M 130 82 L 144 82 L 144 96 L 130 96" fill="none" stroke={accent} strokeWidth="0" />
        <path d="M 126 100 L 142 84 L 148 90 L 132 106 L 124 108 Z" fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'table-pagination') {
    return (
      <Frame>
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={64 + i * 24} cy="100" r="11" fill={i === 1 ? accent : '#26262e'} stroke={i === 1 ? accent : '#3a3a44'} strokeWidth="1.5" opacity={i === 1 ? 1 : 0.85} />
        ))}
        <path d="M 40 100 L 28 100 M 164 100 L 176 100" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'table-responsive-card') {
    return (
      <Frame>
        <rect x="24" y="52" width="70" height="96" rx="4" fill="#26262e" stroke="#3a3a44" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="32" y={64 + i * 20} width="54" height="8" rx="3" fill="#5a5a66" opacity={1 - i * 0.15} />
        ))}
        <path d="M 106 100 L 124 100" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="3 3" />
        <path d="M 117 94 L 124 100 L 117 106" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="136" y="60" width="40" height="80" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="144" y="70" width="24" height="8" rx="3" fill={accent} opacity="0.8" />
        <rect x="144" y="86" width="24" height="6" rx="3" fill="#3a3a44" />
        <rect x="144" y="98" width="24" height="6" rx="3" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'faceted-search-counts') {
    return (
      <Frame>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="40" y={58 + i * 26} width="14" height="14" rx="3" fill="#26262e" stroke={accent} strokeWidth="2" />
            <rect x="62" y={61 + i * 26} width="54" height="8" rx="3" fill="#5a5a66" />
            <rect x="140" y={60 + i * 26} width="28" height="12" rx="6" fill="#26262e" stroke="#3a3a44" />
            <rect x="148" y={64 + i * 26} width="12" height="4" rx="2" fill={accent} opacity="0.8" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'saved-filters-list') {
    return (
      <Frame>
        <path d="M 46 48 L 74 48 L 74 100 L 60 88 L 46 100 Z" fill={accent} opacity="0.85" />
        {[0, 1].map((i) => (
          <rect key={i} x="94" y={56 + i * 24} width="80" height="18" rx="9" fill="#26262e" stroke={accent} strokeWidth="1.5" />
        ))}
        {[0, 1].map((i) => (
          <rect key={i} x="106" y={62 + i * 24} width="48" height="6" rx="3" fill="#5a5a66" />
        ))}
      </Frame>
    )
  }
  if (focus === 'conditional-field-toggle') {
    return (
      <Frame>
        <rect x="40" y="56" width="120" height="24" rx="5" fill="#26262e" stroke="#3a3a44" />
        <circle cx="140" cy="68" r="8" fill={accent} />
        <path d="M 60 92 L 100 92" fill="none" stroke="#3a3a44" strokeWidth="2" strokeDasharray="4 3" />
        <path d="M 92 86 L 100 92 L 92 98" fill="none" stroke="#3a3a44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="40" y="104" width="120" height="24" rx="5" fill="#26262e" stroke={accent} strokeWidth="2" strokeDasharray="4 3" />
      </Frame>
    )
  }
  if (focus === 'autosave-indicator') {
    return (
      <Frame>
        <path d="M 70 92 C 54 92, 50 76, 64 72 C 64 56, 90 54, 96 68 C 112 62, 124 74, 116 86 C 130 88, 128 102, 114 102 L 72 102 C 60 102, 58 94, 70 92 Z" fill="#26262e" stroke={accent} strokeWidth="2" />
        <path d="M 84 78 L 90 84 L 102 70" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="76" y="116" width="48" height="8" rx="4" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'error-recovery-message') {
    return (
      <Frame>
        <path d="M 100 48 L 140 118 L 60 118 Z" fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 100 72 L 100 94" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="105" r="2.5" fill={accent} />
        <path d="M 130 128 C 130 120, 138 116, 144 120 M 144 120 L 144 114 M 144 120 L 150 120" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'inline-validation-state') {
    return (
      <Frame>
        <rect x="40" y="62" width="56" height="24" rx="5" fill="#26262e" stroke="#e5484d" strokeWidth="2" />
        <path d="M 48 70 L 56 78 M 56 70 L 48 78" fill="none" stroke="#e5484d" strokeWidth="2" strokeLinecap="round" />
        <rect x="104" y="62" width="56" height="24" rx="5" fill="#26262e" stroke={accent} strokeWidth="2" />
        <path d="M 112 74 L 117 79 L 126 68" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'chart-type-selector') {
    return (
      <Frame>
        <path d="M 40 110 L 60 80 L 80 96 L 100 58" fill="none" stroke="#5a5a66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={116 + i * 16} y={94 - i * 18} width="10" height={18 + i * 18} fill="#5a5a66" />
        ))}
        <circle cx="166" cy="70" r="16" fill="none" stroke={accent} strokeWidth="3" />
        <path d="M 166 70 L 166 54 A 16 16 0 0 1 180 78 Z" fill={accent} />
        <rect x="40" y="128" width="140" height="2" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'hero-metric-emphasis') {
    return (
      <Frame>
        <rect x="40" y="52" width="80" height="60" rx="8" fill={accent} opacity="0.9" />
        <rect x="56" y="68" width="48" height="12" rx="4" fill="#ffffff" opacity="0.85" />
        <rect x="128" y="52" width="48" height="26" rx="6" fill="#26262e" stroke="#3a3a44" />
        <rect x="128" y="86" width="48" height="26" rx="6" fill="#26262e" stroke="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'kpi-trend-comparison') {
    return (
      <Frame>
        <rect x="46" y="54" width="108" height="48" rx="8" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="60" y="66" width="52" height="14" rx="4" fill="#5a5a66" />
        <path d="M 124 80 L 132 68 L 140 76 L 148 62" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 142 62 L 148 62 L 148 68" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="60" y="112" width="80" height="6" rx="3" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'data-ink-chartjunk') {
    return (
      <Frame>
        <g opacity="0.4">
          <rect x="34" y="46" width="60" height="70" rx="6" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
          <path d="M 42 100 L 52 82 L 62 92 L 74 60 L 86 76" fill="none" stroke="#5a5a66" strokeWidth="3" />
        </g>
        <path d="M 112 106 L 124 70 L 138 88 L 156 52" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'dashboard-empty-canvas') {
    return (
      <Frame>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={40 + (i % 2) * 72} y={52 + Math.floor(i / 2) * 36} width="60" height="28" rx="6" fill="none" stroke="#3a3a44" strokeWidth="2" strokeDasharray="4 3" />
        ))}
        <path d="M 150 60 L 150 100 M 134 80 L 166 80" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'realtime-live-indicator') {
    return (
      <Frame>
        <circle cx="54" cy="58" r="6" fill={accent} opacity="0.9" />
        <circle cx="54" cy="58" r="11" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5" />
        <rect x="72" y="52" width="68" height="12" rx="4" fill="#5a5a66" />
        <path d="M 46 108 L 66 86 L 84 98 L 108 70 L 134 92" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'toast-notification') {
    return (
      <Frame>
        <rect x="18" y="20" width="164" height="90" rx="8" fill="#1c1c22" opacity="0.3" />
        <rect x="44" y="96" width="112" height="28" rx="8" fill="#26262e" stroke={accent} strokeWidth="2" />
        <circle cx="60" cy="110" r="7" fill={accent} />
        <path d="M 56 110 L 59 113 L 65 106" fill="none" stroke="#1c1c22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="76" y="105" width="60" height="10" rx="3" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'banner-persistent') {
    return (
      <Frame>
        <rect x="18" y="32" width="164" height="30" rx="4" fill="#26262e" stroke={accent} strokeWidth="2" />
        <circle cx="34" cy="47" r="6" fill={accent} />
        <rect x="48" y="42" width="90" height="10" rx="3" fill="#5a5a66" />
        <path d="M 160 42 L 168 50 M 168 42 L 160 50" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
        {[0, 1].map((i) => (
          <rect key={i} x="30" y={78 + i * 22} width="140" height="14" rx="4" fill="#26262e" />
        ))}
      </Frame>
    )
  }
  if (focus === 'alerts-severity-levels') {
    return (
      <Frame>
        {[
          { y: 36, c: '#5b8def' },
          { y: 60, c: '#4cb782' },
          { y: 84, c: '#e0a62c' },
          { y: 108, c: '#e5484d' },
        ].map((row, i) => (
          <g key={i}>
            <circle cx="36" cy={row.y} r="8" fill={row.c} />
            <rect x="54" y={row.y - 5} width="110" height="10" rx="3" fill="#5a5a66" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'badge-count-indicator') {
    return (
      <Frame>
        <circle cx="90" cy="76" r="26" fill="none" stroke="#5a5a66" strokeWidth="3" />
        <circle cx="112" cy="56" r="13" fill={accent} />
        <rect x="104" y="51" width="16" height="10" rx="5" fill="#ffffff" opacity="0.9" />
        <rect x="60" y="116" width="60" height="8" rx="4" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'error-message-specificity') {
    return (
      <Frame>
        <rect x="32" y="40" width="136" height="68" rx="8" fill="#26262e" stroke="#e5484d" strokeWidth="2" />
        <circle cx="54" cy="58" r="8" fill="#e5484d" />
        <path d="M 50 58 L 58 58 M 54 54 L 54 62" fill="none" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" />
        <rect x="70" y="52" width="86" height="8" rx="3" fill="#5a5a66" />
        <rect x="70" y="66" width="70" height="6" rx="3" fill="#3a3a44" />
        <rect x="54" y="86" width="60" height="14" rx="5" fill={accent} opacity="0.85" />
      </Frame>
    )
  }
  if (focus === 'perceived-performance-loading') {
    return (
      <Frame>
        <circle cx="100" cy="76" r="22" fill="none" stroke="#3a3a44" strokeWidth="6" />
        <path d="M 100 54 A 22 22 0 0 1 122 76" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        <rect x="44" y="110" width="30" height="8" rx="4" fill="#5a5a66" />
        <rect x="128" y="110" width="30" height="8" rx="4" fill="#5a5a66" opacity="0.4" />
      </Frame>
    )
  }
  if (focus === 'confirmation-dialog-pattern') {
    return (
      <Frame>
        <rect x="16" y="18" width="168" height="94" rx="8" fill="#1c1c22" opacity="0.25" />
        <rect x="46" y="44" width="108" height="56" rx="8" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="58" y="56" width="84" height="8" rx="3" fill="#5a5a66" />
        <rect x="58" y="70" width="36" height="16" rx="5" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
        <rect x="100" y="70" width="42" height="16" rx="5" fill="#e5484d" opacity="0.85" />
      </Frame>
    )
  }
  if (focus === 'coachmark-spotlight-overlay') {
    return (
      <Frame>
        <rect x="16" y="18" width="168" height="94" rx="8" fill="#1c1c22" opacity="0.55" />
        <circle cx="100" cy="64" r="22" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <circle cx="100" cy="64" r="22" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
        <path d="M 100 92 L 92 106 L 108 106 Z" fill={accent} />
        <rect x="62" y="112" width="76" height="8" rx="4" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'onboarding-tooltip-badge') {
    return (
      <Frame>
        <rect x="48" y="78" width="44" height="30" rx="6" fill="#26262e" stroke="#3a3a44" />
        <circle cx="110" cy="70" r="5" fill={accent} />
        <path d="M 100 60 L 110 64 L 150 50" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="2 2" />
        <rect x="112" y="40" width="68" height="26" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="120" y="48" width="48" height="6" rx="3" fill="#5a5a66" />
        <rect x="120" y="56" width="32" height="6" rx="3" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'progressive-disclosure-tiers') {
    return (
      <Frame>
        <rect x="30" y="92" width="50" height="22" rx="5" fill={accent} opacity="0.9" />
        <rect x="88" y="70" width="50" height="22" rx="5" fill={accent} opacity="0.55" />
        <rect x="146" y="48" width="36" height="22" rx="5" fill={accent} opacity="0.3" />
        <path d="M 30 44 L 182 44" fill="none" stroke="#3a3a44" strokeWidth="2" strokeDasharray="3 3" />
      </Frame>
    )
  }
  if (focus === 'demo-content-preview') {
    return (
      <Frame>
        <rect x="40" y="46" width="120" height="48" rx="8" fill="#26262e" stroke={accent} strokeWidth="2" strokeDasharray="4 3" opacity="0.8" />
        <circle cx="60" cy="62" r="8" fill="#5a5a66" />
        <rect x="76" y="56" width="64" height="7" rx="3" fill="#5a5a66" />
        <rect x="76" y="68" width="44" height="6" rx="3" fill="#3a3a44" />
        <rect x="60" y="106" width="80" height="14" rx="6" fill={accent} opacity="0.85" />
      </Frame>
    )
  }
  if (focus === 'feature-discovery-badge') {
    return (
      <Frame>
        <rect x="46" y="52" width="108" height="20" rx="6" fill="#26262e" stroke="#3a3a44" />
        <rect x="58" y="59" width="60" height="6" rx="3" fill="#5a5a66" />
        <rect x="128" y="56" width="26" height="14" rx="7" fill={accent} />
        <rect x="46" y="84" width="108" height="20" rx="6" fill="#26262e" stroke="#3a3a44" opacity="0.5" />
        <rect x="58" y="91" width="60" height="6" rx="3" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'checklist-progress-steps') {
    return (
      <Frame>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx="52" cy={48 + i * 24} r="9" fill={i < 2 ? accent : 'none'} stroke={accent} strokeWidth="2" />
            {i < 2 && <path d={`M 48 ${48 + i * 24} L 51 ${51 + i * 24} L 57 ${44 + i * 24}`} fill="none" stroke="#1c1c22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="70" y={43 + i * 24} width="100" height="10" rx="4" fill={i < 2 ? '#3a3a44' : '#5a5a66'} />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'product-tour-steps') {
    return (
      <Frame>
        <rect x="30" y="50" width="140" height="44" rx="8" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="44" y="62" width="100" height="8" rx="3" fill="#5a5a66" />
        <rect x="44" y="76" width="70" height="6" rx="3" fill="#3a3a44" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={82 + i * 12} r="3.5" cy="112" fill={i === 1 ? accent : '#3a3a44'} />
        ))}
      </Frame>
    )
  }
  if (focus === 'permission-gated-element') {
    return (
      <Frame>
        <rect x="40" y="50" width="130" height="24" rx="6" fill="#26262e" stroke="#3a3a44" />
        <rect x="52" y="58" width="80" height="8" rx="3" fill="#5a5a66" />
        <rect x="40" y="86" width="130" height="24" rx="6" fill="#1c1c22" stroke="#3a3a44" opacity="0.5" />
        <rect x="52" y="94" width="80" height="8" rx="3" fill="#3a3a44" />
        <circle cx="158" cy="98" r="9" fill="none" stroke="#5a5a66" strokeWidth="2" />
        <rect x="155" y="92" width="6" height="7" rx="1" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
      </Frame>
    )
  }
  if (focus === 'role-permission-matrix') {
    return (
      <Frame>
        {[0, 1, 2].map((row) => (
          <g key={row}>
            <rect x="34" y={46 + row * 22} width="46" height="14" rx="3" fill="#3a3a44" />
            {[0, 1, 2].map((col) => (
              <rect key={col} x={92 + col * 28} y={46 + row * 22} width="20" height="14" rx="3" fill={(row + col) % 2 === 0 ? accent : '#26262e'} opacity={(row + col) % 2 === 0 ? 0.85 : 1} stroke="#3a3a44" />
            ))}
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'settings-sidebar-nav') {
    return (
      <Frame>
        <rect x="24" y="36" width="52" height="88" rx="6" fill="#26262e" stroke="#3a3a44" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="32" y={46 + i * 20} width="36" height={i === 1 ? 10 : 8} rx="3" fill={i === 1 ? accent : '#5a5a66'} opacity={i === 1 ? 0.9 : 0.6} />
        ))}
        <rect x="88" y="44" width="92" height="12" rx="4" fill="#5a5a66" />
        <rect x="88" y="66" width="70" height="44" rx="6" fill="#26262e" stroke="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'admin-panel-table') {
    return (
      <Frame>
        <rect x="24" y="40" width="152" height="16" rx="4" fill="#3a3a44" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="24" y={60 + i * 18} width="152" height="14" rx="3" fill="#26262e" stroke="#3a3a44" />
        ))}
        <circle cx="34" cy="67" r="4" fill="none" stroke={accent} strokeWidth="1.5" />
        <rect x="46" y="64" width="70" height="6" rx="3" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'workspace-switcher') {
    return (
      <Frame>
        <rect x="30" y="40" width="100" height="26" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="40" y="48" width="18" height="10" rx="3" fill={accent} />
        <rect x="64" y="49" width="52" height="8" rx="3" fill="#5a5a66" />
        <path d="M 150 50 L 158 58 L 150 66" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {[0, 1].map((i) => (
          <rect key={i} x="30" y={80 + i * 20} width="100" height="16" rx="5" fill="#1c1c22" opacity="0.6" />
        ))}
      </Frame>
    )
  }
  if (focus === 'bulk-progress-async') {
    return (
      <Frame>
        <rect x="34" y="70" width="132" height="14" rx="7" fill="#26262e" stroke="#3a3a44" />
        <rect x="34" y="70" width="86" height="14" rx="7" fill={accent} opacity="0.85" />
        <rect x="34" y="94" width="70" height="8" rx="4" fill="#5a5a66" />
        <circle cx="150" cy="98" r="6" fill="none" stroke="#e5484d" strokeWidth="2" />
      </Frame>
    )
  }
  if (focus === 'density-toggle-enterprise') {
    return (
      <Frame>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="30" y={42 + i * 10} width="70" height="6" rx="2" fill="#5a5a66" opacity={0.9 - i * 0.1} />
        ))}
        {[0, 1].map((i) => (
          <rect key={i} x="118" y={46 + i * 28} width="62" height="18" rx="4" fill={i === 0 ? accent : '#26262e'} opacity={i === 0 ? 0.85 : 1} stroke="#3a3a44" />
        ))}
      </Frame>
    )
  }
  if (focus === 'roach-motel-trap') {
    return (
      <Frame>
        <rect x="40" y="46" width="52" height="20" rx="10" fill={accent} opacity="0.85" />
        <path d="M 96 56 L 134 56" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="4 3" />
        <path d="M 126 50 L 134 56 L 126 62" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="140" y="46" width="30" height="20" rx="4" fill="#1c1c22" stroke="#3a3a44" />
        <path d="M 150 94 Q 100 80 60 94 Q 100 108 150 94 Z" fill="none" stroke="#e5484d" strokeWidth="2" strokeDasharray="3 2" />
        <rect x="90" y="86" width="20" height="14" rx="3" fill="#26262e" stroke="#e5484d" opacity="0.6" />
      </Frame>
    )
  }
  if (focus === 'forced-continuity-billing') {
    return (
      <Frame>
        <rect x="40" y="48" width="120" height="44" rx="8" fill="#26262e" stroke="#3a3a44" />
        <rect x="52" y="58" width="60" height="8" rx="3" fill="#5a5a66" />
        <rect x="52" y="72" width="90" height="6" rx="3" fill="#3a3a44" />
        <circle cx="150" cy="60" r="8" fill="#e5484d" opacity="0.85" />
        <path d="M 146 60 L 150 64 L 154 56" fill="none" stroke="#1c1c22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="60" y="104" width="80" height="12" rx="5" fill={accent} opacity="0.3" />
      </Frame>
    )
  }
  if (focus === 'hidden-costs-checkout') {
    return (
      <Frame>
        <rect x="34" y="46" width="60" height="30" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="44" y="58" width="40" height="8" rx="3" fill={accent} opacity="0.7" />
        <path d="M 100 60 L 130 60" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
        <path d="M 122 54 L 130 60 L 122 66" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="136" y="46" width="44" height="52" rx="6" fill="#26262e" stroke="#e5484d" strokeWidth="2" />
        <rect x="144" y="56" width="28" height="6" rx="2" fill="#5a5a66" />
        <rect x="144" y="66" width="28" height="6" rx="2" fill="#e5484d" opacity="0.7" />
        <rect x="144" y="76" width="28" height="6" rx="2" fill="#e5484d" opacity="0.7" />
      </Frame>
    )
  }
  if (focus === 'ethical-design-balance') {
    return (
      <Frame>
        <rect x="42" y="56" width="50" height="20" rx="6" fill={accent} opacity="0.85" />
        <rect x="108" y="56" width="50" height="20" rx="6" fill={accent} opacity="0.85" />
        <path d="M 100 44 L 100 100" fill="none" stroke="#3a3a44" strokeWidth="2" />
        <path d="M 60 44 L 140 44" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
        <circle cx="100" cy="44" r="4" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'plain-explanation-test') {
    return (
      <Frame>
        <rect x="36" y="44" width="128" height="52" rx="8" fill="#26262e" stroke={accent} strokeWidth="2" />
        <path d="M 52 60 Q 48 54 54 52 Q 56 46 62 50" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        <rect x="68" y="56" width="80" height="7" rx="3" fill="#5a5a66" />
        <rect x="68" y="68" width="60" height="6" rx="3" fill="#3a3a44" />
        <path d="M 100 96 L 92 110 L 108 110 Z" fill="#26262e" stroke={accent} strokeWidth="1.5" />
      </Frame>
    )
  }
  if (focus === 'microcopy-word-choice') {
    return (
      <Frame>
        <rect x="40" y="56" width="120" height="24" rx="5" fill="#26262e" stroke="#3a3a44" />
        <rect x="40" y="88" width="90" height="8" rx="3" fill={accent} opacity="0.3" />
        <rect x="40" y="88" width="34" height="8" rx="3" fill={accent} opacity="0.9" />
        <path d="M 150 60 L 158 68 M 158 60 L 150 68" fill="none" stroke="#5a5a66" strokeWidth="1.5" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'button-text-verb-first') {
    return (
      <Frame>
        <rect x="42" y="58" width="56" height="26" rx="6" fill={accent} opacity="0.9" />
        <rect x="54" y="68" width="32" height="7" rx="3" fill="#ffffff" opacity="0.85" />
        <rect x="112" y="58" width="56" height="26" rx="6" fill="#26262e" stroke="#3a3a44" />
        <rect x="120" y="68" width="18" height="7" rx="3" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'error-tone-neutral') {
    return (
      <Frame>
        <rect x="36" y="48" width="128" height="48" rx="8" fill="#26262e" stroke="#e5484d" strokeWidth="1.5" opacity="0.7" />
        <rect x="50" y="60" width="90" height="7" rx="3" fill="#5a5a66" />
        <rect x="50" y="72" width="60" height="6" rx="3" fill="#3a3a44" />
        <path d="M 50 110 Q 100 98 150 110" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'voice-tone-shift') {
    return (
      <Frame>
        <rect x="34" y="48" width="58" height="34" rx="8" fill={accent} opacity="0.85" />
        <circle cx="48" cy="60" r="3" fill="#ffffff" />
        <circle cx="58" cy="60" r="3" fill="#ffffff" />
        <rect x="46" y="68" width="28" height="6" rx="3" fill="#ffffff" opacity="0.7" />
        <rect x="108" y="48" width="58" height="34" rx="8" fill={accent} opacity="0.55" />
        <rect x="118" y="60" width="16" height="4" rx="2" fill="#ffffff" opacity="0.8" />
        <rect x="120" y="68" width="28" height="6" rx="3" fill="#ffffff" opacity="0.7" />
      </Frame>
    )
  }
  if (focus === 'onboarding-benefit-first') {
    return (
      <Frame>
        <path d="M 60 100 L 100 54 L 140 100" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="100" cy="54" r="7" fill={accent} />
        <rect x="56" y="108" width="88" height="8" rx="4" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'confirmation-copy-specific') {
    return (
      <Frame>
        <rect x="38" y="46" width="124" height="20" rx="5" fill="#26262e" stroke="#3a3a44" opacity="0.5" />
        <path d="M 95 56 L 105 56" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="2 2" />
        <rect x="38" y="78" width="124" height="28" rx="6" fill="#26262e" stroke="#e5484d" strokeWidth="2" />
        <rect x="50" y="88" width="100" height="8" rx="3" fill="#5a5a66" />
      </Frame>
    )
  }
  if (focus === 'nielsen-heuristics-list') {
    return (
      <Frame>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="40" y={44 + i * 18} width="14" height="14" rx="4" fill="none" stroke={accent} strokeWidth="2" />
            {i < 2 && <path d={`M 44 ${51 + i * 18} L 47 ${54 + i * 18} L 51 ${47 + i * 18}`} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="62" y={46 + i * 18} width="110" height="10" rx="3" fill="#5a5a66" opacity={i < 2 ? 0.9 : 0.5} />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'independent-reviewers-severity') {
    return (
      <Frame>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={56 + i * 36} cy="56" r="14" fill="none" stroke="#5a5a66" strokeWidth="2" />
        ))}
        <rect x="40" y="90" width="120" height="14" rx="7" fill="#26262e" stroke="#3a3a44" />
        <rect x="40" y="90" width="40" height="14" rx="7" fill="#e5484d" opacity="0.8" />
        <rect x="80" y="90" width="40" height="14" fill="#e0a62c" opacity="0.8" />
        <rect x="120" y="90" width="40" height="14" rx="7" fill="#4cb782" opacity="0.8" />
      </Frame>
    )
  }
  if (focus === 'feedback-sandwich-sbi') {
    return (
      <Frame>
        <rect x="40" y="46" width="120" height="16" rx="6" fill={accent} opacity="0.3" />
        <rect x="40" y="68" width="120" height="16" rx="6" fill="#26262e" stroke="#3a3a44" />
        <rect x="40" y="90" width="120" height="16" rx="6" fill={accent} opacity="0.3" />
        <rect x="52" y="51" width="60" height="6" rx="3" fill={accent} />
        <rect x="52" y="73" width="80" height="6" rx="3" fill="#5a5a66" />
        <rect x="52" y="95" width="50" height="6" rx="3" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'self-review-checklist-items') {
    return (
      <Frame>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="46" y={48 + i * 18} width="12" height="12" rx="3" fill={i !== 2 ? accent : 'none'} stroke={accent} strokeWidth="1.5" opacity={i !== 2 ? 0.9 : 1} />
            {i !== 2 && <path d={`M 48.5 ${54 + i * 18} L 51 ${57 + i * 18} L 55.5 ${50 + i * 18}`} fill="none" stroke="#1c1c22" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="66" y={50 + i * 18} width="104" height="8" rx="3" fill={i === 2 ? '#e5484d' : '#5a5a66'} opacity={i === 2 ? 0.7 : 0.8} />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'reviewer-rotation-gate') {
    return (
      <Frame>
        <circle cx="70" cy="60" r="16" fill="none" stroke={accent} strokeWidth="2.5" />
        <circle cx="130" cy="60" r="16" fill="none" stroke="#5a5a66" strokeWidth="2" opacity="0.5" />
        <path d="M 88 60 L 112 60" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="4 3" />
        <path d="M 104 54 L 112 60 L 104 66" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="56" y="94" width="88" height="14" rx="6" fill="#26262e" stroke="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'menu-bar-completeness') {
    return (
      <Frame>
        <rect x="20" y="36" width="160" height="14" rx="3" fill="#26262e" stroke="#3a3a44" />
        {['File', 'Edit', 'View'].map((_, i) => (
          <rect key={i} x={30 + i * 32} y="40" width="24" height="6" rx="2" fill="#5a5a66" />
        ))}
        <rect x="30" y="54" width="90" height="56" rx="4" fill="#26262e" stroke={accent} strokeWidth="1.5" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="38" y={62 + i * 12} width="70" height="6" rx="2" fill="#5a5a66" opacity={0.9 - i * 0.1} />
        ))}
      </Frame>
    )
  }
  if (focus === 'multi-window-doc-utility') {
    return (
      <Frame>
        <rect x="26" y="40" width="94" height="66" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="26" y="40" width="94" height="10" rx="3" fill={accent} opacity="0.6" />
        <rect x="128" y="54" width="56" height="78" rx="6" fill="#26262e" stroke="#3a3a44" opacity="0.6" />
        <rect x="128" y="54" width="56" height="10" rx="3" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'sacred-shortcuts-lock') {
    return (
      <Frame>
        <rect x="76" y="70" width="48" height="34" rx="6" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <path d="M 86 70 L 86 56 A 14 14 0 0 1 114 56 L 114 70" fill="none" stroke={accent} strokeWidth="3" />
        <circle cx="100" cy="86" r="5" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'unsaved-changes-indicator') {
    return (
      <Frame>
        <rect x="40" y="44" width="120" height="16" rx="4" fill="#26262e" stroke="#3a3a44" />
        <rect x="52" y="50" width="70" height="5" rx="2" fill="#5a5a66" />
        <circle cx="140" cy="52" r="5" fill={accent} />
        <rect x="40" y="74" width="120" height="40" rx="6" fill="#1c1c22" opacity="0.3" />
      </Frame>
    )
  }
  if (focus === 'native-vs-custom-control') {
    return (
      <Frame>
        <rect x="38" y="52" width="56" height="22" rx="5" fill="none" stroke="#5a5a66" strokeWidth="2" />
        <rect x="46" y="60" width="40" height="6" rx="3" fill="#5a5a66" />
        <rect x="106" y="52" width="56" height="22" rx="11" fill={accent} opacity="0.85" />
        <circle cx="152" cy="63" r="8" fill="#ffffff" opacity="0.9" />
      </Frame>
    )
  }
  if (focus === 'voice-ui-conversation') {
    return (
      <Frame>
        <circle cx="70" cy="76" r="22" fill={accent} opacity="0.85" />
        <rect x="62" y="68" width="4" height="16" rx="2" fill="#ffffff" opacity="0.8" />
        <rect x="68" y="62" width="4" height="28" rx="2" fill="#ffffff" opacity="0.8" />
        <rect x="74" y="70" width="4" height="12" rx="2" fill="#ffffff" opacity="0.8" />
        <path d="M 102 70 Q 118 70 118 82 Q 118 94 100 94 L 100 100 L 108 94" fill="#26262e" stroke="#3a3a44" strokeWidth="1.5" />
      </Frame>
    )
  }
  if (focus === 'kiosk-public-terminal') {
    return (
      <Frame>
        <rect x="56" y="30" width="88" height="88" rx="8" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <rect x="68" y="42" width="64" height="12" rx="3" fill="#5a5a66" />
        {[0, 1].map((i) => (
          <rect key={i} x={68 + i * 34} y="62" width="28" height="28" rx="6" fill="#1c1c22" stroke="#3a3a44" />
        ))}
        <path d="M 150 50 A 20 20 0 1 1 150 98" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="4 3" />
        <path d="M 144 92 L 150 98 L 156 92" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'tabletop-orientation') {
    return (
      <Frame>
        <circle cx="100" cy="76" r="40" fill="none" stroke="#3a3a44" strokeWidth="2" strokeDasharray="3 2" />
        {[0, 90, 180, 270].map((deg, i) => (
          <g key={i} transform={`rotate(${deg} 100 76)`}>
            <rect x="92" y="38" width="16" height="10" rx="3" fill={accent} opacity="0.8" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'continue-where-left-off') {
    return (
      <Frame>
        <rect x="34" y="50" width="70" height="46" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="42" y="80" width="54" height="5" rx="2" fill="#3a3a44" />
        <rect x="42" y="80" width="32" height="5" rx="2" fill={accent} />
        <path d="M 112 72 L 136 72" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
        <path d="M 128 65 L 136 72 L 128 79" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="146" y="46" width="40" height="54" rx="6" fill="#26262e" stroke="#3a3a44" />
        <rect x="152" y="76" width="28" height="5" rx="2" fill="#3a3a44" />
        <rect x="152" y="76" width="16" height="5" rx="2" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'aria-attribute-widget') {
    return (
      <Frame>
        <rect x="40" y="48" width="120" height="54" rx="6" fill="#1c1c22" stroke="#3a3a44" />
        <rect x="52" y="58" width="60" height="7" rx="3" fill={accent} opacity="0.85" />
        <rect x="52" y="72" width="80" height="6" rx="3" fill="#5a5a66" />
        <rect x="52" y="84" width="50" height="6" rx="3" fill="#5a5a66" />
        <path d="M 140 64 L 148 72 L 140 80" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'roving-tabindex-widget') {
    return (
      <Frame>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={30 + i * 38} y="58" width="30" height="30" rx="6" fill={i === 1 ? accent : '#26262e'} opacity={i === 1 ? 0.9 : 1} stroke={i === 1 ? accent : '#3a3a44'} strokeWidth={i === 1 ? 2.5 : 1.5} />
        ))}
        <path d="M 60 100 L 98 100" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
        <path d="M 90 94 L 98 100 L 90 106" fill="none" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'table-header-scope') {
    return (
      <Frame>
        <rect x="30" y="42" width="140" height="18" rx="3" fill={accent} opacity="0.85" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="30" y={64 + i * 16} width="140" height="12" rx="2" fill="#26262e" stroke="#3a3a44" />
        ))}
        <path d="M 60 50 L 60 108" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
      </Frame>
    )
  }
  if (focus === 'dialog-aria-modal') {
    return (
      <Frame>
        <rect x="16" y="18" width="168" height="94" rx="8" fill="#1c1c22" opacity="0.55" />
        <rect x="52" y="44" width="96" height="60" rx="8" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <rect x="64" y="56" width="60" height="8" rx="3" fill="#5a5a66" />
        <rect x="64" y="70" width="72" height="6" rx="3" fill="#3a3a44" />
        <rect x="64" y="86" width="40" height="12" rx="4" fill={accent} opacity="0.85" />
      </Frame>
    )
  }
  if (focus === 'keyboard-trap-bug') {
    return (
      <Frame>
        <rect x="50" y="46" width="100" height="60" rx="8" fill="none" stroke="#e5484d" strokeWidth="2.5" strokeDasharray="5 3" />
        <path d="M 100 56 L 100 96 M 80 76 L 120 76" fill="none" stroke="#5a5a66" strokeWidth="2" opacity="0.6" />
        <path d="M 150 76 L 160 76" fill="none" stroke="#e5484d" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 150 70 L 142 76 L 150 82" fill="none" stroke="#e5484d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'design-system-steward') {
    return (
      <Frame>
        <circle cx="100" cy="56" r="16" fill={accent} opacity="0.85" />
        <path d="M 92 56 L 97 61 L 108 50" fill="none" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={50 + i * 50} cy="98" r="10" fill="none" stroke="#5a5a66" strokeWidth="2" />
        ))}
        <path d="M 100 72 L 50 88 M 100 72 L 100 88 M 100 72 L 150 88" fill="none" stroke="#3a3a44" strokeWidth="1.5" strokeDasharray="3 2" />
      </Frame>
    )
  }
  if (focus === 'token-tier-structure') {
    return (
      <Frame>
        <rect x="70" y="40" width="60" height="16" rx="4" fill="#5a5a66" />
        <path d="M 100 56 L 100 66" fill="none" stroke="#3a3a44" strokeWidth="2" />
        <rect x="55" y="66" width="90" height="16" rx="4" fill={accent} opacity="0.75" />
        <path d="M 100 82 L 100 92" fill="none" stroke="#3a3a44" strokeWidth="2" />
        <rect x="40" y="92" width="120" height="16" rx="4" fill={accent} opacity="0.95" />
      </Frame>
    )
  }
  if (focus === 'contribution-pr-model') {
    return (
      <Frame>
        <circle cx="54" cy="56" r="14" fill="none" stroke="#5a5a66" strokeWidth="2" />
        <path d="M 68 56 L 100 56" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
        <rect x="100" y="42" width="60" height="28" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <path d="M 112 56 L 118 62 L 130 48" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="80" y="86" width="60" height="22" rx="6" fill="#1c1c22" stroke="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'changelog-migration') {
    return (
      <Frame>
        <rect x="40" y="40" width="120" height="68" rx="6" fill="#26262e" stroke="#3a3a44" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx="54" cy={56 + i * 16} r="3" fill={accent} />
            <rect x="64" y={52 + i * 16} width="84" height="8" rx="3" fill="#5a5a66" opacity={1 - i * 0.2} />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'component-docs-example') {
    return (
      <Frame>
        <rect x="30" y="40" width="68" height="68" rx="6" fill="#26262e" stroke="#4cb782" strokeWidth="2" />
        <path d="M 54 72 L 60 78 L 74 62" fill="none" stroke="#4cb782" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="102" y="40" width="68" height="68" rx="6" fill="#26262e" stroke="#e5484d" strokeWidth="2" />
        <path d="M 126 62 L 146 86 M 146 62 L 126 86" fill="none" stroke="#e5484d" strokeWidth="2.5" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'coverage-usage-metrics') {
    return (
      <Frame>
        <circle cx="70" cy="76" r="30" fill="none" stroke="#3a3a44" strokeWidth="10" />
        <path d="M 70 46 A 30 30 0 1 1 46 100" fill="none" stroke={accent} strokeWidth="10" strokeLinecap="round" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="128" y={50 + i * 18} width={40 - i * 10} height="10" rx="3" fill="#5a5a66" opacity={1 - i * 0.25} />
        ))}
      </Frame>
    )
  }
  if (focus === 'five-second-glance') {
    return (
      <Frame>
        <rect x="40" y="42" width="120" height="70" rx="8" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="52" y="54" width="70" height="8" rx="3" fill="#5a5a66" />
        <rect x="52" y="68" width="50" height="6" rx="3" fill="#3a3a44" />
        <circle cx="150" cy="58" r="12" fill="none" stroke={accent} strokeWidth="2.5" />
        <path d="M 150 52 L 150 58 L 154 61" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'first-click-heatmap') {
    return (
      <Frame>
        <rect x="30" y="38" width="140" height="78" rx="6" fill="#26262e" stroke="#3a3a44" />
        <circle cx="90" cy="60" r="22" fill={accent} opacity="0.35" />
        <circle cx="90" cy="60" r="10" fill={accent} opacity="0.85" />
        <circle cx="130" cy="92" r="10" fill="#5a5a66" opacity="0.4" />
        <circle cx="54" cy="96" r="7" fill="#5a5a66" opacity="0.3" />
      </Frame>
    )
  }
  if (focus === 'test-script-intro') {
    return (
      <Frame>
        <rect x="46" y="38" width="108" height="78" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="58" y={50 + i * 15} width={i === 1 ? 60 : 84} height="7" rx="3" fill={i === 1 ? accent : '#5a5a66'} opacity={i === 1 ? 0.9 : 0.7} />
        ))}
      </Frame>
    )
  }
  if (focus === 'moderated-live-session') {
    return (
      <Frame>
        <circle cx="62" cy="64" r="20" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <path d="M 54 70 Q 62 78 70 70" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        <path d="M 86 64 L 110 64" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="140" cy="64" r="16" fill="#1c1c22" stroke="#3a3a44" strokeWidth="2" />
        <rect x="46" y="98" width="108" height="10" rx="4" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'affinity-theme-clusters') {
    return (
      <Frame>
        {[[40, 44], [66, 54], [40, 70]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="48" height="16" rx="4" fill={accent} opacity="0.8" />
        ))}
        {[[120, 48], [138, 72], [112, 90]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="48" height="16" rx="4" fill="#5a5a66" opacity="0.6" />
        ))}
      </Frame>
    )
  }
  if (focus === 'ab-test-split-traffic') {
    return (
      <Frame>
        <circle cx="42" cy="76" r="10" fill="#5a5a66" />
        <path d="M 52 76 L 76 50 M 52 76 L 76 102" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
        <rect x="86" y="36" width="56" height="28" rx="6" fill={accent} opacity="0.85" />
        <rect x="86" y="92" width="56" height="28" rx="6" fill="#26262e" stroke="#3a3a44" strokeWidth="2" />
        <rect x="152" y="44" width="20" height="12" rx="3" fill={accent} />
        <rect x="152" y="100" width="12" height="12" rx="3" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'ui-process-audit') {
    return (
      <Frame>
        <rect x="34" y="40" width="58" height="72" rx="6" fill="#26262e" stroke="#3a3a44" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="44" y={54 + i * 16} width="38" height="8" rx="3" fill="#5a5a66" />
        ))}
        <path d="M 100 76 L 128 76" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="4 3" />
        <path d="M 120 68 L 128 76 L 120 84" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="138" y="44" width="42" height="64" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="146" y="56" width="26" height="6" rx="2" fill={accent} opacity="0.8" />
      </Frame>
    )
  }
  if (focus === 'edge-case-demo') {
    return (
      <Frame>
        <rect x="30" y="42" width="60" height="68" rx="6" fill="#26262e" stroke="#3a3a44" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="38" y={52 + i * 14} width="44" height="7" rx="2" fill="#5a5a66" opacity={0.9 - i * 0.1} />
        ))}
        <rect x="104" y="42" width="60" height="68" rx="6" fill="#26262e" stroke="#e5484d" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="134" cy="76" r="14" fill="none" stroke="#e5484d" strokeWidth="2" />
        <path d="M 134 70 L 134 76 M 134 82 L 134 83" fill="none" stroke="#e5484d" strokeWidth="2" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'enterprise-case-audience') {
    return (
      <Frame>
        <circle cx="70" cy="60" r="18" fill="none" stroke={accent} strokeWidth="2.5" />
        <path d="M 70 52 L 70 68 M 62 60 L 78 60" fill="none" stroke={accent} strokeWidth="2" />
        {[0, 1].map((i) => (
          <rect key={i} x="110" y={40 + i * 36} width="60" height="26" rx="6" fill="#26262e" stroke="#3a3a44" />
        ))}
        <path d="M 88 60 L 108 60" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
      </Frame>
    )
  }
  if (focus === 'complex-ui-walkthrough') {
    return (
      <Frame>
        <rect x="34" y="40" width="132" height="68" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <rect x="46" y="50" width="108" height="10" rx="3" fill="#5a5a66" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="46" y={66 + i * 13} width={100 - i * 18} height="7" rx="2" fill="#3a3a44" />
        ))}
        <circle cx="150" cy="96" r="12" fill={accent} opacity="0.85" />
        <path d="M 146 96 L 150 100 L 156 90" fill="none" stroke="#1c1c22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'capstone-realistic-domain') {
    return (
      <Frame>
        {[0, 1, 2].map((i) => (
          <rect key={i} x={30 + i * 50} y="40" width="40" height="34" rx="6" fill="#26262e" stroke={i === 1 ? accent : '#3a3a44'} strokeWidth={i === 1 ? 2.5 : 2} />
        ))}
        <path d="M 80 78 L 80 96" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="3 2" />
        <rect x="52" y="98" width="56" height="20" rx="6" fill={accent} opacity="0.85" />
        <path d="M 65 108 L 73 114 L 94 96" fill="none" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Frame>
    )
  }
  if (focus === 'capstone-happy-path-gap') {
    return (
      <Frame>
        <path d="M 30 70 L 170 70" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <circle cx="170" cy="70" r="9" fill="none" stroke={accent} strokeWidth="2.5" />
        <path d="M 166 70 L 169 73 L 175 65" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 60 70 L 60 104 L 110 104" fill="none" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="110" cy="104" r="9" fill="none" stroke="#e5484d" strokeWidth="2.5" />
        <path d="M 106 100 L 114 108 M 114 100 L 106 108" fill="none" stroke="#e5484d" strokeWidth="2" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'capstone-design-system-scope') {
    return (
      <Frame>
        {[0, 1].map((i) => (
          <rect key={i} x={30} y={40 + i * 26} width="26" height="18" rx="4" fill="#26262e" stroke="#3a3a44" strokeWidth="2" />
        ))}
        <rect x="76" y="38" width="94" height="72" rx="8" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <rect x="88" y="50" width="70" height="10" rx="3" fill="#5a5a66" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="88" y={68 + i * 12} width={60 - i * 10} height="7" rx="2" fill="#3a3a44" />
        ))}
      </Frame>
    )
  }
  if (focus === 'capstone-full-integration') {
    return (
      <Frame>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={28 + (i % 2) * 24} y={34 + Math.floor(i / 2) * 24} width="18" height="18" rx="4" fill="#26262e" stroke="#5a5a66" strokeWidth="2" />
        ))}
        <path d="M 70 55 L 100 65" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="3 2" />
        <rect x="104" y="40" width="68" height="76" rx="8" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="114" y={52 + i * 18} width="48" height="10" rx="3" fill={i === 0 ? accent : '#3a3a44'} opacity={i === 0 ? 0.85 : 1} />
        ))}
      </Frame>
    )
  }
  if (focus === 'capstone-disjointed-screens') {
    return (
      <Frame>
        {[[28, 36], [96, 30], [60, 86], [128, 92]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="44" height="30" rx="6" fill="#26262e" stroke="#e5484d" strokeWidth="2" strokeDasharray="4 3" />
        ))}
        <circle cx="100" cy="60" r="11" fill="none" stroke="#e5484d" strokeWidth="2" />
        <path d="M 96 56 L 104 64 M 104 56 L 96 64" fill="none" stroke="#e5484d" strokeWidth="2" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'app-shell') {
    return (
      <Frame>
        <rect x="26" y="44" width="148" height="10" rx="5" fill="#3a3a44" />
        <rect x="20" y="62" width="160" height="56" rx="6" fill={accent} opacity="0.85" />
        <rect x="32" y="78" width="100" height="10" rx="5" fill="#17171a" opacity="0.7" />
        <rect x="32" y="94" width="70" height="8" rx="4" fill="#17171a" opacity="0.5" />
        <rect x="20" y="126" width="75" height="44" rx="4" fill="#2a2a34" />
        <rect x="105" y="126" width="75" height="44" rx="4" fill="#2a2a34" />
        <rect x="20" y="178" width="160" height="22" rx="6" fill="#26262e" />
        {[44, 100, 156].map((x) => <circle key={x} cx={x} cy="189" r="5" fill="#3a3a44" />)}
      </Frame>
    )
  }
  if (focus === 'game-hud') {
    return (
      <Frame>
        <rect x="20" y="40" width="160" height="90" rx="8" fill="#1b2230" />
        <rect x="30" y="50" width="54" height="8" rx="4" fill={accent} opacity="0.85" />
        <rect x="30" y="62" width="70" height="7" rx="3" fill="#3a3a44" />
        <circle cx="152" cy="64" r="16" fill="none" stroke="#4a4a56" strokeWidth="2" />
        <path d="M 92 85 L 92 95 M 86 90 L 98 90" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <rect x="30" y="108" width="50" height="10" rx="5" fill="#2a2a34" />
        <rect x="32" y="110" width="35" height="6" rx="3" fill={accent} />
        <rect x="128" y="108" width="40" height="10" rx="5" fill="#2a2a34" />
      </Frame>
    )
  }
  if (focus === 'game-design-discipline') {
    return (
      <Frame>
        <rect x="46" y="38" width="108" height="96" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        <path d="M 46 58 L 154 58" stroke="#3a3a44" strokeWidth="2" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="60" y={70 + i * 18} width="80" height="8" rx="3" fill="#5a5a66" />
        ))}
        <circle cx="100" cy="46" r="5" fill={accent} />
      </Frame>
    )
  }
  if (focus === 'game-roles-split') {
    return (
      <Frame>
        {[36, 100, 164].map((cx, i) => (
          <g key={cx}>
            <circle cx={cx} cy="62" r="16" fill="none" stroke={i === 1 ? accent : '#5a5a66'} strokeWidth="2.5" />
            <path d={`M ${cx} 56 L ${cx} 62 M ${cx - 5} 58 L ${cx + 5} 58`} stroke={i === 1 ? accent : '#5a5a66'} strokeWidth="2" strokeLinecap="round" />
            <rect x={cx - 20} y="88" width="40" height="34" rx="4" fill="#26262e" stroke="#3a3a44" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'game-toy-puzzle-game') {
    return (
      <Frame>
        <circle cx="42" cy="76" r="20" fill="#26262e" stroke="#5a5a66" strokeWidth="2" />
        <path d="M 34 76 L 50 76 M 42 68 L 42 84" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
        <rect x="80" y="56" width="40" height="40" rx="8" fill="#26262e" stroke={accent} strokeWidth="2.5" />
        <circle cx="120" cy="76" r="7" fill={accent} />
        <path d="M 150 60 L 170 60 L 170 92 L 150 92 Z" fill="none" stroke="#5a5a66" strokeWidth="2" />
        <path d="M 150 76 L 136 76 L 136 68" fill="none" stroke="#5a5a66" strokeWidth="2" />
      </Frame>
    )
  }
  if (focus === 'game-key-questions') {
    return (
      <Frame>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx="46" cy={48 + i * 28} r="11" fill="none" stroke={i === 0 ? accent : '#5a5a66'} strokeWidth="2.5" />
            <text x="46" y={53 + i * 28} textAnchor="middle" fontSize="13" fill={i === 0 ? accent : '#5a5a66'} fontWeight="700">?</text>
            <rect x="66" y={40 + i * 28} width="108" height="16" rx="4" fill="#26262e" stroke="#3a3a44" />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'game-design-vs-dev') {
    return (
      <Frame>
        <rect x="30" y="40" width="60" height="78" rx="6" fill="#26262e" stroke={accent} strokeWidth="2" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="40" y={56 + i * 16} width="40" height="7" rx="2" fill="#5a5a66" />
        ))}
        <path d="M 100 79 L 118 79" stroke="#5a5a66" strokeWidth="2" strokeDasharray="3 2" />
        <rect x="124" y="40" width="46" height="78" rx="6" fill="#1b1b22" stroke="#3a3a44" strokeWidth="2" />
        <text x="147" y="72" textAnchor="middle" fontSize="16" fill="#5a5a66" fontFamily="monospace">{'</>'}</text>
      </Frame>
    )
  }
  if (focus === 'game-ideation-divergent') {
    return (
      <Frame>
        <circle cx="46" cy="86" r="8" fill={accent} />
        {[[100, 42], [130, 66], [140, 96], [120, 124], [90, 136]].map(([x, y], i) => (
          <g key={i}>
            <path d={`M 54 86 L ${x} ${y}`} stroke={i === 2 ? accent : '#5a5a66'} strokeWidth={i === 2 ? 2.5 : 1.5} />
            <circle cx={x} cy={y} r={i === 2 ? 9 : 6} fill={i === 2 ? accent : '#3a3a44'} />
          </g>
        ))}
      </Frame>
    )
  }
  if (focus === 'game-playtest-silent') {
    return (
      <Frame>
        <circle cx="56" cy="64" r="16" fill="#26262e" stroke="#5a5a66" strokeWidth="2" />
        <path d="M 48 68 L 64 68" stroke="#5a5a66" strokeWidth="2" strokeLinecap="round" />
        <rect x="40" y="96" width="32" height="40" rx="4" fill="#26262e" stroke="#3a3a44" strokeWidth="2" />
        <rect x="100" y="48" width="70" height="46" rx="8" fill="#1b2230" stroke={accent} strokeWidth="2" />
        <circle cx="170" cy="52" r="10" fill="none" stroke={accent} strokeWidth="2" />
        <path d="M 163 59 L 177 45" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      </Frame>
    )
  }
  if (focus === 'game-pitch-hook') {
    return (
      <Frame>
        <rect x="28" y="44" width="144" height="64" rx="10" fill="#26262e" stroke={accent} strokeWidth="2" />
        <path d="M 28 108 L 44 108 L 36 124 Z" fill="#26262e" stroke={accent} strokeWidth="2" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="44" y={60 + i * 16} width={i === 0 ? 100 : 70} height="8" rx="4" fill={i === 0 ? accent : '#5a5a66'} />
        ))}
        <path d="M 150 30 C 150 46, 166 46, 166 30" stroke={accent} strokeWidth="2.5" fill="none" />
      </Frame>
    )
  }
  if (focus === 'game-scope-jam-studio') {
    return (
      <Frame>
        <rect x="30" y="92" width="36" height="36" rx="4" fill="#26262e" stroke={accent} strokeWidth="2" />
        <text x="48" y="140" textAnchor="middle" fontSize="9" fill="#8a8a9a">джем</text>
        <rect x="100" y="40" width="80" height="88" rx="4" fill="#26262e" stroke="#5a5a66" strokeWidth="2" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="112" y={54 + i * 18} width="56" height="8" rx="3" fill="#5a5a66" />
        ))}
        <text x="140" y="140" textAnchor="middle" fontSize="9" fill="#8a8a9a">студія</text>
      </Frame>
    )
  }
  // default: загальний макет сайту (лише для Web Design)
  return (
    <Frame>
      <rect x="20" y="46" width="160" height="22" rx="4" fill={accent} opacity="0.85" />
      <rect x="20" y="74" width="160" height="60" rx="4" fill="#2a2a34" />
      <rect x="32" y="90" width="100" height="10" rx="5" fill="#8a8a9a" />
      <rect x="32" y="106" width="70" height="10" rx="5" fill="#8a8a9a" />
      <rect x="32" y="122" width="40" height="12" rx="6" fill={accent} />
      <rect x="20" y="142" width="75" height="44" rx="4" fill="#2a2a34" />
      <rect x="105" y="142" width="75" height="44" rx="4" fill="#2a2a34" />
      <rect x="20" y="196" width="160" height="34" rx="4" fill="#26262e" />
    </Frame>
  )
}

// Час "на читання" для мовчазного режиму (без голосу) — орієнтовно
// швидкість читання дорослою людиною, з розумними межами, щоб і короткий,
// і довгий підпис встигали прочитатись, не затягуючи огляд надовго.
function readingDuration(text) {
  return Math.min(6000, Math.max(2200, text.length * 55))
}

export default function LessonReel({ module }) {
  const scenes = buildScenes(module)
  const [state, setState] = useState('idle') // idle | loading | playing | error | done
  const [sceneIndex, setSceneIndex] = useState(0)
  const [voiceOn, setVoiceOn] = useState(true)
  const audioRef = useRef(null)
  const blobUrlRef = useRef(null)
  const requestIdRef = useRef(0)
  const timeoutRef = useRef(null)
  // playScene читає ЦЕ, а не параметр функції чи замкнене значення стану —
  // інакше кнопка звуку, натиснута ПІД ЧАС відтворення, ніяк не впливала б
  // на наступні сцени (voiceOn із замикання застиг би на моменті старту).
  const voiceOnRef = useRef(true)

  function cleanup() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; audioRef.current = null }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }

  useEffect(() => () => cleanup(), [])

  // Кнопка звуку працює в будь-який момент, і навіть коли аудіо вже
  // грає — миттєво вмикає/вимикає його через .muted, без перезапуску сцени.
  function toggleVoice() {
    setVoiceOn((v) => {
      const next = !v
      voiceOnRef.current = next
      if (audioRef.current) audioRef.current.muted = !next
      return next
    })
  }

  async function playScene(i, myId) {
    if (i >= scenes.length) {
      if (myId === requestIdRef.current) { setState('done'); cleanup() }
      return
    }
    setSceneIndex(i)

    if (!voiceOnRef.current) {
      // Беззвучний режим — просто текстові слайди, що гортаються за часом
      // на читання, без жодного звернення до голосового рушія.
      setState('playing')
      timeoutRef.current = setTimeout(() => { if (myId === requestIdRef.current) playScene(i + 1, myId) }, readingDuration(scenes[i].caption))
      return
    }

    setState('loading')
    try {
      const blob = await withTimeout(synthesizeSpeechWav(scenes[i].caption))
      if (myId !== requestIdRef.current) return
      cleanup()
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      const audio = new Audio(url)
      audio.muted = !voiceOnRef.current
      audioRef.current = audio
      audio.onended = () => { if (myId === requestIdRef.current) playScene(i + 1, myId) }
      audio.onerror = () => { if (myId === requestIdRef.current) playScene(i + 1, myId) }
      await audio.play()
      if (myId !== requestIdRef.current) return
      setState('playing')
    } catch {
      // Озвучення не вдалося (мережа тощо) — все одно показуємо картку й
      // перейдемо далі за часом, щоб короткий огляд не завис назавжди.
      if (myId !== requestIdRef.current) return
      setState('playing')
      timeoutRef.current = setTimeout(() => { if (myId === requestIdRef.current) playScene(i + 1, myId) }, 2500)
    }
  }

  function start() {
    const myId = ++requestIdRef.current
    voiceOnRef.current = voiceOn
    playScene(0, myId)
  }

  function stop() {
    requestIdRef.current += 1
    cleanup()
    setState('idle')
    setSceneIndex(0)
  }

  if (scenes.length === 0) return null
  const scene = scenes[Math.min(sceneIndex, scenes.length - 1)]
  const isActive = state === 'playing' || state === 'loading'

  return (
    <div className="lesson-reel">
      <p className="eyebrow">🎬 Короткий огляд</p>
      <div className="lesson-reel-card">
        <BrowserMockup focus={isActive ? scene.focus : (scenes[0]?.focus || 'site')} alert={isActive && scene.kind === 'mistake'} />

        {isActive ? (
          <div className="lesson-reel-caption-wrap">
            {scene.kind === 'mistake' && <span className="lesson-reel-flag">⚠️ Типова помилка</span>}
            <p className="lesson-reel-caption">{scene.caption}</p>
          </div>
        ) : (
          <div className="lesson-reel-cover">
            <p className="lesson-reel-cover-title">{module.title}</p>
          </div>
        )}

        {isActive && (
          <div className="lesson-reel-progress">
            {scenes.map((_, i) => (
              <span key={i} className={'lesson-reel-dot' + (i === sceneIndex ? ' active' : i < sceneIndex ? ' done' : '')} />
            ))}
          </div>
        )}
      </div>

      <div className="lesson-reel-controls">
        <button
          className="harmony-btn"
          onClick={toggleVoice}
          title={voiceOn ? 'Вимкнути звук' : 'Увімкнути звук'}
          aria-label={voiceOn ? 'Вимкнути звук' : 'Увімкнути звук'}
        >
          {voiceOn ? '🔊' : '🔇'}
        </button>
        {!isActive && state !== 'done' && (
          <button className="pf-add-btn" onClick={start}>▶ Переглянути огляд</button>
        )}
        {state === 'done' && (
          <button className="harmony-btn" onClick={start}>↻ Переглянути ще раз</button>
        )}
        {isActive && (
          <button className="harmony-btn" onClick={stop}>⏹ Зупинити</button>
        )}
      </div>
    </div>
  )
}
