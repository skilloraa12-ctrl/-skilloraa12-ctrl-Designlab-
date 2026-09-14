// Кожен трек — набір id модулів, що визначають готовність напрямку.
// Відсоток рахується виключно від реально пройдених модулів
// (жодних "гарантовано готові" тверджень — див. README).

export const CAREER_TRACKS = [
  { label: 'Design Fundamentals', ids: [1, 6, 7, 8] },
  { label: 'Typography', ids: [4] },
  { label: 'Color', ids: [3] },
  { label: 'Composition', ids: [2, 5] },
  { label: 'Branding', ids: [15, 16, 17] },
  { label: 'Digital Design', ids: [18, 27, 28, 29, 30, 35] },
  { label: 'Print & Packaging', ids: [21, 22, 23] },
  { label: 'Professional Practice', ids: [38, 39, 40, 41, 42, 43] },
]
