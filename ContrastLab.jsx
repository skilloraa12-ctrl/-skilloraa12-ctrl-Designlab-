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

const TABS = [
  { key: 'text', icon: '📝', label: 'Текст' },
  { key: 'ui', icon: '🔲', label: 'Іконки / UI' },
  { key: 'states', icon: '🎛', label: 'Стани' },
  { key: 'focus', icon: '🎯', label: 'Фокус' },
]

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}

function HelpBox({ children }) {
  return (
    <details className="cl-help">
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

function defaultState() {
  return {
    text: { fg: '#17171A', bg: '#FFFFFF', largeText: false },
    ui: { fg: '#3E37E0', bg: '#FFFFFF' },
    states: { fg: '#17171A', bg: '#ECEAE3', deltas: { hover: -10, focus: -15, active: -20, disabled: 30 } },
    focus: { ring: '#3E37E0', bg: '#FFFFFF', width: 2, offset: 2 },
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
      subtitle="Перевірка контрасту WCAG для тексту, іконок, інтерактивних станів і фокус-індикатора."
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
        </div>
      </div>
    </LabShell>
  )
}
