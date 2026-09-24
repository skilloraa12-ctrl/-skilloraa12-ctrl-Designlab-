// Досягнення розблоковуються автоматично в ProgressContext на основі
// реального прогресу користувача — ніяких фейкових/заглушкових бейджів.

export const ACHIEVEMENTS = [
  {
    slug: 'first-step',
    title: 'Перший крок',
    description: 'Завершіть свій перший модуль.',
    check: (stats) => stats.completedCount >= 1,
  },
  {
    slug: 'foundations-done',
    title: 'Фундамент закладено',
    description: 'Завершіть усі модулі рівня Foundations.',
    check: (stats) => stats.levelDone.A === true,
  },
  {
    slug: 'color-master',
    title: 'Майстер кольору',
    description: 'Завершіть модуль «Теорія кольору» і створіть 3 палітри в Color Lab.',
    check: (stats) => stats.completedIds.includes(3) && stats.paletteCount >= 3,
  },
  {
    slug: 'typography-pro',
    title: 'Типографічний профі',
    description: 'Завершіть модуль «Типографіка».',
    check: (stats) => stats.completedIds.includes(4),
  },
  {
    slug: 'brand-builder',
    title: 'Будівничий бренду',
    description: 'Завершіть модулі Logo, Brand Identity та Branding Systems.',
    check: (stats) => [15, 16, 17].every((id) => stats.completedIds.includes(id)),
  },
  {
    slug: 'ten-modules',
    title: 'Десятка',
    description: 'Завершіть 10 модулів академії.',
    check: (stats) => stats.completedCount >= 10,
  },
  {
    slug: 'quarter-way',
    title: 'Чверть шляху',
    description: 'Пройдіть 25% усієї програми.',
    check: (stats) => stats.completedCount >= Math.ceil(stats.total * 0.25),
  },
  {
    slug: 'halfway',
    title: 'Половина шляху',
    description: 'Пройдіть 50% усієї програми.',
    check: (stats) => stats.completedCount >= Math.ceil(stats.total * 0.5),
  },
  {
    slug: 'portfolio-starter',
    title: 'Перший кейс',
    description: 'Додайте перший проєкт у портфоліо.',
    check: (stats) => stats.portfolioCount >= 1,
  },
  {
    slug: 'portfolio-five',
    title: 'Зростаюче портфоліо',
    description: 'Додайте 5 проєктів у портфоліо.',
    check: (stats) => stats.portfolioCount >= 5,
  },
  {
    slug: 'streak-3',
    title: 'Стрік 3 дні',
    description: 'Займайтеся 3 дні поспіль.',
    check: (stats) => stats.streak >= 3,
  },
  {
    slug: 'job-ready',
    title: 'Job Ready',
    description: 'Завершіть усі доступні модулі академії.',
    check: (stats) => stats.completedCount >= stats.total,
  },
]
