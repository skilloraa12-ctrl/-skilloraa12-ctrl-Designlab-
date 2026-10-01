import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { SECTION_TYPES, FIELD_TYPES, PAGE_TEMPLATES, moveItem } from './labs/wireframeBuilder.js'

const TABS = [
  { key: 'sections', icon: '📑', label: 'Секції' },
  { key: 'forms', icon: '📝', label: 'Форми' },
  { key: 'cards', icon: '🗂️', label: 'Картки' },
  { key: 'templates', icon: '📋', label: 'Шаблони' },
  { key: 'annotate', icon: '📌', label: 'Анотації' },
]

let idCounter = 1
function nextId() { return idCounter++ }

function HelpBox({ children }) {
  return (
    <details className="cl-help">
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

function BlockList({ items, catalog, onMove, onRemove }) {
  return (
    <div className="l3d-object-list">
      {items.map((it, i) => {
        const def = catalog.find((c) => c.key === it.type)
        return (
          <div key={it.id} className="l3d-object-row">
            <span style={{ width: 22, textAlign: 'center' }}>{def?.icon}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{def?.label}</span>
            <button className="cl-mini-btn" disabled={i === 0} onClick={() => onMove(i, -1)} title="Вгору">↑</button>
            <button className="cl-mini-btn" disabled={i === items.length - 1} onClick={() => onMove(i, 1)} title="Вниз">↓</button>
            <button className="cl-mini-btn" onClick={() => onRemove(it.id)} title="Видалити">✕</button>
          </div>
        )
      })}
      {items.length === 0 && <p className="cl-tab-desc">Список порожній — додайте блок із палітри вище.</p>}
    </div>
  )
}

function SectionsTab({ state, patch, toastApi }) {
  const items = state.sections.items
  function add(type) {
    if (items.length >= 12) { toastApi.show('Максимум 12 блоків'); return }
    patch('sections', { items: [...items, { id: nextId(), type }] })
  }
  function move(i, dir) { patch('sections', { items: moveItem(items, i, dir) }) }
  function remove(id) { patch('sections', { items: items.filter((it) => it.id !== id) }) }
  return (
    <div>
      <p className="cl-tab-desc">Складіть каркас сторінки з типових блоків — заголовок, hero, контент, футер.</p>
      <HelpBox>
        <p>Вайрфрейм навмисно без кольорів і реального тексту — це інструмент для структури та пропорцій макета, а не фінального дизайну.</p>
        <p>Саме ця "сірість" — головна перевага на ранньому етапі: стейкхолдери обговорюють розташування й ієрархію блоків, а не сперечаються про відтінок синього чи шрифт. Покажіть кольоровий макет замість вайрфрейму на нараді з обговорення структури — і 90% фідбеку буде про колір, хоча питання стояло про те, чи потрібен взагалі блок "Відгуки" на головній.</p>
      </HelpBox>

      <div className="cl-section-title">Палітра блоків</div>
      <div className="cl-btn-row">
        {SECTION_TYPES.map((t) => <button key={t.key} className="harmony-btn" onClick={() => add(t.key)}>{t.icon} {t.label}</button>)}
      </div>

      <div className="cl-section-title">Список ({items.length})</div>
      <BlockList items={items} catalog={SECTION_TYPES} onMove={move} onRemove={remove} />

      <div className="cl-section-title">Превʼю</div>
      <div className="wf-stack">
        {items.map((it) => {
          const def = SECTION_TYPES.find((c) => c.key === it.type)
          return <div key={it.id} className="wf-block" style={{ height: def.heightPx }}>{def.icon} {def.label}</div>
        })}
        {items.length === 0 && <div className="wf-block" style={{ height: 60 }}>Порожньо</div>}
      </div>
    </div>
  )
}

function FormsTab({ state, patch, toastApi }) {
  const fields = state.forms.fields
  function add(type) {
    if (fields.length >= 12) { toastApi.show('Максимум 12 полів'); return }
    const def = FIELD_TYPES.find((f) => f.key === type)
    patch('forms', { fields: [...fields, { id: nextId(), type, label: def.label }] })
  }
  function move(i, dir) { patch('forms', { fields: moveItem(fields, i, dir) }) }
  function remove(id) { patch('forms', { fields: fields.filter((f) => f.id !== id) }) }
  return (
    <div>
      <p className="cl-tab-desc">Зберіть каркас форми з полів потрібного типу — зручно для швидкого прототипу реєстрації, чекауту чи налаштувань.</p>
      <HelpBox>
        <p>Порядок полів у списку визначає порядок у формі (і природний tab-order для клавіатурної навігації) — тому стрілки вгору/вниз тут важливі, не косметичні.</p>
        <p>Хороше правило для довгих форм: групуйте споріднені поля (ім'я + прізвище, місто + індекс) поруч і розташовуйте найлегші поля першими — користувач, що вже почав заповнювати форму, рідше кидає її на півдорозі, ніж той, хто побачив довгий список одразу. Кнопка дії завжди йде останньою в списку — це теж частина каркаса, не деталь фінального дизайну.</p>
      </HelpBox>

      <div className="cl-section-title">Палітра полів</div>
      <div className="cl-btn-row">
        {FIELD_TYPES.map((t) => <button key={t.key} className="harmony-btn" onClick={() => add(t.key)}>{t.icon} {t.label}</button>)}
      </div>

      <div className="cl-section-title">Список ({fields.length})</div>
      <BlockList items={fields} catalog={FIELD_TYPES} onMove={move} onRemove={remove} />

      <div className="cl-section-title">Превʼю</div>
      <div className="wf-stack">
        {fields.map((f) => (
          <div key={f.id} className="wf-field">
            {f.type !== 'button' && f.type !== 'checkbox' && f.type !== 'radio' && <span className="wf-field-label">{f.label}</span>}
            {f.type === 'textarea' && <div className="wf-field-box tall" />}
            {f.type === 'text' && <div className="wf-field-box" />}
            {f.type === 'select' && <div className="wf-field-box" />}
            {f.type === 'checkbox' && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="wf-field-box" style={{ width: 20, height: 20 }} /><span className="wf-field-label">{f.label}</span></div>}
            {f.type === 'radio' && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="wf-field-box" style={{ width: 20, height: 20, borderRadius: '50%' }} /><span className="wf-field-label">{f.label}</span></div>}
            {f.type === 'button' && <div className="wf-field-box button">{f.label}</div>}
          </div>
        ))}
        {fields.length === 0 && <div className="wf-block" style={{ height: 60 }}>Порожньо</div>}
      </div>
    </div>
  )
}

function CardsTab({ state, patch }) {
  const cfg = state.cards
  const cards = Array.from({ length: cfg.count })
  return (
    <div>
      <p className="cl-tab-desc">Сітка карток — типовий блок для списку товарів, статей чи профілів.</p>
      <HelpBox>
        <p>Увімкніть/вимкніть окремі елементи картки, щоб перевірити, як сітка виглядає з різним набором контенту (наприклад, без зображення для текстових карток).</p>
        <p>Завжди перевіряйте сітку з "найгіршим" реалістичним контентом, а не ідеальним прикладом: заголовок на два рядки замість одного, відсутнє зображення, довша ціна. Макет, що тримає форму лише з акуратними тестовими даними, ламається в продакшні, де довжина заголовка товару чи статті ніким не контролюється.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Колонок<input type="range" min={1} max={4} value={cfg.cols} onChange={(e) => patch('cards', { cols: parseInt(e.target.value, 10) })} /><span>{cfg.cols}</span></label></div>
      <div className="cl-editrow"><label>Карток<input type="range" min={1} max={8} value={cfg.count} onChange={(e) => patch('cards', { count: parseInt(e.target.value, 10) })} /><span>{cfg.count}</span></label></div>

      <div className="cl-btn-row">
        <button className={'harmony-btn' + (cfg.showImage ? ' active' : '')} onClick={() => patch('cards', { showImage: !cfg.showImage })}>Зображення</button>
        <button className={'harmony-btn' + (cfg.showTitle ? ' active' : '')} onClick={() => patch('cards', { showTitle: !cfg.showTitle })}>Заголовок</button>
        <button className={'harmony-btn' + (cfg.showText ? ' active' : '')} onClick={() => patch('cards', { showText: !cfg.showText })}>Текст</button>
        <button className={'harmony-btn' + (cfg.showButton ? ' active' : '')} onClick={() => patch('cards', { showButton: !cfg.showButton })}>Кнопка</button>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="wf-cards-grid" style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)` }}>
        {cards.map((_, i) => (
          <div key={i} className="wf-card">
            {cfg.showImage && <div className="wf-card-image" />}
            {cfg.showTitle && <div className="wf-card-line" />}
            {cfg.showText && (<><div className="wf-card-line" /><div className="wf-card-line short" /></>)}
            {cfg.showButton && <div className="wf-card-button" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function TemplatesTab({ patch, setTab, toastApi }) {
  return (
    <div>
      <p className="cl-tab-desc">Готові каркаси типових сторінок — застосуйте й доопрацюйте на вкладці "Секції".</p>
      <HelpBox>
        <p>Шаблон замінює поточний список секцій — це швидкий старт, а не остаточне рішення. Після застосування перейдіть на вкладку "Секції" й приберіть зайве чи додайте специфічне для вашого проєкту (наприклад, банер з акцією над hero-блоком).</p>
      </HelpBox>
      <div className="l3d-template-grid">
        {PAGE_TEMPLATES.map((t) => (
          <button
            key={t.key}
            className="l3d-template-card"
            onClick={() => {
              patch('sections', { items: t.sections.map((key) => ({ id: nextId(), type: key })) })
              toastApi.show(`✓ Застосовано «${t.label}»`)
              setTab('sections')
            }}
          >
            <span className="l3d-template-icon">{t.icon}</span>
            <span className="l3d-template-label">{t.label}</span>
            <span className="l3d-template-count">{t.sections.length} блоків</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function AnnotateTab({ state, patch, toastApi }) {
  const items = state.sections.items
  const notes = state.annotate.notes
  function addNote(e) {
    if (notes.length >= 20) { toastApi.show('Максимум 20 анотацій'); return }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    patch('annotate', { notes: [...notes, { id: nextId(), x, y, text: '' }] })
  }
  function updateNote(id, text) {
    patch('annotate', { notes: notes.map((n) => (n.id === id ? { ...n, text } : n)) })
  }
  function removeNote(id) {
    patch('annotate', { notes: notes.filter((n) => n.id !== id) })
  }
  return (
    <div>
      <p className="cl-tab-desc">Клікніть по каркасу нижче, щоб залишити нумеровану анотацію — нотатку для розробника чи колеги про те, як саме має працювати цей блок.</p>
      <HelpBox>
        <p>Анотації — стандартна практика передачі (handoff) макета в розробку: вайрфрейм показує ЩО й ДЕ, а анотації пояснюють ЯК саме це має поводитись — що відбувається при кліку, які дані підвантажуються, яка поведінка на мобільному. Без цього розробник змушений вгадувати або переривати роботу купою уточнювальних питань.</p>
        <p>Хороша анотація конкретна й перевірювана: не "зробити гарну анімацію", а "картка підіймається на 4px і зʼявляється тінь за 150мс при наведенні". Анотації тут прив'язані до каркаса з вкладки "Секції" — додайте спочатку потрібні блоки там, а повернувшись сюди, розставте нотатки по готовій структурі.</p>
      </HelpBox>

      <div className="cl-section-title">Каркас — клікніть, щоб додати анотацію</div>
      <div className="wf-annotate-stage" onClick={addNote}>
        {items.map((it) => {
          const def = SECTION_TYPES.find((c) => c.key === it.type)
          return <div key={it.id} className="wf-block" style={{ height: def.heightPx }}>{def.icon} {def.label}</div>
        })}
        {items.length === 0 && <div className="wf-block" style={{ height: 60 }}>Порожньо — додайте секції на вкладці "Секції"</div>}
        {notes.map((n, i) => (
          <div key={n.id} className="wf-pin" style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }} onClick={(e) => e.stopPropagation()}>{i + 1}</div>
        ))}
      </div>

      <div className="cl-section-title">Нотатки ({notes.length})</div>
      {notes.length === 0 ? (
        <p className="cl-tab-desc">Клікніть по каркасу вище, щоб додати першу анотацію.</p>
      ) : (
        <div className="l3d-object-list">
          {notes.map((n, i) => (
            <div key={n.id} className="l3d-object-row" style={{ flexWrap: 'wrap' }}>
              <span style={{ width: 20, textAlign: 'center', fontWeight: 700, color: 'var(--accent)' }}>{i + 1}</span>
              <input
                className="cl-text-input"
                style={{ flex: 1 }}
                placeholder="Що тут має відбуватись?"
                value={n.text}
                onChange={(e) => updateNote(n.id, e.target.value)}
              />
              <button className="cl-mini-btn" onClick={() => removeNote(n.id)} title="Видалити">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function defaultState() {
  return {
    sections: { items: [{ id: nextId(), type: 'header' }, { id: nextId(), type: 'hero' }, { id: nextId(), type: 'content' }, { id: nextId(), type: 'footer' }] },
    forms: { fields: [{ id: nextId(), type: 'text', label: 'Текстове поле' }, { id: nextId(), type: 'text', label: 'Текстове поле' }, { id: nextId(), type: 'button', label: 'Кнопка' }] },
    cards: { cols: 3, count: 3, showImage: true, showTitle: true, showText: true, showButton: true },
    annotate: { notes: [] },
  }
}

export default function WireframeLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('sections')
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
    pushRecentLab('wireframe')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Wireframe Lab"
      subtitle="Швидкі каркаси інтерфейсу: секції сторінки, форми, сітки карток, готові шаблони й анотації для розробника."
      icon="🧭"
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
          {tab === 'sections' && <SectionsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'forms' && <FormsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'cards' && <CardsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'templates' && <TemplatesTab state={state} patch={patch} setTab={setTab} toastApi={toastApi} />}
          {tab === 'annotate' && <AnnotateTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
