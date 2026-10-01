import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { buildDotsCss, buildStripesCss, buildWaveSvg, buildTrianglesSvg } from './labs/patternBuilder.js'

const TABS = [
  { key: 'dots', icon: '⚫', label: 'Крапки' },
  { key: 'lines', icon: '📏', label: 'Лінії' },
  { key: 'waves', icon: '🌊', label: 'Хвилі' },
  { key: 'geometric', icon: '🔷', label: 'Геометрія' },
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

function DotsTab({ state, patch, toastApi }) {
  const css = buildDotsCss(state.dots)
  return (
    <div>
      <p className="cl-tab-desc">Патерн із крапок — поширений фоновий візерунок, зроблений чистим CSS без жодної картинки.</p>
      <HelpBox>
        <p>Трюк — <code>radial-gradient</code>, що малює одне коло, і <code>background-size</code>, менший за саму картинку, через що браузер повторює (тайлить) цей квадрат по всій площі.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Розмір крапки<input type="range" min={1} max={20} value={state.dots.size} onChange={(e) => patch('dots', { size: parseInt(e.target.value, 10) })} /><span>{state.dots.size}px</span></label></div>
      <div className="cl-editrow"><label>Відстань<input type="range" min={10} max={80} value={state.dots.spacing} onChange={(e) => patch('dots', { spacing: parseInt(e.target.value, 10) })} /><span>{state.dots.spacing}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Крапка</span>
        <input type="color" className="cl-swatch-input" value={state.dots.color} onChange={(e) => patch('dots', { color: e.target.value })} />
        <input className="cl-hex-input" value={state.dots.color} onChange={(e) => patch('dots', { color: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={state.dots.bg} onChange={(e) => patch('dots', { bg: e.target.value })} />
        <input className="cl-hex-input" value={state.dots.bg} onChange={(e) => patch('dots', { bg: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview" style={{ backgroundColor: state.dots.bg, backgroundImage: `radial-gradient(circle, ${state.dots.color} ${state.dots.size}px, transparent ${state.dots.size}px)`, backgroundSize: `${state.dots.spacing}px ${state.dots.spacing}px` }} />

      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function LinesTab({ state, patch, toastApi }) {
  const css = buildStripesCss(state.lines)
  const bgImage = `repeating-linear-gradient(${state.lines.angle}deg, ${state.lines.color} 0px, ${state.lines.color} ${state.lines.width}px, transparent ${state.lines.width}px, transparent ${state.lines.width + state.lines.gap}px)`
  return (
    <div>
      <p className="cl-tab-desc">Смугастий патерн — ще один CSS-only трюк, цього разу на <code>repeating-linear-gradient</code>.</p>
      <HelpBox>
        <p>Градієнт повторюється кожні (ширина смуги + проміжок) пікселів. Кут 0° — вертикальні смуги, 90° — горизонтальні, 45° — по діагоналі.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Кут<input type="range" min={0} max={180} value={state.lines.angle} onChange={(e) => patch('lines', { angle: parseInt(e.target.value, 10) })} /><span>{state.lines.angle}°</span></label></div>
      <div className="cl-editrow"><label>Ширина смуги<input type="range" min={1} max={40} value={state.lines.width} onChange={(e) => patch('lines', { width: parseInt(e.target.value, 10) })} /><span>{state.lines.width}px</span></label></div>
      <div className="cl-editrow"><label>Проміжок<input type="range" min={1} max={40} value={state.lines.gap} onChange={(e) => patch('lines', { gap: parseInt(e.target.value, 10) })} /><span>{state.lines.gap}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Лінія</span>
        <input type="color" className="cl-swatch-input" value={state.lines.color} onChange={(e) => patch('lines', { color: e.target.value })} />
        <input className="cl-hex-input" value={state.lines.color} onChange={(e) => patch('lines', { color: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={state.lines.bg} onChange={(e) => patch('lines', { bg: e.target.value })} />
        <input className="cl-hex-input" value={state.lines.bg} onChange={(e) => patch('lines', { bg: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview" style={{ backgroundColor: state.lines.bg, backgroundImage: bgImage }} />

      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function WavesTab({ state, patch, toastApi }) {
  const svg = buildWaveSvg({ ...state.waves, cols: 6, rows: 4 })
  return (
    <div>
      <p className="cl-tab-desc">Хвилястий патерн — реальний тайлований SVG (<code>&lt;pattern&gt;</code>), а не наближення через CSS-градієнт.</p>
      <HelpBox>
        <p>Wavelength — довжина однієї хвилі. Amplitude — висота хвилі (наскільки сильно вигинається). SVG <code>&lt;pattern&gt;</code> сам повторює один сегмент хвилі по всій площі.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Wavelength<input type="range" min={20} max={120} value={state.waves.wavelength} onChange={(e) => patch('waves', { wavelength: parseInt(e.target.value, 10) })} /><span>{state.waves.wavelength}px</span></label></div>
      <div className="cl-editrow"><label>Amplitude<input type="range" min={4} max={40} value={state.waves.amplitude} onChange={(e) => patch('waves', { amplitude: parseInt(e.target.value, 10) })} /><span>{state.waves.amplitude}px</span></label></div>
      <div className="cl-editrow"><label>Товщина лінії<input type="range" min={1} max={8} value={state.waves.strokeWidth} onChange={(e) => patch('waves', { strokeWidth: parseInt(e.target.value, 10) })} /><span>{state.waves.strokeWidth}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Лінія</span>
        <input type="color" className="cl-swatch-input" value={state.waves.color} onChange={(e) => patch('waves', { color: e.target.value })} />
        <input className="cl-hex-input" value={state.waves.color} onChange={(e) => patch('waves', { color: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={state.waves.bg} onChange={(e) => patch('waves', { bg: e.target.value })} />
        <input className="cl-hex-input" value={state.waves.bg} onChange={(e) => patch('waves', { bg: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview-svg" dangerouslySetInnerHTML={{ __html: svg }} />

      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(svg); toastApi.show('✓ SVG скопійовано') }}>Copy SVG</button>
        <button className="harmony-btn" onClick={() => downloadText(svg, 'waves.svg', 'image/svg+xml')}>⬇ SVG</button>
      </div>
      <pre className="cl-code-block">{svg}</pre>
    </div>
  )
}

function GeometricTab({ state, patch, toastApi }) {
  const svg = buildTrianglesSvg({ ...state.geometric, cols: 10, rows: 6 })
  return (
    <div>
      <p className="cl-tab-desc">Мозаїка з трикутників — кожна клітинка сітки поділена по діагоналі на два трикутники почергових кольорів.</p>
      <HelpBox>
        <p>Класичний «геометричний» фон для брендингу й обкладинок — два кольори в шаховому порядку створюють відчуття об'єму без жодної тіні чи градієнта.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Розмір клітинки<input type="range" min={16} max={80} value={state.geometric.cellSize} onChange={(e) => patch('geometric', { cellSize: parseInt(e.target.value, 10) })} /><span>{state.geometric.cellSize}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Колір A</span>
        <input type="color" className="cl-swatch-input" value={state.geometric.colorA} onChange={(e) => patch('geometric', { colorA: e.target.value })} />
        <input className="cl-hex-input" value={state.geometric.colorA} onChange={(e) => patch('geometric', { colorA: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Колір B</span>
        <input type="color" className="cl-swatch-input" value={state.geometric.colorB} onChange={(e) => patch('geometric', { colorB: e.target.value })} />
        <input className="cl-hex-input" value={state.geometric.colorB} onChange={(e) => patch('geometric', { colorB: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview-svg" dangerouslySetInnerHTML={{ __html: svg }} />

      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(svg); toastApi.show('✓ SVG скопійовано') }}>Copy SVG</button>
        <button className="harmony-btn" onClick={() => downloadText(svg, 'triangles.svg', 'image/svg+xml')}>⬇ SVG</button>
      </div>
      <pre className="cl-code-block">{svg}</pre>
    </div>
  )
}

function defaultState() {
  return {
    dots: { size: 3, spacing: 24, color: '#3E37E0', bg: '#FFFFFF' },
    lines: { angle: 45, width: 6, gap: 10, color: '#3E37E0', bg: '#FFFFFF' },
    waves: { wavelength: 60, amplitude: 14, strokeWidth: 3, color: '#3E37E0', bg: '#FFFFFF' },
    geometric: { cellSize: 36, colorA: '#3E37E0', colorB: '#6B62FF' },
  }
}

export default function PatternLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('dots')
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
    pushRecentLab('pattern')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Pattern Lab"
      subtitle="Крапки, лінії, хвилі й геометрія — з експортом у CSS або SVG."
      icon="🔳"
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
          {tab === 'dots' && <DotsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'lines' && <LinesTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'waves' && <WavesTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'geometric' && <GeometricTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
