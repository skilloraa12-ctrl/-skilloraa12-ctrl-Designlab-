import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { ASPECTS, buildColumnGridCss, buildModularGridCss, buildBaselineGridCss, buildIsometricSvg } from './labs/gridPatterns.js'

const TABS = [
  { key: 'column', icon: '📊', label: 'Колонкова' },
  { key: 'modular', icon: '🔲', label: 'Модульна' },
  { key: 'baseline', icon: '📏', label: 'Базова лінія' },
  { key: 'isometric', icon: '🔺', label: 'Ізометрична' },
]

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}
function downloadText(text, filename, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function HelpBox({ children }) {
  return (
    <details className="cl-help">
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

function ColumnTab({ state, patch, toastApi }) {
  const css = buildColumnGridCss(state.column)
  const cols = Array.from({ length: state.column.columns })
  return (
    <div>
      <p className="cl-tab-desc">Колонкова сітка — основа будь-якого сайту: контент вирівнюється по вертикальних колонках однакової ширини з відступами (gutter) між ними.</p>
      <HelpBox>
        <p>Columns — скільки колонок у сітці (12 — найпоширеніший вибір, ділиться на 2/3/4/6). Gutter — відступ між колонками. Margin — відступ від краю екрана до першої/останньої колонки.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>Columns
          <input type="range" min={2} max={16} step={1} value={state.column.columns} onChange={(e) => patch('column', { columns: parseInt(e.target.value, 10) })} />
          <span>{state.column.columns}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Gutter
          <input type="range" min={0} max={48} step={2} value={state.column.gutter} onChange={(e) => patch('column', { gutter: parseInt(e.target.value, 10) })} />
          <span>{state.column.gutter}px</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Margin
          <input type="range" min={0} max={64} step={2} value={state.column.margin} onChange={(e) => patch('column', { margin: parseInt(e.target.value, 10) })} />
          <span>{state.column.margin}px</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Max width
          <input type="range" min={600} max={1400} step={20} value={state.column.maxWidth} onChange={(e) => patch('column', { maxWidth: parseInt(e.target.value, 10) })} />
          <span>{state.column.maxWidth}px</span>
        </label>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="gl-column-preview" style={{ maxWidth: state.column.maxWidth, padding: `0 ${state.column.margin}px`, gap: state.column.gutter }}>
        {cols.map((_, i) => <div key={i} className="gl-column-bar" />)}
      </div>

      <div className="cl-section-title">CSS</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function ModularTab({ state, patch, toastApi }) {
  const css = buildModularGridCss(state.modular)
  const cells = Array.from({ length: state.modular.columns * state.modular.rows })
  return (
    <div>
      <p className="cl-tab-desc">Модульна сітка — однакові за пропорціями «модулі» (картки, плитки, прев'ю), розставлені рядками й колонками. Класика для галерей і каталогів.</p>
      <HelpBox>
        <p>Aspect ratio модуля визначає форму кожної плитки незалежно від того, скільки їх у рядку — зручно, коли контент (фото, відео, картки товару) має бути однакових пропорцій.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>Columns
          <input type="range" min={1} max={8} step={1} value={state.modular.columns} onChange={(e) => patch('modular', { columns: parseInt(e.target.value, 10) })} />
          <span>{state.modular.columns}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Rows
          <input type="range" min={1} max={6} step={1} value={state.modular.rows} onChange={(e) => patch('modular', { rows: parseInt(e.target.value, 10) })} />
          <span>{state.modular.rows}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Gap
          <input type="range" min={0} max={48} step={2} value={state.modular.gap} onChange={(e) => patch('modular', { gap: parseInt(e.target.value, 10) })} />
          <span>{state.modular.gap}px</span>
        </label>
      </div>
      <div className="cl-section-title">Aspect ratio</div>
      <div className="cl-btn-row">
        {ASPECTS.map((a) => (
          <button key={a.key} className={'harmony-btn' + (state.modular.aspect === a.value ? ' active' : '')} onClick={() => patch('modular', { aspect: a.value })}>{a.label}</button>
        ))}
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="gl-modules-preview" style={{ gridTemplateColumns: `repeat(${state.modular.columns}, 1fr)`, gap: state.modular.gap }}>
        {cells.map((_, i) => <div key={i} className="gl-module-cell" style={{ aspectRatio: state.modular.aspect }} />)}
      </div>

      <div className="cl-section-title">CSS</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

const BASELINE_SAMPLE = 'Базова лінія (baseline grid) — невидима сітка горизонтальних ліній, крок якої дорівнює висоті рядка. Коли line-height кратний цьому кроку, текст різних розмірів вирівнюється по одних і тих самих лініях на сторінці.'

function BaselineTab({ state, patch, toastApi }) {
  const css = buildBaselineGridCss(state.baseline)
  const lineHeight = state.baseline.baseline * state.baseline.multiple
  return (
    <div>
      <p className="cl-tab-desc">Базова лінія — крок вертикального ритму сторінки. Абзаци, заголовки й картинки вирівнюються так, щоб кожен рядок тексту сідав точно на лінію.</p>
      <HelpBox>
        <p>Baseline — крок сітки в px (4 або 8 — типові значення). Multiple — у скільки кроків вкладається line-height тексту: 8px × 3 = 24px line-height, наприклад.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>Baseline
          <input type="range" min={4} max={16} step={1} value={state.baseline.baseline} onChange={(e) => patch('baseline', { baseline: parseInt(e.target.value, 10) })} />
          <span>{state.baseline.baseline}px</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Multiple
          <input type="range" min={1} max={6} step={1} value={state.baseline.multiple} onChange={(e) => patch('baseline', { multiple: parseInt(e.target.value, 10) })} />
          <span>×{state.baseline.multiple} = {lineHeight}px</span>
        </label>
      </div>

      <div className="cl-section-title">Превʼю (з підсвіченою сіткою)</div>
      <div
        className="gl-baseline-preview"
        style={{
          lineHeight: `${lineHeight}px`,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${state.baseline.baseline - 1}px, rgba(224,82,62,0.35) ${state.baseline.baseline}px)`,
        }}
      >
        {BASELINE_SAMPLE}
      </div>

      <div className="cl-section-title">CSS</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function IsometricTab({ state, patch, toastApi }) {
  const svg = buildIsometricSvg(state.isometric)
  return (
    <div>
      <p className="cl-tab-desc">Ізометрична сітка — лінії під 30°, які утворюють ромби. Використовується для вирівнювання ізометричних ілюстрацій, іконок і 2.5D-макетів.</p>
      <HelpBox>
        <p>Cell size — розмір однієї ромбовидної комірки. Columns/Rows — скільки комірок по горизонталі й вертикалі вміщається в експортований SVG.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>Cell size
          <input type="range" min={20} max={120} step={4} value={state.isometric.cellSize} onChange={(e) => patch('isometric', { cellSize: parseInt(e.target.value, 10) })} />
          <span>{state.isometric.cellSize}px</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Columns
          <input type="range" min={2} max={16} step={1} value={state.isometric.cols} onChange={(e) => patch('isometric', { cols: parseInt(e.target.value, 10) })} />
          <span>{state.isometric.cols}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Rows
          <input type="range" min={2} max={16} step={1} value={state.isometric.rows} onChange={(e) => patch('isometric', { rows: parseInt(e.target.value, 10) })} />
          <span>{state.isometric.rows}</span>
        </label>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="gl-iso-preview" dangerouslySetInnerHTML={{ __html: svg }} />

      <div className="cl-section-title">SVG</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(svg); toastApi.show('✓ SVG скопійовано') }}>Copy SVG</button>
        <button className="harmony-btn" onClick={() => downloadText(svg, 'isometric-grid.svg', 'image/svg+xml')}>⬇ SVG</button>
      </div>
      <pre className="cl-code-block">{svg}</pre>
    </div>
  )
}

const DEFAULT_STATE = {
  column: { columns: 12, gutter: 24, margin: 24, maxWidth: 1200 },
  modular: { columns: 4, rows: 2, gap: 16, aspect: '4 / 3' },
  baseline: { baseline: 8, multiple: 3 },
  isometric: { cellSize: 48, cols: 8, rows: 6 },
}

export default function GridLab() {
  const [state, setStateLive] = useState(DEFAULT_STATE)
  const [tab, setTab] = useState('column')
  const stateRef = useRef(state)
  const debounceRef = useRef(null)
  const hist = useLabHistory(DEFAULT_STATE)

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
    pushRecentLab('grid')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Grid Lab"
      subtitle="Колонкові, модульні, базові та ізометричні сітки — з живим превʼю й готовим CSS/SVG для кожної."
      icon="📐"
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
          {tab === 'column' && <ColumnTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'modular' && <ModularTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'baseline' && <BaselineTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'isometric' && <IsometricTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
