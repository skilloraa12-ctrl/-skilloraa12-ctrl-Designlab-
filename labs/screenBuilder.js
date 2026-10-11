// Модель і генератори коду для UI Preview Lab: структуровані блоки
// (не довільне малювання), які одразу рендеряться в телефон (App Design)
// чи десктоп/дашборд (UI Design) фрейм і паралельно збираються в реальний
// HTML/CSS/React(JSX) код — "малюєш" розташуванням готових блоків, а не
// пензлем, тому код можна прямо згенерувати з того самого списку блоків.

export const MODES = {
  app: { key: 'app', label: 'App Design', frameLabel: 'Телефон', icon: '📱', width: 300, startBlocks: ['header', 'text', 'button'] },
  ui: { key: 'ui', label: 'UI Design', frameLabel: 'Десктоп / дашборд', icon: '🖥️', width: 640, startBlocks: ['header', 'kpi', 'table'] },
}

export const VARIANT_LABELS = {
  primary: 'Основна', secondary: 'Другорядна', text: 'Текстова',
  neutral: 'Нейтральний', success: 'Успіх', warning: 'Увага', error: 'Помилка', info: 'Інфо',
  line: 'Лінійний', bar: 'Стовпчиковий',
}

// Кожен тип блоку: у яких режимах доступний (App/UI/обидва), які поля
// властивостей показувати в панелі "Властивості", і props за замовчуванням.
export const BLOCK_DEFS = [
  { type: 'header', icon: '🔝', label: 'Заголовок екрана', modes: ['app', 'ui'], fields: ['text'], defaultProps: { text: 'Заголовок екрана' } },
  { type: 'text', icon: '📝', label: 'Текстовий блок', modes: ['app', 'ui'], fields: ['text', 'text2'], defaultProps: { text: 'Заголовок блоку', text2: 'Короткий опис із деталями для цього блоку.' } },
  { type: 'button', icon: '🔘', label: 'Кнопка', modes: ['app', 'ui'], fields: ['text', 'variant'], variants: ['primary', 'secondary', 'text'], defaultProps: { text: 'Кнопка', variant: 'primary' } },
  { type: 'input', icon: '⌨️', label: 'Поле вводу', modes: ['app', 'ui'], fields: ['text'], defaultProps: { text: 'Email' } },
  { type: 'card', icon: '🗂️', label: 'Картка', modes: ['app', 'ui'], fields: ['text', 'text2', 'toggle'], toggleLabel: 'Зображення', defaultProps: { text: 'Назва картки', text2: 'Короткий опис картки.', toggle: true } },
  { type: 'list', icon: '📋', label: 'Список', modes: ['app', 'ui'], fields: ['count'], min: 2, max: 6, defaultProps: { count: 3 } },
  { type: 'image', icon: '🖼️', label: 'Зображення', modes: ['app', 'ui'], fields: [], defaultProps: {} },
  { type: 'badge', icon: '🏷️', label: 'Бейдж', modes: ['app', 'ui'], fields: ['text', 'variant'], variants: ['neutral', 'success', 'warning', 'error'], defaultProps: { text: 'Статус', variant: 'success' } },
  { type: 'alert', icon: '🔔', label: 'Alert', modes: ['app', 'ui'], fields: ['text', 'variant'], variants: ['info', 'success', 'warning', 'error'], defaultProps: { text: 'Повідомлення для користувача.', variant: 'info' } },
  { type: 'empty', icon: '🗒️', label: 'Порожній стан', modes: ['app', 'ui'], fields: ['text', 'text2'], defaultProps: { text: 'Тут поки нічого немає', text2: 'Додайте перший елемент, щоб почати.' } },
  { type: 'divider', icon: '➖', label: 'Розділювач', modes: ['app', 'ui'], fields: [], defaultProps: {} },
  { type: 'tabbar', icon: '🧭', label: 'Таб-бар (низ екрана)', modes: ['app'], fields: ['count'], min: 3, max: 5, defaultProps: { count: 4 } },
  { type: 'fab', icon: '➕', label: 'FAB-кнопка', modes: ['app'], fields: [], defaultProps: {} },
  { type: 'kpi', icon: '📈', label: 'KPI-картка', modes: ['ui'], fields: ['text', 'text2'], defaultProps: { text: '1.2М₴', text2: 'Виручка за місяць' } },
  { type: 'chart', icon: '📊', label: 'Графік', modes: ['ui'], fields: ['text', 'variant'], variants: ['line', 'bar'], defaultProps: { text: 'Динаміка продажів', variant: 'line' } },
  { type: 'table', icon: '🗃️', label: 'Таблиця даних', modes: ['ui'], fields: ['cols', 'count', 'toggle'], toggleLabel: 'Панель bulk-дій', min: 2, max: 6, minCols: 3, maxCols: 6, defaultProps: { cols: 4, count: 4, toggle: false } },
  { type: 'filterbar', icon: '🔍', label: 'Панель фільтрів', modes: ['ui'], fields: ['count'], min: 2, max: 5, defaultProps: { count: 3 } },
]

export function getDef(type) { return BLOCK_DEFS.find((b) => b.type === type) }
export function defsForMode(mode) { return BLOCK_DEFS.filter((b) => b.modes.includes(mode)) }

let idCounter = 1
export function createBlock(type) {
  const def = getDef(type)
  return { id: 'b' + idCounter++, type, props: { ...def.defaultProps } }
}

export function moveItem(items, i, dir) {
  const j = i + dir
  if (j < 0 || j >= items.length) return items
  const copy = items.slice()
  const [it] = copy.splice(i, 1)
  copy.splice(j, 0, it)
  return copy
}

export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function times(n) { return Array.from({ length: n }) }

// ---------- HTML ----------

function blockHtmlBody(block) {
  const p = block.props
  switch (block.type) {
    case 'header': return `<header class="sb-header">\n    <h2>${esc(p.text)}</h2>\n  </header>`
    case 'text': return `<div class="sb-text">\n    <h3>${esc(p.text)}</h3>\n    <p>${esc(p.text2)}</p>\n  </div>`
    case 'button': return `<button class="sb-btn sb-btn--${p.variant}">${esc(p.text)}</button>`
    case 'input': return `<label class="sb-field">\n    <span>${esc(p.text)}</span>\n    <input type="text" placeholder="${esc(p.text)}" />\n  </label>`
    case 'card': return `<div class="sb-card">\n${p.toggle ? '    <div class="sb-card-img"></div>\n' : ''}    <h4>${esc(p.text)}</h4>\n    <p>${esc(p.text2)}</p>\n  </div>`
    case 'list': return `<ul class="sb-list">\n${times(p.count).map((_, i) => `    <li class="sb-list-item"><span class="sb-avatar"></span><span>Елемент ${i + 1}</span></li>`).join('\n')}\n  </ul>`
    case 'image': return `<div class="sb-image" role="img" aria-label="Зображення"></div>`
    case 'badge': return `<span class="sb-badge sb-badge--${p.variant}">${esc(p.text)}</span>`
    case 'alert': return `<div class="sb-alert sb-alert--${p.variant}" role="alert">${esc(p.text)}</div>`
    case 'empty': return `<div class="sb-empty">\n    <div class="sb-empty-icon"></div>\n    <h4>${esc(p.text)}</h4>\n    <p>${esc(p.text2)}</p>\n  </div>`
    case 'divider': return `<hr class="sb-divider" />`
    case 'tabbar': return `<nav class="sb-tabbar">\n${times(p.count).map((_, i) => `    <button class="sb-tab${i === 0 ? ' sb-tab--active' : ''}">●</button>`).join('\n')}\n  </nav>`
    case 'fab': return `<button class="sb-fab" aria-label="Додати">+</button>`
    case 'kpi': return `<div class="sb-kpi">\n    <div class="sb-kpi-value">${esc(p.text)}</div>\n    <div class="sb-kpi-label">${esc(p.text2)}</div>\n  </div>`
    case 'chart': return `<div class="sb-chart">\n    <div class="sb-chart-title">${esc(p.text)}</div>\n    <div class="sb-chart-body sb-chart-body--${p.variant}"></div>\n  </div>`
    case 'table': return `<div class="sb-table-wrap">\n${p.toggle ? '    <div class="sb-table-bulk">Вибрано: 2 <button>Дія</button></div>\n' : ''}    <table class="sb-table">\n      <thead><tr>${times(p.cols).map((_, i) => `<th>Колонка ${i + 1}</th>`).join('')}</tr></thead>\n      <tbody>\n${times(p.count).map(() => `        <tr>${times(p.cols).map(() => '<td>—</td>').join('')}</tr>`).join('\n')}\n      </tbody>\n    </table>\n  </div>`
    case 'filterbar': return `<div class="sb-filterbar">\n${times(p.count).map((_, i) => `    <span class="sb-chip">Фільтр ${i + 1}</span>`).join('\n')}\n  </div>`
    default: return ''
  }
}

export function generateHtml(mode, blocks, settings) {
  const frameClass = `sb-frame sb-frame--${mode}`
  const body = blocks.map((b) => '  ' + blockHtmlBody(b)).join('\n\n')
  if (mode === 'ui' && settings.sidebar) {
    return `<div class="${frameClass}">
  <aside class="sb-sidebar">
    <div class="sb-sidebar-logo"></div>
${times(5).map(() => '    <div class="sb-sidebar-item"></div>').join('\n')}
  </aside>
  <main class="sb-content">
${body || '    <!-- додайте блоки з палітри зліва -->'}
  </main>
</div>`
  }
  return `<div class="${frameClass}">
  <main class="sb-content">
${body || '    <!-- додайте блоки з палітри зліва -->'}
  </main>
</div>`
}

export function generateCss(mode, blocks, settings) {
  const used = new Set(blocks.map((b) => b.type))
  const parts = []
  parts.push(`:root {\n  --sb-accent: ${settings.accent};\n  --sb-radius: ${settings.radius}px;\n}`)
  parts.push(`.sb-frame { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; background: #F5F4F0; color: #17171A; width: 100%; ${mode === 'ui' ? 'display: flex;' : ''} border: 1px solid #E3E1D9; border-radius: ${mode === 'app' ? '28px' : '16px'}; overflow: hidden; }`)
  if (mode === 'ui' && settings.sidebar) {
    parts.push(`.sb-sidebar { width: 180px; flex: none; background: #FFFFFF; border-right: 1px solid #E3E1D9; padding: 16px 12px; }`)
    parts.push(`.sb-sidebar-logo { width: 28px; height: 28px; border-radius: 8px; background: var(--sb-accent); margin-bottom: 18px; }`)
    parts.push(`.sb-sidebar-item { height: 10px; border-radius: 4px; background: #E3E1D9; margin-bottom: 14px; width: 70%; }`)
  }
  parts.push(`.sb-content { flex: 1; padding: 18px; display: flex; flex-direction: column; gap: 14px; }`)

  const css = {
    header: `.sb-header h2 { margin: 0; font-size: 18px; }`,
    text: `.sb-text h3 { margin: 0 0 4px; font-size: 15px; }\n.sb-text p { margin: 0; font-size: 13px; color: #68676E; line-height: 1.5; }`,
    button: `.sb-btn { border: none; border-radius: var(--sb-radius); padding: 10px 18px; font-size: 13px; cursor: pointer; font-weight: 600; }\n.sb-btn--primary { background: var(--sb-accent); color: #FFFFFF; }\n.sb-btn--secondary { background: #ECEAE3; color: #17171A; }\n.sb-btn--text { background: none; color: var(--sb-accent); padding-left: 2px; padding-right: 2px; }`,
    input: `.sb-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #68676E; }\n.sb-field input { border: 1px solid #E3E1D9; border-radius: var(--sb-radius); padding: 9px 12px; font-size: 13px; }`,
    card: `.sb-card { border: 1px solid #E3E1D9; border-radius: var(--sb-radius); padding: 14px; background: #FFFFFF; }\n.sb-card-img { width: 100%; height: 90px; border-radius: calc(var(--sb-radius) - 4px); background: #ECEAE3; margin-bottom: 10px; }\n.sb-card h4 { margin: 0 0 4px; font-size: 14px; }\n.sb-card p { margin: 0; font-size: 12.5px; color: #68676E; }`,
    list: `.sb-list { list-style: none; margin: 0; padding: 0; border: 1px solid #E3E1D9; border-radius: var(--sb-radius); overflow: hidden; }\n.sb-list-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #E3E1D9; font-size: 13px; background: #FFFFFF; }\n.sb-list-item:last-child { border-bottom: none; }\n.sb-avatar { width: 26px; height: 26px; border-radius: 50%; background: #ECEAE3; flex: none; }`,
    image: `.sb-image { width: 100%; height: 120px; border-radius: var(--sb-radius); background: repeating-linear-gradient(45deg, #ECEAE3, #ECEAE3 8px, #F5F4F0 8px, #F5F4F0 16px); }`,
    badge: `.sb-badge { display: inline-block; font-size: 11px; font-weight: 600; border-radius: 999px; padding: 3px 10px; }\n.sb-badge--neutral { background: #ECEAE3; color: #68676E; }\n.sb-badge--success { background: rgba(47,163,107,.15); color: #2FA36B; }\n.sb-badge--warning { background: rgba(200,145,43,.15); color: #C8912B; }\n.sb-badge--error { background: rgba(224,82,62,.15); color: #E0523E; }`,
    alert: `.sb-alert { border-radius: var(--sb-radius); padding: 12px 14px; font-size: 13px; border: 1px solid; }\n.sb-alert--info { background: rgba(59,130,214,.1); border-color: #3B82D6; color: #3B82D6; }\n.sb-alert--success { background: rgba(47,163,107,.1); border-color: #2FA36B; color: #2FA36B; }\n.sb-alert--warning { background: rgba(200,145,43,.1); border-color: #C8912B; color: #C8912B; }\n.sb-alert--error { background: rgba(224,82,62,.1); border-color: #E0523E; color: #E0523E; }`,
    empty: `.sb-empty { text-align: center; padding: 30px 16px; color: #68676E; }\n.sb-empty-icon { width: 44px; height: 44px; border-radius: 50%; background: #ECEAE3; margin: 0 auto 12px; }\n.sb-empty h4 { margin: 0 0 4px; color: #17171A; font-size: 14px; }\n.sb-empty p { margin: 0; font-size: 12.5px; }`,
    divider: `.sb-divider { border: none; border-top: 1px solid #E3E1D9; margin: 0; }`,
    tabbar: `.sb-tabbar { display: flex; justify-content: space-around; border-top: 1px solid #E3E1D9; padding: 10px 0; margin-top: auto; }\n.sb-tab { border: none; background: none; font-size: 16px; color: #68676E; cursor: pointer; }\n.sb-tab--active { color: var(--sb-accent); }`,
    fab: `.sb-fab { align-self: flex-end; width: 48px; height: 48px; border-radius: 50%; border: none; background: var(--sb-accent); color: #FFFFFF; font-size: 22px; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,.18); }`,
    kpi: `.sb-kpi { border: 1px solid #E3E1D9; border-radius: var(--sb-radius); padding: 16px; background: #FFFFFF; }\n.sb-kpi-value { font-size: 26px; font-weight: 700; color: var(--sb-accent); }\n.sb-kpi-label { font-size: 12.5px; color: #68676E; margin-top: 4px; }`,
    chart: `.sb-chart { border: 1px solid #E3E1D9; border-radius: var(--sb-radius); padding: 14px; background: #FFFFFF; }\n.sb-chart-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }\n.sb-chart-body { height: 90px; border-radius: calc(var(--sb-radius) - 4px); }\n.sb-chart-body--line { background: linear-gradient(135deg, transparent 48%, var(--sb-accent) 49%, var(--sb-accent) 51%, transparent 52%), #F5F4F0; }\n.sb-chart-body--bar { background: repeating-linear-gradient(90deg, var(--sb-accent) 0 14%, transparent 14% 20%), #F5F4F0; background-position: bottom; background-size: 100% 70%; background-repeat: no-repeat; }`,
    table: `.sb-table-wrap { border: 1px solid #E3E1D9; border-radius: var(--sb-radius); overflow: hidden; background: #FFFFFF; }\n.sb-table-bulk { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(62,55,224,.08); font-size: 12.5px; }\n.sb-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }\n.sb-table th { text-align: left; padding: 10px 12px; background: #F5F4F0; font-weight: 600; }\n.sb-table td { padding: 9px 12px; border-top: 1px solid #E3E1D9; color: #68676E; }`,
    filterbar: `.sb-filterbar { display: flex; gap: 8px; flex-wrap: wrap; }\n.sb-chip { font-size: 12px; border: 1px solid #E3E1D9; border-radius: 999px; padding: 5px 12px; background: #FFFFFF; }`,
  }
  for (const type of used) if (css[type]) parts.push(css[type])
  return parts.join('\n\n')
}

// ---------- JSX ----------

function blockJsx(block, i) {
  const p = block.props
  switch (block.type) {
    case 'header': return `<header className="sb-header" key="${block.id}">\n      <h2>${esc(p.text)}</h2>\n    </header>`
    case 'text': return `<div className="sb-text" key="${block.id}">\n      <h3>${esc(p.text)}</h3>\n      <p>${esc(p.text2)}</p>\n    </div>`
    case 'button': return `<button className="sb-btn sb-btn--${p.variant}" key="${block.id}">${esc(p.text)}</button>`
    case 'input': return `<label className="sb-field" key="${block.id}">\n      <span>${esc(p.text)}</span>\n      <input type="text" placeholder="${esc(p.text)}" />\n    </label>`
    case 'card': return `<div className="sb-card" key="${block.id}">\n${p.toggle ? '      <div className="sb-card-img" />\n' : ''}      <h4>${esc(p.text)}</h4>\n      <p>${esc(p.text2)}</p>\n    </div>`
    case 'list': return `<ul className="sb-list" key="${block.id}">\n      {Array.from({ length: ${p.count} }).map((_, i) => (\n        <li className="sb-list-item" key={i}><span className="sb-avatar" /><span>Елемент {i + 1}</span></li>\n      ))}\n    </ul>`
    case 'image': return `<div className="sb-image" role="img" aria-label="Зображення" key="${block.id}" />`
    case 'badge': return `<span className="sb-badge sb-badge--${p.variant}" key="${block.id}">${esc(p.text)}</span>`
    case 'alert': return `<div className="sb-alert sb-alert--${p.variant}" role="alert" key="${block.id}">${esc(p.text)}</div>`
    case 'empty': return `<div className="sb-empty" key="${block.id}">\n      <div className="sb-empty-icon" />\n      <h4>${esc(p.text)}</h4>\n      <p>${esc(p.text2)}</p>\n    </div>`
    case 'divider': return `<hr className="sb-divider" key="${block.id}" />`
    case 'tabbar': return `<nav className="sb-tabbar" key="${block.id}">\n      {Array.from({ length: ${p.count} }).map((_, i) => (\n        <button className={\`sb-tab\${i === 0 ? ' sb-tab--active' : ''}\`} key={i}>●</button>\n      ))}\n    </nav>`
    case 'fab': return `<button className="sb-fab" aria-label="Додати" key="${block.id}">+</button>`
    case 'kpi': return `<div className="sb-kpi" key="${block.id}">\n      <div className="sb-kpi-value">${esc(p.text)}</div>\n      <div className="sb-kpi-label">${esc(p.text2)}</div>\n    </div>`
    case 'chart': return `<div className="sb-chart" key="${block.id}">\n      <div className="sb-chart-title">${esc(p.text)}</div>\n      <div className="sb-chart-body sb-chart-body--${p.variant}" />\n    </div>`
    case 'table': return `<div className="sb-table-wrap" key="${block.id}">\n${p.toggle ? '      <div className="sb-table-bulk">Вибрано: 2 <button>Дія</button></div>\n' : ''}      <table className="sb-table">\n        <thead><tr>{Array.from({ length: ${p.cols} }).map((_, i) => <th key={i}>Колонка {i + 1}</th>)}</tr></thead>\n        <tbody>\n          {Array.from({ length: ${p.count} }).map((_, r) => (\n            <tr key={r}>{Array.from({ length: ${p.cols} }).map((_, c) => <td key={c}>—</td>)}</tr>\n          ))}\n        </tbody>\n      </table>\n    </div>`
    case 'filterbar': return `<div className="sb-filterbar" key="${block.id}">\n      {Array.from({ length: ${p.count} }).map((_, i) => (\n        <span className="sb-chip" key={i}>Фільтр {i + 1}</span>\n      ))}\n    </div>`
    default: return ''
  }
}

export function generateJsx(mode, blocks, settings) {
  const body = blocks.map((b, i) => '    ' + blockJsx(b, i)).join('\n\n')
  const inner = mode === 'ui' && settings.sidebar
    ? `  <div className="sb-frame sb-frame--ui">
    <aside className="sb-sidebar">
      <div className="sb-sidebar-logo" />
      {Array.from({ length: 5 }).map((_, i) => <div className="sb-sidebar-item" key={i} />)}
    </aside>
    <main className="sb-content">
${body || '      /* додайте блоки з палітри зліва */'}
    </main>
  </div>`
    : `  <div className="sb-frame sb-frame--${mode}">
    <main className="sb-content">
${body || '      /* додайте блоки з палітри зліва */'}
    </main>
  </div>`
  return `export default function Screen() {\n  return (\n${inner}\n  )\n}`
}

export function defaultSettings(mode) {
  return { accent: '#3E37E0', radius: 10, sidebar: mode === 'ui' }
}
