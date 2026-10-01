import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { ASPECTS, buildColumnGridCss, buildModularGridCss, buildBaselineGridCss, buildIsometricSvg, buildResponsiveGridCss } from './labs/gridPatterns.js'

const TABS = [
  { key: 'column', icon: '📊', label: 'Колонкова' },
  { key: 'modular', icon: '🔲', label: 'Модульна' },
  { key: 'baseline', icon: '📏', label: 'Базова лінія' },
  { key: 'isometric', icon: '🔺', label: 'Ізометрична' },
  { key: 'overlay', icon: '🧭', label: 'Накладання' },
  { key: 'breakpoints', icon: '📱', label: 'Брейкпоінти' },
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
    <details className="cl-help" open>
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
        <p>Чому саме 12? Воно ділиться без остачі на 2, 3, 4 і 6 — тому блок може займати «половину» (6 колонок), «третину» (4 колонки) чи «чверть» (3 колонки) сітки без дробових значень. Bootstrap, Material Design і більшість CSS-фреймворків використовують саме 12-колонкову сітку з цієї причини. Подивись на вкладці «Накладання», як ця сітка лягає поверх справжнього макета.</p>
        <p>Margin і gutter — не взаємозамінні, хоч обидва й "простір": margin — фіксований відступ від краю екрана, який не повторюється (лише з двох боків), а gutter повторюється між кожною парою сусідніх колонок, тому на вузькому екрані з 12 колонками накопичений gutter (11 проміжків) може зʼїсти більше простору, ніж самі колонки — тому мобільні версії сітки майже завжди зменшують і кількість колонок, і gutter одночасно (див. вкладку "Брейкпоінти").</p>
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
        <p>У CSS це найпростіше реалізувати через <code>display: grid; grid-template-columns: repeat(N, 1fr);</code> разом з <code>aspect-ratio</code> на кожній плитці — браузер сам підганяє висоту під ширину колонки, тому сітка лишається рівною навіть при зміні ширини екрана.</p>
        <p>Коли контент не завжди відповідає заданому aspect-ratio (наприклад, фото з іншими пропорціями, ніж 4:3), саме зображення всередині плитки варто ставити з <code>object-fit: cover</code> — тоді воно заповнить комірку без спотворення, обрізавшись по краях замість того, щоб стискатись або лишати порожні смуги. Це той самий принцип, що розбирає вкладка "Обрізка" в Ratio Lab.</p>
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
        <p>Якщо заголовок має line-height 32px (4 кроки по 8px), а звичайний текст — 24px (3 кроки по 8px), обидва все одно «приземляються» на тих самих горизонтальних лініях — саме тому текст різних розмірів на сторінці виглядає впорядковано, а не хаотично зсунутим.</p>
        <p>Базова лінія діє не лише на текст: зображення, картки й відступи між блоками теж варто округлювати до кратного кроку сітки (8px, 16px, 24px...) — тоді ритм тримається навіть у місцях без тексту. Саме тому крок spacing-шкали в Design Calculator Lab і крок базової лінії тут часто збігаються: 8px — найпоширеніший спільний знаменник для обох.</p>
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
        <p>Кут 30° — не випадковий: це стандартний кут ізометричної проєкції, яким малюють «гру-кубики» (think SimCity, Monument Valley). Експортований SVG можна відкрити в Figma/Illustrator як направляючі (guide layer) і малювати ілюстрацію поверх, щоб усі обʼєкти мали однаковий «нахил».</p>
        <p>Ізометрія — не справжня 3D-перспектива (де далекі обʼєкти зменшуються), а паралельна проєкція: лінії, які в реальності паралельні, лишаються паралельними на малюнку, незалежно від відстані. Саме тому ізометричні ілюстрації виглядають "технічними" й акуратними — і саме тому це улюблений стиль для схем, інфографіки та гри-менеджерів, де важлива читабельність розташування обʼєктів, а не фотореалістична глибина.</p>
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

function OverlayTab({ state, patch }) {
  const cols = Array.from({ length: state.column.columns })
  return (
    <div>
      <p className="cl-tab-desc">Та сама колонкова сітка (з вкладки "Колонкова"), накладена поверх макета сторінки — щоб перевірити, чи дійсно елементи до неї прив'язані.</p>
      <HelpBox>
        <p>Дизайнери й розробники часто сперечаються, чи «на око» картка дійсно вирівняна по сітці, чи просто здається такою. Накладання знімає це питання: якщо край блоку збігається з лінією колонки — все вирівняно правильно.</p>
        <p>У Figma та інших дизайн-інструментах ця ж перевірка називається "layout grid overlay" і вмикається гарячою клавішею (зазвичай Ctrl/Cmd+G чи через панель View) просто поверх макета — звичка перевіряти вирівнювання так само, як орфографію в тексті, рятує від непомітних на перший погляд "на піксель вбік" помилок, які псують враження охайності цілого макета.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>Прозорість сітки
          <input type="range" min={10} max={70} step={5} value={state.overlay.opacity} onChange={(e) => patch('overlay', { opacity: parseInt(e.target.value, 10) })} />
          <span>{state.overlay.opacity}%</span>
        </label>
      </div>
      <div className="cl-picker-top">
        <button className={'harmony-btn' + (state.overlay.show ? ' active' : '')} onClick={() => patch('overlay', { show: !state.overlay.show })}>
          {state.overlay.show ? '👁 Сітка увімкнена' : '🚫 Сітка вимкнена'}
        </button>
      </div>

      <div className="cl-section-title">Превʼю макета</div>
      <div className="gl-overlay-stage" style={{ maxWidth: state.column.maxWidth, padding: `0 ${state.column.margin}px` }}>
        <div className="gl-overlay-mock-header">Header</div>
        <div className="gl-overlay-mock-hero">Hero-блок</div>
        <div className="gl-overlay-mock-cards">
          {[1, 2, 3].map((i) => <div key={i} className="gl-overlay-mock-card">Картка {i}</div>)}
        </div>
        {state.overlay.show && (
          <div className="gl-overlay-grid" style={{ left: state.column.margin, right: state.column.margin, gap: state.column.gutter, opacity: state.overlay.opacity / 100 }}>
            {cols.map((_, i) => <div key={i} className="gl-overlay-col" />)}
          </div>
        )}
      </div>
    </div>
  )
}

function BreakpointRow({ label, widthLabel, previewWidth, cfg, onChange }) {
  const cols = Array.from({ length: cfg.columns })
  return (
    <div className="l3d-object-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ width: 150, flex: 'none' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{widthLabel}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Колонок</span>
        <input type="range" min={1} max={12} value={cfg.columns} onChange={(e) => onChange({ columns: parseInt(e.target.value, 10) })} style={{ width: 100 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Gutter</span>
        <input type="range" min={0} max={32} value={cfg.gutter} onChange={(e) => onChange({ gutter: parseInt(e.target.value, 10) })} style={{ width: 100 }} />
      </div>
      <div className="gl-column-preview" style={{ width: previewWidth, gap: Math.round(cfg.gutter * (previewWidth / 1200)), padding: 0, maxWidth: 'none' }}>
        {cols.map((_, i) => <div key={i} className="gl-column-bar" style={{ height: 36 }} />)}
      </div>
    </div>
  )
}

function BreakpointsTab({ state, patch, toastApi }) {
  const css = buildResponsiveGridCss(state.breakpoints)
  return (
    <div>
      <p className="cl-tab-desc">Та сама колонкова сітка не повинна лишатись однаковою на всіх екранах — тут можна задати окрему кількість колонок і gutter для мобільного, планшета й десктопа.</p>
      <HelpBox>
        <p>12 колонок по ~25px кожна на екрані телефону 375px шириною — це вже нижче за комфортний мінімум для контенту (менше за типовий розмір пальця для тапу). Тому відповідальні сітки "складаються" на вузьких екранах: мобільний зазвичай отримує 4 колонки, планшет — 8, десктоп — усі 12. Це називається mobile-first підхід: базові стилі пишуться для найменшого екрана, а ширші екрани додають стилі поверх через <code>min-width</code> медіа-запити (а не навпаки).</p>
        <p>Чому саме mobile-first, а не desktop-first (з <code>max-width</code>): мобільний трафік сьогодні зазвичай більший за десктопний, тому "базовий", найпростіший варіант стилів повинен бути для мобільного — старіші браузери на слабких пристроях не завантажують зайвий CSS для широких екранів, якого вони ніколи не побачать.</p>
        <ol>
          <li>Налаштуйте колонки/gutter окремо для кожного брейкпоінта — мініпревʼю праворуч масштабоване пропорційно (не піксель-у-піксель) для порівняння тіснішої й просторішої сітки.</li>
          <li>Готовий CSS внизу використовує саме <code>min-width</code> медіа-запити в mobile-first порядку.</li>
        </ol>
      </HelpBox>

      <div className="l3d-object-list">
        <BreakpointRow label="📱 Мобільний" widthLabel="база, до 768px" previewWidth={90} cfg={state.breakpoints.mobile} onChange={(p) => patch('breakpoints', { mobile: { ...state.breakpoints.mobile, ...p } })} />
        <BreakpointRow label="📱 Планшет" widthLabel={`від ${state.breakpoints.tablet.minWidth}px`} previewWidth={140} cfg={state.breakpoints.tablet} onChange={(p) => patch('breakpoints', { tablet: { ...state.breakpoints.tablet, ...p } })} />
        <BreakpointRow label="🖥️ Десктоп" widthLabel={`від ${state.breakpoints.desktop.minWidth}px`} previewWidth={200} cfg={state.breakpoints.desktop} onChange={(p) => patch('breakpoints', { desktop: { ...state.breakpoints.desktop, ...p } })} />
      </div>

      <div className="cl-section-title">CSS (mobile-first)</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

const DEFAULT_STATE = {
  column: { columns: 12, gutter: 24, margin: 24, maxWidth: 1200 },
  modular: { columns: 4, rows: 2, gap: 16, aspect: '4 / 3' },
  baseline: { baseline: 8, multiple: 3 },
  isometric: { cellSize: 48, cols: 8, rows: 6 },
  overlay: { show: true, opacity: 30 },
  breakpoints: {
    mobile: { columns: 4, gutter: 16 },
    tablet: { columns: 8, gutter: 20, minWidth: 768 },
    desktop: { columns: 12, gutter: 24, minWidth: 1200 },
  },
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
      subtitle="Колонкові, модульні, базові та ізометричні сітки, плюс брейкпоінти — з живим превʼю й готовим CSS/SVG для кожної."
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
          {tab === 'overlay' && <OverlayTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'breakpoints' && <BreakpointsTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
