// Опис завдань для вкладки «Практика» — ТЗ розділ 5. Завдання — статичні
// дані в коді (та сама логіка, що й уроки в modules.js: контент тут не з
// CMS/БД, а з коду репозиторію).
//
// Чесна межа цього заходу: для кожного вже збудованого редактора (Vector/
// Flow & Layout/Game Systems Board/3D Studio — 10 із 12 напрямів) є кілька
// вручну підібраних завдань за шаблонами з ТЗ розділу 8, прив'язаних до
// реальних уроків modules.js. Для решти уроків цих напрямів getPracticeTask()
// повертає ЗАГАЛЬНУ вправу на розділ (чесно позначену як загальну, не
// підігнану під конкретний урок) — це дає практику одразу по всій програмі,
// а не лише в кількох уроках. Motion Design/Advertising Design (Motion
// Studio) залишаються без редактора цього заходу — повертається null,
// PracticePage.jsx показує чесну заглушку (practiceProject.js:
// editorReady=false).

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
  10601: { // UI Design → «Mega Menu»
    title: 'Складна навігація',
    goal: 'Побудуй нав-панель із кількома пунктами меню — додай нав-панель і щонайменше 3 додаткові елементи поруч із нею.',
    estimateMin: 12, xp: 35, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Є нав-панель', validator: 'componentUsed', params: { type: 'nav', min: 1 }, weight: 1 },
      { id: 'g2', text: 'Щонайменше 4 обʼєкти загалом (пункти меню)', validator: 'countObjects', params: { min: 4 }, weight: 1 },
    ],
    hints: [
      'Додай екран Desktop і компонент «Нав-панель» угорі.',
      'Додай кілька текстових написів поруч із нав-панеллю — це пункти меню.',
      'Mega Menu зазвичай показує кілька колонок посилань, а не один рядок.',
    ],
  },
  10701: { // UI Design → «Table Anatomy»
    title: 'Анатомія таблиці',
    goal: 'Побудуй просту таблицю зі щонайменше 3 рядків — використай «Елемент списку» для кожного рядка.',
    estimateMin: 10, xp: 30, maxAttempts: 5,
    startProject: flowStart(),
    goals: [{ id: 'g1', text: 'Щонайменше 3 рядки (елементи списку)', validator: 'componentUsed', params: { type: 'listitem', min: 3 }, weight: 1 }],
    hints: [
      'Додай екран Desktop.',
      'У «Компоненти» обери «Елемент списку» й додай 3 штуки одна під одною.',
      'Вирівняй їх по X, щоб утворити рядки таблиці.',
    ],
  },
  10801: { // UI Design → «Search UI»
    title: 'Пошукова панель',
    goal: 'Збери пошукову панель: поле вводу поруч із кнопкою.',
    estimateMin: 10, xp: 30, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Є поле вводу', validator: 'componentUsed', params: { type: 'input', min: 1 }, weight: 1 },
      { id: 'g2', text: 'Є кнопка', validator: 'componentUsed', params: { type: 'button', min: 1 }, weight: 1 },
    ],
    hints: [
      'Додай екран.',
      'У «Компоненти» обери «Поле вводу», розмісти його.',
      'Додай «Кнопку» одразу праворуч від поля — це кнопка пошуку.',
    ],
  },
  10901: { // UI Design → «Multi-step Forms»
    title: 'Багатокрокова форма',
    goal: 'Розбий форму на щонайменше 2 екрани-кроки, звʼязані переходом.',
    estimateMin: 12, xp: 40, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 2 екрани', validator: 'screenCount', params: { min: 2 }, weight: 1 },
      { id: 'g2', text: 'Є перехід між ними', validator: 'hasLink', params: { min: 1 }, weight: 1 },
    ],
    hints: [
      'Додай 2 екрани Mobile — «Крок 1» і «Крок 2».',
      'На кожному додай поле вводу.',
      'Інструментом «Зв’язок» зʼєднай перший екран із другим.',
    ],
  },
  11001: { // UI Design → «Dashboard Layout»
    title: 'Макет дашборда',
    goal: 'Розклади щонайменше 3 картки даних на одному екрані.',
    estimateMin: 12, xp: 35, maxAttempts: 5,
    startProject: flowStart(),
    goals: [{ id: 'g1', text: 'Щонайменше 3 картки', validator: 'componentUsed', params: { type: 'card', min: 3 }, weight: 1 }],
    hints: [
      'Додай екран Desktop.',
      'У «Компоненти» обери «Картка» й додай 3 штуки в ряд чи сітку.',
      'Кожна картка дашборда зазвичай показує одну метрику чи графік.',
    ],
  },
  11101: { // UI Design → «Toasts»
    title: 'Сповіщення (toast)',
    goal: 'Додай невеликий елемент сповіщення — картку з коротким текстом.',
    estimateMin: 8, xp: 25, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Є картка-сповіщення', validator: 'componentUsed', params: { type: 'card', min: 1 }, weight: 1 },
      { id: 'g2', text: 'Є текст усередині чи поруч', validator: 'countObjects', params: { min: 2 }, weight: 1 },
    ],
    hints: [
      'Додай екран і маленьку картку в кутку.',
      'Додай короткий текст на ній — "Збережено", "Помилка" тощо.',
      'Toast зазвичай зʼявляється в кутку екрана й не блокує решту інтерфейсу.',
    ],
  },
  5701: { // App Design → «Status Bar» (екранна структура)
    title: 'Онбординг з трьох екранів',
    goal: 'Побудуй онбординг щонайменше з 3 мобільних екранів, звʼязаних переходами по черзі.',
    estimateMin: 12, xp: 40, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 3 екрани', validator: 'screenCount', params: { min: 3 }, weight: 1 },
      { id: 'g2', text: 'Усі екрани досяжні від першого', validator: 'allScreensReachable', params: {}, weight: 1 },
    ],
    hints: [
      'Додай 3 екрани Mobile.',
      'На кожному додай текст-заголовок кроку.',
      'Звʼяжи 1→2→3 інструментом «Зв’язок».',
    ],
  },
  5901: { // App Design → «Adaptive Design»
    title: 'Безпечні зони й відступи',
    goal: 'Розклади щонайменше 3 елементи на мобільному екрані так, щоб усі інтерактивні — не менше 44×44px.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 3 обʼєкти', validator: 'countObjects', params: { min: 3 }, weight: 1 },
      { id: 'g2', text: 'Інтерактивні елементи ≥ 44×44px', validator: 'minTapTarget', params: { px: 44 }, weight: 1 },
    ],
    hints: [
      'Додай екран Mobile.',
      'Додай кнопку чи таб — за замовчуванням вони вже відповідають розміру.',
      'Не стискай їх меншими за 44px у властивостях.',
    ],
  },
  6101: { // App Design → «Що таке Wireframe»
    title: 'Low-fi wireframe мобільного екрана',
    goal: 'Зроби чорно-білий (сірий) каркас мобільного екрана без кольору.',
    estimateMin: 10, xp: 30, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Є екран', validator: 'screenCount', params: { min: 1 }, weight: 1 },
      { id: 'g2', text: 'Не більше 3 кольорів (сірі відтінки)', validator: 'colorsMax', params: { max: 3 }, weight: 1 },
    ],
    hints: [
      'Додай екран Mobile.',
      'Додавай лише прямокутники сірих відтінків — без яскравих кольорів.',
      'Wireframe показує структуру, а не фінальний дизайн.',
    ],
  },
  6201: { // App Design → «Що таке Prototype»
    title: 'Проходження прототипу',
    goal: 'Побудуй короткий прототип: 2 екрани зі звʼязком між ними.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: flowStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 2 екрани', validator: 'screenCount', params: { min: 2 }, weight: 1 },
      { id: 'g2', text: 'Є перехід між ними', validator: 'hasLink', params: { min: 1 }, weight: 1 },
    ],
    hints: [
      'Додай 2 екрани Mobile — "До" і "Після".',
      'На першому додай кнопку.',
      'Інструментом «Зв’язок» зʼєднай перший екран із другим — це і є клікабельний перехід.',
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

function gameBoardStart() {
  return { nodes: [], connections: [], table: { columns: ['Рівень', 'XP потрібно'], rows: [] } }
}

const GAME_BOARD_HAND_TASKS = {
  15301: { // Game Design → «Core Gameplay Loop»
    title: 'Основна петля',
    goal: 'Побудуй просту ігрову петлю щонайменше з 4 вузлів, яка замикається сама на себе (гравець повертається до початку).',
    estimateMin: 15, xp: 45, maxAttempts: 5,
    startProject: gameBoardStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 4 вузли', validator: 'nodeCount', params: { min: 4 }, weight: 1 },
      { id: 'g2', text: 'Петля замкнена (є цикл)', validator: 'loopClosed', params: {}, weight: 2 },
    ],
    hints: [
      'Додай 4 вузли: напр. «Дослідити», «Зібрати ресурс», «Покращити», «Спробувати знову».',
      'Інструментом «Звʼязок» зʼєднай їх по черзі стрілками: 1→2→3→4.',
      'Останній крок поверни стрілкою назад до першого вузла — це і замикає петлю.',
    ],
  },
  16101: { // Game Design → «Валюти»
    title: 'Джерело й витрата ресурсу',
    goal: 'Додай вузол-ресурс (напр. «Золото») із вузлом-джерелом, що його поповнює, і вузлом-дією, що його витрачає.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: gameBoardStart(),
    goals: [
      { id: 'g1', text: 'Є вузол-ресурс із джерелом і витратою', validator: 'resourceSourceAndSink', params: {}, weight: 1 },
    ],
    hints: [
      'Додай вузол типу «Ресурс» — напр. «Золото».',
      'Додай вузол типу «Дія» (напр. «Перемога в бою») і звʼяжи його СТРІЛКОЮ ДО ресурсу — це джерело.',
      'Додай ще один вузол «Дія» (напр. «Купівля») і звʼяжи ресурс стрілкою ДО нього — це витрата.',
    ],
  },
  15601: { // Game Design → «Symmetry vs Asymmetry» (використано для таблиці балансу)
    title: 'Таблиця прогресії рівнів',
    goal: 'Заповни таблицю балансу: 5 рядків із рівнями й XP, що зростає за формулою (без ручного введення кожного числа).',
    estimateMin: 12, xp: 40, maxAttempts: 5,
    startProject: gameBoardStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 5 рядків', validator: 'tableColumnsPresent', params: { min: 2 }, weight: 1 },
      { id: 'g2', text: 'Є робоча формула (=prev+N чи =prev*N)', validator: 'formulaValid', params: { column: 1 }, weight: 1 },
      { id: 'g3', text: 'Значення зростають монотонно', validator: 'monotonicIncreasing', params: { column: 1 }, weight: 1 },
    ],
    hints: [
      'Перейди на вкладку «Баланс» унизу, додай кнопкою «+ Рядок» 5 рядків.',
      'У перший рядок другої колонки впиши число, напр. 100.',
      'У кожен наступний рядок впиши формулу =prev+50 (лінійний ріст) чи =prev*1.3 (експоненціальний).',
    ],
  },
}

function motionStart() {
  return { objects: [], duration: 5, fps: 24, exportedFormats: [] }
}

const MOTION_HAND_TASKS = {
  24601: { // Motion Design → «Анімація простих форм та морфінг»
    title: 'Поява логотипа',
    goal: 'Зроби плавну появу обʼєкта: на початку він прозорий і маленький, наприкінці — звичайного розміру й непрозорий.',
    estimateMin: 12, xp: 40, maxAttempts: 5,
    startProject: motionStart(),
    goals: [{ id: 'g1', text: 'Обʼєкт анімовано щонайменше 2 ключами', validator: 'hasKeyframes', params: { min: 1, minPerObject: 2 }, weight: 1 }],
    hints: [
      'Додай фігуру чи текст на полотно.',
      'На 0с постав малий масштаб і низьку прозорість, натисни «Додати ключ».',
      'Перетягни повзунок часу вперед, поверни масштаб і прозорість до звичайних, знову «Додати ключ».',
    ],
  },
  26101: { // Motion Design → практика ключових кадрів
    title: 'М’яч (squash and stretch)',
    goal: 'Анімуй стрибок м’яча щонайменше 5 ключовими кадрами — стискання при ударі, витягування в польоті.',
    estimateMin: 15, xp: 50, maxAttempts: 5,
    startProject: motionStart(),
    goals: [{ id: 'g1', text: 'Щонайменше 5 ключових кадрів', validator: 'hasKeyframes', params: { min: 1, minPerObject: 5 }, weight: 1 }],
    hints: [
      'Додай еліпс — це буде «м’яч».',
      'Постав ключі на різних Y (висота) по довжині таймлайна — підйом, падіння, удар.',
      'У момент удару зменш масштаб по Y (сплющення) — це і є «squash».',
    ],
  },
  31501: { // Advertising Design → стандартні розміри банерів
    title: 'Банер з CTA',
    goal: 'Зроби банер щонайменше з 2 обʼєктів (текст + кнопка-CTA), де кнопка анімована.',
    estimateMin: 12, xp: 40, maxAttempts: 5,
    startProject: motionStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 2 обʼєкти', validator: 'countObjects', params: { min: 2 }, weight: 1 },
      { id: 'g2', text: 'Є анімований обʼєкт', validator: 'hasKeyframes', params: { min: 1, minPerObject: 2 }, weight: 1 },
    ],
    hints: [
      'Додай текст (заголовок) і прямокутник (кнопка CTA).',
      'Обери кнопку, постав ключ на 0с, перейди на 1с, зміни масштаб чи позицію, постав другий ключ.',
      'Перевір відтворення кнопкою ▶ на таймлайні.',
    ],
  },
  31901: { // Advertising Design → дизайн CTA
    title: 'Анімація CTA-кнопки',
    goal: 'Анімуй кнопку заклику до дії: легке «дихання» масштабом, щоб привернути увагу.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: motionStart(),
    goals: [{ id: 'g1', text: 'Кнопка анімована щонайменше 3 ключами', validator: 'hasKeyframes', params: { min: 1, minPerObject: 3 }, weight: 1 }],
    hints: [
      'Додай прямокутник як кнопку й текст усередині чи поруч.',
      'На 0с — звичайний масштаб, на середині таймлайна — трохи більший, наприкінці — знову звичайний.',
      'Це створює ефект «пульсації», що привертає око.',
    ],
  },
}

function genericMotionTask(module) {
  return {
    title: `Практика: ${module.title}`,
    goal: 'Додай обʼєкт і постав йому щонайменше 2 ключові кадри.',
    estimateMin: 10, xp: 25, maxAttempts: 5,
    startProject: motionStart(),
    goals: [{ id: 'g1', text: 'Обʼєкт анімовано', validator: 'hasKeyframes', params: { min: 1, minPerObject: 2 }, weight: 1 }],
    hints: [
      'Додай фігуру чи текст інструментами зліва.',
      'На різних моментах таймлайна зміни позицію/масштаб/поворот і тисни «Додати ключ».',
      'Перевір результат кнопкою «Перевірити».',
    ],
  }
}

const MOTION_LEVEL_PROFILE = { 'motion-design': 'motion', 'advertising-design': 'advertising' }

function threeDStart() {
  return { objects: [], cameraView: 'iso', exportedFormats: [] }
}

const THREED_HAND_TASKS = {
  33101: { // 3D Design → «Базові примітиви»
    title: 'Стіл із трьома предметами',
    goal: 'Додай щонайменше 4 обʼєкти на сцену (напр. стіл + 3 предмети на ньому).',
    estimateMin: 12, xp: 40, maxAttempts: 5,
    startProject: threeDStart(),
    goals: [{ id: 'g1', text: 'Щонайменше 4 обʼєкти', validator: 'countObjects', params: { min: 4 }, weight: 1 }],
    hints: [
      'Додай куб як «стіл» — збільш його масштаб по X/Z, зменш по Y.',
      'Додай ще 3 примітиви різних типів зверху столу.',
      'Позиціонуй по Y так, щоб предмети стояли НА столі, а не всередині нього.',
    ],
  },
  33501: { // 3D Design → матеріали
    title: 'Матеріали скло, метал, гума',
    goal: 'Налаштуй матеріал щонайменше трьох обʼєктів — колір, metalness, roughness.',
    estimateMin: 12, xp: 40, maxAttempts: 5,
    startProject: threeDStart(),
    goals: [{ id: 'g1', text: 'Матеріал свідомо налаштовано у 3 обʼєктах', validator: 'materialAssigned', params: { min: 3 }, weight: 1 }],
    hints: [
      'Додай 3 примітиви.',
      'Для «металу» постав високий metalness, низький roughness.',
      'Для «гуми» постав низький metalness, високий roughness. Для «скла» — низький metalness і низький roughness.',
    ],
  },
  33701: { // 3D Design → освітлення
    title: 'Трипунктне освітлення',
    goal: 'Додай щонайменше 3 джерела світла на сцену.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: threeDStart(),
    goals: [{ id: 'g1', text: 'Щонайменше 3 джерела світла', validator: 'lightCount', params: { min: 3 }, weight: 1 }],
    hints: [
      'Додай точкове світло кнопкою зліва — це буде «key light».',
      'Додай ще одне точкове світло слабшої інтенсивності — «fill light».',
      'Додай прожектор ззаду обʼєкта — «rim light», щоб підсвітити контур.',
    ],
  },
  33801: { // 3D Design → камера й композиція
    title: 'Кадр і рендер',
    goal: 'Обери продуманий ракурс камери (не типовий) і зроби PNG-рендер сцени.',
    estimateMin: 8, xp: 30, maxAttempts: 5,
    startProject: threeDStart(),
    goals: [
      { id: 'g1', text: 'Обрано ракурс камери', validator: 'cameraFraming', params: {}, weight: 1 },
      { id: 'g2', text: 'Зроблено PNG-рендер', validator: 'exportFormatIs', params: { format: 'png' }, weight: 1 },
    ],
    hints: [
      'Додай хоча б один обʼєкт на сцену.',
      'У панелі властивостей обери ракурс «Спереду», «Збоку» чи «Зверху».',
      'Перейди на вкладку «Експорт» унизу й натисни «Рендер PNG».',
    ],
  },
  27601: { // Game Art → 3D-моделювання
    title: 'Low-poly предмет',
    goal: 'Побудуй обʼєкт із простих форм, що разом не перевищують 500 трикутників.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: threeDStart(),
    goals: [{ id: 'g1', text: 'До 500 трикутників', validator: 'polyBudget', params: { max: 500 }, weight: 1 }],
    hints: [
      'Куб — лише 12 трикутників, це найдешевший примітив.',
      'Складні форми (сфера, тор, вузол тора) коштують сотні й тисячі трикутників — уникай їх у low-poly.',
      'Збирай форму з кількох кубів/циліндрів замість однієї складної фігури.',
    ],
  },
  27701: { // Game Art → UV і текстурування
    title: 'Стилізовані матеріали',
    goal: 'Побудуй сцену, що використовує не більше 4 різних кольорів матеріалів — стилізована палітра, як у грі.',
    estimateMin: 10, xp: 35, maxAttempts: 5,
    startProject: threeDStart(),
    goals: [{ id: 'g1', text: 'Не більше 4 кольорів матеріалів', validator: 'materialColorsMax', params: { max: 4 }, weight: 1 }],
    hints: [
      'Додай кілька обʼєктів.',
      'Повторно використовуй ОДНІ й ТІ САМІ кольори для різних обʼєктів замість кожного разу нового.',
      'Стилізована гра зазвичай тримається на невеликій, продуманій палітрі.',
    ],
  },
}

function genericThreeDTask(module) {
  return {
    title: `Практика: ${module.title}`,
    goal: 'Додай щонайменше 2 обʼєкти на сцену.',
    estimateMin: 10, xp: 25, maxAttempts: 5,
    startProject: threeDStart(),
    goals: [{ id: 'g1', text: 'Щонайменше 2 обʼєкти', validator: 'countObjects', params: { min: 2 }, weight: 1 }],
    hints: [
      'Обери примітив чи світло в панелі інструментів зліва й клікни кнопку — він зʼявиться в центрі сцени.',
      'Перетягуй значення X/Y/Z у панелі властивостей, щоб розташувати обʼєкти.',
      'Перевір результат кнопкою «Перевірити».',
    ],
  }
}

const THREED_LEVEL_PROFILE = { '3d-design': '3d-design', 'game-art': 'game-art' }

function genericGameBoardTask(module) {
  return {
    title: `Практика: ${module.title}`,
    goal: 'Додай щонайменше 3 вузли й звʼяжи їх хоча б одним звʼязком.',
    estimateMin: 10, xp: 25, maxAttempts: 5,
    startProject: gameBoardStart(),
    goals: [
      { id: 'g1', text: 'Щонайменше 3 вузли', validator: 'nodeCount', params: { min: 3 }, weight: 1 },
      { id: 'g2', text: 'Є хоча б один звʼязок', validator: 'hasConnection', params: { min: 1 }, weight: 1 },
    ],
    hints: [
      'Обери тип вузла в панелі властивостей, потім клікни на полотні.',
      'Інструментом «Звʼязок» зʼєднай два вузли.',
      'Перевір результат кнопкою «Перевірити».',
    ],
  }
}

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
  if (MOTION_LEVEL_PROFILE[module.level]) {
    const info = MOTION_HAND_TASKS[module.id]
    const base = info || genericMotionTask(module)
    return {
      ...base,
      taskId: `task-${module.id}`,
      lessonId: module.id,
      editor: 'motion',
      profile: MOTION_LEVEL_PROFILE[module.level],
      isHandAuthored: !!info,
    }
  }
  if (THREED_LEVEL_PROFILE[module.level]) {
    const info = THREED_HAND_TASKS[module.id]
    const base = info || genericThreeDTask(module)
    return {
      ...base,
      taskId: `task-${module.id}`,
      lessonId: module.id,
      editor: 'threeD',
      profile: THREED_LEVEL_PROFILE[module.level],
      isHandAuthored: !!info,
    }
  }
  if (module.level === 'game-design') {
    const info = GAME_BOARD_HAND_TASKS[module.id]
    const base = info || genericGameBoardTask(module)
    return {
      ...base,
      taskId: `task-${module.id}`,
      lessonId: module.id,
      editor: 'gameBoard',
      profile: 'game-design',
      isHandAuthored: !!info,
    }
  }
  return null
}
