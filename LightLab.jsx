import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { buildBoxShadowCss, hexToRgba, makeLayer, PRESETS, buildTextShadowCss, TEXT_SHADOW_PRESETS } from './labs/shadowBuilder.js'

const TABS = [
  { key: 'shadow', icon: '🌑', label: 'Тінь' },
  { key: 'light', icon: '💡', label: 'Світло' },
  { key: 'textShadow', icon: '🔤', label: 'Тінь тексту' },
  { key: 'presets', icon: '🎨', label: 'Пресети' },
  { key: 'export', icon: '📤', label: 'Експорт' },
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

function ShadowTab({ layers, setLayers, toastApi }) {
  const css = `box-shadow: ${buildBoxShadowCss(layers)};`
  function updateLayer(id, patch) {
    setLayers(layers.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  function removeLayer(id) {
    if (layers.length <= 1) {
      toastApi.show('Потрібен щонайменше один шар')
      return
    }
    setLayers(layers.filter((l) => l.id !== id))
  }
  function addLayer() {
    if (layers.length >= 5) {
      toastApi.show('Максимум 5 шарів')
      return
    }
    setLayers([...layers, makeLayer({ y: 8, blur: 16, opacity: 0.15 })])
  }
  return (
    <div>
      <p className="cl-tab-desc">Власна тінь — зсув по X/Y, розмиття (blur), розширення (spread) і колір. Можна накласти кілька шарів одна на одну для реалістичнішої, м'якшої тіні.</p>
      <HelpBox>
        <p>X/Y — куди падає тінь. Blur — наскільки розмиті її краї (0 = чіткий силует). Spread — наскільки тінь більша/менша за сам елемент. Inset — тінь всередині елемента (заглиблення) замість зовні.</p>
        <p>Реальні тіні рідко бувають одним шаром: подивись на будь-який об'єкт під лампою — є чітка темна тінь під самим предметом (малий blur, невелика opacity) і м'якша розмита тінь навколо (великий blur, ще менша opacity). Material Design саме так і будує свої тіні — два шари: "ключова" тінь + "фонова" (дивись пресети).</p>
      </HelpBox>

      <div className="cl-section-title">Превʼю</div>
      <div className="sl-preview-stage">
        <div className="sl-preview-card" style={{ boxShadow: buildBoxShadowCss(layers) }} />
      </div>

      <div className="cl-section-title">Шари ({layers.length})</div>
      {layers.map((l, i) => (
        <div key={l.id} className="sl-layer-card">
          <div className="sl-layer-head">
            <span>Шар {i + 1}</span>
            <button className="cl-mini-btn" onClick={() => removeLayer(l.id)} title="Видалити шар">✕</button>
          </div>
          <div className="cl-editrow">
            <label>X<input type="range" min={-40} max={40} value={l.x} onChange={(e) => updateLayer(l.id, { x: parseInt(e.target.value, 10) })} /><span>{l.x}px</span></label>
          </div>
          <div className="cl-editrow">
            <label>Y<input type="range" min={-40} max={40} value={l.y} onChange={(e) => updateLayer(l.id, { y: parseInt(e.target.value, 10) })} /><span>{l.y}px</span></label>
          </div>
          <div className="cl-editrow">
            <label>Blur<input type="range" min={0} max={80} value={l.blur} onChange={(e) => updateLayer(l.id, { blur: parseInt(e.target.value, 10) })} /><span>{l.blur}px</span></label>
          </div>
          <div className="cl-editrow">
            <label>Spread<input type="range" min={-20} max={20} value={l.spread} onChange={(e) => updateLayer(l.id, { spread: parseInt(e.target.value, 10) })} /><span>{l.spread}px</span></label>
          </div>
          <div className="cl-editrow">
            <label>Opacity<input type="range" min={0} max={1} step={0.01} value={l.opacity} onChange={(e) => updateLayer(l.id, { opacity: parseFloat(e.target.value) })} /><span>{l.opacity.toFixed(2)}</span></label>
          </div>
          <div className="cl-picker-top">
            <input type="color" className="cl-swatch-input" value={l.color} onChange={(e) => updateLayer(l.id, { color: e.target.value })} />
            <input className="cl-hex-input" value={l.color} onChange={(e) => updateLayer(l.id, { color: e.target.value })} />
          </div>
          <div className="cl-editrow">
            <label><input type="checkbox" checked={l.inset} onChange={(e) => updateLayer(l.id, { inset: e.target.checked })} /> Inset</label>
          </div>
        </div>
      ))}
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={addLayer}>+ Додати шар</button>
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function LightTab({ light, patch, toastApi }) {
  const rad = (light.angle * Math.PI) / 180
  const x = Math.round(Math.cos(rad) * light.distance)
  const y = Math.round(Math.sin(rad) * light.distance)
  const css = `box-shadow: ${x}px ${y}px ${light.softness}px 0px ${hexToRgba(light.color, light.opacity)};`
  return (
    <div>
      <p className="cl-tab-desc">Думай про це не як про X/Y напряму, а як про положення джерела світла — кут і відстань самі перетворюються на зсув і розмиття тіні.</p>
      <HelpBox>
        <p>Angle — звідки «світить» (0° — праворуч, 90° — знизу, 180° — ліворуч, 270° — згори). Distance — наскільки далеко об'єкт від поверхні (більше — тінь зсунута далі). Softness — розмір джерела світла: маленьке й різке — чіткі краї тіні, велике й розсіяне — м'які.</p>
        <p>Це той самий box-shadow, що й на вкладці «Тінь», просто X/Y тут обчислюються за формулою кола (<code>x = cos(angle) × distance</code>, <code>y = sin(angle) × distance</code>) — зручніше думати «світло зверху-зліва під 45°», ніж підбирати X і Y навмання.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>Angle<input type="range" min={0} max={360} value={light.angle} onChange={(e) => patch({ angle: parseInt(e.target.value, 10) })} /><span>{light.angle}°</span></label>
      </div>
      <div className="cl-editrow">
        <label>Distance<input type="range" min={0} max={40} value={light.distance} onChange={(e) => patch({ distance: parseInt(e.target.value, 10) })} /><span>{light.distance}px</span></label>
      </div>
      <div className="cl-editrow">
        <label>Softness<input type="range" min={0} max={80} value={light.softness} onChange={(e) => patch({ softness: parseInt(e.target.value, 10) })} /><span>{light.softness}px</span></label>
      </div>
      <div className="cl-editrow">
        <label>Opacity<input type="range" min={0} max={1} step={0.01} value={light.opacity} onChange={(e) => patch({ opacity: parseFloat(e.target.value) })} /><span>{light.opacity.toFixed(2)}</span></label>
      </div>
      <div className="cl-picker-top">
        <input type="color" className="cl-swatch-input" value={light.color} onChange={(e) => patch({ color: e.target.value })} />
        <input className="cl-hex-input" value={light.color} onChange={(e) => patch({ color: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="sl-preview-stage">
        <div className="sl-preview-card" style={{ boxShadow: `${x}px ${y}px ${light.softness}px 0px ${hexToRgba(light.color, light.opacity)}` }} />
      </div>

      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function TextShadowTab({ ts, patch, toastApi }) {
  const css = `text-shadow: ${buildTextShadowCss(ts)};`
  return (
    <div>
      <p className="cl-tab-desc"><code>text-shadow</code> — окрема від box-shadow властивість: малює тінь по контуру самих букв, а не прямокутника навколо.</p>
      <HelpBox>
        <p>Синтаксис схожий на box-shadow, але без spread та inset — лише зсув X/Y, розмиття й колір. Якщо поставити X=0, Y=0 і великий blur — вийде не тінь, а «світіння» (glow) навколо букв, як неонова вивіска.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>X<input type="range" min={-20} max={20} value={ts.x} onChange={(e) => patch({ x: parseInt(e.target.value, 10) })} /><span>{ts.x}px</span></label>
      </div>
      <div className="cl-editrow">
        <label>Y<input type="range" min={-20} max={20} value={ts.y} onChange={(e) => patch({ y: parseInt(e.target.value, 10) })} /><span>{ts.y}px</span></label>
      </div>
      <div className="cl-editrow">
        <label>Blur<input type="range" min={0} max={30} value={ts.blur} onChange={(e) => patch({ blur: parseInt(e.target.value, 10) })} /><span>{ts.blur}px</span></label>
      </div>
      <div className="cl-editrow">
        <label>Opacity<input type="range" min={0} max={1} step={0.01} value={ts.opacity} onChange={(e) => patch({ opacity: parseFloat(e.target.value) })} /><span>{ts.opacity.toFixed(2)}</span></label>
      </div>
      <div className="cl-picker-top">
        <input type="color" className="cl-swatch-input" value={ts.color} onChange={(e) => patch({ color: e.target.value })} />
        <input className="cl-hex-input" value={ts.color} onChange={(e) => patch({ color: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="sl-text-preview-stage">
        <span className="sl-text-preview" style={{ textShadow: buildTextShadowCss(ts) }}>Aa Шрифт</span>
      </div>

      <div className="cl-section-title">Швидкі пресети</div>
      <div className="cl-btn-row">
        {TEXT_SHADOW_PRESETS.map((p) => (
          <button key={p.id} className="harmony-btn" onClick={() => patch({ x: p.x, y: p.y, blur: p.blur, color: p.color, opacity: p.opacity })}>{p.label}</button>
        ))}
      </div>

      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function PresetsTab({ onApply }) {
  return (
    <div>
      <p className="cl-tab-desc">Готові рецепти тіней — застосуй один як стартову точку й далі підлаштуй на вкладці «Тінь».</p>
      <div className="l3d-template-grid">
        {PRESETS.map((p) => (
          <button key={p.id} className="l3d-template-card sl-preset-card" onClick={() => onApply(p)}>
            <div className="sl-preset-swatch" style={{ boxShadow: buildBoxShadowCss(p.layers.map((l) => ({ ...l, inset: l.inset || false }))) }} />
            <span className="l3d-template-label">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ExportTab({ layers }) {
  const css = `box-shadow: ${buildBoxShadowCss(layers)};`
  const json = JSON.stringify(layers, null, 2)
  return (
    <div>
      <p className="cl-tab-desc">Забери поточну тінь (з вкладки «Тінь») з собою.</p>
      <div className="cl-section-title">Текст</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => copy(css)}>Copy CSS</button>
        <button className="harmony-btn" onClick={() => copy(json)}>Copy JSON</button>
      </div>
      <div className="cl-section-title">Файли</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => downloadText(css, 'shadow.css')}>⬇ CSS</button>
        <button className="harmony-btn" onClick={() => downloadText(json, 'shadow.json', 'application/json')}>⬇ JSON</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function defaultState() {
  return {
    layers: [makeLayer()],
    light: { angle: 135, distance: 14, softness: 20, opacity: 0.25, color: '#000000' },
    textShadow: { x: 2, y: 2, blur: 4, color: '#000000', opacity: 0.4 },
  }
}

export default function LightLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('shadow')
  const stateRef = useRef(state)
  const debounceRef = useRef(null)
  const hist = useLabHistory(initial)

  function scheduleCommit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => hist.set(stateRef.current), 400)
  }
  function applyState(next) {
    stateRef.current = next
    setStateLive(next)
    scheduleCommit()
  }
  function setLayers(layers) {
    applyState({ ...stateRef.current, layers })
  }
  function patchLight(partial) {
    applyState({ ...stateRef.current, light: { ...stateRef.current.light, ...partial } })
  }
  function patchTextShadow(partial) {
    applyState({ ...stateRef.current, textShadow: { ...stateRef.current.textShadow, ...partial } })
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
    pushRecentLab('light')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyPreset(preset) {
    setLayers(preset.layers.map((l) => makeLayer(l)))
    setTab('shadow')
    toastApi.show(`✓ Застосовано: ${preset.label}`)
  }

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Shadow & Light Lab"
      subtitle="Тіні, світло й готові CSS-пресети (material, floating, layered)."
      icon="🌑"
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
          {tab === 'shadow' && <ShadowTab layers={state.layers} setLayers={setLayers} toastApi={toastApi} />}
          {tab === 'light' && <LightTab light={state.light} patch={patchLight} toastApi={toastApi} />}
          {tab === 'textShadow' && <TextShadowTab ts={state.textShadow} patch={patchTextShadow} toastApi={toastApi} />}
          {tab === 'presets' && <PresetsTab onApply={applyPreset} />}
          {tab === 'export' && <ExportTab layers={state.layers} />}
        </div>
      </div>
    </LabShell>
  )
}
