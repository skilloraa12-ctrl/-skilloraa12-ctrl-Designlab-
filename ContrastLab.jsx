import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { wcagLevel } from './colorMath.js'
import { contrastRatio, nonTextLevel, adjustLightness, STATE_DEFS } from './labs/a11yChecks.js'
import { simulateColorBlindness, CVD_TYPES, CVD_DESCRIPTIONS } from './labs/colorBlindness.js'

const TABS = [
  { key: 'text', icon: '📝', label: 'Текст' },
  { key: 'ui', icon: '🔲', label: 'Іконки / UI' },
  { key: 'states', icon: '🎛', label: 'Стани' },
  { key: 'focus', icon: '🎯', label: 'Фокус' },
  { key: 'matrix', icon: '🔢', label: 'Матриця' },
  { key: 'colorblind', icon: '👁', label: 'Дальтонізм' },
]

const CVD_KEYS = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia']

let matrixIdCounter = 1

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}

function HelpBox({ children }) {
  return (
    <details className="cl-help" open>
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="cl-picker-top">
      <span style={{ fontSize: 12, color: 'var(--muted)', width: 90, flex: 'none' }}>{label}</span>
      <input type="color" className="cl-swatch-input" value={value} onChange={(e) => onChange(e.target.value)} />
      <input className="cl-hex-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function RatioBadges({ ratio, aa, aaa }) {
  return (
    <div className="cl-tags" style={{ marginTop: 10 }}>
      <span className="cl-tag">Ratio {ratio.toFixed(2)}:1</span>
      <span className={'cl-badge ' + (aa ? 'pass' : 'fail')}>{aa ? '✓' : '✕'} AA</span>
      {aaa !== undefined && <span className={'cl-badge ' + (aaa ? 'pass' : 'fail')}>{aaa ? '✓' : '✕'} AAA</span>}
    </div>
  )
}

function TextTab({ state, patch }) {
  const ratio = contrastRatio(state.text.fg, state.text.bg)
  const level = wcagLevel(ratio, state.text.largeText)
  return (
    <div>
      <p className="cl-tab-desc">Контраст тексту проти фону — найчастіша перевірка доступності: чи достатньо видно напис на цьому фоні.</p>
      <HelpBox>
        <p>AA — мінімальна вимога WCAG (обов'язкова для більшості сайтів): 4.5:1 для звичайного тексту, 3:1 для великого (≥18pt або ≥14pt жирний). AAA — підвищена вимога: 7:1 і 4.5:1 відповідно.</p>
        <p>Коефіцієнт контрасту рахується з яскравості (luminance) обох кольорів за формулою WCAG: <code>(L1 + 0.05) / (L2 + 0.05)</code>, де L1 — яскравіший колір. Максимум — 21:1 (чорне на білому), мінімум — 1:1 (однакові кольори). Більшість дизайн-систем цілять у 4.5:1+ навіть для «не обовʼязкового» AAA, бо це просто зручніше читається.</p>
        <p>Наприклад, сірий текст #777777 на білому фоні дає приблизно 4.5:1 — це рівно межа AA, тобто найсвітліший сірий, який ще «проходить» перевірку для звичайного тексту. Трохи світліший #999999 падає нижче 3:1 і вже не проходить навіть поріг для великого тексту — ось чому «ледь сірий» текст на білому фоні так часто виявляється провальним на аудиті доступності.</p>
      </HelpBox>

      <ColorField label="Текст" value={state.text.fg} onChange={(v) => patch('text', { fg: v })} />
      <ColorField label="Фон" value={state.text.bg} onChange={(v) => patch('text', { bg: v })} />
      <div className="cl-editrow" style={{ marginTop: 10 }}>
        <label>
          <input type="checkbox" checked={state.text.largeText} onChange={(e) => patch('text', { largeText: e.target.checked })} />
          Великий текст (≥18pt або ≥14pt жирний)
        </label>
      </div>

      <RatioBadges ratio={ratio} aa={level.aa} aaa={level.aaa} />

      <div className="cl-section-title">Превʼю</div>
      <div className="ac-preview" style={{ background: state.text.bg, color: state.text.fg, fontSize: state.text.largeText ? 24 : 15, fontWeight: state.text.largeText ? 600 : 400 }}>
        Швидка бура лисиця перестрибує через ледачого пса
      </div>
    </div>
  )
}

function UiTab({ state, patch }) {
  const ratio = contrastRatio(state.ui.fg, state.ui.bg)
  const level = nonTextLevel(ratio)
  return (
    <div>
      <p className="cl-tab-desc">Нетекстові елементи — іконки, межі полів вводу, кордони карток — теж мають вимогу контрасту (WCAG 1.4.11), окрему від тексту.</p>
      <HelpBox>
        <p>Поріг для іконок і UI-елементів — 3:1 проти фону (AAA-рівня для цього критерію не існує). Застосовується до будь-якої графіки, що несе інформацію (іконка кнопки, рамка активного поля), — не до суто декоративних елементів.</p>
        <p>Приклад декоративного винятку: фонова текстура або орнамент, який нічого не «повідомляє», не підпадає під цю вимогу. А ось рамка текстового поля, яка показує, що воно активне — підпадає, бо несе функціональну інформацію (стан елемента).</p>
        <p>Поширена помилка — брендовий «фірмовий» синій (наприклад #A5B4FC, світлий відтінок) на білому фоні іконок: він виглядає приємно, але часто дає лише 1.5-2:1, набагато нижче за поріг 3:1. Якщо потрібно зберегти колір бренду, але підняти контраст, найпростіший вихід — затемнити той самий відтінок (знизити lightness в HSL), а не міняти hue.</p>
      </HelpBox>

      <ColorField label="Іконка/межа" value={state.ui.fg} onChange={(v) => patch('ui', { fg: v })} />
      <ColorField label="Фон" value={state.ui.bg} onChange={(v) => patch('ui', { bg: v })} />

      <RatioBadges ratio={ratio} aa={level.aa} />

      <div className="cl-section-title">Превʼю</div>
      <div className="ac-preview ac-preview-ui" style={{ background: state.ui.bg }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={state.ui.fg} strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <div className="ac-preview-field" style={{ borderColor: state.ui.fg }} />
      </div>
    </div>
  )
}

function StatesTab({ state, patch }) {
  return (
    <div>
      <p className="cl-tab-desc">Текст, який добре читається у звичайному стані, часто стає малопомітним у hover/focus/active — особливо коли фон змінюється, а колір тексту лишається той самий.</p>
      <HelpBox>
        <p>Для кожного стану фон «освітлюється» чи «затемнюється» на вказаний відсоток відносно базового — так само, як це зазвичай роблять в CSS (<code>filter: brightness()</code> чи окремий колір на hover). Якщо контраст тексту падає нижче AA — стан позначається червоним.</p>
        <p>Найчастіша помилка новачків — перевірити контраст лише в звичайному стані кнопки й забути про hover/active. Якщо текст білий, а фон на hover стає світлішим (замість темнішим), контраст може «провалитись» саме в той момент, коли людина наводить курсор — а це якраз момент, коли читабельність найважливіша.</p>
        <p>Стан Disabled — особливий випадок: WCAG офіційно не вимагає контрасту 4.5:1 для вимкнених елементів (вони non-interactive), тому дизайнери традиційно роблять їх навмисно блідими (+30% lightness тут), щоб сигналізувати «недоступно» — саме тому цей стан єдиний, де низький контраст — очікувана, а не помилкова поведінка.</p>
      </HelpBox>

      <ColorField label="Текст" value={state.states.fg} onChange={(v) => patch('states', { fg: v })} />
      <ColorField label="Базовий фон" value={state.states.bg} onChange={(v) => patch('states', { bg: v })} />

      <div className="cl-section-title">Стани</div>
      <div className="ac-state-grid">
        {STATE_DEFS.map((def) => {
          const delta = state.states.deltas[def.key]
          const bg = adjustLightness(state.states.bg, delta)
          const ratio = contrastRatio(state.states.fg, bg)
          const level = wcagLevel(ratio, false)
          return (
            <div key={def.key} className="ac-state-card">
              <div className="ac-state-preview" style={{ background: bg, color: state.states.fg }}>{def.label}</div>
              <div className="cl-editrow">
                <label>Δ lightness
                  <input
                    type="range" min={-50} max={50} step={1} value={delta}
                    onChange={(e) => patch('states', { deltas: { ...state.states.deltas, [def.key]: parseInt(e.target.value, 10) } })}
                  />
                  <span>{delta > 0 ? '+' : ''}{delta}%</span>
                </label>
              </div>
              <RatioBadges ratio={ratio} aa={level.aa} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FocusTab({ state, patch }) {
  const ratio = contrastRatio(state.focus.ring, state.focus.bg)
  const level = nonTextLevel(ratio)
  return (
    <div>
      <p className="cl-tab-desc">Індикатор фокусу (контур при навігації клавіатурою Tab) має бути достатньо контрастним проти фону — інакше людина, яка керує клавіатурою, не бачить, де вона перебуває.</p>
      <HelpBox>
        <p>WCAG 2.4.11 вимагає, щоб фокус-індикатор мав контраст ≥3:1 проти сусіднього фону (той самий поріг, що й для UI-елементів) і був не тоншим за 2px суцільної лінії навколо компонента.</p>
        <p>Багато сайтів прибирають <code>outline</code> у CSS заради «чистішого» вигляду (<code>outline: none</code>) і нічим його не замінюють — це робить сайт непридатним для керування клавіатурою: людина просто не бачить, на якому елементі вона зараз перебуває. Якщо прибираєш стандартний outline — обовʼязково постав власний через <code>:focus-visible</code>.</p>
        <p>Параметр «Відступ (offset)» визначає, чи кільце фокусу торкається самого елемента, чи «плаває» на невеликій відстані від нього — додатний offset (2-4px) часто виглядає охайніше на кнопках зі скругленими кутами, бо кільце не зливається з border-radius елемента.</p>
      </HelpBox>

      <ColorField label="Колір контуру" value={state.focus.ring} onChange={(v) => patch('focus', { ring: v })} />
      <ColorField label="Фон" value={state.focus.bg} onChange={(v) => patch('focus', { bg: v })} />
      <div className="cl-editrow">
        <label>Товщина
          <input type="range" min={1} max={6} step={1} value={state.focus.width} onChange={(e) => patch('focus', { width: parseInt(e.target.value, 10) })} />
          <span>{state.focus.width}px</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Відступ (offset)
          <input type="range" min={0} max={8} step={1} value={state.focus.offset} onChange={(e) => patch('focus', { offset: parseInt(e.target.value, 10) })} />
          <span>{state.focus.offset}px</span>
        </label>
      </div>

      <RatioBadges ratio={ratio} aa={level.aa} />
      {state.focus.width < 2 && <p className="cl-tab-desc" style={{ color: 'var(--coral)' }}>⚠ Менше 2px — WCAG 2.4.11 рекомендує щонайменше 2px суцільної лінії.</p>}

      <div className="cl-section-title">Превʼю (так виглядає Tab-фокус)</div>
      <div className="ac-preview" style={{ background: state.focus.bg, display: 'flex', justifyContent: 'center', padding: 40 }}>
        <button
          className="harmony-btn"
          style={{ outline: `${state.focus.width}px solid ${state.focus.ring}`, outlineOffset: state.focus.offset }}
        >
          Кнопка у фокусі
        </button>
      </div>
    </div>
  )
}

function MatrixTab({ state, patch }) {
  const colors = state.matrix.colors
  function update(id, hex) {
    patch('matrix', { colors: colors.map((c) => (c.id === id ? { ...c, hex } : c)) })
  }
  function remove(id) {
    if (colors.length <= 2) return
    patch('matrix', { colors: colors.filter((c) => c.id !== id) })
  }
  function add() {
    if (colors.length >= 8) return
    matrixIdCounter += 1
    patch('matrix', { colors: [...colors, { id: matrixIdCounter, hex: '#999999', label: `Колір ${colors.length + 1}` }] })
  }
  return (
    <div>
      <p className="cl-tab-desc">Перевірте контраст одразу для всієї палітри — кожна пара кольорів із кожною, не по одній.</p>
      <HelpBox>
        <p>Коли в дизайн-системі 5-6 кольорів, вручну перевіряти кожну можливу пару (текст на фоні, фон на фоні) довго й легко щось пропустити. Матриця показує відразу всі комбінації: по діагоналі — порожньо (колір сам із собою завжди 1:1, безглуздо), а в кожній клітинці — реальне співвідношення контрасту цієї пари.</p>
        <p>Матриця симетрична відносно діагоналі (контраст A проти B такий самий, як B проти A — формула не залежить від порядку, окрім того, який колір світліший), тому фактично достатньо дивитись лише на половину клітинок вище або нижче діагоналі. Поріг 4.5:1 тут жорстко зашитий (рівень AA для тексту) — якщо потрібен AAA (7:1) чи поріг для UI-елементів (3:1), використовуйте вкладки «Текст» чи «Іконки / UI» для конкретної пари.</p>
      </HelpBox>

      <div className="l3d-object-list">
        {colors.map((c) => (
          <div key={c.id} className="l3d-object-row">
            <input type="color" className="cl-swatch-input" style={{ width: 32, height: 28 }} value={c.hex} onChange={(e) => update(c.id, e.target.value)} />
            <input className="cl-hex-input" style={{ flex: 1 }} value={c.hex} onChange={(e) => update(c.id, e.target.value)} />
            <button className="cl-mini-btn" onClick={() => remove(c.id)} title="Видалити">✕</button>
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={add}>+ Додати колір</button>
      </div>

      <div className="cl-section-title">Матриця контрасту</div>
      <div className="ac-matrix-wrap">
        <table className="ac-matrix-table">
          <thead>
            <tr>
              <th />
              {colors.map((c) => <th key={c.id}><span className="ac-matrix-swatch" style={{ background: c.hex }} /></th>)}
            </tr>
          </thead>
          <tbody>
            {colors.map((rowC) => (
              <tr key={rowC.id}>
                <th><span className="ac-matrix-swatch" style={{ background: rowC.hex }} /></th>
                {colors.map((colC) => {
                  if (rowC.id === colC.id) return <td key={colC.id} className="ac-matrix-cell ac-matrix-cell-empty">—</td>
                  const ratio = contrastRatio(rowC.hex, colC.hex)
                  const pass = ratio >= 4.5
                  return (
                    <td key={colC.id} className={'ac-matrix-cell ' + (pass ? 'ac-matrix-pass' : 'ac-matrix-fail')}>
                      {ratio.toFixed(1)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ColorblindTab({ state, patch }) {
  const { fg, bg, type } = state.colorblind
  const simFg = simulateColorBlindness(fg, type)
  const simBg = simulateColorBlindness(bg, type)
  const normalRatio = contrastRatio(fg, bg)
  const simRatio = contrastRatio(simFg, simBg)
  const normalLevel = wcagLevel(normalRatio, false)
  const simLevel = wcagLevel(simRatio, false)
  return (
    <div>
      <p className="cl-tab-desc">Контраст рахується за звичайним зором — але чи лишається пара текст/фон читабельною для людини з дальтонізмом?</p>
      <HelpBox>
        <p>Симуляція нижче перераховує обидва кольори за опублікованими матрицями Machado/Oliveira/Fernandes (2009) для кожного типу дальтонізму, а тоді рахує WCAG-контраст заново вже для «побачених» кольорів. Якщо коефіцієнт при симуляції падає нижче AA — пара, яка технічно проходить перевірку для звичайного зору, насправді погано читається для частини аудиторії.</p>
        <p>Найризикованіша комбінація — червоний проти зеленого (чи навпаки): у людей з протанопією або дейтеранопією (разом ≈ 8% чоловіків) ці кольори можуть зливатись у схожий відтінок, навіть якщо їхня яскравість (і тому контраст за формулою WCAG) відрізняється достатньо. Ось чому не можна покладатись лише на колір, щоб передати стан (помилка/успіх) — завжди додавайте ще й іконку, підпис чи форму.</p>
        <p>Ахроматопсія (повна відсутність кольорового зору, дуже рідкісна) — корисний «стрес-тест»: якщо дизайн лишається зрозумілим навіть у відтінках сірого, то й для решти типів дальтонізму він, з високою ймовірністю, буде ОК.</p>
      </HelpBox>

      <ColorField label="Текст" value={fg} onChange={(v) => patch('colorblind', { fg: v })} />
      <ColorField label="Фон" value={bg} onChange={(v) => patch('colorblind', { bg: v })} />

      <div className="cl-section-title">Тип дальтонізму</div>
      <div className="cl-tags">
        {CVD_KEYS.map((key) => (
          <button
            key={key}
            className={'harmony-btn' + (type === key ? ' active' : '')}
            onClick={() => patch('colorblind', { type: key })}
          >
            {CVD_TYPES[key]}
          </button>
        ))}
      </div>
      <p className="cl-tab-desc" style={{ marginTop: 8 }}>{CVD_DESCRIPTIONS[type]}</p>

      <div className="cl-section-title">Порівняння</div>
      <div className="l3d-template-grid">
        <div className="l3d-template-card">
          <div className="ac-preview" style={{ background: bg, color: fg }}>Звичайний зір</div>
          <RatioBadges ratio={normalRatio} aa={normalLevel.aa} />
        </div>
        <div className="l3d-template-card">
          <div className="ac-preview" style={{ background: simBg, color: simFg }}>{CVD_TYPES[type]}</div>
          <RatioBadges ratio={simRatio} aa={simLevel.aa} />
        </div>
      </div>
    </div>
  )
}

function defaultState() {
  return {
    text: { fg: '#17171A', bg: '#FFFFFF', largeText: false },
    ui: { fg: '#3E37E0', bg: '#FFFFFF' },
    states: { fg: '#17171A', bg: '#ECEAE3', deltas: { hover: -10, focus: -15, active: -20, disabled: 30 } },
    focus: { ring: '#3E37E0', bg: '#FFFFFF', width: 2, offset: 2 },
    matrix: { colors: [
      { id: 1, hex: '#17171A', label: 'Text' },
      { id: 2, hex: '#FFFFFF', label: 'BG' },
      { id: 3, hex: '#3E37E0', label: 'Primary' },
      { id: 4, hex: '#ECEAE3', label: 'Surface' },
    ] },
    colorblind: { fg: '#D14343', bg: '#FFFFFF', type: 'protanopia' },
  }
}

export default function ContrastLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('text')
  const stateRef = useRef(state)
  const debounceRef = useRef(null)
  const hist = useLabHistory(initial)

  function scheduleCommit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => hist.set(stateRef.current), 400)
  }
  function patch(section, partial) {
    const next = { ...stateRef.current, [section]: { ...stateRef.current[section], ...partial } }
    stateRef.current = next
    setStateLive(next)
    scheduleCommit()
  }
  function handleUndo() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    hist.undo()
  }
  function handleRedo() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    hist.redo()
  }
  useEffect(() => {
    stateRef.current = hist.value
    setStateLive(hist.value)
  }, [hist.value])

  const labMode = useLabMode()
  const toastApi = useLabToast()
  const { push: pushRecentLab } = useLabRecent('lab')
  useEffect(() => {
    pushRecentLab('contrast')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
    onCopy: () => {
      const r = contrastRatio(state.text.fg, state.text.bg)
      copy(r.toFixed(2) + ':1')
      toastApi.show('✓ Ratio скопійовано')
    },
  })

  return (
    <LabShell
      title="Contrast & Accessibility Lab"
      subtitle="Перевірка контрасту WCAG для тексту, іконок, інтерактивних станів, фокус-індикатора, цілої палітри й зору з дальтонізмом."
      icon="◐"
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
      toast={toastApi.toast}
      extra={
        <LabInfoTip title="Гарячі клавіші">
          Ctrl/Cmd+Z — Undo · Ctrl/Cmd+Shift+Z — Redo · Ctrl/Cmd+C — скопіювати ratio тексту (поза текстовими полями).
        </LabInfoTip>
      }
    >
      <div className="cl">
        <div className="cl-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={'cl-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
              <span className="cl-tab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <div className="cl-panel">
          {tab === 'text' && <TextTab state={state} patch={patch} />}
          {tab === 'ui' && <UiTab state={state} patch={patch} />}
          {tab === 'states' && <StatesTab state={state} patch={patch} />}
          {tab === 'focus' && <FocusTab state={state} patch={patch} />}
          {tab === 'matrix' && <MatrixTab state={state} patch={patch} />}
          {tab === 'colorblind' && <ColorblindTab state={state} patch={patch} />}
        </div>
      </div>
    </LabShell>
  )
}
