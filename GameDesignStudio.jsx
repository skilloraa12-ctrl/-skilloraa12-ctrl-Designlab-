import { useState } from 'react'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'

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

const TILE_TYPES = [
  { id: 'empty', icon: '', label: 'Порожньо' },
  { id: 'ground', icon: '🟫', label: 'Земля' },
  { id: 'platform', icon: '🟩', label: 'Платформа' },
  { id: 'enemy', icon: '👾', label: 'Ворог' },
  { id: 'collectible', icon: '⭐', label: 'Предмет' },
  { id: 'hazard', icon: '🔥', label: 'Небезпека' },
  { id: 'start', icon: '🚩', label: 'Старт' },
  { id: 'finish', icon: '🏁', label: 'Фініш' },
]

const GRID_COLS = 10
const GRID_ROWS = 6

function emptyGrid() {
  return Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => 'empty'))
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
  lines.push(`Рівень: сітка ${GRID_COLS}×${GRID_ROWS}, використані елементи — ${[...used].map((id) => TILE_TYPES.find((t) => t.id === id)?.label).join(', ') || '(порожньо)'}`)
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
      <p className="cl-tab-desc">Додай ігрові об’єкти з палітри — кожен одразу отримує типову поведінку, яку можна відредагувати під свою гру.</p>
      <div className="sb-palette-grid">
        {OBJECT_TYPES.map((t) => (
          <button key={t.type} className="sb-palette-btn" onClick={() => onAdd(t)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div className="cl-section-title">Об’єкти гри ({objects.length})</div>
      {objects.length === 0 && <p className="cl-tab-desc">Порожньо — додай об’єкт із палітри вище.</p>}
      <div className="l3d-object-list">
        {objects.map((o) => {
          const def = OBJECT_TYPES.find((t) => t.type === o.type)
          return (
            <div key={o.id} className="gds-object-card">
              <div className="gds-object-head">
                <span>{def?.icon}</span>
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

function LevelTab({ grid, onPaint, activeTile, setActiveTile }) {
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
  const [activeTab, setActiveTab] = useState('rules')
  const [objects, setObjects] = useState([])
  const [grid, setGrid] = useState(emptyGrid)
  const [activeTile, setActiveTile] = useState('ground')
  const [testItems, setTestItems] = useState(DEFAULT_TEST_QUESTIONS.map((text) => ({ id: nextId(), text, checked: false, custom: false })))

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
    setGrid((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? activeTile : cell)) : row)))
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
    addPortfolioItem({
      title: `${module?.title || 'Game Design Studio'} — план гри`,
      desc: planText,
      tags: [module?.title, 'Game Design Studio'].filter(Boolean),
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
                { id: 'test', label: 'Тест' },
              ].map((t) => (
                <button key={t.id} className={'cl-tab' + (activeTab === t.id ? ' active' : '')} onClick={() => setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>
            {activeTab === 'rules' && <RulesTab gameType={gameType} goal={goal} difficulty={difficulty} planText={planText} toastApi={toastApi} />}
            {activeTab === 'objects' && <ObjectsTab objects={objects} onAdd={addObject} onUpdate={updateObject} onRemove={removeObject} />}
            {activeTab === 'level' && <LevelTab grid={grid} onPaint={paintCell} activeTile={activeTile} setActiveTile={setActiveTile} />}
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
