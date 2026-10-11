// Модель і генератори коду для Game Design Lab: структуровані ігрові блоки
// (HUD-елементи й меню), які рендеряться поверх геймплей-вʼюпорта чи як
// самостійний екран меню, і одночасно збираються в реальний HTML/CSS/
// React(JSX) код — та сама логіка, що й labs/screenBuilder.js для UI
// Preview Lab, але блоки й розкладка специфічні для гри.

export const MODES = {
  hud: { key: 'hud', label: 'HUD поверх геймплею', frameLabel: 'Ігровий вʼюпорт', icon: '🎯', startBlocks: ['healthbar', 'ammocounter', 'minimap'] },
  menu: { key: 'menu', label: 'Екран меню', frameLabel: 'Екран меню', icon: '📋', startBlocks: ['mainmenu'] },
}

export const VARIANT_LABELS = {
  bar: 'Смуга', hearts: 'Серця',
  coin: 'Монети', gem: 'Кристали', score: 'Очки',
  item: 'Предмет', achievement: 'Досягнення', warning: 'Попередження',
}

// HUD-блоки мають фіксовану "зону" розміщення поверх вʼюпорта (як у
// реальних іграх) — користувач не перетягує їх довільно, а обирає ІЗ
// палітри; кожен тип завжди зʼявляється у своєму коректному куті екрана.
// Це свідомо простіше й надійніше за вільний drag-and-drop, і одразу дає
// реалістичний, а не хаотичний HUD.
export const BLOCK_DEFS = [
  { type: 'healthbar', icon: '❤️', label: 'Шкала здоровʼя', modes: ['hud'], zone: 'bottom-left', fields: ['text', 'variant'], variants: ['bar', 'hearts'], defaultProps: { text: '75/100', variant: 'bar' } },
  { type: 'ammocounter', icon: '🔫', label: 'Лічильник набоїв', modes: ['hud'], zone: 'bottom-right', fields: ['text'], defaultProps: { text: '24 / 90' } },
  { type: 'cooldownicon', icon: '🔷', label: 'Іконка здібності', modes: ['hud'], zone: 'bottom-right', fields: ['text', 'toggle'], toggleLabel: 'Показати cooldown', defaultProps: { text: 'Q', toggle: true } },
  { type: 'minimap', icon: '🗺️', label: 'Мінімапа', modes: ['hud'], zone: 'top-right', fields: ['toggle'], toggleLabel: 'Кругла форма', defaultProps: { toggle: true } },
  { type: 'scoredisplay', icon: '🪙', label: 'Очки / валюта', modes: ['hud'], zone: 'top-right', fields: ['text', 'variant'], variants: ['coin', 'gem', 'score'], defaultProps: { text: '1 250', variant: 'coin' } },
  { type: 'objectivetracker', icon: '📍', label: 'Трекер цілі', modes: ['hud'], zone: 'top-left', fields: ['text', 'text2'], defaultProps: { text: 'Поточна ціль', text2: 'Знайти ключ від підземелля (1/1)' } },
  { type: 'crosshair', icon: '➕', label: 'Приціл', modes: ['hud'], zone: 'center', fields: [], defaultProps: {} },
  { type: 'notificationtoast', icon: '🔔', label: 'Спливне сповіщення', modes: ['hud'], zone: 'top-center', fields: ['text', 'variant'], variants: ['item', 'achievement', 'warning'], defaultProps: { text: 'Отримано: Залізний меч', variant: 'item' } },
  { type: 'interactionprompt', icon: '⌨️', label: 'Підказка дії', modes: ['hud'], zone: 'bottom-center', fields: ['text'], defaultProps: { text: 'Натисни E, щоб підняти' } },
  { type: 'damageindicator', icon: '💥', label: 'Індикатор удару', modes: ['hud'], zone: 'overlay', fields: [], defaultProps: {} },

  { type: 'mainmenu', icon: '🏠', label: 'Головне меню', modes: ['menu'], fields: ['text', 'count'], min: 2, max: 5, defaultProps: { text: 'Назва гри', count: 4 } },
  { type: 'pausemenu', icon: '⏸️', label: 'Меню паузи', modes: ['menu'], fields: ['count'], min: 2, max: 4, defaultProps: { count: 3 } },
  { type: 'inventorygrid', icon: '🎒', label: 'Інвентар', modes: ['menu'], fields: ['cols', 'count'], min: 2, max: 5, minCols: 4, maxCols: 8, defaultProps: { cols: 6, count: 3 } },
  { type: 'dialoguebox', icon: '💬', label: 'Діалогове вікно', modes: ['menu'], fields: ['text', 'text2'], defaultProps: { text: 'Імʼя персонажа', text2: 'Репліка персонажа для цього діалогу.' } },
  { type: 'settingsmenu', icon: '⚙️', label: 'Меню налаштувань', modes: ['menu'], fields: ['count'], min: 2, max: 6, defaultProps: { count: 4 } },
  { type: 'levelselect', icon: '🗂️', label: 'Вибір рівня', modes: ['menu'], fields: ['cols', 'count'], min: 1, max: 3, minCols: 3, maxCols: 5, defaultProps: { cols: 4, count: 2 } },
]

export function getDef(type) { return BLOCK_DEFS.find((b) => b.type === type) }
export function defsForMode(mode) { return BLOCK_DEFS.filter((b) => b.modes.includes(mode)) }

let idCounter = 1
export function createBlock(type) {
  const def = getDef(type)
  return { id: 'g' + idCounter++, type, props: { ...def.defaultProps } }
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
    case 'healthbar': return `<div class="gb-healthbar gb-healthbar--${p.variant}"><span class="gb-hb-icon">❤️</span><div class="gb-hb-track"><div class="gb-hb-fill"></div></div><span class="gb-hb-value">${esc(p.text)}</span></div>`
    case 'ammocounter': return `<div class="gb-ammo"><span class="gb-ammo-icon">🔫</span><span>${esc(p.text)}</span></div>`
    case 'cooldownicon': return `<div class="gb-cooldown">${p.toggle ? '<div class="gb-cooldown-overlay"></div>' : ''}<span>${esc(p.text)}</span></div>`
    case 'minimap': return `<div class="gb-minimap${p.toggle ? ' gb-minimap--round' : ''}"></div>`
    case 'scoredisplay': return `<div class="gb-score gb-score--${p.variant}"><span class="gb-score-icon"></span><span>${esc(p.text)}</span></div>`
    case 'objectivetracker': return `<div class="gb-objective"><div class="gb-objective-title">${esc(p.text)}</div><div class="gb-objective-sub">${esc(p.text2)}</div></div>`
    case 'crosshair': return `<div class="gb-crosshair"><span></span><span></span></div>`
    case 'notificationtoast': return `<div class="gb-toast gb-toast--${p.variant}">${esc(p.text)}</div>`
    case 'interactionprompt': return `<div class="gb-prompt"><kbd>E</kbd><span>${esc(p.text)}</span></div>`
    case 'damageindicator': return `<div class="gb-damage"></div>`
    case 'mainmenu': return `<div class="gb-mainmenu"><h2>${esc(p.text)}</h2>${times(p.count).map((_, i) => `<button class="gb-menu-btn${i === 0 ? ' gb-menu-btn--primary' : ''}">Пункт меню ${i + 1}</button>`).join('')}</div>`
    case 'pausemenu': return `<div class="gb-pausemenu"><h3>Пауза</h3>${times(p.count).map((_, i) => `<button class="gb-menu-btn">Пункт ${i + 1}</button>`).join('')}</div>`
    case 'inventorygrid': return `<div class="gb-inventory"><div class="gb-inv-grid" style="grid-template-columns: repeat(${p.cols}, 1fr);">${times(p.cols * p.count).map(() => `<div class="gb-inv-slot"></div>`).join('')}</div></div>`
    case 'dialoguebox': return `<div class="gb-dialogue"><div class="gb-dialogue-portrait"></div><div class="gb-dialogue-body"><div class="gb-dialogue-name">${esc(p.text)}</div><div class="gb-dialogue-line">${esc(p.text2)}</div></div></div>`
    case 'settingsmenu': return `<div class="gb-settings">${times(p.count).map((_, i) => `<div class="gb-settings-row"><span>Налаштування ${i + 1}</span><div class="gb-settings-control"></div></div>`).join('')}</div>`
    case 'levelselect': return `<div class="gb-levelselect" style="grid-template-columns: repeat(${p.cols}, 1fr);">${times(p.cols * p.count).map((_, i) => `<div class="gb-level-card${i > 1 ? ' gb-level-card--locked' : ''}">${i + 1}</div>`).join('')}</div>`
    default: return ''
  }
}

export function generateHtml(mode, blocks) {
  if (mode === 'hud') {
    const zones = groupByZone(blocks)
    const zoneHtml = (zone) => (zones[zone] || []).map((b) => '    ' + blockHtmlBody(b)).join('\n')
    return `<div class="gb-viewport">
  <div class="gb-zone gb-zone--top-left">
${zoneHtml('top-left')}
  </div>
  <div class="gb-zone gb-zone--top-right">
${zoneHtml('top-right')}
  </div>
  <div class="gb-zone gb-zone--top-center">
${zoneHtml('top-center')}
  </div>
  <div class="gb-zone gb-zone--center">
${zoneHtml('center')}
  </div>
  <div class="gb-zone gb-zone--bottom-left">
${zoneHtml('bottom-left')}
  </div>
  <div class="gb-zone gb-zone--bottom-right">
${zoneHtml('bottom-right')}
  </div>
  <div class="gb-zone gb-zone--bottom-center">
${zoneHtml('bottom-center')}
  </div>
${zoneHtml('overlay')}
</div>`
  }
  const body = blocks.map((b) => '  ' + blockHtmlBody(b)).join('\n\n')
  return `<div class="gb-screen">
${body || '  <!-- додайте блоки з палітри зліва -->'}
</div>`
}

function groupByZone(blocks) {
  const out = {}
  for (const b of blocks) {
    const def = getDef(b.type)
    if (!out[def.zone]) out[def.zone] = []
    out[def.zone].push(b)
  }
  return out
}

export function generateCss(mode, blocks, settings) {
  const used = new Set(blocks.map((b) => b.type))
  const parts = [`:root {\n  --gb-accent: ${settings.accent};\n}`]
  if (mode === 'hud') {
    parts.push(`.gb-viewport { position: relative; width: 100%; aspect-ratio: 16 / 9; background: linear-gradient(160deg, #1b2230, #262f3f); overflow: hidden; border-radius: 10px; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #fff; }`)
    parts.push(`.gb-zone { position: absolute; display: flex; flex-direction: column; gap: 8px; padding: 14px; pointer-events: none; }`)
    parts.push(`.gb-zone--top-left { top: 0; left: 0; align-items: flex-start; }`)
    parts.push(`.gb-zone--top-right { top: 0; right: 0; align-items: flex-end; }`)
    parts.push(`.gb-zone--top-center { top: 0; left: 50%; transform: translateX(-50%); align-items: center; }`)
    parts.push(`.gb-zone--center { top: 50%; left: 50%; transform: translate(-50%, -50%); }`)
    parts.push(`.gb-zone--bottom-left { bottom: 0; left: 0; align-items: flex-start; }`)
    parts.push(`.gb-zone--bottom-right { bottom: 0; right: 0; align-items: flex-end; }`)
    parts.push(`.gb-zone--bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); align-items: center; }`)
  } else {
    parts.push(`.gb-screen { width: 100%; min-height: 360px; background: #15151c; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #fff; }`)
  }

  const css = {
    healthbar: `.gb-healthbar { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,.45); padding: 6px 10px; border-radius: 8px; }\n.gb-hb-track { width: 120px; height: 14px; background: rgba(255,255,255,.15); border-radius: 7px; overflow: hidden; }\n.gb-hb-fill { width: 75%; height: 100%; background: linear-gradient(90deg, #e0523e, #ff8a6a); }\n.gb-hb-value { font-size: 12px; font-weight: 600; }`,
    ammocounter: `.gb-ammo { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,.45); padding: 8px 12px; border-radius: 8px; font-size: 16px; font-weight: 700; }`,
    cooldownicon: `.gb-cooldown { position: relative; width: 40px; height: 40px; background: rgba(0,0,0,.5); border: 2px solid var(--gb-accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; }\n.gb-cooldown-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.6); clip-path: inset(0 0 40% 0); }`,
    minimap: `.gb-minimap { width: 96px; height: 96px; background: rgba(0,0,0,.5); border: 2px solid rgba(255,255,255,.3); }\n.gb-minimap--round { border-radius: 50%; }`,
    scoredisplay: `.gb-score { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,.45); padding: 6px 12px; border-radius: 999px; font-weight: 700; }\n.gb-score-icon { width: 14px; height: 14px; border-radius: 50%; background: var(--gb-accent); }`,
    objectivetracker: `.gb-objective { background: rgba(0,0,0,.45); padding: 10px 14px; border-radius: 8px; max-width: 220px; pointer-events: auto; }\n.gb-objective-title { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--gb-accent); margin-bottom: 4px; }\n.gb-objective-sub { font-size: 13px; }`,
    crosshair: `.gb-crosshair { width: 20px; height: 20px; position: relative; }\n.gb-crosshair span { position: absolute; background: #fff; }\n.gb-crosshair span:first-child { left: 9px; top: 0; width: 2px; height: 20px; }\n.gb-crosshair span:last-child { top: 9px; left: 0; width: 20px; height: 2px; }`,
    notificationtoast: `.gb-toast { pointer-events: auto; background: rgba(0,0,0,.7); border-left: 4px solid var(--gb-accent); padding: 10px 16px; border-radius: 6px; font-size: 13px; }`,
    interactionprompt: `.gb-prompt { pointer-events: auto; display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,.6); padding: 8px 14px; border-radius: 8px; font-size: 13px; }\n.gb-prompt kbd { background: #fff; color: #000; border-radius: 4px; padding: 2px 7px; font-weight: 700; font-size: 12px; }`,
    damageindicator: `.gb-damage { position: absolute; inset: 0; box-shadow: inset 0 0 80px 20px rgba(224,82,62,.55); pointer-events: none; }`,
    mainmenu: `.gb-mainmenu { display: flex; flex-direction: column; align-items: center; gap: 12px; }\n.gb-mainmenu h2 { margin: 0 0 10px; font-size: 24px; }`,
    pausemenu: `.gb-pausemenu { display: flex; flex-direction: column; align-items: center; gap: 10px; background: rgba(0,0,0,.6); padding: 24px 32px; border-radius: 10px; }`,
    inventorygrid: `.gb-inv-grid { display: grid; gap: 8px; width: 100%; max-width: 420px; }\n.gb-inv-slot { aspect-ratio: 1; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2); border-radius: 6px; }`,
    dialoguebox: `.gb-dialogue { display: flex; gap: 14px; background: rgba(0,0,0,.7); border: 1px solid rgba(255,255,255,.15); border-radius: 10px; padding: 14px; width: 100%; max-width: 420px; }\n.gb-dialogue-portrait { width: 56px; height: 56px; border-radius: 8px; background: var(--gb-accent); flex: none; }\n.gb-dialogue-name { font-weight: 700; color: var(--gb-accent); margin-bottom: 4px; font-size: 13px; }\n.gb-dialogue-line { font-size: 13px; line-height: 1.5; }`,
    settingsmenu: `.gb-settings { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 10px; }\n.gb-settings-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }\n.gb-settings-control { width: 80px; height: 10px; border-radius: 5px; background: rgba(255,255,255,.15); }`,
    levelselect: `.gb-levelselect { display: grid; gap: 10px; width: 100%; max-width: 420px; }\n.gb-level-card { aspect-ratio: 1; background: var(--gb-accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; }\n.gb-level-card--locked { background: rgba(255,255,255,.08); color: rgba(255,255,255,.3); }`,
  }
  const btnCss = `.gb-menu-btn { border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.06); color: #fff; padding: 10px 28px; border-radius: 8px; font-size: 13px; cursor: pointer; min-width: 180px; }\n.gb-menu-btn--primary { background: var(--gb-accent); border-color: var(--gb-accent); font-weight: 700; }`
  if (used.has('mainmenu') || used.has('pausemenu')) parts.push(btnCss)
  for (const type of used) if (css[type]) parts.push(css[type])
  return parts.join('\n\n')
}

// ---------- JSX ----------

function blockJsx(block) {
  const p = block.props
  switch (block.type) {
    case 'healthbar': return `<div className="gb-healthbar gb-healthbar--${p.variant}" key="${block.id}"><span className="gb-hb-icon">❤️</span><div className="gb-hb-track"><div className="gb-hb-fill" /></div><span className="gb-hb-value">${esc(p.text)}</span></div>`
    case 'ammocounter': return `<div className="gb-ammo" key="${block.id}"><span className="gb-ammo-icon">🔫</span><span>${esc(p.text)}</span></div>`
    case 'cooldownicon': return `<div className="gb-cooldown" key="${block.id}">${p.toggle ? '<div className="gb-cooldown-overlay" />' : ''}<span>${esc(p.text)}</span></div>`
    case 'minimap': return `<div className={\`gb-minimap${p.toggle ? ' gb-minimap--round' : ''}\`} key="${block.id}" />`
    case 'scoredisplay': return `<div className="gb-score gb-score--${p.variant}" key="${block.id}"><span className="gb-score-icon" /><span>${esc(p.text)}</span></div>`
    case 'objectivetracker': return `<div className="gb-objective" key="${block.id}"><div className="gb-objective-title">${esc(p.text)}</div><div className="gb-objective-sub">${esc(p.text2)}</div></div>`
    case 'crosshair': return `<div className="gb-crosshair" key="${block.id}"><span /><span /></div>`
    case 'notificationtoast': return `<div className="gb-toast gb-toast--${p.variant}" key="${block.id}">${esc(p.text)}</div>`
    case 'interactionprompt': return `<div className="gb-prompt" key="${block.id}"><kbd>E</kbd><span>${esc(p.text)}</span></div>`
    case 'damageindicator': return `<div className="gb-damage" key="${block.id}" />`
    case 'mainmenu': return `<div className="gb-mainmenu" key="${block.id}"><h2>${esc(p.text)}</h2>{Array.from({ length: ${p.count} }).map((_, i) => (<button className={\`gb-menu-btn\${i === 0 ? ' gb-menu-btn--primary' : ''}\`} key={i}>Пункт меню {i + 1}</button>))}</div>`
    case 'pausemenu': return `<div className="gb-pausemenu" key="${block.id}"><h3>Пауза</h3>{Array.from({ length: ${p.count} }).map((_, i) => (<button className="gb-menu-btn" key={i}>Пункт {i + 1}</button>))}</div>`
    case 'inventorygrid': return `<div className="gb-inventory" key="${block.id}"><div className="gb-inv-grid" style={{ gridTemplateColumns: 'repeat(${p.cols}, 1fr)' }}>{Array.from({ length: ${p.cols * p.count} }).map((_, i) => (<div className="gb-inv-slot" key={i} />))}</div></div>`
    case 'dialoguebox': return `<div className="gb-dialogue" key="${block.id}"><div className="gb-dialogue-portrait" /><div className="gb-dialogue-body"><div className="gb-dialogue-name">${esc(p.text)}</div><div className="gb-dialogue-line">${esc(p.text2)}</div></div></div>`
    case 'settingsmenu': return `<div className="gb-settings" key="${block.id}">{Array.from({ length: ${p.count} }).map((_, i) => (<div className="gb-settings-row" key={i}><span>Налаштування {i + 1}</span><div className="gb-settings-control" /></div>))}</div>`
    case 'levelselect': return `<div className="gb-levelselect" style={{ gridTemplateColumns: 'repeat(${p.cols}, 1fr)' }} key="${block.id}">{Array.from({ length: ${p.cols * p.count} }).map((_, i) => (<div className={\`gb-level-card\${i > 1 ? ' gb-level-card--locked' : ''}\`} key={i}>{i + 1}</div>))}</div>`
    default: return ''
  }
}

export function generateJsx(mode, blocks) {
  if (mode === 'hud') {
    const zones = groupByZone(blocks)
    const zoneJsx = (zone) => (zones[zone] || []).map((b) => '        ' + blockJsx(b)).join('\n')
    return `export default function Hud() {
  return (
    <div className="gb-viewport">
      <div className="gb-zone gb-zone--top-left">
${zoneJsx('top-left')}
      </div>
      <div className="gb-zone gb-zone--top-right">
${zoneJsx('top-right')}
      </div>
      <div className="gb-zone gb-zone--top-center">
${zoneJsx('top-center')}
      </div>
      <div className="gb-zone gb-zone--center">
${zoneJsx('center')}
      </div>
      <div className="gb-zone gb-zone--bottom-left">
${zoneJsx('bottom-left')}
      </div>
      <div className="gb-zone gb-zone--bottom-right">
${zoneJsx('bottom-right')}
      </div>
      <div className="gb-zone gb-zone--bottom-center">
${zoneJsx('bottom-center')}
      </div>
${zoneJsx('overlay')}
    </div>
  )
}`
  }
  const body = blocks.map((b) => '      ' + blockJsx(b)).join('\n\n')
  return `export default function Screen() {
  return (
    <div className="gb-screen">
${body || '      /* додайте блоки з палітри зліва */'}
    </div>
  )
}`
}

export function defaultSettings() {
  return { accent: '#F59E0B' }
}
