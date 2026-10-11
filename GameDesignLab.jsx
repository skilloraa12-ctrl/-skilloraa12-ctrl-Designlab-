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
  MODES, VARIANT_LABELS, getDef, defsForMode, createBlock, moveItem,
  generateHtml, generateCss, generateJsx, defaultSettings,
} from './labs/gameBuilder.js'

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

// Та сама розмітка (ті самі класи), що й у згенерованому HTML/JSX нижче —
// превʼю і код завжди 1-в-1.
function BlockPreview({ block, selected, onSelect }) {
  const p = block.props
  const wrap = { className: 'gb-block-wrap' + (selected ? ' gb-block-wrap--selected' : ''), onClick: (e) => { e.stopPropagation(); onSelect(block.id) } }
  switch (block.type) {
    case 'healthbar': return <div {...wrap}><div className={`gb-healthbar gb-healthbar--${p.variant}`}><span className="gb-hb-icon">❤️</span><div className="gb-hb-track"><div className="gb-hb-fill" /></div><span className="gb-hb-value">{p.text}</span></div></div>
    case 'ammocounter': return <div {...wrap}><div className="gb-ammo"><span className="gb-ammo-icon">🔫</span><span>{p.text}</span></div></div>
    case 'cooldownicon': return <div {...wrap}><div className="gb-cooldown">{p.toggle && <div className="gb-cooldown-overlay" />}<span>{p.text}</span></div></div>
    case 'minimap': return <div {...wrap}><div className={'gb-minimap' + (p.toggle ? ' gb-minimap--round' : '')} /></div>
    case 'scoredisplay': return <div {...wrap}><div className={`gb-score gb-score--${p.variant}`}><span className="gb-score-icon" /><span>{p.text}</span></div></div>
    case 'objectivetracker': return <div {...wrap}><div className="gb-objective"><div className="gb-objective-title">{p.text}</div><div className="gb-objective-sub">{p.text2}</div></div></div>
    case 'crosshair': return <div {...wrap}><div className="gb-crosshair"><span /><span /></div></div>
    case 'notificationtoast': return <div {...wrap}><div className={`gb-toast gb-toast--${p.variant}`}>{p.text}</div></div>
    case 'interactionprompt': return <div {...wrap}><div className="gb-prompt"><kbd>E</kbd><span>{p.text}</span></div></div>
    case 'damageindicator': return <div {...wrap} style={{ position: 'absolute', inset: 0 }}><div className="gb-damage" /></div>
    case 'mainmenu': return (
      <div {...wrap}>
        <div className="gb-mainmenu">
          <h2>{p.text}</h2>
          {Array.from({ length: p.count }).map((_, i) => <button className={'gb-menu-btn' + (i === 0 ? ' gb-menu-btn--primary' : '')} key={i}>Пункт меню {i + 1}</button>)}
        </div>
      </div>
    )
    case 'pausemenu': return (
      <div {...wrap}>
        <div className="gb-pausemenu">
          <h3>Пауза</h3>
          {Array.from({ length: p.count }).map((_, i) => <button className="gb-menu-btn" key={i}>Пункт {i + 1}</button>)}
        </div>
      </div>
    )
    case 'inventorygrid': return (
      <div {...wrap}>
        <div className="gb-inventory">
          <div className="gb-inv-grid" style={{ gridTemplateColumns: `repeat(${p.cols}, 1fr)` }}>
            {Array.from({ length: p.cols * p.count }).map((_, i) => <div className="gb-inv-slot" key={i} />)}
          </div>
        </div>
      </div>
    )
    case 'dialoguebox': return <div {...wrap}><div className="gb-dialogue"><div className="gb-dialogue-portrait" /><div className="gb-dialogue-body"><div className="gb-dialogue-name">{p.text}</div><div className="gb-dialogue-line">{p.text2}</div></div></div></div>
    case 'settingsmenu': return (
      <div {...wrap}>
        <div className="gb-settings">
          {Array.from({ length: p.count }).map((_, i) => <div className="gb-settings-row" key={i}><span>Налаштування {i + 1}</span><div className="gb-settings-control" /></div>)}
        </div>
      </div>
    )
    case 'levelselect': return (
      <div {...wrap}>
        <div className="gb-levelselect" style={{ gridTemplateColumns: `repeat(${p.cols}, 1fr)` }}>
          {Array.from({ length: p.cols * p.count }).map((_, i) => <div className={'gb-level-card' + (i > 1 ? ' gb-level-card--locked' : '')} key={i}>{i + 1}</div>)}
        </div>
      </div>
    )
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
      <div className="cl-section-title">Налаштування</div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Акцент</span>
        <input type="color" className="cl-swatch-input" value={settings.accent} onChange={(e) => onChange({ accent: e.target.value })} />
        <input className="cl-hex-input" value={settings.accent} onChange={(e) => onChange({ accent: e.target.value })} />
      </div>
      <p className="cl-tab-desc" style={{ marginTop: 14 }}>
        {mode === 'hud'
          ? 'HUD-блоки мають фіксовану зону (як у реальних іграх) — додайте блок із палітри, і він зʼявиться у своєму куті вʼюпорта.'
          : 'Блоки меню йдуть одним стовпцем по центру екрана. Виберіть блок у списку зліва чи клікніть по ньому в превʼю, щоб редагувати текст.'}
      </p>
    </div>
  )
}

function CodePanel({ mode, blocks, settings, toastApi }) {
  const [codeTab, setCodeTab] = useState('html')
  const html = generateHtml(mode, blocks)
  const css = generateCss(mode, blocks, settings)
  const jsx = generateJsx(mode, blocks)
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
        ctx.fillStyle = '#15151c'
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
  return { mode: 'hud', blocks: defaultBlocks('hud'), settings: defaultSettings() }
}

function zoneBlocks(blocks, zone) {
  return blocks.filter((b) => getDef(b.type).zone === zone)
}

export default function GameDesignLab() {
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
    pushRecentLab('game-design')
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
    setSelectedId(null)
    patch({ mode: nextMode, blocks: defaultBlocks(nextMode) })
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
        title: `${MODES[mode].label} — Game Design Lab`,
        desc: `Зібрано в Game Design Lab із ${blocks.length} блок${blocks.length === 1 ? 'ом' : 'ів'} (${MODES[mode].frameLabel}). HTML/CSS/JSX-код можна скопіювати повторно в самому лабі.`,
        tags: [MODES[mode].label, 'Game Design Lab'],
        attachments: [{ url: dataUrl, name: 'hud.png', type: 'image' }],
      })
      toastApi.show('✓ Збережено в портфоліо')
    } catch {
      toastApi.show('Не вдалося зберегти превʼю — спробуйте ще раз')
    }
  }

  const palette = defsForMode(mode)
  const frameStyle = { '--gb-accent': settings.accent }

  return (
    <LabShell
      title="Game Design Lab"
      subtitle="Складіть HUD поверх ігрового вʼюпорта чи екран меню з готових блоків — і одразу отримайте робочий HTML, CSS і React-код."
      icon="🎮"
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
        <p>Це не вільне малювання — ви складаєте HUD чи меню з готових, уже стильних блоків, тому результат одразу є ВАЛІДНИМ HTML/CSS/React-кодом, а не картинкою. Що бачите в превʼю — те й отримуєте в коді праворуч, 1-в-1.</p>
        <p><strong>HUD поверх геймплею</strong> — кожен блок має фіксовану зону розміщення (шкала здоровʼя завжди внизу зліва, мінімапа вгорі справа тощо), як у реальних іграх: ви обираєте блоки, а не розставляєте їх вручну. <strong>Екран меню</strong> перемикає палітру на самостійні екрани (головне меню, інвентар, діалог, налаштування), які йдуть одним стовпцем по центру.</p>
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
          {mode === 'hud' ? (
            <div ref={canvasRef} className="gb-viewport" style={frameStyle} onClick={() => setSelectedId(null)}>
              <div className="gb-zone gb-zone--top-left">{zoneBlocks(blocks, 'top-left').map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}</div>
              <div className="gb-zone gb-zone--top-right">{zoneBlocks(blocks, 'top-right').map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}</div>
              <div className="gb-zone gb-zone--top-center">{zoneBlocks(blocks, 'top-center').map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}</div>
              <div className="gb-zone gb-zone--center">{zoneBlocks(blocks, 'center').map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}</div>
              <div className="gb-zone gb-zone--bottom-left">{zoneBlocks(blocks, 'bottom-left').map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}</div>
              <div className="gb-zone gb-zone--bottom-right">{zoneBlocks(blocks, 'bottom-right').map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}</div>
              <div className="gb-zone gb-zone--bottom-center">{zoneBlocks(blocks, 'bottom-center').map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}</div>
              {zoneBlocks(blocks, 'overlay').map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}
              {blocks.length === 0 && <p className="cl-tab-desc" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>Порожньо — додайте блоки зліва.</p>}
            </div>
          ) : (
            <div ref={canvasRef} className="gb-screen" style={frameStyle} onClick={() => setSelectedId(null)}>
              {blocks.map((b) => <BlockPreview key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} />)}
              {blocks.length === 0 && <p className="cl-tab-desc">Порожньо — додайте блоки зліва.</p>}
            </div>
          )}
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
