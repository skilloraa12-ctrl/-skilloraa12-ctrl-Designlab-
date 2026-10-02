import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import {
  THIRDS_LINES, POWER_POINTS, nearestPowerPoint,
  GOLDEN_LINES, buildGoldenSpiralPoints, spiralToSvgPath,
  SYMMETRY_AXES, mirrorCells,
  calcBalance,
  negativeSpaceRatio, NEGATIVE_SPACE_LABELS,
  groupByProximity,
} from './labs/compositionBuilder.js'

const TABS = [
  { key: 'thirds', icon: '▦', label: 'Правило третин' },
  { key: 'golden', icon: '🌀', label: 'Золотий перетин' },
  { key: 'symmetry', icon: '🪞', label: 'Симетрія' },
  { key: 'balance', icon: '⚖️', label: 'Баланс' },
  { key: 'negspace', icon: '◻️', label: 'Негативний простір' },
  { key: 'proximity', icon: '🔗', label: 'Групування' },
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

function ThirdsTab({ state, patch }) {
  const marker = state.thirds.marker
  const near = marker ? nearestPowerPoint(marker.x, marker.y) : null
  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    patch('thirds', { marker: { x, y } })
  }
  return (
    <div>
      <p className="cl-tab-desc">Правило третин: поділіть кадр на 3×3 — головний обʼєкт, розміщений на перетині ліній ("точці сили"), виглядає природніше, ніж по центру.</p>
      <HelpBox>
        <p>Клікніть у прямокутник нижче, щоб поставити мітку обʼєкта — лаба підкаже, наскільки близько вона до найближчої точки сили.</p>
        <p>Чому не по центру: погляд, що входить по центральній осі, "зупиняється" одразу — йому нема куди рухатись далі. Зсув до точки сили лишає трохи простору з одного боку, і погляд природно "дослідує" кадр, перш ніж зупинитись на обʼєкті. Саме тому портретна фотографія й кадрування відео майже завжди уникають строго центрованого обличчя.</p>
        <p>Більшість камер телефонів і дзеркалок мають опцію "сітка третин" (grid overlay) прямо у видошукачі чи на екрані — це не декоративна функція, а прямий інструмент компонування в реальному часі, саме за цим самим принципом, який демонструє ця вкладка.</p>
      </HelpBox>

      <div className="cl-section-title">Клікніть, щоб розмістити обʼєкт</div>
      <div className="cm-photo-stage" onClick={handleClick}>
        {THIRDS_LINES.map((f, i) => <div key={'v' + i} className="cm-grid-line cm-grid-line-v" style={{ left: `${f * 100}%` }} />)}
        {THIRDS_LINES.map((f, i) => <div key={'h' + i} className="cm-grid-line cm-grid-line-h" style={{ top: `${f * 100}%` }} />)}
        {POWER_POINTS.map((p, i) => <div key={i} className="cm-power-dot" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} />)}
        {marker && <div className="cm-marker" style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }} />}
      </div>

      {near && (
        <div className="cl-tags" style={{ marginTop: 10 }}>
          <span className={'cl-badge ' + (near.distance < 0.08 ? 'pass' : 'fail')}>
            {near.distance < 0.08 ? '✓ Близько до точки сили' : `Δ ${(near.distance * 100).toFixed(0)}% до найближчої точки`}
          </span>
        </div>
      )}
    </div>
  )
}

function GoldenTab({ state, patch }) {
  const cfg = state.golden
  const points = buildGoldenSpiralPoints(cfg.turns)
  const { d, viewBox } = spiralToSvgPath(points)
  return (
    <div>
      <p className="cl-tab-desc">Золотий перетин ділить кадр не навпіл і не на третини, а у пропорції 1.618:1 — лінії зсунуті ближче до центру, ніж у правилі третин.</p>
      <HelpBox>
        <p>Золота спіраль — та сама пропорція, розгорнута в криву: кожна чверть оберту вона збільшується в 1.618 раза. Погляд глядача природно "тече" по ній до фокальної точки у центрі.</p>
        <p>На практиці різниця між золотим перетином і правилом третин (0.618 проти 0.667) на око майже непомітна — більшість людей не відрізнить кадр, побудований за одним від іншого. Користь радше методологічна: обидві сітки дають структуровану альтернативу "по центру", а яку саме обрати — питання звички, а не точності.</p>
        <p>Число 1.618 (φ) зʼявляється не лише в композиції кадру — та сама пропорція лежить в основі типографічних шкал (вкладка «Шкала» у Typography Lab) і співвідношень сторін (Ratio Lab): це один математичний принцип, застосований у кількох різних лабораторіях цієї платформи.</p>
      </HelpBox>

      <div className="cl-picker-top">
        <button className={'harmony-btn' + (cfg.showGrid ? ' active' : '')} onClick={() => patch('golden', { showGrid: !cfg.showGrid })}>Сітка</button>
        <button className={'harmony-btn' + (cfg.showSpiral ? ' active' : '')} onClick={() => patch('golden', { showSpiral: !cfg.showSpiral })}>Спіраль</button>
        <button className={'harmony-btn' + (cfg.flipX ? ' active' : '')} onClick={() => patch('golden', { flipX: !cfg.flipX })}>⇋ X</button>
        <button className={'harmony-btn' + (cfg.flipY ? ' active' : '')} onClick={() => patch('golden', { flipY: !cfg.flipY })}>⇵ Y</button>
      </div>
      <div className="cl-editrow"><label>Витків спіралі<input type="range" min={1.5} max={4} step={0.5} value={cfg.turns} onChange={(e) => patch('golden', { turns: parseFloat(e.target.value) })} /><span>{cfg.turns}</span></label></div>

      <div className="cl-section-title">Превʼю</div>
      <div className="cm-photo-stage">
        {cfg.showGrid && GOLDEN_LINES.map((f, i) => <div key={'v' + i} className="cm-grid-line cm-grid-line-v" style={{ left: `${f * 100}%` }} />)}
        {cfg.showGrid && GOLDEN_LINES.map((f, i) => <div key={'h' + i} className="cm-grid-line cm-grid-line-h" style={{ top: `${f * 100}%` }} />)}
        {cfg.showSpiral && (
          <svg className="cm-spiral-svg" viewBox={viewBox} style={{ transform: `scale(${cfg.flipX ? -1 : 1}, ${cfg.flipY ? -1 : 1})` }}>
            <path d={d} fill="none" stroke="#E0373E" strokeWidth={Math.abs(parseFloat(viewBox.split(' ')[2])) * 0.01} />
          </svg>
        )}
      </div>
    </div>
  )
}

const SYM_ROWS = 6
const SYM_COLS = 8

function SymmetryTab({ state, patch }) {
  const { axis, filled } = state.symmetry
  function toggle(row, col) {
    const key = `${row},${col}`
    const next = !filled[key]
    const updates = { [key]: next }
    mirrorCells(row, col, SYM_ROWS, SYM_COLS, axis).forEach(([r, c]) => { updates[`${r},${c}`] = next })
    patch('symmetry', { filled: { ...filled, ...updates } })
  }
  const cells = []
  for (let r = 0; r < SYM_ROWS; r++) for (let c = 0; c < SYM_COLS; c++) cells.push([r, c])
  return (
    <div>
      <p className="cl-tab-desc">Симетрична композиція дає відчуття стабільності й порядку. Клікайте клітинки — дзеркальні заповняться самі.</p>
      <HelpBox>
        <p>Вертикальна вісь дзеркалить ліво↔право, горизонтальна — верх↔низ, "обидві" дають 4-кратну (радіальну по квадрантах) симетрію.</p>
        <p>Симетрія читається як "формальна", "спокійна", іноді навіть "офіційна" — тому вона природний вибір для логотипів, сертифікатів, титульних екранів. Але та ж передбачуваність може зробити макет статичним і нудним у тривалому використанні: сторінки з великою кількістю контенту (стрічки, каталоги) зазвичай навмисно порушують симетрію, щоб додати динаміки й напрямку руху ока.</p>
        <p>Дизайнери розрізняють "дзеркальну" симетрію (точна копія, як тут) і "радіальну" (обертання навколо центру, як у сніжинці чи логотипі-мандалі) — радіальна симетрія психологічно читається ще "спокійніше" за дзеркальну, бо не має жодного вираженого напрямку (лівий/правий, верх/низ).</p>
      </HelpBox>

      <div className="cl-section-title">Вісь симетрії</div>
      <div className="cl-btn-row">
        {SYMMETRY_AXES.map((a) => (
          <button key={a.key} className={'harmony-btn' + (axis === a.key ? ' active' : '')} onClick={() => patch('symmetry', { axis: a.key })}>{a.label}</button>
        ))}
      </div>

      <div className="cl-section-title">Полотно</div>
      <div className="cm-symmetry-grid" style={{ gridTemplateColumns: `repeat(${SYM_COLS}, 1fr)` }}>
        {cells.map(([r, c]) => (
          <button
            key={`${r},${c}`}
            className={'cm-symmetry-cell' + (filled[`${r},${c}`] ? ' filled' : '')}
            onClick={() => toggle(r, c)}
          />
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={() => patch('symmetry', { filled: {} })}>Очистити</button>
      </div>
    </div>
  )
}

function BalanceTab({ state, patch }) {
  const items = state.balance.items
  const result = calcBalance(items)
  function update(id, partial) {
    patch('balance', { items: items.map((it) => (it.id === id ? { ...it, ...partial } : it)) })
  }
  function remove(id) {
    patch('balance', { items: items.filter((it) => it.id !== id) })
  }
  function add() {
    patch('balance', { items: [...items, { id: nextId(), x: 0, weight: 0.5 }] })
  }
  return (
    <div>
      <p className="cl-tab-desc">Візуальна вага — не фізична маса, а "привертання уваги": розмір, колір, контраст. Велике й маленьке можна зрівноважити, розставивши по різні боки від центру.</p>
      <HelpBox>
        <p>Крутний момент (torque) = позиція × вага, як важіль. Якщо сума моментів зліва й справа від центру майже рівна — композиція відчувається збалансованою.</p>
        <p>"Вага" в дизайні — не розмір сам по собі: яскраво-червона маленька кнопка може переважити велику бліду сіру форму, бо контраст і насиченість кольору теж притягують увагу. Асиметричний баланс (маленький яскравий елемент справа врівноважує великий тьмяний зліва) часто виглядає цікавіше за симетричний — тому досвідчені дизайнери свідомо грають вагою, а не лише розміром.</p>
        <p>Елементи ближче до країв важать більше за ту саму вагу, ніж елементи ближче до центру — так само, як на фізичних терезах довше плече важеля дає більший момент при тій самій масі. Тому маленький елемент у самому кутку макета іноді врівноважує набагато більший елемент, розташований ближче до центру.</p>
      </HelpBox>

      <div className="cl-tags">
        <span className={'cl-badge ' + (result.balanced ? 'pass' : 'fail')}>
          {result.balanced ? '✓ Збалансовано' : `Нахил ${result.tiltDeg.toFixed(1)}°`}
        </span>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="cm-balance-stage">
        <div className="cm-balance-beam" style={{ transform: `rotate(${result.tiltDeg}deg)` }}>
          {items.map((it) => (
            <div
              key={it.id}
              className="cm-balance-item"
              style={{
                left: `calc(50% + ${it.x * 45}%)`,
                width: 16 + it.weight * 40, height: 16 + it.weight * 40,
                background: it.x < 0 ? '#3E37E0' : it.x > 0 ? '#E0373E' : '#6B62FF',
              }}
            />
          ))}
        </div>
        <div className="cm-balance-fulcrum" />
      </div>

      <div className="cl-section-title">Елементи ({items.length})</div>
      <div className="l3d-object-list">
        {items.map((it) => (
          <div key={it.id} className="l3d-object-row" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Позиція</span>
            <input type="range" min={-1} max={1} step={0.05} value={it.x} onChange={(e) => update(it.id, { x: parseFloat(e.target.value) })} style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Вага</span>
            <input type="range" min={0.1} max={1} step={0.05} value={it.weight} onChange={(e) => update(it.id, { weight: parseFloat(e.target.value) })} style={{ flex: 1 }} />
            <button className="cl-mini-btn" onClick={() => remove(it.id)} title="Видалити">✕</button>
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={add}>+ Додати елемент</button>
      </div>
    </div>
  )
}

function NegativeSpaceTab({ state, patch }) {
  const { padding } = state.negspace
  const { spaceRatio, rating } = negativeSpaceRatio(padding)
  const info = NEGATIVE_SPACE_LABELS[rating]
  return (
    <div>
      <p className="cl-tab-desc">Негативний простір — порожнеча навколо й між елементами. Це не "невикористаний" простір, а повноцінний інструмент композиції.</p>
      <HelpBox>
        <p>Недосвідчені макети часто страждають від протилежної крайності — страху порожнечі: кожен вільний піксель заповнюють ще одним елементом "про всяк випадок". Але саме порожній простір навколо заголовка чи кнопки робить їх помітнішими — це той самий принцип контрасту, тільки контраст не кольору, а щільності.</p>
        <p>Negative space буває макро (велике поле навколо всього блоку — як у цьому демо) і мікро (відстань між рядками тексту, між іконкою й підписом). Обидва рівні впливають на відчуття "охайності" інтерфейсу однаково сильно — часто саме мікро-простір найлегше випадково зламати, стиснувши елементи занадто щільно.</p>
        <p>Відомий прийом — "активний" негативний простір, коли сама форма порожнечі несе сенс (класичний приклад — логотип FedEx зі стрілкою, утвореною проміжком між літерами E і x). Це складніша техніка за просто "залишити більше повітря" — тут порожнеча навмисно утворює впізнавану фігуру.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Padding<input type="range" min={0} max={45} value={padding} onChange={(e) => patch('negspace', { padding: parseInt(e.target.value, 10) })} /><span>{padding}%</span></label></div>

      <div className="cl-tags" style={{ marginTop: 10 }}>
        <span className="cl-badge">{(spaceRatio * 100).toFixed(0)}% негативного простору</span>
        <span className={'cl-badge ' + (rating === 'balanced' ? 'pass' : '')}>{info.label}</span>
      </div>
      <p className="cl-tab-desc">{info.hint}</p>

      <div className="cl-section-title">Превʼю</div>
      <div className="cm-negspace-stage">
        <div className="cm-negspace-content" style={{ inset: `${padding}%` }} />
      </div>
    </div>
  )
}

function ProximityTab({ state, patch }) {
  const { total, perGroup, groupGap, itemGap } = state.proximity
  const groups = groupByProximity(total, perGroup)
  return (
    <div>
      <p className="cl-tab-desc">Закон близькості (Gestalt proximity) — елементи, розташовані ближче один до одного, мозок автоматично сприймає як одну групу, навіть без рамки чи фону.</p>
      <HelpBox>
        <p>Нижче — однакові квадратики без жодних кольорів чи ліній, що їх розділяють. Єдина відмінність — відстань: проміжок між групами більший за проміжок між сусідніми елементами всередині групи. Саме цієї різниці достатньо, щоб око "побачило" групи.</p>
        <p>Це найпрактичніший принцип Gestalt для веброзробки: відступи у формі (label впритул до свого input, але з помітним проміжком до наступного поля) — це закон близькості в чистому вигляді. Якщо відступи всередині групи й між групами однакові, форма "розсипається" — користувач не одразу зчитує, яке поле до якого підпису належить.</p>
        <p>Та сама логіка працює у навігаційному меню (пункти однієї секції ближче один до одного, ніж до пунктів іншої секції) і в картках товарів (ціна ближче до назви товару, ніж до кнопки "Купити" під нею, навіть якщо обидва елементи мають однаковий шрифт).</p>
      </HelpBox>

      <div className="cl-editrow"><label>Кількість елементів<input type="range" min={4} max={24} value={total} onChange={(e) => patch('proximity', { total: parseInt(e.target.value, 10) })} /><span>{total}</span></label></div>
      <div className="cl-editrow"><label>Елементів у групі<input type="range" min={2} max={8} value={perGroup} onChange={(e) => patch('proximity', { perGroup: parseInt(e.target.value, 10) })} /><span>{perGroup}</span></label></div>
      <div className="cl-editrow"><label>Відстань у групі<input type="range" min={2} max={20} value={itemGap} onChange={(e) => patch('proximity', { itemGap: parseInt(e.target.value, 10) })} /><span>{itemGap}px</span></label></div>
      <div className="cl-editrow"><label>Відстань між групами<input type="range" min={itemGap} max={60} value={groupGap} onChange={(e) => patch('proximity', { groupGap: parseInt(e.target.value, 10) })} /><span>{groupGap}px</span></label></div>

      <div className="cl-section-title">Превʼю</div>
      <div className="cm-proximity-stage" style={{ display: 'flex', flexWrap: 'wrap', gap: groupGap }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ display: 'flex', gap: itemGap }}>
            {g.map((idx) => <div key={idx} className="cm-proximity-item" />)}
          </div>
        ))}
      </div>
      {groupGap <= itemGap && <p className="cl-tab-desc" style={{ color: 'var(--coral)' }}>⚠ Відстань між групами має бути більшою за відстань у групі — інакше групування не читається.</p>}
    </div>
  )
}

function defaultState() {
  return {
    thirds: { marker: null },
    golden: { showGrid: true, showSpiral: true, turns: 2.5, flipX: false, flipY: false },
    symmetry: { axis: 'vertical', filled: {} },
    balance: { items: [{ id: nextId(), x: -0.6, weight: 0.5 }, { id: nextId(), x: 0.4, weight: 0.8 }] },
    negspace: { padding: 10 },
    proximity: { total: 12, perGroup: 4, groupGap: 28, itemGap: 6 },
  }
}

export default function CompositionLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('thirds')
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
    pushRecentLab('composition')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Composition Lab"
      subtitle="Правило третин, золотий перетин, симетрія, візуальний баланс, негативний простір і групування за близькістю — інтерактивно."
      icon="🧠"
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
          {tab === 'thirds' && <ThirdsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'golden' && <GoldenTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'symmetry' && <SymmetryTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'balance' && <BalanceTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'negspace' && <NegativeSpaceTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'proximity' && <ProximityTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
