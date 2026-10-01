import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import {
  pxToRem, remToPx, calcDpi, calcMaxPrintInches, CM_PER_INCH,
  buildClamp, formatBytes, downloadSeconds, msToFrames, framesToMs,
  generateSpacingScale,
} from './labs/designCalc.js'

const TABS = [
  { key: 'pxrem', icon: '🔢', label: 'px ↔ rem' },
  { key: 'dpi', icon: '🖨️', label: 'DPI / PPI' },
  { key: 'fluid', icon: '📐', label: 'Fluid type' },
  { key: 'filesize', icon: '💾', label: 'Розмір файлу' },
  { key: 'duration', icon: '🎞️', label: 'мс ↔ кадри' },
  { key: 'spacing', icon: '📏', label: 'Шкала відступів' },
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

const numInputStyle = { width: 100, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--ink)', padding: '7px 9px', fontSize: 13 }

function NumField({ label, value, onChange, suffix, min }) {
  return (
    <div className="cl-picker-top">
      <span style={{ fontSize: 12, color: 'var(--muted)', width: 110, flex: 'none' }}>{label}</span>
      <input type="number" min={min} style={numInputStyle} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
      {suffix && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{suffix}</span>}
    </div>
  )
}

function PxRemTab({ state, patch }) {
  const cfg = state.pxrem
  const remResult = pxToRem(cfg.px, cfg.rootPx)
  const pxResult = remToPx(cfg.rem, cfg.rootPx)
  const PRESETS = [8, 12, 14, 16, 20, 24, 32, 48]
  return (
    <div>
      <p className="cl-tab-desc">Переведення пікселів у rem/em і назад — залежно від розміру шрифту кореневого елемента (зазвичай 16px).</p>
      <HelpBox>
        <p><code>rem</code> завжди відносний до <code>&lt;html&gt;</code>, <code>em</code> — до батьківського елемента; математика однакова, лише точка відліку різна.</p>
      </HelpBox>

      <NumField label="Кореневий розмір" value={cfg.rootPx} onChange={(v) => patch('pxrem', { rootPx: v })} suffix="px" min={1} />

      <div className="cl-section-title">px → rem</div>
      <NumField label="Пікселі" value={cfg.px} onChange={(v) => patch('pxrem', { px: v })} suffix="px" min={0} />
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(`${remResult.toFixed(4)}rem`); }}>= {remResult.toFixed(4)}rem</button>
      </div>

      <div className="cl-section-title">rem → px</div>
      <NumField label="Rem" value={cfg.rem} onChange={(v) => patch('pxrem', { rem: v })} suffix="rem" min={0} />
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(`${pxResult.toFixed(2)}px`); }}>= {pxResult.toFixed(2)}px</button>
      </div>

      <div className="cl-section-title">Швидкі значення (px)</div>
      <div className="cl-btn-row">
        {PRESETS.map((p) => (
          <button key={p} className="harmony-btn" onClick={() => patch('pxrem', { px: p })}>{p}</button>
        ))}
      </div>
    </div>
  )
}

function DpiTab({ state, patch }) {
  const cfg = state.dpi
  const dpi = calcDpi(cfg.widthPx, cfg.printWidthCm / CM_PER_INCH)
  const maxInches = calcMaxPrintInches(cfg.widthPx, cfg.targetDpi)
  const maxCm = maxInches * CM_PER_INCH
  const quality = dpi >= 300 ? 'pass' : dpi >= 150 ? 'warn' : 'fail'
  const qualityLabel = dpi >= 300 ? '✓ Якість друку' : dpi >= 150 ? '⚠ Прийнятно для великих банерів' : '✕ Замало для друку'
  return (
    <div>
      <p className="cl-tab-desc">DPI/PPI показує щільність пікселів — критично для друку (веб завжди 72/96 DPI незалежно від щільності файлу).</p>
      <HelpBox>
        <p>300 DPI — стандарт якісного друку (візитки, фото). 150 DPI прийнятний для великих банерів, які розглядають здалека. Менше 150 — помітна пікселізація зблизька.</p>
      </HelpBox>

      <NumField label="Ширина" value={cfg.widthPx} onChange={(v) => patch('dpi', { widthPx: v })} suffix="px" min={1} />
      <NumField label="Ширина друку" value={cfg.printWidthCm} onChange={(v) => patch('dpi', { printWidthCm: v })} suffix="см" min={0.1} />

      <div className="cl-tags" style={{ marginTop: 10 }}>
        <span className={'cl-badge ' + (quality === 'pass' ? 'pass' : quality === 'fail' ? 'fail' : '')} style={quality === 'warn' ? { background: '#FCECC8', color: '#8A5A00' } : undefined}>
          {dpi.toFixed(0)} DPI — {qualityLabel}
        </span>
      </div>

      <div className="cl-section-title">Навпаки: цільовий DPI → макс. розмір друку</div>
      <NumField label="Цільовий DPI" value={cfg.targetDpi} onChange={(v) => patch('dpi', { targetDpi: v })} suffix="dpi" min={1} />
      <p className="cl-tab-desc">При {cfg.widthPx}px ширини можна надрукувати максимум <strong>{maxCm.toFixed(1)} см</strong> ({maxInches.toFixed(2)}″) у {cfg.targetDpi} DPI.</p>
    </div>
  )
}

function FluidTab({ state, patch, toastApi }) {
  const cfg = state.fluid
  const { css } = buildClamp(cfg)
  return (
    <div>
      <p className="cl-tab-desc">Fluid typography (<code>clamp()</code>) плавно масштабує розмір шрифту між мінімальним і максимальним значенням залежно від ширини вікна — без медіа-запитів.</p>
      <HelpBox>
        <p>Формула лінійно інтерполює значення між двома точками (minVw→minPx і maxVw→maxPx), обгорнуте в <code>clamp()</code>, щоб розмір не виходив за межі поза цим діапазоном.</p>
      </HelpBox>

      <NumField label="Мін. розмір" value={cfg.minPx} onChange={(v) => patch('fluid', { minPx: v })} suffix="px" min={1} />
      <NumField label="при ширині" value={cfg.minVw} onChange={(v) => patch('fluid', { minVw: v })} suffix="px" min={1} />
      <NumField label="Макс. розмір" value={cfg.maxPx} onChange={(v) => patch('fluid', { maxPx: v })} suffix="px" min={1} />
      <NumField label="при ширині" value={cfg.maxVw} onChange={(v) => patch('fluid', { maxVw: v })} suffix="px" min={1} />

      <div className="cl-section-title">Превʼю (три контрольні точки)</div>
      <div className="dc-fluid-preview">
        <div style={{ fontSize: cfg.minPx }}>Aa — {cfg.minPx}px ({cfg.minVw}px екран)</div>
        <div style={{ fontSize: (cfg.minPx + cfg.maxPx) / 2 }}>Aa — проміжний розмір</div>
        <div style={{ fontSize: cfg.maxPx }}>Aa — {cfg.maxPx}px ({cfg.maxVw}px екран)</div>
      </div>

      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(`font-size: ${css};`); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">font-size: {css};</pre>
    </div>
  )
}

function FileSizeTab({ state, patch }) {
  const cfg = state.filesize
  const bytes = cfg.value * Math.pow(1024, cfg.unitIndex)
  const seconds = downloadSeconds(bytes, cfg.mbps)
  const UNITS = ['B', 'KB', 'MB', 'GB']
  return (
    <div>
      <p className="cl-tab-desc">Скільки важить файл у різних одиницях і скільки часу він завантажуватиметься на заданій швидкості зʼєднання.</p>
      <HelpBox>
        <p>1 КБ = 1024 Б (бінарний рахунок, як показують файлові менеджери). Швидкість інтернету вимірюється в мегабітах (Мбіт/с), а розмір файлу — в байтах, тому перед діленням байти переводяться в біти (× 8).</p>
      </HelpBox>

      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 110, flex: 'none' }}>Розмір</span>
        <input type="number" min={0} style={numInputStyle} value={cfg.value} onChange={(e) => patch('filesize', { value: parseFloat(e.target.value) || 0 })} />
        <div className="cl-btn-row" style={{ marginLeft: 6 }}>
          {UNITS.map((u, i) => (
            <button key={u} className={'harmony-btn' + (cfg.unitIndex === i ? ' active' : '')} onClick={() => patch('filesize', { unitIndex: i })}>{u}</button>
          ))}
        </div>
      </div>
      <NumField label="Швидкість мережі" value={cfg.mbps} onChange={(v) => patch('filesize', { mbps: v })} suffix="Мбіт/с" min={0.1} />

      <div className="cl-tags" style={{ marginTop: 10 }}>
        <span className="cl-badge pass">{formatBytes(bytes)}</span>
        <span className="cl-tag">⏱ {seconds < 60 ? `${seconds.toFixed(1)} сек` : `${(seconds / 60).toFixed(1)} хв`}</span>
      </div>
    </div>
  )
}

function DurationTab({ state, patch }) {
  const cfg = state.duration
  const framesFromMs = msToFrames(cfg.ms, cfg.fps)
  const msFromFrames = framesToMs(cfg.frames, cfg.fps)
  const FPS_PRESETS = [24, 30, 60, 120]
  return (
    <div>
      <p className="cl-tab-desc">Переведення тривалості анімації між мілісекундами й кадрами при заданому FPS — зручно, коли дизайн анімації прийшов з After Effects/Lottie.</p>
      <HelpBox>
        <p>Кадри = (мс / 1000) × FPS. Наприклад, 500мс при 60fps — це 30 кадрів.</p>
      </HelpBox>

      <div className="cl-section-title">FPS</div>
      <div className="cl-btn-row">
        {FPS_PRESETS.map((f) => (
          <button key={f} className={'harmony-btn' + (cfg.fps === f ? ' active' : '')} onClick={() => patch('duration', { fps: f })}>{f}</button>
        ))}
      </div>

      <div className="cl-section-title">мс → кадри</div>
      <NumField label="Мілісекунди" value={cfg.ms} onChange={(v) => patch('duration', { ms: v })} suffix="мс" min={0} />
      <p className="cl-tab-desc">= <strong>{framesFromMs}</strong> кадрів при {cfg.fps}fps</p>

      <div className="cl-section-title">кадри → мс</div>
      <NumField label="Кадри" value={cfg.frames} onChange={(v) => patch('duration', { frames: v })} suffix="к." min={0} />
      <p className="cl-tab-desc">= <strong>{msFromFrames.toFixed(0)}мс</strong> при {cfg.fps}fps</p>
    </div>
  )
}

function SpacingTab({ state, patch, toastApi }) {
  const cfg = state.spacing
  const scale = generateSpacingScale(cfg.base, cfg.ratio, cfg.steps, cfg.mode)
  const css = scale.map((v, i) => `--space-${i + 1}: ${v}px;`).join('\n')
  return (
    <div>
      <p className="cl-tab-desc">Шкала відступів (spacing scale) — набір узгоджених значень для margin/padding/gap, замість довільних чисел по всьому проєкту.</p>
      <HelpBox>
        <p>Лінійний режим додає однаковий крок щоразу (як 8pt-сітка: 8,16,24,32…). Геометричний — множить на коефіцієнт щокроку (росте швидше для великих відступів).</p>
      </HelpBox>

      <div className="cl-btn-row">
        <button className={'harmony-btn' + (cfg.mode === 'linear' ? ' active' : '')} onClick={() => patch('spacing', { mode: 'linear' })}>Лінійний</button>
        <button className={'harmony-btn' + (cfg.mode === 'geometric' ? ' active' : '')} onClick={() => patch('spacing', { mode: 'geometric' })}>Геометричний</button>
      </div>
      <NumField label="База" value={cfg.base} onChange={(v) => patch('spacing', { base: v })} suffix="px" min={1} />
      <NumField label={cfg.mode === 'linear' ? 'Крок (×база)' : 'Коефіцієнт'} value={cfg.ratio} onChange={(v) => patch('spacing', { ratio: v })} min={0.05} />
      <NumField label="Кількість кроків" value={cfg.steps} onChange={(v) => patch('spacing', { steps: Math.max(2, Math.min(12, Math.round(v))) })} min={2} />

      <div className="cl-section-title">Шкала</div>
      <div className="dc-spacing-row">
        {scale.map((v, i) => (
          <div key={i} className="dc-spacing-item">
            <div className="dc-spacing-bar" style={{ width: Math.min(v, 140) }} />
            <span>{v}px</span>
          </div>
        ))}
      </div>

      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function defaultState() {
  return {
    pxrem: { px: 16, rem: 1, rootPx: 16 },
    dpi: { widthPx: 1200, printWidthCm: 10, targetDpi: 300 },
    fluid: { minPx: 16, maxPx: 24, minVw: 360, maxVw: 1440, rootPx: 16 },
    filesize: { value: 4.5, unitIndex: 2, mbps: 20 },
    duration: { ms: 500, frames: 30, fps: 60 },
    spacing: { base: 8, ratio: 1, steps: 8, mode: 'linear' },
  }
}

export default function DesignCalcLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('pxrem')
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
    pushRecentLab('calculator')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Design Calculator Lab"
      subtitle="px↔rem, DPI/PPI, fluid typography, розмір файлу, мс↔кадри, шкала відступів."
      icon="🧮"
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
          {tab === 'pxrem' && <PxRemTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'dpi' && <DpiTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'fluid' && <FluidTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'filesize' && <FileSizeTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'duration' && <DurationTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'spacing' && <SpacingTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
