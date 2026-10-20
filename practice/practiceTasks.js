// Опис завдань для вкладки «Практика» — ТЗ розділ 5. Завдання — статичні
// дані в коді (та сама логіка, що й уроки в modules.js: контент тут не з
// CMS/БД, а з коду репозиторію).
//
// Чесна межа цього заходу: Vector Studio (Graphic/Logo/Branding) — єдиний
// повністю збудований редактор, тож лише для нього є вручну підібрані
// завдання за шаблонами з ТЗ розділу 8 (по 2 на напрям, прив'язані до
// реальних уроків modules.js). Для решти уроків цих трьох напрямів
// getPracticeTask() повертає ЗАГАЛЬНУ вправу на розділ (чесно позначену
// як загальну, не підігнану під конкретний урок) — це дає практику
// одразу по всій програмі, а не лише в 6 уроках. Для 3D Design/Game Art/
// UX/UI/Web/App/Motion/Advertising/Game Design завдань ще немає — у них
// немає редактора (practiceProject.js: editorReady=false).

export const COURSE_PALETTE = ['#F59E0B', '#0B0B0C', '#FFFFFF', '#2E6DFF', '#FF5A1F', '#10B981']

function vectorStart(artboard) {
  return {
    objects: [],
    artboards: [{ id: 'ab1', name: 'Артборд 1', ...artboard }],
    palette: [],
    exportedFormats: [],
    variants: [],
  }
}

function flowStart() {
  return { frames: [], objects: [], links: [], palette: [] }
}

const A4 = { w: 595, h: 842, x: 0, y: 0, bg: '#ffffff' }
const SQUARE = { w: 400, h: 400, x: 0, y: 0, bg: '#ffffff' }

// Вручну підібрані завдання (ТЗ розділ 8), по 2 на напрям Vector Studio.
const HAND_TASKS = {
  20701: { // Graphic Design → «Призначення та види постерів»
    title: 'Афіша A4',
    goal: 'Побудуй просту афішу на артборді A4: щонайменше 3 фігури/текстові блоки, текст із заданим шрифтом, і хоч один елемент вирівняно до напрямної.',
    estimateMin: 15, xp: 50, maxAttempts: 5,
    startProject: vectorStart(A4),
    goals: [
      { id: 'g1', text: 'Щонайменше 3 фігури чи написи', validator: 'shapeCount', params: { min: 2 }, weight: 1 },
      { id: 'g2', text: 'Текст із заданим шрифтом', validator: 'textHasFont', params: {}, weight: 1 },
      { id: 'g3', text: 'Хоч один елемент вирівняно до напрямної', validator: 'alignedToGuide', params: { min: 1 }, weight: 1 },
    ],
    hints: [
      'Почни з великого прямокутника чи кола як фонової плями — потім додай заголовок.',
      'Натисни T і клацни на полотні, щоб додати текст; у властивостях обери шрифт.',
      'Увімкни притягування (клавіша S) і піднеси фігуру до напрямної — вона сама «прилипне».',
    ],
  },
  20301: { // Graphic Design → «Що таке колір і колірне коло»
    title: 'Кольорова гармонія',
    goal: 'Склади композицію щонайменше з 2 фігур, використавши колір із палітри курсу, не більше 5 кольорів загалом.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: { ...vectorStart(SQUARE), palette: COURSE_PALETTE.slice(0, 5) },
    goals: [
      { id: 'g1', text: 'Щонайменше 2 фігури', validator: 'shapeCount', params: { min: 2 }, weight: 1 },
      { id: 'g2', text: 'Використано колір із палітри курсу', validator: 'colorUsed', params: {}, weight: 1 },
      { id: 'g3', text: 'Не більше 5 кольорів у роботі', validator: 'colorsMax', params: { max: 5 }, weight: 1 },
    ],
    hints: [
      'У правій панелі «Властивості» для заливки обери колір прямо з палітри курсу, не з довільного пікера.',
      'Рахуй кожен унікальний fill/stroke окремо — повторне використання того самого кольору не додає до ліміту.',
      'Три-чотири фігури різного розміру тим самим кольором виглядають гармонійніше, ніж п’ять різних.',
    ],
  },
  29401: { // Logo Design → «Побудова на сітці»
    title: 'Побудова на сітці',
    goal: 'Побудуй просту форму логотипа з базових фігур, вирівнявши їх до напрямних побудови.',
    estimateMin: 15, xp: 50, maxAttempts: 5,
    startProject: vectorStart(SQUARE),
    goals: [
      { id: 'g1', text: 'Є хоча б одна фігура', validator: 'shapeCount', params: { min: 1 }, weight: 1 },
      { id: 'g2', text: 'Вирівняно до напрямної', validator: 'alignedToGuide', params: { min: 1 }, weight: 1 },
    ],
    hints: [
      'Почни з найпростішої форми — кола чи квадрата — що стане «кістяком» знака.',
      'Увімкни сітку й притягування (S), щоб форма лягала точно на перетини.',
      'Знак не мусить бути складним: впізнаваний силует важливіший за деталі.',
    ],
  },
  29701: { // Logo Design → «Основна та допоміжна версія»
    title: 'Три варіанти логотипа',
    goal: 'Збережи поточний стан логотипа як варіант щонайменше 3 рази (кольоровий, спрощений, інший розмір) кнопкою «Зберегти варіант».',
    estimateMin: 10, xp: 40, maxAttempts: 5,
    startProject: vectorStart(SQUARE),
    goals: [
      { id: 'g1', text: 'Є хоча б одна фігура', validator: 'shapeCount', params: { min: 1 }, weight: 1 },
      { id: 'g2', text: 'Збережено щонайменше 3 варіанти', validator: 'hasVariants', params: { min: 3 }, weight: 2 },
    ],
    hints: [
      'Спочатку зроби повноколірну версію й збережи її як варіант.',
      'Зміни кольори на чорно-білі (чи приберіть заливку) і збережи ще раз.',
      'Зменш чи спрости форму для дрібного розміру — це теж окремий варіант.',
    ],
  },
  22701: { // Branding → «Колір у брендингу»
    title: 'Палітра бренду',
    goal: 'Склади палітру бренду щонайменше з 5 кольорів і перевір, що основний колір тексту проходить контраст WCAG AA на фоні.',
    estimateMin: 15, xp: 45, maxAttempts: 5,
    startProject: vectorStart(SQUARE),
    goals: [
      { id: 'g1', text: 'У палітрі щонайменше 5 кольорів', validator: 'paletteSize', params: { min: 5 }, weight: 1 },
      { id: 'g2', text: 'Контраст тексту ≥ 4.5:1', validator: 'contrastRatio', params: { min: 4.5 }, weight: 1 },
    ],
    hints: [
      'Додай 5 кольорів у палітру проєкту: основний, додатковий, 2 нейтральні, 1 акцент.',
      'Додай текстовий об’єкт основним кольором — саме його колір і перевіряється на контраст.',
      'Якщо контраст не проходить — затемни чи освітли колір тексту чи фону артборду.',
    ],
  },
  22801: { // Branding → «Роль типографіки в брендингу»
    title: 'Типографіка бренду',
    goal: 'Додай текстові написи щонайменше двома різними шрифтами — наприклад, заголовний і допоміжний.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: vectorStart(SQUARE),
    goals: [
      { id: 'g1', text: 'Щонайменше 2 різні шрифти', validator: 'fontsUsed', params: { min: 2 }, weight: 1 },
      { id: 'g2', text: 'У кожного тексту заданий шрифт', validator: 'textHasFont', params: {}, weight: 1 },
    ],
    hints: [
      'Додай текст інструментом T, потім обери шрифт у властивостях справа.',
      'Другий напис зроби іншим шрифтом зі списку — наприклад, контрастним до першого.',
      'Шрифт за замовчуванням теж рахується — головне, щоб у двох текстів шрифти відрізнялись.',
    ],
  },
}

// Flow & Layout Studio — по 2 вручну підібрані завдання на напрям (ТЗ
// розділ 8), прив'язані до реальних уроків modules.js.
const FLOW_HAND_TASKS = {
  27081: { // UX Design → «Що таке User Flow і типи блоків потоку»
    title: 'User flow покупки',
    goal: 'Побудуй потік із щонайменше 3 екранів і звʼяжи їх стрілками так, щоб кожен екран був досяжний від початкового.',
    estimateMin: 15, xp: 45, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 3 екрани', validator: 'screenCount', params: { min: 3 }, weight: 1 },
      { id: 'g2', text: 'Щонайменше 2 звʼязки між екранами', validator: 'hasLink', params: { min: 2 }, weight: 1 },
      { id: 'g3', text: 'Усі екрани досяжні від першого', validator: 'allScreensReachable', params: {}, weight: 1 },
    ],
    hints: [
      'Додай 3 екрани кнопками-пресетами внизу (вкладка «Екрани») — напр. каталог, картка товару, кошик.',
      'Обери інструмент «Зв’язок» (↗), клікни на перший екран, потім на другий — зʼявиться стрілка.',
      'Перевір, що до КОЖНОГО екрана, крім першого, веде хоч одна стрілка.',
    ],
  },
  27091: { // UX Design → «Low-fidelity проти mid-fidelity вайрфреймів»
    title: 'Low-fi wireframe',
    goal: 'Зроби простий чорно-білий вайрфрейм одного екрана — без кольорової палітри, лише форма й розташування.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Є хоча б один екран', validator: 'screenCount', params: { min: 1 }, weight: 1 },
      { id: 'g2', text: 'Не більше 3 кольорів (сіра палітра)', validator: 'colorsMax', params: { max: 3 }, weight: 1 },
    ],
    hints: [
      'Додай екран (Mobile чи Desktop) кнопкою-пресетом.',
      'Додавай лише прямокутники й текст сірими відтінками — без яскравих кольорів.',
      'Low-fi — це про розташування блоків, а не про фінальний вигляд.',
    ],
  },
  10201: { // UI Design → «Affordance»
    title: 'Кнопка в 4 станах',
    goal: 'Додай компонент «Кнопка» чотири рази з різними станами: Default, Hover, Pressed, Disabled.',
    estimateMin: 10, xp: 40, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: '4 кнопки на полотні', validator: 'componentUsed', params: { type: 'button', min: 4 }, weight: 1 },
      { id: 'g2', text: '4 різні стани', validator: 'stateDefined', params: { type: 'button', count: 4 }, weight: 1 },
    ],
    hints: [
      'Додай екран, потім у вкладці «Компоненти» обери «Кнопка» й клікни на полотні 4 рази.',
      'Обери кожну кнопку окремо й у властивостях справа зміни «Стан».',
      'У кожної з 4 кнопок має бути свій, не повторений стан.',
    ],
  },
  5801: { // App Design → «Buttons (кнопки)»
    title: 'Нижня навігація з 4 вкладок',
    goal: 'Додай 4 таби нижньої навігації на один мобільний екран.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Є мобільний екран', validator: 'screenCount', params: { min: 1 }, weight: 1 },
      { id: 'g2', text: '4 таби', validator: 'componentUsed', params: { type: 'tab', min: 4 }, weight: 2 },
    ],
    hints: [
      'Додай екран Mobile кнопкою-пресетом.',
      'У вкладці «Компоненти» обери «Таб» і додай 4 штуки в один ряд унизу екрана.',
      'Розташуй таби рівномірно за шириною екрана (375px / 4 ≈ по 90px кожен).',
    ],
  },
  701: { // Web Design → «Header — шапка сайту»
    title: 'Структура сторінки',
    goal: 'Побудуй структуру сторінки на Desktop-екрані: нав-панель угорі, хоча б один блок вмісту.',
    estimateMin: 12, xp: 40, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Є екран', validator: 'screenCount', params: { min: 1 }, weight: 1 },
      { id: 'g2', text: 'Є нав-панель', validator: 'componentUsed', params: { type: 'nav', min: 1 }, weight: 1 },
    ],
    hints: [
      'Додай екран Desktop.',
      'У вкладці «Компоненти» обери «Нав-панель» і розмісти її вгорі екрана.',
      'Додай ще картку чи текст нижче — це вже вміст сторінки.',
    ],
  },
  801: { // Web Design → «Buttons — кнопки»
    title: 'CTA-блок',
    goal: 'Додай кнопку розміром не менше 44×44px і текстовий підпис поруч, що проходить контраст WCAG AA.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Кнопка ≥ 44×44px', validator: 'minTapTarget', params: { px: 44 }, weight: 1 },
      { id: 'g2', text: 'Контраст тексту ≥ 4.5:1', validator: 'contrastRatio', params: { min: 4.5 }, weight: 1 },
    ],
    hints: [
      'Додай екран, потім компонент «Кнопка» — за замовчуванням вона вже 120×44px.',
      'Додай текстовий об’єкт темним кольором — фон екрана завжди білий.',
      'Якщо текст замалий чи закритого кольору — зміни fill на темніший у властивостях.',
    ],
  },
}

// Загальна Flow-вправа для решти уроків UX/UI/Web/App.
function genericFlowTask(module) {
  return {
    title: `Практика: ${module.title}`,
    goal: 'Додай екран і розмісти на ньому хоча б один компонент.',
    estimateMin: 10, xp: 25, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Є хоча б один екран', validator: 'screenCount', params: { min: 1 }, weight: 1 },
      { id: 'g2', text: 'Є хоча б 2 обʼєкти на полотні', validator: 'countObjects', params: { min: 2 }, weight: 1 },
    ],
    hints: [
      'Додай екран кнопкою-пресетом у вкладці «Екрани».',
      'У вкладці «Компоненти» обери будь-який і клікни на полотні.',
      'Перевір результат кнопкою «Перевірити».',
    ],
  }
}

const FLOW_LEVEL_PROFILE = { 'ux-design': 'ux', 'ui-design': 'ui', 'web-design': 'web', 'app-design': 'app' }

// Загальна (не підігнана під урок) вправа — доступна в будь-якому уроці
// Graphic/Logo/Branding без власноруч підібраного завдання, щоб «Практика»
// працювала по всій програмі курсу, а не лише в кількох уроках.
function genericVectorTask(module) {
  return {
    title: `Практика: ${module.title}`,
    goal: 'Застосуй побачене в уроці на полотні: додай щонайменше 2 об’єкти та задай їм колір із палітри курсу.',
    estimateMin: 10, xp: 25, maxAttempts: 5,
    startProject: { ...vectorStart(SQUARE), palette: COURSE_PALETTE.slice(0, 5) },
    goals: [
      { id: 'g1', text: 'Щонайменше 2 об’єкти на полотні', validator: 'countObjects', params: { min: 2 }, weight: 1 },
      { id: 'g2', text: 'Використано колір із палітри курсу', validator: 'colorUsed', params: {}, weight: 1 },
    ],
    hints: [
      'Додай фігуру чи текст інструментами зліва — вибери, що найкраще пасує до теми уроку.',
      'У властивостях справа онови заливку чи колір тексту — обери прямо з палітри курсу.',
      'Перевір результат кнопкою «Перевірити»; чекліст покаже, чого саме бракує.',
    ],
  }
}

const VECTOR_LEVELS = ['graphic-design', 'logo-design', 'branding']
const VECTOR_PROFILE = { 'graphic-design': 'graphic', 'logo-design': 'logo', branding: 'branding' }

export function getPracticeTask(module) {
  if (VECTOR_LEVELS.includes(module.level)) {
    const info = HAND_TASKS[module.id]
    const base = info || genericVectorTask(module)
    return {
      ...base,
      taskId: `task-${module.id}`,
      lessonId: module.id,
      editor: 'vector',
      profile: VECTOR_PROFILE[module.level],
      isHandAuthored: !!info,
    }
  }
  if (FLOW_LEVEL_PROFILE[module.level]) {
    const info = FLOW_HAND_TASKS[module.id]
    const base = info || genericFlowTask(module)
    return {
      ...base,
      taskId: `task-${module.id}`,
      lessonId: module.id,
      editor: 'flow',
      profile: FLOW_LEVEL_PROFILE[module.level],
      isHandAuthored: !!info,
    }
  }
  return null
}
