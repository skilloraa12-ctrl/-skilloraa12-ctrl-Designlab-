import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { buildLinearCss, buildRadialCss, buildConicCss, RADIAL_SHAPES, makeStop, defaultStops, sortStops, GRADIENT_PRESETS, buildAnimatedGradientCss } from './labs/gradientBuilder.js'

const TABS = [
  { key: 'linear', icon: '🔵', label: 'Лінійний' },
  { key: 'radial', icon: '⚪', label: 'Радіальний' },
  { key: 'conic', icon: '🎯', label: 'Конічний' },
  { key: 'animated', icon: '🎬', label: 'Анімований' },
  { key: 'presets', icon: '✨', label: 'Пресети' },
]

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

function StopEditor({ stops, onChange, toastApi }) {
  const sorted = sortStops(stops)
  function updateStop(id, patch) {
    onChange(stops.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  function removeStop(id) {
    if (stops.length <= 2) {
      toastApi.show('Потрібно щонайменше 2 точки')
      return
    }
    onChange(stops.filter((s) => s.id !== id))
  }
  function addStop() {
    if (stops.length >= 8) {
      toastApi.show('Максимум 8 точок')
      return
    }
    const last = sorted[sorted.length - 1]
    onChange([...stops, makeStop(last.color, Math.min(100, last.pos + 10))])
  }
  return (
    <div>
      <div className="cl-section-title">Точки кольору ({stops.length})</div>
      <div className="l3d-object-list">
        {sorted.map((s) => (
          <div key={s.id} className="l3d-object-row">
            <input type="color" className="cl-swatch-input" style={{ width: 32, height: 28 }} value={s.color} onChange={(e) => updateStop(s.id, { color: e.target.value })} />
            <input
              className="cl-hex-input"
              value={s.color}
              onChange={(e) => updateStop(s.id, { color: e.target.value })}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={s.pos}
              onChange={(e) => updateStop(s.id, { pos: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) })}
              style={{ width: 56, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--ink)', padding: '5px 7px', fontSize: 12 }}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>%</span>
            <button className="cl-mini-btn" onClick={() => removeStop(s.id)} title="Видалити точку">✕</button>
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={addStop}>+ Додати точку</button>
      </div>
    </div>
  )
}

function LinearTab({ state, patch, toastApi }) {
  const css = buildLinearCss(state.linear)
  return (
    <div>
      <p className="cl-tab-desc">Лінійний градієнт переходить від однієї точки кольору до іншої вздовж прямої лінії під заданим кутом.</p>
      <HelpBox>
        <p>Angle — напрямок переходу: 0deg — знизу вгору, 90deg — зліва направо, 180deg — згори вниз. Кожна точка (stop) має колір і позицію у відсотках уздовж цієї лінії.</p>
        <p>Наприклад, <code>linear-gradient(90deg, #3E37E0 0%, #6B62FF 100%)</code> читається так: «почни з фіолетового зліва (0%) і плавно перейди до синього справа (100%), рухаючись по горизонталі (90°)». Якщо додати третю точку на позиції 50%, вийде перехід у три кольори замість двох — браузер сам плавно змішує сусідні точки.</p>
        <p>Популярні кути для реальних інтерфейсів: 180° (зверху вниз) для затемнення фото під підписом, 135° для hero-секцій (діагональ "з кута в кут" виглядає динамічніше за просту вертикаль), 90° для кнопок і бейджів. Уникайте довільних кутів типу 37° чи 142° без причини — вони виглядають випадково, тоді як круглі значення (0/45/90/135/180) читаються як навмисний дизайнерський вибір.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>Angle
          <input type="range" min={0} max={360} step={1} value={state.linear.angle} onChange={(e) => patch('linear', { angle: parseInt(e.target.value, 10) })} />
          <span>{state.linear.angle}deg</span>
        </label>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="gr-preview" style={{ background: css }} />

      <StopEditor stops={state.linear.stops} onChange={(stops) => patch('linear', { stops })} toastApi={toastApi} />

      <div className="cl-section-title">CSS</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(`background: ${css};`); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">background: {css};</pre>
    </div>
  )
}

function RadialTab({ state, patch, toastApi }) {
  const css = buildRadialCss(state.radial)
  return (
    <div>
      <p className="cl-tab-desc">Радіальний градієнт розходиться колами (чи еліпсами) від центру назовні.</p>
      <HelpBox>
        <p>Circle дає рівномірне коло незалежно від пропорцій контейнера, Ellipse підлаштовується під ширину/висоту елемента.</p>
        <p>Радіальні градієнти добре підходять для ефекту «світла з центру» — кнопки hover-стану, фон-«прожектор» за заголовком, або м'яка тінь-виноска (vignette) по краях картки. Позиція 0% — колір у самому центрі, 100% — колір на межі форми.</p>
        <p>За замовчуванням радіальний градієнт центрується в середині елемента, але CSS дозволяє задати довільну точку (<code>radial-gradient(circle at 20% 30%, ...)</code>) — зсунутий у кут "прожектор" часто виглядає природніше за ідеально центрований, особливо на великих hero-банерах, де джерело світла рідко буває рівно посередині кадру.</p>
      </HelpBox>

      <div className="cl-section-title">Форма</div>
      <div className="cl-btn-row">
        {RADIAL_SHAPES.map((s) => (
          <button key={s.key} className={'harmony-btn' + (state.radial.shape === s.key ? ' active' : '')} onClick={() => patch('radial', { shape: s.key })}>{s.label}</button>
        ))}
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="gr-preview" style={{ background: css }} />

      <StopEditor stops={state.radial.stops} onChange={(stops) => patch('radial', { stops })} toastApi={toastApi} />

      <div className="cl-section-title">CSS</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(`background: ${css};`); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">background: {css};</pre>
    </div>
  )
}

function ConicTab({ state, patch, toastApi }) {
  const css = buildConicCss(state.conic)
  return (
    <div>
      <p className="cl-tab-desc">Конічний градієнт обертається навколо центру по колу, як стрілка годинника — зручно для кольорових колес і індикаторів прогресу.</p>
      <HelpBox>
        <p>From — звідки починається обертання (0deg — згори). Точки розташовані по колу у відсотках від повного оберту (360°).</p>
        <p>Класичне застосування — колесо вибору кольору (color wheel) з точками 0%/33%/66%/100% у червоному/зеленому/синьому/червоному знову (щоб коло замкнулось без різкого стику), або круговий індикатор прогресу, де одна точка — колір прогресу, а решта кола — прозорий/сірий фон.</p>
        <p>Хитрість для різкої межі замість плавного переходу (наприклад, щоб 70% прогрес-бару було чітко кольоровим, а решта — чітко сірим, без розмитості): постав дві точки одного кольору поруч, на одній і тій самій позиції або дуже близько (наприклад <code>#3E37E0 70%, #E4E4EA 70%</code>) — градієнт "стрибне" миттєво замість плавного змішування.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>From
          <input type="range" min={0} max={360} step={1} value={state.conic.angle} onChange={(e) => patch('conic', { angle: parseInt(e.target.value, 10) })} />
          <span>{state.conic.angle}deg</span>
        </label>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="gr-preview" style={{ background: css }} />

      <StopEditor stops={state.conic.stops} onChange={(stops) => patch('conic', { stops })} toastApi={toastApi} />

      <div className="cl-section-title">CSS</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(`background: ${css};`); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">background: {css};</pre>
    </div>
  )
}

function AnimatedTab({ state, patch, toastApi }) {
  const { gradient, css } = buildAnimatedGradientCss(state.animated)
  return (
    <div>
      <p className="cl-tab-desc">Той самий градієнт, але «живий» — кольори плавно перетікають без жодного JavaScript, лише CSS-анімація.</p>
      <HelpBox>
        <p>Трюк простий, але неочевидний: градієнт робиться набагато більшим за сам елемент (<code>background-size: 400% 400%</code>), а потім анімується властивість <code>background-position</code> — елемент ніби "рухається" по великому градієнтному полотну, хоча насправді статичний, рухається лише видима ділянка фону.</p>
        <p>Це дешевше для продуктивності, ніж анімувати сам градієнт (генерувати новий <code>background</code> на кожному кадрі): анімація <code>background-position</code>, як і <code>transform</code>/<code>opacity</code>, не змушує браузер перераховувати layout — лише перемальовує, тому рух лишається плавним навіть на слабких пристроях.</p>
        <p>Популярне застосування — "живі" фони на лендингах і заставках застосунків (ефект "aurora"/"mesh"), анімовані бейджі "Pro"/"New", чи фон кнопки при завантаженні. Не зловживайте: постійний рух на фоні під текстом, який читають, швидко втомлює око — тримайте тривалість циклу довгою (8-15 секунд) і використовуйте лише там, де немає тексту для читання поверх.</p>
      </HelpBox>

      <div className="cl-editrow">
        <label>Тривалість циклу
          <input type="range" min={2} max={20} step={1} value={state.animated.durationS} onChange={(e) => patch('animated', { durationS: parseInt(e.target.value, 10) })} />
          <span>{state.animated.durationS}с</span>
        </label>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <style>{css}</style>
      <div className="gr-preview anim-gradient" style={{ background: gradient, backgroundSize: '400% 400%', animation: `gradientShift ${state.animated.durationS}s ease infinite` }} />

      <StopEditor stops={state.animated.stops} onChange={(stops) => patch('animated', { stops })} toastApi={toastApi} />

      <div className="cl-section-title">CSS</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function PresetsTab({ patch, setTab, toastApi }) {
  return (
    <div>
      <p className="cl-tab-desc">Готові комбінації кольорів і типу градієнта — для натхнення або швидкого старту.</p>
      <HelpBox>
        <p>Кожен пресет — це повний набір налаштувань (тип, кут, кольорові точки), готовий до використання. Клік одразу перемикає тебе на відповідну вкладку (Лінійний/Радіальний/Конічний) з уже застосованими кольорами — звідти можна продовжити редагувати як завгодно: змінити кут, додати чи прибрати точки.</p>
        <p>Пресети тут навмисно різностильові — від теплого "Fire" до монохромного "Mono" — щоб показати діапазон того, на що здатен один і той самий інструмент. Хороша вправа: застосуйте пресет, що найменше схожий на ваш звичайний смак, і спробуйте підібрати йому застосування (банер, фон кнопки, обкладинка картки) — це тренує погляд ширше, ніж завжди підбирати кольори з нуля у звичній зоні комфорту.</p>
      </HelpBox>
      <div className="l3d-template-grid">
        {GRADIENT_PRESETS.map((p) => (
          <button
            key={p.key}
            className="l3d-template-card"
            style={{ background: p.type === 'linear' ? buildLinearCss({ angle: p.angle, stops: p.stops }) : p.type === 'radial' ? buildRadialCss({ shape: p.shape, stops: p.stops }) : buildConicCss({ angle: p.angle, stops: p.stops }) }}
            onClick={() => {
              const stops = p.stops.map((s) => makeStop(s.color, s.pos))
              if (p.type === 'linear') patch('linear', { angle: p.angle, stops })
              if (p.type === 'radial') patch('radial', { shape: p.shape, stops })
              if (p.type === 'conic') patch('conic', { angle: p.angle, stops })
              toastApi.show(`✓ Застосовано «${p.label}»`)
              setTab(p.type)
            }}
          >
            <span className="l3d-template-label" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{p.icon} {p.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function defaultState() {
  return {
    linear: { angle: 90, stops: defaultStops() },
    radial: { shape: 'circle', stops: defaultStops() },
    conic: { angle: 0, stops: defaultStops() },
    animated: { durationS: 8, stops: [makeStop('#3E37E0', 0), makeStop('#E0373E', 50), makeStop('#3E37E0', 100)] },
  }
}

export default function GradientLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('linear')
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
    pushRecentLab('gradient')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Gradient Lab"
      subtitle="Лінійні, радіальні, конічні й анімовані градієнти з кількома точками кольору — живе превʼю й готовий CSS."
      icon="🌈"
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
          {tab === 'linear' && <LinearTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'radial' && <RadialTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'conic' && <ConicTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'animated' && <AnimatedTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'presets' && <PresetsTab state={state} patch={patch} setTab={setTab} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
