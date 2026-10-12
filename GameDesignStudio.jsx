import { useEffect, useRef, useState } from 'react'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import { useLabHistory } from './labs/useLabHistory.js'
import LabToast from './labs/LabToast.jsx'
import GamePlayer from './GamePlay.jsx'

// Практичний інструмент для уроків напрямку Game Design — замінює
// загальний SketchPad (вільне малювання), бо для планування правил,
// об'єктів, рівня й тесту гри потрібна структура, а не порожнє полотно.
// Крок 1-3 — короткий конструктор концепції; крок 4 — робоча панель з
// чотирма вкладками (Правила/Об'єкти/Рівень/Тест), кожна відповідає
// одній з практичних задач дизайнера гри з уроків цього напрямку.

const GAME_TYPES = ['2D-платформер', 'Головоломка', 'Нескінченний раннер', 'Гра з видом зверху']
const GOALS = ['Зібрати всі предмети', 'Дістатися фінішу', 'Вижити певний час', 'Розв’язати головоломку']
const DIFFICULTIES = [
  { id: 'easy', label: 'Легка', desc: 'мінімум перешкод' },
  { id: 'medium', label: 'Середня', desc: 'перешкоди та вороги' },
  { id: 'hard', label: 'Висока', desc: 'складні механіки й обмеження' },
]

const COMPLETION_BY_GOAL = {
  'Зібрати всі предмети': 'перемога — зібрано всі предмети на рівні; поразка — гравець втрачає всі життя чи вичерпує ліміт часу (якщо він є).',
  'Дістатися фінішу': 'перемога — гравець досягає точки фінішу; поразка — гравець втрачає всі життя чи гине від перешкоди.',
  'Вижити певний час': 'перемога — гравець протримався до кінця таймера; поразка — гравець втрачає всі життя до завершення часу.',
  'Розв’язати головоломку': 'перемога — знайдено правильний розв’язок головоломки; поразка зазвичай відсутня або обмежена кількістю спроб.',
}

const OBJECT_TYPES = [
  { type: 'player', icon: '🧍', label: 'Гравець', defaultBehavior: 'Керується гравцем: рух, стрибок, основна дія.' },
  { type: 'enemy', icon: '👾', label: 'Ворог', defaultBehavior: 'Рухається за патерном і завдає шкоди при контакті.' },
  { type: 'collectible', icon: '⭐', label: 'Предмет-колекція', defaultBehavior: 'Зникає при підборі, додає очки чи прогрес до мети.' },
  { type: 'obstacle', icon: '🧱', label: 'Перешкода', defaultBehavior: 'Блокує шлях чи завдає шкоди при зіткненні.' },
  { type: 'powerup', icon: '🔋', label: 'Бонус', defaultBehavior: 'Тимчасово змінює можливості гравця при підборі.' },
  { type: 'platform', icon: '🟩', label: 'Платформа', defaultBehavior: 'Поверхня, на яку гравець може стати чи стрибнути.' },
]

// Колір за типом об'єкта — кожна картка в списку одразу візуально
// відрізняється, а не виглядає однаково незалежно від обраного типу.
// Ті самі кольори, що й у TILE_COLORS на вкладці «Рівень» для спільних
// понять (ворог/предмет/платформа), щоб проєкт виглядав цілісно.
const OBJECT_COLORS = {
  player: '#2f6fa3',
  enemy: '#6b4fa0',
  collectible: '#c8912b',
  obstacle: '#a63a2c',
  powerup: '#d9a62e',
  platform: '#2fa36b',
}

const TILE_TYPES = [
  { id: 'empty', icon: '', label: 'Порожньо' },
  { id: 'ground', icon: '🟫', label: 'Земля' },
  { id: 'platform', icon: '🟩', label: 'Платформа' },
  { id: 'wall', icon: '🧱', label: 'Стіна' },
  { id: 'enemy', icon: '👾', label: 'Ворог' },
  { id: 'collectible', icon: '⭐', label: 'Предмет' },
  { id: 'key', icon: '🔑', label: 'Ключ' },
  { id: 'door', icon: '🚪', label: 'Двері' },
  { id: 'checkpoint', icon: '📍', label: 'Контрольна точка' },
  { id: 'hazard', icon: '🔥', label: 'Небезпека' },
  { id: 'start', icon: '🚩', label: 'Старт' },
  { id: 'finish', icon: '🏁', label: 'Фініш' },
]

const TILE_COLORS = {
  empty: '#1c1c22',
  ground: '#6b4a30',
  platform: '#2fa36b',
  wall: '#45454f',
  enemy: '#6b4fa0',
  collectible: '#c8912b',
  key: '#d9a62e',
  door: '#5a3c23',
  checkpoint: '#3a6b5c',
  hazard: '#a63a2c',
  start: '#2f6fa3',
  finish: '#26262e',
}

// «Стіна» — єдиний тип клітинки, що блокує прохід (для перевірки
// досяжності фінішу); решта тайлів — лише позначки на прохідній клітинці.
const BLOCKING_TILES = new Set(['wall'])

const GRID_SIZES = [
  { id: 'small', label: 'Малий', cols: 10, rows: 6 },
  { id: 'medium', label: 'Середній', cols: 14, rows: 8 },
  { id: 'large', label: 'Великий', cols: 18, rows: 10 },
]

function emptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'empty'))
}

// Зберігає вміст клітинок, що влізають у новий розмір; решта — порожні.
function resizeGrid(grid, rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (grid[r] && grid[r][c]) || 'empty'))
}

function gridHasContent(grid) {
  return grid.some((row) => row.some((cell) => cell !== 'empty'))
}

// BFS від першого «Старту» до будь-якого «Фінішу» через непрохідні клітинки.
function isFinishReachable(grid) {
  const rows = grid.length
  const cols = grid[0]?.length || 0
  let startPos = null
  for (let r = 0; r < rows && !startPos; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 'start') { startPos = [r, c]; break }
    }
  }
  if (!startPos) return false
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false))
  const queue = [startPos]
  visited[startPos[0]][startPos[1]] = true
  while (queue.length) {
    const [r, c] = queue.shift()
    if (grid[r][c] === 'finish') return true
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (visited[nr][nc]) continue
      if (BLOCKING_TILES.has(grid[nr][nc])) continue
      visited[nr][nc] = true
      queue.push([nr, nc])
    }
  }
  return false
}

// Проста евристична перевірка рівня — не фізичний симулятор, а чекліст
// типових проблем, які самостійно важко помітити на власній сітці.
function checkLevel(grid, goal, difficulty) {
  const problems = []
  const rows = grid.length
  const cols = grid[0]?.length || 0
  const total = rows * cols
  const flat = grid.flat()
  const count = (type) => flat.filter((cell) => cell === type).length
  const startCount = count('start')
  const finishCount = count('finish')
  const hazardCount = count('hazard')
  const enemyCount = count('enemy')
  const collectibleCount = count('collectible')

  if (startCount === 0) problems.push('Немає жодної клітинки «Старт» — незрозуміло, звідки гравець починає рівень.')
  if (finishCount === 0) problems.push('Немає жодної клітинки «Фініш» — незрозуміло, у чому мета цього рівня.')
  if (startCount > 0 && finishCount > 0 && !isFinishReachable(grid)) {
    problems.push('Фініш недосяжний від старту — між ними суцільна «Стіна» чи розрив без прохідного шляху.')
  }
  if (goal === 'Зібрати всі предмети' && collectibleCount === 0) {
    problems.push('Мета рівня — «Зібрати всі предмети», але на сітці немає жодного предмета.')
  }
  const challenge = hazardCount + enemyCount
  const challengeRatio = total > 0 ? challenge / total : 0
  if (difficulty === 'easy' && challengeRatio > 0.08) {
    problems.push(`Складність «Легка», але на рівні ${challenge} ворогів/небезпек — може відчуватись несправедливо складно.`)
  }
  if (difficulty === 'hard' && challenge === 0) {
    problems.push('Складність «Висока», але на рівні немає жодного ворога чи небезпеки — реального виклику не буде.')
  }
  return problems
}

// Малює сітку рівня на canvas — спільна логіка для живого прев'ю (LevelTab)
// і для знімка, що йде в портфоліо, щоб обидва завжди показували те саме.
function drawLevelGrid(ctx, grid, cellSize) {
  const rows = grid.length
  const cols = grid[0]?.length || 0
  ctx.fillStyle = '#15151c'
  ctx.fillRect(0, 0, cols * cellSize, rows * cellSize)
  grid.forEach((row, r) => {
    row.forEach((cellType, c) => {
      const x = c * cellSize
      const y = r * cellSize
      ctx.fillStyle = TILE_COLORS[cellType] || TILE_COLORS.empty
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
      const def = TILE_TYPES.find((t) => t.id === cellType)
      if (def?.icon) {
        ctx.font = `${Math.round(cellSize * 0.56)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(def.icon, x + cellSize / 2, y + cellSize / 2 + 1)
      }
    })
  })
}

function renderLevelPreviewDataUrl(grid, cellSize = 36) {
  const canvas = document.createElement('canvas')
  canvas.width = (grid[0]?.length || 0) * cellSize
  canvas.height = grid.length * cellSize
  drawLevelGrid(canvas.getContext('2d'), grid, cellSize)
  return canvas.toDataURL('image/png')
}

const DEFAULT_TEST_QUESTIONS = [
  'Чи чітко виконується умова перемоги?',
  'Чи чітко виконується умова поразки?',
  'Чи виклик справедливий — поразка завжди через дію гравця, а не випадковість?',
  'Чи центральна механіка цікава сама по собі, без додаткового контенту навколо?',
  'Чи гравець розуміє, що робити, без зовнішніх пояснень?',
]

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}

let idCounter = 1
function nextId() { return idCounter++ }

function buildPlanText({ module, gameType, goal, difficulty, objects, grid, testItems }) {
  const diff = DIFFICULTIES.find((d) => d.id === difficulty)
  const completion = COMPLETION_BY_GOAL[goal] || ''
  const lines = []
  lines.push(`План гри — ${module?.title || 'Game Design Studio'}`)
  lines.push('')
  lines.push(`Жанр: ${gameType || '—'}`)
  lines.push(`Мета: ${goal || '—'}`)
  lines.push(`Складність: ${diff ? `${diff.label} — ${diff.desc}` : '—'}`)
  lines.push(`Умови завершення: ${completion || '—'}`)
  lines.push('')
  lines.push('Об’єкти:')
  if (objects.length === 0) lines.push('  (ще не додано)')
  objects.forEach((o) => {
    const def = OBJECT_TYPES.find((t) => t.type === o.type)
    lines.push(`  - ${o.name} (${def?.label}): ${o.behavior}`)
  })
  lines.push('')
  const used = new Set()
  grid.forEach((row) => row.forEach((cell) => { if (cell !== 'empty') used.add(cell) }))
  const gridCols = grid[0]?.length || 0
  const gridRows = grid.length
  lines.push(`Рівень: сітка ${gridCols}×${gridRows}, використані елементи — ${[...used].map((id) => TILE_TYPES.find((t) => t.id === id)?.label).join(', ') || '(порожньо)'}`)
  lines.push('')
  lines.push('Плейтест-чекліст:')
  testItems.forEach((q) => lines.push(`  [${q.checked ? 'x' : ' '}] ${q.text}`))
  return lines.join('\n')
}

function StepDots({ step }) {
  return (
    <div className="gds-steps">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={'gds-step-dot' + (n === step ? ' active' : n < step ? ' done' : '')}>{n}</span>
      ))}
    </div>
  )
}

function RulesTab({ gameType, goal, difficulty, planText, toastApi }) {
  const diff = DIFFICULTIES.find((d) => d.id === difficulty)
  const completion = COMPLETION_BY_GOAL[goal] || ''
  return (
    <div className="gds-rules-card">
      <p className="eyebrow">Правила твоєї гри</p>
      <ul className="callout-list">
        <li>Жанр: «{gameType}».</li>
        <li>Мета: «{goal}».</li>
        <li>Складність: «{diff?.label}» — {diff?.desc}.</li>
        <li>Умови завершення: {completion}</li>
      </ul>
      <button className="harmony-btn" onClick={() => { copy(planText); toastApi.show('✓ План гри скопійовано') }}>📋 Скопіювати план гри</button>
    </div>
  )
}

function ObjectsTab({ objects, onAdd, onUpdate, onRemove }) {
  return (
    <div>
      <p className="cl-tab-desc">Додай ігрові об’єкти з палітри — кожен одразу отримує типову поведінку, яку можна відредагувати під свою гру. Колір картки відповідає типу об’єкта.</p>
      <div className="sb-palette-grid">
        {OBJECT_TYPES.map((t) => (
          <button key={t.type} className="sb-palette-btn" onClick={() => onAdd(t)} style={{ borderLeftColor: OBJECT_COLORS[t.type], borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div className="cl-section-title">Об’єкти гри ({objects.length})</div>
      {objects.length === 0 && <p className="cl-tab-desc">Порожньо — додай об’єкт із палітри вище.</p>}
      <div className="l3d-object-list">
        {objects.map((o) => {
          const def = OBJECT_TYPES.find((t) => t.type === o.type)
          const color = OBJECT_COLORS[o.type]
          return (
            <div key={o.id} className="gds-object-card" style={{ borderLeftColor: color, borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
              <div className="gds-object-head">
                <span className="gds-object-badge" style={{ background: color }}>{def?.icon}</span>
                <input className="cl-text-input" value={o.name} onChange={(e) => onUpdate(o.id, { name: e.target.value })} />
                <button className="cl-mini-btn" onClick={() => onRemove(o.id)} title="Видалити">✕</button>
              </div>
              <textarea className="gds-object-behavior" rows={2} value={o.behavior} onChange={(e) => onUpdate(o.id, { behavior: e.target.value })} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LevelPreview({ grid, canvasRef }) {
  const cellSize = 28
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = (grid[0]?.length || 0) * cellSize
    canvas.height = grid.length * cellSize
    drawLevelGrid(canvas.getContext('2d'), grid, cellSize)
  }, [grid, canvasRef])
  return (
    <div className="gds-preview">
      <div className="cl-section-title">Перегляд рівня</div>
      {gridHasContent(grid) ? (
        <canvas ref={canvasRef} className="gds-preview-canvas" />
      ) : (
        <p className="cl-tab-desc">Порожньо — розстав клітинки на сітці зліва, і тут одразу зʼявиться чистий перегляд рівня, без кнопок редагування.</p>
      )}
    </div>
  )
}

function LevelTab({
  grid, onPaint, activeTile, setActiveTile, previewRef,
  gridSizeId, onResize, canUndo, canRedo, onUndo, onRedo,
  problems, onCheck,
}) {
  return (
    <div>
      <p className="cl-tab-desc">Обери тип клітинки внизу, тоді клікай по сітці, щоб розставити старт, фініш, платформи, ворогів і предмети — проста схема рівня, не фінальний рівень.</p>
      <div className="cl-btn-row">
        {TILE_TYPES.map((t) => (
          <button key={t.id} className={'harmony-btn' + (activeTile === t.id ? ' active' : '')} onClick={() => setActiveTile(t.id)}>
            {t.icon || '▢'} {t.label}
          </button>
        ))}
      </div>

      <div className="cl-picker-top">
        <span className="gds-level-toolbar-label">Розмір сітки</span>
        {GRID_SIZES.map((s) => (
          <button key={s.id} className={'harmony-btn' + (gridSizeId === s.id ? ' active' : '')} onClick={() => onResize(s.id)}>
            {s.label} ({s.cols}×{s.rows})
          </button>
        ))}
      </div>

      <div className="cl-picker-top">
        <button className="harmony-btn" disabled={!canUndo} onClick={onUndo}>↶ Undo</button>
        <button className="harmony-btn" disabled={!canRedo} onClick={onRedo}>↷ Redo</button>
        <button className="harmony-btn" onClick={onCheck}>✓ Перевірити рівень</button>
      </div>

      {problems !== null && (
        problems.length === 0 ? (
          <p className="gds-check-ok">✓ Усе гаразд: є старт і фініш, фініш досяжний, виклик виглядає збалансованим для обраної складності.</p>
        ) : (
          <ul className="callout-list gds-check-problems">
            {problems.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )
      )}

      <div className="gds-level-layout">
        <div className="gds-grid">
          {grid.map((row, r) => (
            <div className="gds-grid-row" key={r}>
              {row.map((cell, c) => (
                <button key={c} className="gds-grid-cell" onClick={() => onPaint(r, c)}>
                  {TILE_TYPES.find((t) => t.id === cell)?.icon}
                </button>
              ))}
            </div>
          ))}
        </div>
        <LevelPreview grid={grid} canvasRef={previewRef} />
      </div>
    </div>
  )
}

function TestTab({ items, onToggle, onAdd, onRemove }) {
  const [draft, setDraft] = useState('')
  return (
    <div>
      <p className="cl-tab-desc">Плейтест-чекліст — познач пункти, які вже перевірив на власній концепції, і додай свої.</p>
      <div className="l3d-object-list">
        {items.map((q) => (
          <div key={q.id} className="l3d-object-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}>
              <input type="checkbox" checked={q.checked} onChange={() => onToggle(q.id)} />
              <span style={{ fontSize: 13 }}>{q.text}</span>
            </label>
            {q.custom && <button className="cl-mini-btn" onClick={() => onRemove(q.id)} title="Видалити">✕</button>}
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <input className="cl-text-input" placeholder="Свій пункт для перевірки…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="harmony-btn" onClick={() => { if (draft.trim()) { onAdd(draft.trim()); setDraft('') } }}>+ Додати</button>
      </div>
    </div>
  )
}

export default function GameDesignStudio({ module, onClose }) {
  const { addPortfolioItem } = useProgress()
  const toastApi = useLabToast()
  const [step, setStep] = useState(1)
  const [gameType, setGameType] = useState(null)
  const [goal, setGoal] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [activeTab, setActiveTab] = useState(module?.studioTab || 'rules')
  const [playMode, setPlayMode] = useState('platformer')
  const [objects, setObjects] = useState([])
  const [gridSizeId, setGridSizeId] = useState(GRID_SIZES[0].id)
  const initialGrid = useRef(emptyGrid(GRID_SIZES[0].rows, GRID_SIZES[0].cols)).current
  const gridHistory = useLabHistory(initialGrid)
  const grid = gridHistory.value
  const [activeTile, setActiveTile] = useState('ground')
  const [levelProblems, setLevelProblems] = useState(null)
  const [testItems, setTestItems] = useState(DEFAULT_TEST_QUESTIONS.map((text) => ({ id: nextId(), text, checked: false, custom: false })))
  const levelPreviewRef = useRef(null)

  function addObject(def) {
    setObjects((prev) => [...prev, { id: nextId(), type: def.type, name: def.label, behavior: def.defaultBehavior }])
  }
  function updateObject(id, partial) {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, ...partial } : o)))
  }
  function removeObject(id) {
    setObjects((prev) => prev.filter((o) => o.id !== id))
  }
  function paintCell(r, c) {
    gridHistory.set((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? activeTile : cell)) : row)))
    setLevelProblems(null)
  }
  function resizeGridTo(sizeId) {
    const size = GRID_SIZES.find((s) => s.id === sizeId)
    if (!size) return
    setGridSizeId(sizeId)
    gridHistory.reset(resizeGrid(grid, size.rows, size.cols))
    setLevelProblems(null)
  }
  function handleUndoGrid() {
    gridHistory.undo()
    setLevelProblems(null)
  }
  function handleRedoGrid() {
    gridHistory.redo()
    setLevelProblems(null)
  }
  function handleCheckLevel() {
    setLevelProblems(checkLevel(grid, goal, difficulty))
  }
  function toggleTest(id) {
    setTestItems((prev) => prev.map((q) => (q.id === id ? { ...q, checked: !q.checked } : q)))
  }
  function addTest(text) {
    setTestItems((prev) => [...prev, { id: nextId(), text, checked: false, custom: true }])
  }
  function removeTest(id) {
    setTestItems((prev) => prev.filter((q) => q.id !== id))
  }

  const planText = buildPlanText({ module, gameType, goal, difficulty, objects, grid, testItems })

  function handleSaveToPortfolio() {
    const attachments = gridHasContent(grid)
      ? [{ url: renderLevelPreviewDataUrl(grid), name: 'level.png', type: 'image' }]
      : []
    addPortfolioItem({
      title: `${module?.title || 'Game Design Studio'} — план гри`,
      desc: planText,
      tags: [module?.title, 'Game Design Studio'].filter(Boolean),
      attachments,
    })
    toastApi.show('✓ Збережено в портфоліо')
  }

  const checklist = module?.selfCheck || []
  const [checked, setChecked] = useState({})

  return (
    <div className="sketchpad">
      {module && (
        <div className="sketchpad-hints">
          <p className="eyebrow">Завдання: {module.title}</p>
          {module.practice && <p className="sketchpad-hints-task">{module.practice}</p>}
          {checklist.length > 0 && (
            <ul className="sketchpad-checklist">
              {checklist.map((c, i) => (
                <li key={i}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!checked[i]}
                      onChange={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
                    />
                    {c}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="gds">
        <StepDots step={step} />

        {step === 1 && (
          <div className="gds-step">
            <p className="eyebrow">Крок 1. Обери тип гри</p>
            <div className="cl-btn-row">
              {GAME_TYPES.map((t) => (
                <button key={t} className={'harmony-btn' + (gameType === t ? ' active' : '')} onClick={() => setGameType(t)}>{t}</button>
              ))}
            </div>
            <button className="complete-btn" disabled={!gameType} onClick={() => setStep(2)}>Далі →</button>
          </div>
        )}

        {step === 2 && (
          <div className="gds-step">
            <p className="eyebrow">Крок 2. Що буде головною метою?</p>
            <div className="cl-btn-row">
              {GOALS.map((g) => (
                <button key={g} className={'harmony-btn' + (goal === g ? ' active' : '')} onClick={() => setGoal(g)}>{g}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="cl-mini-btn" onClick={() => setStep(1)}>← Назад</button>
              <button className="complete-btn" disabled={!goal} onClick={() => setStep(3)}>Далі →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="gds-step">
            <p className="eyebrow">Крок 3. Складність</p>
            <div className="cl-btn-row">
              {DIFFICULTIES.map((d) => (
                <button key={d.id} className={'harmony-btn' + (difficulty === d.id ? ' active' : '')} onClick={() => setDifficulty(d.id)}>{d.label} — {d.desc}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="cl-mini-btn" onClick={() => setStep(2)}>← Назад</button>
              <button className="complete-btn" disabled={!difficulty} onClick={() => setStep(4)}>Далі →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="gds-step">
            <p className="eyebrow">Крок 4. Робоча панель</p>
            <div className="cl-tabs">
              {[
                { id: 'rules', label: 'Правила' },
                { id: 'objects', label: 'Об’єкти' },
                { id: 'level', label: 'Рівень' },
                { id: 'play', label: 'Гра' },
                { id: 'test', label: 'Тест' },
              ].map((t) => (
                <button key={t.id} className={'cl-tab' + (activeTab === t.id ? ' active' : '')} onClick={() => setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>
            {activeTab === 'rules' && <RulesTab gameType={gameType} goal={goal} difficulty={difficulty} planText={planText} toastApi={toastApi} />}
            {activeTab === 'objects' && <ObjectsTab objects={objects} onAdd={addObject} onUpdate={updateObject} onRemove={removeObject} />}
            {activeTab === 'level' && (
              <LevelTab
                grid={grid} onPaint={paintCell} activeTile={activeTile} setActiveTile={setActiveTile} previewRef={levelPreviewRef}
                gridSizeId={gridSizeId} onResize={resizeGridTo}
                canUndo={gridHistory.canUndo} canRedo={gridHistory.canRedo} onUndo={handleUndoGrid} onRedo={handleRedoGrid}
                problems={levelProblems} onCheck={handleCheckLevel}
              />
            )}
            {activeTab === 'play' && (
              <div>
                <p className="cl-tab-desc">Пройди свій рівень насправді — зі справжньою фізикою, стрибками чи рухом у 4 напрямки, а не лише схемою для планування.</p>
                <div className="cl-btn-row">
                  <button className={'harmony-btn' + (playMode === 'platformer' ? ' active' : '')} onClick={() => setPlayMode('platformer')}>🏃 Платформер (гравітація + стрибок)</button>
                  <button className={'harmony-btn' + (playMode === 'topdown' ? ' active' : '')} onClick={() => setPlayMode('topdown')}>🔭 Вигляд зверху (4 напрямки)</button>
                </div>
                {grid.some((row) => row.includes('start')) ? (
                  <GamePlayer key={playMode} grid={grid} mode={playMode} goal={goal} />
                ) : (
                  <p className="cl-tab-desc">Спочатку розстав клітинку «Старт» на вкладці «Рівень» — звідти почнеться проходження.</p>
                )}
              </div>
            )}
            {activeTab === 'test' && <TestTab items={testItems} onToggle={toggleTest} onAdd={addTest} onRemove={removeTest} />}
            <button className="cl-mini-btn" style={{ marginTop: 14 }} onClick={() => setStep(3)}>← До складності</button>
          </div>
        )}
      </div>

      <div className="sketchpad-actions">
        <button className="pf-add-btn" onClick={handleSaveToPortfolio}>Зберегти в портфоліо</button>
        <button className="cl-mini-btn" onClick={onClose}>Закрити</button>
      </div>
      <LabToast message={toastApi.toast} />
    </div>
  )
}
