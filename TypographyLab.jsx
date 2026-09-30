import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { FONT_STACKS, RATIOS, TRACKING_PRESETS, computeScale, buildCssVariables, buildCssSnippet } from './labs/typeScale.js'

const TABS = [
  { key: 'scale', icon: '📏', label: 'Шкала' },
  { key: 'lineHeight', icon: '↕️', label: 'Міжрядковий інтервал' },
  { key: 'tracking', icon: '🔠', label: 'Трекінг' },
  { key: 'preview', icon: '🖼', label: 'Превʼю' },
  { key: 'export', icon: '📤', label: 'Експорт' },
]

const SAMPLE_PARAGRAPH = 'Дизайн — це не про те, як щось виглядає, а про те, як воно працює. Хороша типографіка робить текст зручним для читання: правильний розмір, міжрядковий інтервал і трекінг допомагають оку рухатися сторінкою без зусиль, а не борсатися в суцільній стіні тексту.'

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

function FontPicker({ fontFamily, setFontFamily }) {
  return (
    <div className="cl-btn-row">
      {Object.entries(FONT_STACKS).map(([key, f]) => (
        <button
          key={key}
          className={'harmony-btn' + (fontFamily === key ? ' active' : '')}
          style={{ fontFamily: f.css }}
          onClick={() => setFontFamily(key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

function ScaleTab({ state, setBaseSize, setRatio, setFontFamily, isPro }) {
  const scale = computeScale(state.baseSize, state.ratio)
  return (
    <div>
      <p className="cl-tab-desc">Модульна шкала — усі розміри тексту на сторінці рахуються від однієї базової величини помножен­ням на одне й те саме співвідношення, а не підбираються «на око».</p>
      <HelpBox>
        <p>Base — розмір звичайного тексту (зазвичай 16px). Ratio — у скільки разів кожен наступний рівень більший за попередній. Менше ratio (1.125) — акуратна різниця між заголовками, більше (1.618, золотий перетин) — контрастні, «кричущі» заголовки.</p>
      </HelpBox>

      <div className="cl-section-title">Шрифт</div>
      <FontPicker fontFamily={state.fontFamily} setFontFamily={setFontFamily} />

      <div className="cl-section-title">Base size</div>
      <div className="cl-editrow">
        <label>
          <input type="range" min={12} max={24} step={1} value={state.baseSize} onChange={(e) => setBaseSize(parseInt(e.target.value, 10))} />
          <span>{state.baseSize}px</span>
        </label>
      </div>

      <div className="cl-section-title">Ratio</div>
      <div className="cl-btn-row">
        {RATIOS.map((r) => (
          <button key={r.key} className={'harmony-btn' + (state.ratio === r.value ? ' active' : '')} onClick={() => setRatio(r.value)}>
            {r.label} ({r.key})
          </button>
        ))}
      </div>

      <div className="cl-section-title">Шкала</div>
      <div className="tl-scale-list">
        {[...scale].reverse().map((s) => (
          <div key={s.key} className="tl-scale-row">
            <span className="tl-scale-tag">{s.label}</span>
            <span className="tl-scale-sample" style={{ fontFamily: FONT_STACKS[state.fontFamily].css, fontSize: `${s.px}px`, lineHeight: 1.1 }}>Aa</span>
            <span className="tl-scale-meta">{s.px}px{isPro ? ` · ${s.rem}rem` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineHeightTab({ state, setLineHeightHeading, setLineHeightBody }) {
  return (
    <div>
      <p className="cl-tab-desc">Міжрядковий інтервал (line-height) — відстань між рядками тексту. Заголовкам зазвичай потрібен щільніший інтервал, довгим абзацам — просторіший, інакше рядки «зливаються».</p>
      <HelpBox>
        <p>1.0 = рядки впритул одне до одного. 1.5–1.7 — комфортно для довгого тексту (як у книжках). Для великих заголовків з 1-2 рядків зазвичай достатньо 1.05–1.2 — просторіший інтервал там просто виглядає як зайвий відступ.</p>
      </HelpBox>

      <div className="cl-section-title">Heading line-height ({state.lineHeightHeading.toFixed(2)})</div>
      <input type="range" min={1.0} max={1.5} step={0.01} value={state.lineHeightHeading} onChange={(e) => setLineHeightHeading(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <div className="tl-lh-preview" style={{ fontFamily: FONT_STACKS[state.fontFamily].css, fontSize: '32px', lineHeight: state.lineHeightHeading, fontWeight: 600 }}>
        Хороша типографіка починається з ритму
      </div>

      <div className="cl-section-title">Body line-height ({state.lineHeightBody.toFixed(2)})</div>
      <input type="range" min={1.2} max={2.0} step={0.01} value={state.lineHeightBody} onChange={(e) => setLineHeightBody(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <div className="tl-lh-preview" style={{ fontFamily: FONT_STACKS[state.fontFamily].css, fontSize: '15px', lineHeight: state.lineHeightBody }}>
        {SAMPLE_PARAGRAPH}
      </div>
    </div>
  )
}

function TrackingTab({ state, setHeadingTracking, setLabelTracking }) {
  return (
    <div>
      <p className="cl-tab-desc">Трекінг (letter-spacing) — відстань між буквами. Великі заголовки часто виграють від легкого стиснення, а короткі підписи капсом — від розрядки.</p>
      <HelpBox>
        <p>Негативний трекінг (−0.02em) трохи «стискає» великий заголовок — без нього між великими літерами буває забагато повітря. Позитивний трекінг (+0.05…0.15em) на коротких UPPERCASE-підписах (eyebrow, лейбли) робить їх акуратнішими й легшими для сканування оком.</p>
      </HelpBox>

      <div className="cl-section-title">Heading tracking ({state.headingTracking.toFixed(3)}em)</div>
      <div className="cl-btn-row">
        {TRACKING_PRESETS.map((p) => (
          <button key={p.label} className={'harmony-btn' + (state.headingTracking === p.value ? ' active' : '')} onClick={() => setHeadingTracking(p.value)}>{p.label}</button>
        ))}
      </div>
      <input type="range" min={-0.05} max={0.2} step={0.005} value={state.headingTracking} onChange={(e) => setHeadingTracking(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <div className="tl-lh-preview" style={{ fontFamily: FONT_STACKS[state.fontFamily].css, fontSize: '32px', fontWeight: 600, letterSpacing: `${state.headingTracking}em` }}>
        Заголовок сторінки
      </div>

      <div className="cl-section-title">Label tracking ({state.labelTracking.toFixed(3)}em)</div>
      <div className="cl-btn-row">
        {TRACKING_PRESETS.map((p) => (
          <button key={p.label} className={'harmony-btn' + (state.labelTracking === p.value ? ' active' : '')} onClick={() => setLabelTracking(p.value)}>{p.label}</button>
        ))}
      </div>
      <input type="range" min={-0.05} max={0.2} step={0.005} value={state.labelTracking} onChange={(e) => setLabelTracking(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <div className="tl-lh-preview" style={{ fontFamily: FONT_STACKS[state.fontFamily].css, fontSize: '12px', fontWeight: 600, letterSpacing: `${state.labelTracking}em`, textTransform: 'uppercase', color: 'var(--muted)' }}>
        Категорія проєкту
      </div>
    </div>
  )
}

function PreviewTab({ state }) {
  const scale = computeScale(state.baseSize, state.ratio)
  const get = (key) => scale.find((s) => s.key === key).px
  const font = FONT_STACKS[state.fontFamily].css
  return (
    <div>
      <p className="cl-tab-desc">Уся система разом — шкала, інтервали й трекінг — на реалістичному фрагменті сторінки.</p>
      <div className="tl-article-preview" style={{ fontFamily: font }}>
        <div style={{ fontSize: get('sm'), letterSpacing: `${state.labelTracking}em`, textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 10 }}>
          Категорія проєкту
        </div>
        <h1 style={{ fontSize: get('4xl'), lineHeight: state.lineHeightHeading, letterSpacing: `${state.headingTracking}em`, fontWeight: 600, margin: '0 0 14px' }}>
          Заголовок, який задає тон усій сторінці
        </h1>
        <p style={{ fontSize: get('lg'), lineHeight: state.lineHeightHeading, color: 'var(--muted)', margin: '0 0 22px' }}>
          Підзаголовок пояснює, про що стаття, і готує читача до основного тексту нижче.
        </p>
        <p style={{ fontSize: get('base'), lineHeight: state.lineHeightBody, margin: '0 0 14px' }}>{SAMPLE_PARAGRAPH}</p>
        <p style={{ fontSize: get('sm'), lineHeight: state.lineHeightBody, color: 'var(--muted)' }}>Дрібний підпис — дата публікації, автор чи примітка — завжди на найменшому кроці шкали.</p>
      </div>
    </div>
  )
}

function ExportTab({ state }) {
  const scale = computeScale(state.baseSize, state.ratio)
  const cssVars = buildCssVariables({ ...state, scale })
  const cssSnippet = buildCssSnippet({ ...state, scale })
  const json = JSON.stringify({ ...state, scale }, null, 2)
  return (
    <div>
      <p className="cl-tab-desc">Забери готову систему: CSS-змінні для будь-якого сайту, приклад стилів заголовків/тексту, або дані у JSON.</p>
      <div className="cl-section-title">Текст</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => copy(cssVars)}>Copy CSS Variables</button>
        <button className="harmony-btn" onClick={() => copy(cssSnippet)}>Copy CSS</button>
        <button className="harmony-btn" onClick={() => copy(json)}>Copy JSON</button>
      </div>
      <div className="cl-section-title">Файли</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => downloadText(json, 'type-scale.json', 'application/json')}>⬇ JSON</button>
      </div>
      <pre className="cl-code-block">{cssVars}</pre>
      <pre className="cl-code-block">{cssSnippet}</pre>
    </div>
  )
}

const DEFAULT_STATE = {
  fontFamily: 'sans',
  baseSize: 16,
  ratio: 1.25,
  lineHeightHeading: 1.15,
  lineHeightBody: 1.6,
  headingTracking: -0.01,
  labelTracking: 0.08,
}

export default function TypographyLab() {
  const [state, setStateLive] = useState(DEFAULT_STATE)
  const [tab, setTab] = useState('scale')
  const stateRef = useRef(state)
  const debounceRef = useRef(null)
  const hist = useLabHistory(DEFAULT_STATE)

  function scheduleCommit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => hist.set(stateRef.current), 400)
  }
  function patch(partial) {
    const next = { ...stateRef.current, ...partial }
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
    pushRecentLab('typography')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
    onCopy: () => { copy(buildCssVariables({ ...state, scale: computeScale(state.baseSize, state.ratio) })); toastApi.show('✓ CSS-змінні скопійовано') },
  })

  return (
    <LabShell
      title="Typography Lab"
      subtitle="Модульна типографічна шкала, міжрядковий інтервал, трекінг і превʼю в контексті — на веб-безпечних шрифтах, без завантаження зовнішніх файлів."
      icon="🔤"
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
      toast={toastApi.toast}
      extra={
        <LabInfoTip title="Гарячі клавіші">
          Ctrl/Cmd+Z — Undo · Ctrl/Cmd+Shift+Z — Redo · Ctrl/Cmd+C — скопіювати CSS-змінні (поза текстовими полями).
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
          {tab === 'scale' && (
            <ScaleTab
              state={state}
              setBaseSize={(v) => patch({ baseSize: v })}
              setRatio={(v) => patch({ ratio: v })}
              setFontFamily={(v) => patch({ fontFamily: v })}
              isPro={labMode.isPro}
            />
          )}
          {tab === 'lineHeight' && (
            <LineHeightTab
              state={state}
              setLineHeightHeading={(v) => patch({ lineHeightHeading: v })}
              setLineHeightBody={(v) => patch({ lineHeightBody: v })}
            />
          )}
          {tab === 'tracking' && (
            <TrackingTab
              state={state}
              setHeadingTracking={(v) => patch({ headingTracking: v })}
              setLabelTracking={(v) => patch({ labelTracking: v })}
            />
          )}
          {tab === 'preview' && <PreviewTab state={state} />}
          {tab === 'export' && <ExportTab state={state} />}
        </div>
      </div>
    </LabShell>
  )
}
