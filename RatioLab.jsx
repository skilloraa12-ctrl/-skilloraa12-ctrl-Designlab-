import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { simplifyRatio, ratioDecimal, heightFromWidth, widthFromHeight, fitRect, PRESETS } from './labs/ratioBuilder.js'

const TABS = [
  { key: 'calculator', icon: '🧮', label: 'Калькулятор' },
  { key: 'presets', icon: '📐', label: 'Пресети' },
  { key: 'compare', icon: '⚖️', label: 'Порівняння' },
]

const numInputStyle = { width: 90, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--ink)', padding: '7px 9px', fontSize: 13 }

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

function RatioRect({ ratioW, ratioH, maxW = 260, maxH = 200, label }) {
  const { width, height } = fitRect(ratioW, ratioH, maxW, maxH)
  return (
    <div className="rt-rect-box" style={{ width: maxW, height: maxH }}>
      <div className="rt-rect" style={{ width, height }}>
        <span>{ratioW} : {ratioH}</span>
      </div>
      {label && <div className="rt-rect-caption">{label}</div>}
    </div>
  )
}

function CalculatorTab({ state, patch, toastApi }) {
  const { ratioW, ratioH, targetWidth } = state.calc
  const simplified = simplifyRatio(ratioW, ratioH)
  const decimal = ratioDecimal(ratioW, ratioH)
  const computedHeight = heightFromWidth(targetWidth, ratioW, ratioH)
  const css = `aspect-ratio: ${simplified.w} / ${simplified.h};`

  const { actualWidth, actualHeight } = state.convert
  const actualSimplified = simplifyRatio(actualWidth, actualHeight)
  const actualDecimal = ratioDecimal(actualWidth, actualHeight)

  return (
    <div>
      <p className="cl-tab-desc">Введіть співвідношення сторін і відому ширину — лаба порахує відповідну висоту (і навпаки).</p>
      <HelpBox>
        <p>Співвідношення сторін (aspect ratio) — це пропорція ширини до висоти. Якщо вона фіксована, то знаючи одну сторону, завжди можна порахувати другу: height = width × (ratioH / ratioW).</p>
      </HelpBox>

      <div className="cl-section-title">Співвідношення</div>
      <div className="cl-picker-top">
        <input type="number" min={1} style={numInputStyle} value={ratioW} onChange={(e) => patch('calc', { ratioW: Math.max(1, parseFloat(e.target.value) || 1) })} />
        <span style={{ color: 'var(--muted)' }}>:</span>
        <input type="number" min={1} style={numInputStyle} value={ratioH} onChange={(e) => patch('calc', { ratioH: Math.max(1, parseFloat(e.target.value) || 1) })} />
        <button className="cl-mini-btn" title="Поміняти місцями" onClick={() => patch('calc', { ratioW: ratioH, ratioH: ratioW })}>⇄</button>
      </div>
      <p className="cl-tab-desc" style={{ marginTop: 8 }}>Спрощено: <strong>{simplified.w} : {simplified.h}</strong> · десятковий дріб: <strong>{decimal.toFixed(3)}</strong></p>

      <div className="cl-section-title">Відома ширина → висота</div>
      <div className="cl-picker-top">
        <input type="number" min={0} style={numInputStyle} value={targetWidth} onChange={(e) => patch('calc', { targetWidth: Math.max(0, parseFloat(e.target.value) || 0) })} />
        <span style={{ color: 'var(--muted)' }}>px ширини →</span>
        <strong>{computedHeight.toFixed(1)}px</strong> висоти
      </div>

      <div className="cl-section-title">Превʼю</div>
      <RatioRect ratioW={ratioW} ratioH={ratioH} />

      <div className="cl-picker-top" style={{ marginTop: 12 }}>
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>

      <div className="cl-section-title" style={{ marginTop: 20 }}>Навпаки: яке це співвідношення?</div>
      <p className="cl-tab-desc">Введіть реальну ширину й висоту — дізнайтеся спрощене співвідношення.</p>
      <div className="cl-picker-top">
        <input type="number" min={1} style={numInputStyle} value={actualWidth} onChange={(e) => patch('convert', { actualWidth: Math.max(1, parseFloat(e.target.value) || 1) })} />
        <span style={{ color: 'var(--muted)' }}>×</span>
        <input type="number" min={1} style={numInputStyle} value={actualHeight} onChange={(e) => patch('convert', { actualHeight: Math.max(1, parseFloat(e.target.value) || 1) })} />
      </div>
      <p className="cl-tab-desc" style={{ marginTop: 8 }}>Це приблизно <strong>{actualSimplified.w} : {actualSimplified.h}</strong> ({actualDecimal.toFixed(3)})</p>
    </div>
  )
}

function PresetsTab({ state, patch, toastApi }) {
  const groups = [...new Set(PRESETS.map((p) => p.group))]
  return (
    <div>
      <p className="cl-tab-desc">Готові співвідношення для екранів, соцмереж і друку. Клік застосовує пресет у калькулятор.</p>
      {groups.map((g) => (
        <div key={g}>
          <div className="cl-section-title">{g}</div>
          <div className="l3d-template-grid">
            {PRESETS.filter((p) => p.group === g).map((p) => (
              <button
                key={p.key}
                className={'l3d-template-card' + (state.calc.ratioW === p.w && state.calc.ratioH === p.h ? ' active' : '')}
                onClick={() => { patch('calc', { ratioW: p.w, ratioH: p.h }); toastApi.show(`✓ Застосовано ${p.label}`) }}
              >
                <span className="l3d-template-icon">{p.icon}</span>
                <span className="l3d-template-label">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CompareTab({ state, patch }) {
  const { ratioW, ratioH } = state.calc
  const presetB = PRESETS.find((p) => p.key === state.compareB) || PRESETS[1]
  const presetC = PRESETS.find((p) => p.key === state.compareC) || PRESETS[4]
  return (
    <div>
      <p className="cl-tab-desc">Візуальне порівняння поточного співвідношення (з калькулятора) з двома іншими пресетами в одному масштабі.</p>

      <div className="cl-picker-top">
        <label style={{ fontSize: 12, color: 'var(--muted)' }}>Порівняти з
          <select className="rt-select" value={state.compareB} onChange={(e) => patch(null, { compareB: e.target.value })}>
            {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: 'var(--muted)' }}>і з
          <select className="rt-select" value={state.compareC} onChange={(e) => patch(null, { compareC: e.target.value })}>
            {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="rt-compare-row">
        <RatioRect ratioW={ratioW} ratioH={ratioH} maxW={180} maxH={180} label="Калькулятор" />
        <RatioRect ratioW={presetB.w} ratioH={presetB.h} maxW={180} maxH={180} label={presetB.label} />
        <RatioRect ratioW={presetC.w} ratioH={presetC.h} maxW={180} maxH={180} label={presetC.label} />
      </div>
    </div>
  )
}

function defaultState() {
  return {
    calc: { ratioW: 16, ratioH: 9, targetWidth: 1920 },
    convert: { actualWidth: 1920, actualHeight: 1080 },
    compareB: 'classic',
    compareC: 'story',
  }
}

export default function RatioLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('calculator')
  const stateRef = useRef(state)
  const debounceRef = useRef(null)
  const hist = useLabHistory(initial)

  function scheduleCommit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => hist.set(stateRef.current), 400)
  }
  function patch(section, partial) {
    const next = section
      ? { ...stateRef.current, [section]: { ...stateRef.current[section], ...partial } }
      : { ...stateRef.current, ...partial }
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
    pushRecentLab('ratio')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Ratio Lab"
      subtitle="Розрахунок співвідношень сторін: 16:9, A4, золотий перетин та інші — з калькулятором і візуальним порівнянням."
      icon="📏"
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
      toast={toastApi.toast}
      extra={
        <LabInfoTip title="Гарячі клавіші">
          Ctrl/Cmd+Z — Undo · Ctrl/Cmd+Shift+Z — Redo.
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
          {tab === 'calculator' && <CalculatorTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'presets' && <PresetsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'compare' && <CompareTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
