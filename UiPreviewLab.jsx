import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { useProgress } from './ProgressContext.jsx'
import {
  MODES, VARIANT_LABELS, BLOCK_DEFS, getDef, defsForMode, createBlock, moveItem,
  generateHtml, generateCss, generateJsx, defaultSettings,
} from './labs/screenBuilder.js'

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

// Рендер одного блоку в живому превʼю — та сама розмітка (ті самі класи),
// що й у згенерованому HTML/JSX нижче, тому превʼю й код завжди 1-в-1.
function BlockPreview({ block, selected, onSelect }) {
  const p = block.props
  const wrap = { className: 'sb-block-wrap' + (selected ? ' sb-block-wrap--selected' : ''), onClick: (e) => { e.stopPropagation(); onSelect(block.id) } }
  switch (block.type) {
    case 'header': return <div {...wrap}><header className="sb-header"><h2>{p.text}</h2></header></div>
    case 'text': return <div {...wrap}><div className="sb-text"><h3>{p.text}</h3><p>{p.text2}</p></div></div>
    case 'button': return <div {...wrap}><button className={`sb-btn sb-btn--${p.variant}`}>{p.text}</button></div>
    case 'input': return <div {...wrap}><label className="sb-field"><span>{p.text}</span><input type="text" placeholder={p.text} readOnly /></label></div>
    case 'card': return <div {...wrap}><div className="sb-card">{p.toggle && <div className="sb-card-img" />}<h4>{p.text}</h4><p>{p.text2}</p></div></div>
    case 'list': return <div {...wrap}><ul className="sb-list">{Array.from({ length: p.count }).map((_, i) => <li className="sb-list-item" key={i}><span className="sb-avatar" /><span>Елемент {i + 1}</span></li>)}</ul></div>
    case 'image': return <div {...wrap}><div className="sb-image" /></div>
    case 'badge': return <div {...wrap}><span className={`sb-badge sb-badge--${p.variant}`}>{p.text}</span></div>
    case 'alert': return <div {...wrap}><div className={`sb-alert sb-alert--${p.variant}`}>{p.text}</div></div>
    case 'empty': return <div {...wrap}><div className="sb-empty"><div className="sb-empty-icon" /><h4>{p.text}</h4><p>{p.text2}</p></div></div>
    case 'divider': return <div {...wrap}><hr className="sb-divider" /></div>
    case 'tabbar': return <div {...wrap}><nav className="sb-tabbar">{Array.from({ length: p.count }).map((_, i) => <button className={'sb-tab' + (i === 0 ? ' sb-tab--active' : '')} key={i}>●</button>)}</nav></div>
    case 'fab': return <div {...wrap}><button className="sb-fab">+</button></div>
    case 'kpi': return <div {...wrap}><div className="sb-kpi"><div className="sb-kpi-value">{p.text}</div><div className="sb-kpi-label">{p.text2}</div></div></div>
    case 'chart': return <div {...wrap}><div className="sb-chart"><div className="sb-chart-title">{p.text}</div><div className={`sb-chart-body sb-chart-body--${p.variant}`} /></div></div>
    case 'table': return (
      <div {...wrap}>
        <div className="sb-table-wrap">
          {p.toggle && <div className="sb-table-bulk">Вибрано: 2 <button>Дія</button></div>}
          <table className="sb-table">
            <thead><tr>{Array.from({ length: p.cols }).map((_, i) => <th key={i}>Колонка {i + 1}</th>)}</tr></thead>
            <tbody>{Array.from({ length: p.count }).map((_, r) => <tr key={r}>{Array.from({ length: p.cols }).map((_, c) => <td key={c}>—</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    )
    case 'filterbar': return <div {...wrap}><div className="sb-filterbar">{Array.from({ length: p.count }).map((_, i) => <span className="sb-chip" key={i}>Фільтр {i + 1}</span>)}</div></div>
    default: return null
  }
}

function PropertiesPanel({ block, onChange, onRemove }) {
  const def = getDef(block.type)
  const p = block.props
  return (
    <div>
      <div className="cl-section-title">{def.icon} {def.label}</div>
      {def.fields.includes('text') && (
        <div className="cl-editrow" style={{ display: 'block' }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Текст</label>
          <input className="cl-text-input" value={p.text} onChange={(e) => onChange({ text: e.target.value })} />
        </div>
      )}
      {def.fields.includes('text2') && (
        <div className="cl-editrow" style={{ display: 'block' }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Опис</label>
          <input className="cl-text-input" value={p.text2} onChange={(e) => onChange({ text2: e.target.value })} />
        </div>
      )}
      {def.fields.includes('variant') && (
        <>
          <div className="cl-section-title">Варіант</div>
          <div className="cl-btn-row">
            {def.variants.map((v) => (
              <button key={v} className={'harmony-btn' + (p.variant === v ? ' active' : '')} onClick={() => onChange({ variant: v })}>{VARIANT_LABELS[v]}</button>
            ))}
          </div>
        </>
      )}
      {def.fields.includes('toggle') && (
        <div className="cl-picker-top">
          <button className={'harmony-btn' + (p.toggle ? ' active' : '')} onClick={() => onChange({ toggle: !p.toggle })}>{def.toggleLabel}</button>
        </div>
      )}
      {def.fields.includes('count') && (
        <div className="cl-editrow"><label>Кількість<input type="range" min={def.min} max={def.max} value={p.count} onChange={(e) => onChange({ count: parseInt(e.target.value, 10) })} /><span>{p.count}</span></label></div>
      )}
      {def.fields.includes('cols') && (
        <div className="cl-editrow"><label>Колонок<input type="range" min={def.minCols} max={def.maxCols} value={p.cols} onChange={(e) => onChange({ cols: parseInt(e.target.value, 10) })} /><span>{p.cols}</span></label></div>
      )}
      <button className="cl-mini-btn" style={{ marginTop: 10 }} onClick={onRemove}>✕ Видалити блок</button>
    </div>
  )
}

function SettingsPanel({ mode, settings, onChange }) {
  return (
    <div>
      <div className="cl-section-title">Налаштування екрана</div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Акцент</span>
        <input type="color" className="cl-swatch-input" value={settings.accent} onChange={(e) => onChange({ accent: e.target.value })} />
        <input className="cl-hex-input" value={settings.accent} onChange={(e) => onChange({ accent: e.target.value })} />
      </div>
      <div className="cl-editrow"><label>Радіус<input type="range" min={0} max={24} value={settings.radius} onChange={(e) => onChange({ radius: parseInt(e.target.value, 10) })} /><span>{settings.radius}px</span></label></div>
      {mode === 'ui' && (
        <div className="cl-picker-top">
          <button className={'harmony-btn' + (settings.sidebar ? ' active' : '')} onClick={() => onChange({ sidebar: !settings.sidebar })}>Сайдбар-навігація</button>
        </div>
      )}
      <p className="cl-tab-desc" style={{ marginTop: 14 }}>Виберіть блок у списку зліва чи клікніть по ньому в превʼю, щоб редагувати його текст і варіант.</p>
    </div>
  )
}

function CodePanel({ mode, blocks, settings, toastApi }) {
  const [codeTab, setCodeTab] = useState('html')
  const html = generateHtml(mode, blocks, settings)
  const css = generateCss(mode, blocks, settings)
  const jsx = generateJsx(mode, blocks, settings)
  const text = codeTab === 'html' ? html : codeTab === 'css' ? css : jsx
  return (
    <div>
      <div className="cl-tabs" style={{ marginBottom: 10, paddingBottom: 10 }}>
        {['html', 'css', 'jsx'].map((k) => (
          <button key={k} className={'cl-tab' + (codeTab === k ? ' active' : '')} onClick={() => setCodeTab(k)}>{k.toUpperCase()}</button>
        ))}
      </div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(text); toastApi.show(`✓ ${codeTab.toUpperCase()} скопійовано`) }}>Copy {codeTab.toUpperCase()}</button>
      </div>
      <pre className="cl-code-block sb-code-scroll">{text}</pre>
    </div>
  )
}

// SVG+foreignObject → canvas: знімок живого превʼю без зовнішніх бібліотек
// для скріншотів. Якщо браузер відмовляється растеризувати (рідкісний
// випадок), виклик відхиляється і UI показує тост замість збою.
function domToPngDataUrl(node) {
  const rect = node.getBoundingClientRect()
  const width = Math.round(rect.width)
  const height = Math.round(rect.height)
  const html = node.outerHTML
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;font-family:-apple-system,sans-serif;">${html}</div></foreignObject></svg>`
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#F5F4F0'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = reject
    img.src = svgUrl
  })
}

function defaultBlocks(mode) {
  return MODES[mode].startBlocks.map((t) => createBlock(t))
}

function defaultState() {
  return { mode: 'app', blocks: defaultBlocks('app'), settings: defaultSettings('app') }
}

export default function UiPreviewLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [selectedId, setSelectedId] = useState(null)
  const stateRef = useRef(state)
  const debounceRef = useRef(null)
  const canvasRef = useRef(null)
  const hist = useLabHistory(initial)

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
  const { addPortfolioItem } = useProgress()
  const { push: pushRecentLab } = useLabRecent('lab')
  useEffect(() => {
    pushRecentLab('ui-preview')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  const { mode, blocks, settings } = state
  const selected = blocks.find((b) => b.id === selectedId) || null

  function switchMode(nextMode) {
    if (nextMode === mode) return
    const kept = blocks.filter((b) => defsForMode(nextMode).some((d) => d.type === b.type))
    const nextBlocks = kept.length ? kept : defaultBlocks(nextMode)
    setSelectedId(null)
    patch({ mode: nextMode, blocks: nextBlocks, settings: defaultSettings(nextMode) })
  }
  function addBlock(type) {
    if (blocks.length >= 14) { toastApi.show('Максимум 14 блоків на екрані'); return }
    const b = createBlock(type)
    patch({ blocks: [...blocks, b] })
    setSelectedId(b.id)
  }
  function updateBlock(id, partial) {
    patch({ blocks: blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...partial } } : b)) })
  }
  function removeBlock(id) {
    patch({ blocks: blocks.filter((b) => b.id !== id) })
    if (selectedId === id) setSelectedId(null)
  }
  function move(i, dir) {
    patch({ blocks: moveItem(blocks, i, dir) })
  }
  function updateSettings(partial) {
    patch({ settings: { ...settings, ...partial } })
  }

  async function saveToPortfolio() {
    if (!canvasRef.current) return
    try {
      const dataUrl = await domToPngDataUrl(canvasRef.current)
      addPortfolioItem({
        title: `${MODES[mode].label} — екран з UI Preview Lab`,
        desc: `Зібрано в UI Preview Lab із ${blocks.length} структурних блоків (${MODES[mode].frameLabel}). HTML/CSS/JSX-код цього екрана можна скопіювати повторно в самому лабі.`,
        tags: [MODES[mode].label, 'UI Preview Lab'],
        attachments: [{ url: dataUrl, name: 'screen.png', type: 'image' }],
      })
      toastApi.show('✓ Збережено в портфоліо')
    } catch {
      toastApi.show('Не вдалося зберегти превʼю — спробуйте ще раз')
    }
  }

  const palette = defsForMode(mode)
  const frameStyle = { '--sb-accent': settings.accent, '--sb-radius': `${settings.radius}px`, width: MODES[mode].width }

  return (
    <LabShell
      title="UI Preview Lab"
      subtitle="Складіть екран із готових структурних блоків — для App Design (телефон) чи UI Design (десктоп/дашборд) — і одразу отримайте робочий HTML, CSS і React-код."
      icon="🖥️"
      wide
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
      toast={toastApi.toast}
      extra={
        <>
          <button className="harmony-btn" onClick={saveToPortfolio}>💾 Зберегти в портфоліо</button>
          <LabInfoTip title="Гарячі клавіші">
            Ctrl/Cmd+Z — Undo · Ctrl/Cmd+Shift+Z — Redo.
          </LabInfoTip>
        </>
      }
    >
      <HelpBox>
        <p>Це не вільне малювання — ви складаєте екран із готових, уже стильних блоків (заголовок, кнопка, картка, таблиця тощо), тому результат одразу є ВАЛІДНИМ HTML/CSS/React-кодом, а не картинкою. Що бачите в превʼю — те й отримуєте в коді праворуч, 1-в-1.</p>
        <p><strong>App Design</strong> показує палітру блоків для мобільного екрана (таб-бар, FAB) у рамці телефону. <strong>UI Design</strong> перемикає палітру на блоки для щільних desktop/dashboard-інтерфейсів (KPI, таблиця даних, графік, сайдбар) у ширшій рамці. Перемикання режиму зберігає спільні блоки (кнопки, картки, текст) і підставляє стартовий набір, специфічний для нового режиму.</p>
      </HelpBox>

      <div className="cl-btn-row">
        {Object.values(MODES).map((m) => (
          <button key={m.key} className={'harmony-btn' + (mode === m.key ? ' active' : '')} onClick={() => switchMode(m.key)}>{m.icon} {m.label}</button>
        ))}
      </div>

      <div className="sb-layout">
        <div className="sb-col sb-col-palette">
          <div className="cl-section-title">Палітра блоків</div>
          <div className="sb-palette-grid">
            {palette.map((def) => (
              <button key={def.type} className="sb-palette-btn" onClick={() => addBlock(def.type)}>
                <span>{def.icon}</span>{def.label}
              </button>
            ))}
          </div>

          <div className="cl-section-title">Список ({blocks.length})</div>
          <div className="l3d-object-list">
            {blocks.map((b, i) => {
              const def = getDef(b.type)
              return (
                <div key={b.id} className={'l3d-object-row' + (selectedId === b.id ? ' active' : '')} onClick={() => setSelectedId(b.id)}>
                  <span style={{ width: 22, textAlign: 'center' }}>{def.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, cursor: 'pointer' }}>{def.label}</span>
                  <button className="cl-mini-btn" disabled={i === 0} onClick={(e) => { e.stopPropagation(); move(i, -1) }} title="Вгору">↑</button>
                  <button className="cl-mini-btn" disabled={i === blocks.length - 1} onClick={(e) => { e.stopPropagation(); move(i, 1) }} title="Вниз">↓</button>
                  <button className="cl-mini-btn" onClick={(e) => { e.stopPropagation(); removeBlock(b.id) }} title="Видалити">✕</button>
                </div>
              )
            })}
            {blocks.length === 0 && <p className="cl-tab-desc">Порожньо — додайте блок із палітри вище.</p>}
          </div>
        </div>

        <div className="sb-col sb-col-canvas">
          <div className="cl-section-title">{MODES[mode].frameLabel} — превʼю</div>
          <div
            ref={canvasRef}
            className={`sb-frame sb-frame--${mode}`}
            style={frameStyle}
            onClick={() => setSelectedId(null)}
          >
            {mode === 'ui' && settings.sidebar && (
              <aside className="sb-sidebar">
                <div className="sb-sidebar-logo" />
                {Array.from({ length: 5 }).map((_, i) => <div className="sb-sidebar-item" key={i} />)}
              </aside>
            )}
            <main className="sb-content">
              {blocks.map((b) => (
                <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />
              ))}
              {blocks.length === 0 && <p className="cl-tab-desc">Порожньо — додайте блоки зліва.</p>}
            </main>
          </div>
        </div>

        <div className="sb-col sb-col-side">
          {selected ? (
            <PropertiesPanel
              block={selected}
              onChange={(partial) => updateBlock(selected.id, partial)}
              onRemove={() => removeBlock(selected.id)}
            />
          ) : (
            <SettingsPanel mode={mode} settings={settings} onChange={updateSettings} />
          )}
          <div className="cl-section-title">Код</div>
          <CodePanel mode={mode} blocks={blocks} settings={settings} toastApi={toastApi} />
        </div>
      </div>
    </LabShell>
  )
}
