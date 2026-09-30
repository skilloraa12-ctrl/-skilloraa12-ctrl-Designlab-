// Реальні інструменти, якими можна виконати практику уроку ЗАМІСТЬ
// вбудованого ескізника — для тих, хто вже хоче працювати в справжніх
// сервісах, а не лише в навчальному застосунку. Прив'язано до subcategory
// (не до кожного уроку окремо, щоб не дублювати десятки разів той самий
// набір інструментів).
//
// tag: 'free' (повністю безкоштовно) | 'freemium' (є безкоштовний план) |
// 'paid' (лише платно).
//
// Записи двох видів:
// - internal: true — веде на вже готовий гайд цього інструменту всередині
//   платформи (data/tools/tools.js, розділ /tools) — там повний опис,
//   кроки й огляд інтерфейсу, а не просто зовнішнє посилання.
// - internal: false (або відсутній) — зовнішній сайт (браузерні
//   інструменти, довідники, чекери — те, чого немає в каталозі
//   Інструментів, бо це не "застосунок для роботи", а утиліта/довідка).
export const TOOLS_BY_SUBCATEGORY = {
  'web-design-basics': [
    { name: 'Chrome DevTools (вкладка Мережа)', tag: 'free', href: 'https://developer.chrome.com/docs/devtools/network/reference/', note: 'дивись реальні request/response будь-якого сайту' },
    { name: 'httpstatus.io', tag: 'free', href: 'https://httpstatus.io', note: 'перевір протокол і статус реальної адреси' },
    { name: 'MDN — як працює вебмережа', tag: 'free', href: 'https://developer.mozilla.org/uk/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work', note: '' },
  ],
  'visual-design-basics': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Canva', tag: 'freemium', internal: true, category: 'graphic-design', id: 'canva' },
  ],
  'composition-layout': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Canva', tag: 'freemium', internal: true, category: 'graphic-design', id: 'canva' },
  ],
  color: [
    { name: 'Adobe Color', tag: 'free', href: 'https://color.adobe.com', note: 'побудова й перевірка кольорових схем' },
    { name: 'Coolors', tag: 'free', href: 'https://coolors.co', note: 'швидка генерація палітр' },
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
  ],
  typography: [
    { name: 'Google Fonts', tag: 'free', href: 'https://fonts.google.com', note: 'реальні безкоштовні шрифти для сайту' },
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
  ],
  'visual-assets': [
    { name: 'Canva', tag: 'freemium', internal: true, category: 'graphic-design', id: 'canva' },
    { name: 'Squoosh', tag: 'free', href: 'https://squoosh.app', note: 'стиснення зображень для вебу' },
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
  ],
  'website-structure': [
    { name: 'FigJam', tag: 'freemium', internal: true, category: 'ux-design', id: 'figjam' },
    { name: 'Whimsical', tag: 'freemium', internal: true, category: 'ux-design', id: 'whimsical' },
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
  ],
  'web-components': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'FigJam', tag: 'freemium', internal: true, category: 'ux-design', id: 'figjam' },
    { name: 'Webflow', tag: 'freemium', internal: true, category: 'web-design', id: 'webflow' },
  ],
  'responsive-web-design': [
    { name: 'Chrome DevTools (Device Mode)', tag: 'free', href: 'https://developer.chrome.com/docs/devtools/device-mode/', note: 'реальна перевірка адаптивності' },
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Webflow', tag: 'freemium', internal: true, category: 'web-design', id: 'webflow' },
  ],
  'design-systems': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Zeplin', tag: 'freemium', internal: true, category: 'ui-design', id: 'zeplin' },
    { name: 'FigJam', tag: 'freemium', internal: true, category: 'ux-design', id: 'figjam' },
  ],
  wireframing: [
    { name: 'Balsamiq', tag: 'paid', internal: true, category: 'ui-design', id: 'balsamiq' },
    { name: 'Whimsical', tag: 'freemium', internal: true, category: 'ux-design', id: 'whimsical' },
    { name: 'Moqups', tag: 'freemium', internal: true, category: 'ui-design', id: 'moqups' },
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
  ],
  prototyping: [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Marvel App', tag: 'freemium', internal: true, category: 'app-design', id: 'marvel-app' },
    { name: 'ProtoPie', tag: 'freemium', internal: true, category: 'app-design', id: 'protopie' },
  ],
  'motion-animation': [
    { name: 'Figma (Smart Animate)', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Rive', tag: 'freemium', internal: true, category: 'motion-design', id: 'rive' },
    { name: 'LottieFiles', tag: 'freemium', internal: true, category: 'motion-design', id: 'lottiefiles' },
  ],
  accessibility: [
    { name: 'WAVE', tag: 'free', href: 'https://wave.webaim.org', note: 'перевірка доступності реального сайту' },
    { name: 'WebAIM Contrast Checker', tag: 'free', href: 'https://webaim.org/resources/contrastchecker/', note: '' },
    { name: 'axe DevTools', tag: 'free', href: 'https://www.deque.com/axe/devtools/', note: 'розширення браузера' },
  ],
  'figma-basics': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'FigJam', tag: 'freemium', internal: true, category: 'ux-design', id: 'figjam' },
  ],
  'figma-layout': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
  ],
  'figma-design-system': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Zeplin', tag: 'freemium', internal: true, category: 'ui-design', id: 'zeplin' },
  ],
  'figma-prototype': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
  ],
  'figma-web-design': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Webflow', tag: 'freemium', internal: true, category: 'web-design', id: 'webflow' },
  ],
  'tech-minimum': [
    { name: 'Chrome DevTools', tag: 'free', href: 'https://developer.chrome.com/docs/devtools/', note: '' },
    { name: 'MDN Web Docs', tag: 'free', href: 'https://developer.mozilla.org', note: '' },
    { name: 'caniuse.com', tag: 'free', href: 'https://caniuse.com', note: 'підтримка функцій у браузерах' },
  ],
  'design-to-development': [
    { name: 'CodePen', tag: 'free', href: 'https://codepen.io', note: 'живий HTML/CSS/JS у браузері' },
    { name: 'VS Code + Live Server', tag: 'free', href: 'https://code.visualstudio.com/', note: 'локальний редактор з автооновленням' },
    { name: 'Zeplin', tag: 'freemium', internal: true, category: 'ui-design', id: 'zeplin' },
    { name: 'GitHub', tag: 'freemium', href: 'https://github.com', note: '' },
  ],
  'website-types-practice': [
    { name: 'Webflow', tag: 'freemium', internal: true, category: 'web-design', id: 'webflow' },
    { name: 'Wix', tag: 'freemium', internal: true, category: 'web-design', id: 'wix' },
    { name: 'Framer', tag: 'freemium', internal: true, category: 'web-design', id: 'framer' },
    { name: 'WordPress.com', tag: 'freemium', internal: true, category: 'web-design', id: 'wordpress-com' },
  ],
  'real-projects': [
    { name: 'Figma', tag: 'freemium', internal: true, category: 'ui-design', id: 'figma' },
    { name: 'Webflow', tag: 'freemium', internal: true, category: 'web-design', id: 'webflow' },
    { name: 'GitHub', tag: 'freemium', href: 'https://github.com', note: '' },
    { name: 'Netlify', tag: 'freemium', internal: true, category: 'web-design', id: 'netlify' },
  ],
  'web-designer-portfolio': [
    { name: 'Behance', tag: 'free', href: 'https://behance.net', note: 'публікація кейсів' },
    { name: 'Dribbble', tag: 'freemium', href: 'https://dribbble.com', note: '' },
    { name: 'Framer', tag: 'freemium', internal: true, category: 'web-design', id: 'framer' },
    { name: 'Netlify', tag: 'freemium', internal: true, category: 'web-design', id: 'netlify' },
  ],
}

export function getPracticeTools(subcategory) {
  return TOOLS_BY_SUBCATEGORY[subcategory] || []
}
