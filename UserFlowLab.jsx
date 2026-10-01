import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { NODE_TYPES, FLOW_TEMPLATES, moveItem, buildJourneyPlot, computeFunnel } from './labs/userFlowBuilder.js'

const TABS = [
  { key: 'linear', icon: '🔀', label: 'Сценарій' },
  { key: 'decision', icon: '🔶', label: 'Рішення' },
  { key: 'journey', icon: '📈', label: 'Емоційна крива' },
  { key: 'funnel', icon: '⏳', label: 'Воронка' },
  { key: 'templates', icon: '📋', label: 'Шаблони' },
]

let idCounter = 1
function nextId() { return idCounter++ }

function HelpBox({ children }) {
  return (
    <details className="cl-help" open>
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

function LinearTab({ state, patch, toastApi }) {
  const items = state.linear.items
  function add(type) {
    if (items.length >= 12) { toastApi.show('Максимум 12 кроків'); return }
    patch('linear', { items: [...items, { id: nextId(), type }] })
  }
  function move(i, dir) { patch('linear', { items: moveItem(items, i, dir) }) }
  function remove(id) { patch('linear', { items: items.filter((it) => it.id !== id) }) }
  return (
    <div>
      <p className="cl-tab-desc">Складіть лінійний сценарій користувача з екранів і дій — від старту до кінця.</p>
      <HelpBox>
        <p>User flow показує шлях користувача крок за кроком — зручно, щоб побачити, чи немає зайвих кроків перед тим, як малювати повноцінні екрани.</p>
        <p>Хороше практичне правило: якщо між "Старт" і "Кінець" у критичному сценарії (реєстрація, оплата) виходить більше 5-6 кроків, варто запитати для кожного — "а що буде, якщо цей крок прибрати?". Кожен зайвий екран чи дія — ще одна точка, де користувач може кинути сценарій на півдорозі.</p>
      </HelpBox>

      <div className="cl-section-title">Палітра</div>
      <div className="cl-btn-row">
        {NODE_TYPES.map((t) => <button key={t.key} className="harmony-btn" onClick={() => add(t.key)}>{t.icon} {t.label}</button>)}
      </div>

      <div className="cl-section-title">Список ({items.length})</div>
      <div className="l3d-object-list">
        {items.map((it, i) => {
          const def = NODE_TYPES.find((t) => t.key === it.type)
          return (
            <div key={it.id} className="l3d-object-row">
              <span style={{ width: 22, textAlign: 'center' }}>{def?.icon}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{def?.label}</span>
              <button className="cl-mini-btn" disabled={i === 0} onClick={() => move(i, -1)} title="Вгору">↑</button>
              <button className="cl-mini-btn" disabled={i === items.length - 1} onClick={() => move(i, 1)} title="Вниз">↓</button>
              <button className="cl-mini-btn" onClick={() => remove(it.id)} title="Видалити">✕</button>
            </div>
          )
        })}
        {items.length === 0 && <p className="cl-tab-desc">Порожньо — додайте крок із палітри вище.</p>}
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="uf-flow">
        {items.map((it, i) => {
          const def = NODE_TYPES.find((t) => t.key === it.type)
          return (
            <div key={it.id} style={{ display: 'contents' }}>
              <div className={'uf-node ' + it.type}>{def?.icon} {def?.label}</div>
              {i < items.length - 1 && <div className="uf-arrow">↓</div>}
            </div>
          )
        })}
        {items.length === 0 && <div className="uf-node">Порожньо</div>}
      </div>
    </div>
  )
}

function DecisionTab({ state, patch }) {
  const cfg = state.decision
  function addStep(branch) {
    const list = cfg[branch].steps
    if (list.length >= 5) return
    patch('decision', { [branch]: { steps: [...list, { id: nextId(), text: 'Крок' }] } })
  }
  function updateStep(branch, id, text) {
    patch('decision', { [branch]: { steps: cfg[branch].steps.map((s) => (s.id === id ? { ...s, text } : s)) } })
  }
  function removeStep(branch, id) {
    patch('decision', { [branch]: { steps: cfg[branch].steps.filter((s) => s.id !== id) } })
  }
  return (
    <div>
      <p className="cl-tab-desc">Одна точка рішення з двома гілками — покаже, куди веде кожен варіант відповіді користувача.</p>
      <HelpBox>
        <p>Ромб — стандартне позначення рішення у блок-схемах. Кожна гілка ("Так" / "Ні") — окремий незалежний підсценарій.</p>
        <p>Не кожне "рішення" в дизайні потребує запитання до користувача — найчастіше воно приховане: "чи авторизований" чи "чи є товари в кошику" система перевіряє сама, без екрану з питанням. Малюючи таку розвилку, позначайте явно, хто і коли ухвалює рішення: сам користувач (клік на вибір) чи система (перевірка умови у фоні).</p>
      </HelpBox>

      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Питання</span>
        <input className="cl-text-input" style={{ flex: 1 }} value={cfg.question} onChange={(e) => patch('decision', { question: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="uf-decision-wrap">
        <div className="uf-diamond">🔶 {cfg.question}</div>
        <div className="uf-branches">
          <div className="uf-branch">
            <span className="uf-branch-label">✓ Так</span>
            {cfg.yes.steps.map((s) => <div key={s.id} className="uf-branch-step">{s.text}</div>)}
          </div>
          <div className="uf-branch">
            <span className="uf-branch-label">✕ Ні</span>
            {cfg.no.steps.map((s) => <div key={s.id} className="uf-branch-step">{s.text}</div>)}
          </div>
        </div>
      </div>

      <div className="cl-picker-top" style={{ gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="cl-section-title">Гілка «Так»</div>
          {cfg.yes.steps.map((s) => (
            <div key={s.id} className="cl-picker-top">
              <input className="cl-text-input" value={s.text} onChange={(e) => updateStep('yes', s.id, e.target.value)} />
              <button className="cl-mini-btn" onClick={() => removeStep('yes', s.id)}>✕</button>
            </div>
          ))}
          <button className="harmony-btn" onClick={() => addStep('yes')}>+ Крок</button>
        </div>
        <div style={{ flex: 1 }}>
          <div className="cl-section-title">Гілка «Ні»</div>
          {cfg.no.steps.map((s) => (
            <div key={s.id} className="cl-picker-top">
              <input className="cl-text-input" value={s.text} onChange={(e) => updateStep('no', s.id, e.target.value)} />
              <button className="cl-mini-btn" onClick={() => removeStep('no', s.id)}>✕</button>
            </div>
          ))}
          <button className="harmony-btn" onClick={() => addStep('no')}>+ Крок</button>
        </div>
      </div>
    </div>
  )
}

function JourneyTab({ state, patch }) {
  const stages = state.journey.stages
  const W = 560, H = 160
  const { path, points } = buildJourneyPlot(stages, W, H)
  function update(id, partial) {
    patch('journey', { stages: stages.map((s) => (s.id === id ? { ...s, ...partial } : s)) })
  }
  function remove(id) {
    if (stages.length <= 2) return
    patch('journey', { stages: stages.filter((s) => s.id !== id) })
  }
  function add() {
    if (stages.length >= 7) return
    patch('journey', { stages: [...stages, { id: nextId(), label: 'Етап', mood: 0 }] })
  }
  return (
    <div>
      <p className="cl-tab-desc">Карта емоцій користувача на кожному етапі сценарію — допомагає побачити, де досвід "провисає".</p>
      <HelpBox>
        <p>Класичний інструмент customer journey mapping: по осі X — етапи сценарію в хронологічному порядку, по осі Y — настрій користувача від −2 (фрустрація) до +2 (захват).</p>
        <p>Найцінніша інформація тут — не середній рівень, а різкі падіння: етап, де крива різко йде вниз, — кандидат номер один на редизайн, навіть якщо сусідні етапи виглядають чудово. Один провальний крок (наприклад "Оплата" з купою полів і незрозумілими помилками) може перекреслити враження від усього іншого бездоганного сценарію.</p>
      </HelpBox>

      <div className="l3d-object-list">
        {stages.map((s) => (
          <div key={s.id} className="l3d-object-row" style={{ flexWrap: 'wrap' }}>
            <input className="cl-text-input" style={{ flex: 1, minWidth: 100 }} value={s.label} onChange={(e) => update(s.id, { label: e.target.value })} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>настрій</span>
            <input type="range" min={-2} max={2} step={1} value={s.mood} onChange={(e) => update(s.id, { mood: parseInt(e.target.value, 10) })} style={{ width: 90 }} />
            <span style={{ fontSize: 12, width: 20 }}>{s.mood > 0 ? `+${s.mood}` : s.mood}</span>
            <button className="cl-mini-btn" onClick={() => remove(s.id)} title="Видалити">✕</button>
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={add}>+ Додати етап</button>
      </div>

      <div className="cl-section-title">Графік</div>
      <svg className="uf-journey-box" width={W} height={H + 30} viewBox={`0 -10 ${W} ${H + 30}`}>
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="var(--line)" strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="#3E37E0" strokeWidth={2.5} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} className="uf-journey-dot" />
            <text x={p.x} y={H + 16} textAnchor="middle" className="uf-journey-label">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function TemplatesTab({ patch, setTab, toastApi }) {
  return (
    <div>
      <p className="cl-tab-desc">Готові типові сценарії — застосуйте й доопрацюйте на вкладці "Сценарій".</p>
      <HelpBox>
        <p>Ці шаблони — не універсальний рецепт, а відправна точка з типовою кількістю й послідовністю кроків для поширених задач. Реальний продукт майже завжди вимагає коригування: додайте крок верифікації email в онбординг чи крок вибору способу доставки в чекаут, якщо це є у вашому продукті.</p>
      </HelpBox>
      <div className="l3d-template-grid">
        {FLOW_TEMPLATES.map((t) => (
          <button
            key={t.key}
            className="l3d-template-card"
            onClick={() => {
              patch('linear', { items: t.steps.map((key) => ({ id: nextId(), type: key })) })
              toastApi.show(`✓ Застосовано «${t.label}»`)
              setTab('linear')
            }}
          >
            <span className="l3d-template-icon">{t.icon}</span>
            <span className="l3d-template-label">{t.label}</span>
            <span className="l3d-template-count">{t.steps.length} кроків</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function FunnelTab({ state, patch }) {
  const steps = state.funnel.steps
  const { rows, finalPct, worstIndex } = computeFunnel(steps)
  function update(id, partial) {
    patch('funnel', { steps: steps.map((s) => (s.id === id ? { ...s, ...partial } : s)) })
  }
  function remove(id) {
    if (steps.length <= 2) return
    patch('funnel', { steps: steps.filter((s) => s.id !== id) })
  }
  function add() {
    if (steps.length >= 7) return
    patch('funnel', { steps: [...steps, { id: nextId(), label: 'Крок', continueRate: 0.8 }] })
  }
  return (
    <div>
      <p className="cl-tab-desc">Скільки користувачів доходить до кінця сценарію — і на якому кроці втрачається найбільше.</p>
      <HelpBox>
        <p>Воронка (funnel) — стандартний продуктовий інструмент: кожен крок утримує лише частину аудиторії попереднього. "Continue rate" — відсоток тих, хто дійшов до попереднього кроку й пішов далі (не кинув). На відміну від емоційної кривої, тут вимірюється не настрій, а фактична поведінка — скільки людей реально виконали дію.</p>
        <p>Крок з найгіршим continue rate позначений — це той, де найбільше людей "відвалюється". Але контекст важливий: втрата 90% на кроці "Побачив рекламу → Зайшов на сайт" зазвичай нормальна (так працює реклама), а втрата 50% на кроці "Кошик → Оплата" — тривожний сигнал, бо людина вже виявила намір купити.</p>
      </HelpBox>

      <div className="l3d-object-list">
        {steps.map((s, i) => (
          <div key={s.id} className="l3d-object-row" style={{ flexWrap: 'wrap' }}>
            <input className="cl-text-input" style={{ flex: 1, minWidth: 100 }} value={s.label} onChange={(e) => update(s.id, { label: e.target.value })} />
            {i > 0 && (
              <>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>продовжують</span>
                <input type="range" min={0.05} max={1} step={0.05} value={s.continueRate} onChange={(e) => update(s.id, { continueRate: parseFloat(e.target.value) })} style={{ width: 90 }} />
                <span style={{ fontSize: 12, width: 36 }}>{Math.round(s.continueRate * 100)}%</span>
              </>
            )}
            <button className="cl-mini-btn" onClick={() => remove(s.id)} title="Видалити">✕</button>
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={add}>+ Додати крок</button>
      </div>

      <div className="cl-section-title">Воронка</div>
      <div className="uf-funnel">
        {rows.map((r, i) => (
          <div key={r.id} className="uf-funnel-row">
            <span className="uf-funnel-label">{r.label}</span>
            <div className="uf-funnel-bar-wrap">
              <div className={'uf-funnel-bar' + (i === worstIndex ? ' worst' : '')} style={{ width: `${r.after}%` }} />
            </div>
            <span className="uf-funnel-pct">{r.after.toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="cl-tags" style={{ marginTop: 10 }}>
        <span className="cl-badge">{finalPct.toFixed(0)}% дійшли до кінця</span>
        {worstIndex >= 0 && <span className="cl-badge fail">Найбільша втрата: «{rows[worstIndex].label}»</span>}
      </div>
    </div>
  )
}

function defaultState() {
  return {
    linear: { items: [{ id: nextId(), type: 'start' }, { id: nextId(), type: 'screen' }, { id: nextId(), type: 'action' }, { id: nextId(), type: 'end' }] },
    decision: {
      question: 'Авторизований?',
      yes: { steps: [{ id: nextId(), text: 'Показати дашборд' }] },
      no: { steps: [{ id: nextId(), text: 'Показати форму логіну' }] },
    },
    journey: {
      stages: [
        { id: nextId(), label: 'Вхід', mood: 0 },
        { id: nextId(), label: 'Пошук', mood: 1 },
        { id: nextId(), label: 'Оплата', mood: -1 },
        { id: nextId(), label: 'Готово', mood: 2 },
      ],
    },
    funnel: {
      steps: [
        { id: nextId(), label: 'Зайшли на сайт', continueRate: 1 },
        { id: nextId(), label: 'Додали в кошик', continueRate: 0.4 },
        { id: nextId(), label: 'Почали оплату', continueRate: 0.6 },
        { id: nextId(), label: 'Завершили оплату', continueRate: 0.75 },
      ],
    },
  }
}

export default function UserFlowLab() {
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
    pushRecentLab('user-flow')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="User Flow Lab"
      subtitle="Схеми користувацьких сценаріїв: лінійні шляхи, точки рішень, карта емоцій і воронка конверсії."
      icon="🔀"
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
          {tab === 'decision' && <DecisionTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'journey' && <JourneyTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'funnel' && <FunnelTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'templates' && <TemplatesTab state={state} patch={patch} setTab={setTab} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
