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
  // екрана застосунку (status bar + контент + таб-бар), а не сайт.
  return level === 'app-design' ? 'app-shell' : 'site'
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
