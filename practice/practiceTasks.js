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

export function getPracticeTask(module) {
  const info = HAND_TASKS[module.id]
  const base = info || (['graphic-design', 'logo-design', 'branding'].includes(module.level) ? genericVectorTask(module) : null)
  if (!base) return null
  return {
    ...base,
    taskId: `task-${module.id}`,
    lessonId: module.id,
    editor: 'vector',
    profile: module.level === 'graphic-design' ? 'graphic' : module.level === 'logo-design' ? 'logo' : 'branding',
    isHandAuthored: !!info,
  }
}
