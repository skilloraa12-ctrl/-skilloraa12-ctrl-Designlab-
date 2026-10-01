import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import {
  TARGET_MIN_AA, TARGET_MIN_AAA, checkTargetSize,
  validateHeadings, validateAlt, checkFlashSafety, CHECKLIST_ITEMS,
} from './labs/a11yAudit.js'

const TABS = [
  { key: 'target', icon: '👆', label: 'Розмір цілей' },
  { key: 'headings', icon: '🔠', label: 'Заголовки' },
  { key: 'alt', icon: '🖼️', label: 'Alt-текст' },
  { key: 'labels', icon: '🏷️', label: 'Підписи форм' },
  { key: 'motion', icon: '⚡', label: 'Мигання' },
  { key: 'checklist', icon: '✅', label: 'Чекліст' },
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

function IssueList({ issues, okMessage }) {
  if (issues.length === 0) return <p className="a11y-ok">✓ {okMessage}</p>
  return (
    <ul className="a11y-issue-list">
      {issues.map((msg, i) => <li key={i} className="a11y-issue">⚠ {msg}</li>)}
    </ul>
  )
}

function TargetTab({ state, patch }) {
  const { width, height } = state.target
  const result = checkTargetSize(width, height)
  return (
    <div>
      <p className="cl-tab-desc">Інтерактивні елементи (кнопки, іконки, посилання) мають бути досить великими, щоб у них можна було влучити пальцем на тачскріні.</p>
      <HelpBox>
        <p>WCAG 2.5.8 (AA) вимагає мінімум 24×24px, WCAG 2.5.5 (AAA) рекомендує 44×44px. Виняток — коли елемент вбудований у текст або має еквівалент більшого розміру поруч.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Ширина<input type="range" min={8} max={64} value={width} onChange={(e) => patch('target', { width: parseInt(e.target.value, 10) })} /><span>{width}px</span></label></div>
      <div className="cl-editrow"><label>Висота<input type="range" min={8} max={64} value={height} onChange={(e) => patch('target', { height: parseInt(e.target.value, 10) })} /><span>{height}px</span></label></div>

      <div className="cl-tags" style={{ marginTop: 10 }}>
        <span className={'cl-badge ' + (result.passAA ? 'pass' : 'fail')}>{result.passAA ? '✓' : '✕'} AA (24px)</span>
        <span className={'cl-badge ' + (result.passAAA ? 'pass' : 'fail')}>{result.passAAA ? '✓' : '✕'} AAA (44px)</span>
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="a11y-target-stage">
        <div className="a11y-target-min-outline" style={{ width: TARGET_MIN_AAA, height: TARGET_MIN_AAA }}>
          <div className="a11y-target-box" style={{ width, height }} />
        </div>
      </div>
      <p className="cl-tab-desc">Пунктир — рекомендований мінімум 44×44px (AAA) для порівняння з розміром вашого елемента.</p>
    </div>
  )
}

function HeadingsTab({ state, patch, toastApi }) {
  const items = state.headings.items
  const issues = validateHeadings(items.map((it) => it.level))
  function setLevel(id, level) {
    patch('headings', { items: items.map((it) => (it.id === id ? { ...it, level } : it)) })
  }
  function remove(id) {
    patch('headings', { items: items.filter((it) => it.id !== id) })
  }
  function add() {
    patch('headings', { items: [...items, { id: nextId(), level: 2 }] })
  }
  return (
    <div>
      <p className="cl-tab-desc">Побудуйте план заголовків сторінки — лаба перевірить, чи немає пропущених рівнів і чи є рівно один H1.</p>
      <HelpBox>
        <p>Заголовки формують структуру, якою скрінрідери дають користувачам "перестрибувати" по сторінці. Якщо після H2 одразу йде H4, людина, що навігує по заголовках, не зрозуміє, що пропущено H3.</p>
      </HelpBox>

      <div className="a11y-heading-list">
        {items.map((it) => (
          <div key={it.id} className="a11y-heading-row" style={{ paddingLeft: (it.level - 1) * 16 }}>
            <select className="rt-select" value={it.level} onChange={(e) => setLevel(it.id, parseInt(e.target.value, 10))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>H{n}</option>)}
            </select>
            <span className="a11y-heading-sample">Заголовок рівня {it.level}</span>
            <button className="cl-mini-btn" onClick={() => remove(it.id)} title="Видалити">✕</button>
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={add}>+ Додати заголовок</button>
      </div>

      <div className="cl-section-title">Результат перевірки</div>
      <IssueList issues={issues.map((i) => i.message)} okMessage="Ієрархія заголовків коректна" />
    </div>
  )
}

function AltTab({ state, patch }) {
  const images = state.alt.images
  function update(id, partial) {
    patch('alt', { images: images.map((img) => (img.id === id ? { ...img, ...partial } : img)) })
  }
  function remove(id) {
    patch('alt', { images: images.filter((img) => img.id !== id) })
  }
  function add() {
    patch('alt', { images: [...images, { id: nextId(), type: 'informative', alt: '' }] })
  }
  return (
    <div>
      <p className="cl-tab-desc">Для кожного зображення вкажіть тип і alt-текст — лаба підкаже, чи він коректний.</p>
      <HelpBox>
        <p>Декоративні зображення (орнаменти, іконки-прикраси) повинні мати <code>alt=""</code>, щоб скрінрідер їх пропускав. Інформативні — повинні мати опис того, що на зображенні, а не його назву файлу чи слово "картинка".</p>
      </HelpBox>

      <div className="a11y-heading-list">
        {images.map((img) => {
          const issues = validateAlt(img)
          return (
            <div key={img.id} className="a11y-image-row">
              <div className="cl-picker-top">
                <button className={'harmony-btn' + (img.type === 'informative' ? ' active' : '')} onClick={() => update(img.id, { type: 'informative' })}>Інформативне</button>
                <button className={'harmony-btn' + (img.type === 'decorative' ? ' active' : '')} onClick={() => update(img.id, { type: 'decorative' })}>Декоративне</button>
                <button className="cl-mini-btn" onClick={() => remove(img.id)} title="Видалити">✕</button>
              </div>
              {img.type === 'informative' && (
                <input className="cp-input-el" style={{ width: '100%', marginTop: 6 }} placeholder="alt=&quot;...&quot;" value={img.alt} onChange={(e) => update(img.id, { alt: e.target.value })} />
              )}
              <IssueList issues={issues} okMessage={img.type === 'decorative' ? 'alt="" — коректно' : 'alt-текст коректний'} />
            </div>
          )
        })}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={add}>+ Додати зображення</button>
      </div>
    </div>
  )
}

function LabelsTab({ state, patch }) {
  const fields = state.labels.fields
  function toggle(id) {
    patch('labels', { fields: fields.map((f) => (f.id === id ? { ...f, hasLabel: !f.hasLabel } : f)) })
  }
  return (
    <div>
      <p className="cl-tab-desc">Поле вводу без справжнього <code>&lt;label&gt;</code> виглядає нормально, доки в ньому немає тексту, — а для скрінрідера воно залишається безіменним назавжди.</p>
      <HelpBox>
        <p>Placeholder — не заміна label: він зникає під час вводу і не завжди озвучується скрінрідерами так само надійно. Кожне поле повинно мати <code>&lt;label for="..."&gt;</code> або <code>aria-label</code>.</p>
      </HelpBox>

      <div className="a11y-heading-list">
        {fields.map((f) => (
          <div key={f.id} className="a11y-field-row">
            <div className="a11y-field-preview">
              {f.hasLabel && <label className="a11y-field-label">{f.name}</label>}
              <input className="cp-input-el" placeholder={f.hasLabel ? '' : f.name} readOnly />
            </div>
            <button className={'harmony-btn' + (f.hasLabel ? ' active' : '')} onClick={() => toggle(f.id)}>
              {f.hasLabel ? '✓ Є label' : '✕ Немає label'}
            </button>
          </div>
        ))}
      </div>

      <div className="cl-section-title">Результат</div>
      <IssueList
        issues={fields.filter((f) => !f.hasLabel).map((f) => `Поле «${f.name}» не має <label> — додайте підпис`)}
        okMessage="Усі поля мають підписи"
      />
    </div>
  )
}

function MotionTab({ state, patch }) {
  const { hz } = state.motion
  const [running, setRunning] = useState(false)
  const [lit, setLit] = useState(false)
  const intervalRef = useRef(null)
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (running && !prefersReduced) {
      intervalRef.current = setInterval(() => setLit((v) => !v), 500 / hz)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, hz])

  const result = checkFlashSafety(hz)

  return (
    <div>
      <p className="cl-tab-desc">Елементи, що швидко мигають, можуть провокувати напади в людей з фотосенситивною епілепсією.</p>
      <HelpBox>
        <p>WCAG 2.3.1 забороняє контент, що мигає частіше за 3 рази за секунду (загальний поріг спалаху). Демо нижче навмисно обмежене 5 Гц і приглушеними кольорами — для безпеки.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Частота<input type="range" min={1} max={5} step={0.5} value={hz} onChange={(e) => patch('motion', { hz: parseFloat(e.target.value) })} /><span>{hz} Гц</span></label></div>

      <div className="cl-tags" style={{ marginTop: 10 }}>
        <span className={'cl-badge ' + (result.safe ? 'pass' : 'fail')}>{result.safe ? '✓' : '✕'} {result.message}</span>
      </div>

      <div className="cl-section-title">Превʼю (помʼякшені кольори, обмежена частота)</div>
      {prefersReduced ? (
        <p className="cl-tab-desc">Ваша система має увімкнено "менше анімації" (prefers-reduced-motion) — демо не відтворюється, це очікувана й правильна поведінка.</p>
      ) : (
        <>
          <div className="a11y-motion-stage">
            <div className="a11y-motion-box" style={{ background: lit ? '#C9C2FF' : '#EDEDF0' }} />
          </div>
          <div className="cl-picker-top">
            <button className="harmony-btn" onClick={() => setRunning((r) => !r)}>{running ? '⏸ Зупинити демо' : '▶ Запустити демо'}</button>
          </div>
        </>
      )}
    </div>
  )
}

function ChecklistTab({ state, patch }) {
  const checked = state.checklist.checked
  const groups = [...new Set(CHECKLIST_ITEMS.map((i) => i.group))]
  const total = CHECKLIST_ITEMS.length
  const doneCount = Object.values(checked).filter(Boolean).length
  function toggle(id) {
    patch('checklist', { checked: { ...checked, [id]: !checked[id] } })
  }
  return (
    <div>
      <p className="cl-tab-desc">Швидкий чекліст базових вимог доступності — пройдіться перед релізом інтерфейсу.</p>

      <div className="a11y-progress-track"><div className="a11y-progress-fill" style={{ width: `${(doneCount / total) * 100}%` }} /></div>
      <p className="cl-tab-desc">{doneCount} / {total} виконано</p>

      {groups.map((g) => (
        <div key={g}>
          <div className="cl-section-title">{g}</div>
          <div className="a11y-checklist-group">
            {CHECKLIST_ITEMS.filter((i) => i.group === g).map((item) => (
              <label key={item.id} className="a11y-checklist-item">
                <input type="checkbox" checked={!!checked[item.id]} onChange={() => toggle(item.id)} />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function defaultState() {
  return {
    target: { width: 32, height: 32 },
    headings: { items: [{ id: nextId(), level: 1 }, { id: nextId(), level: 2 }, { id: nextId(), level: 3 }, { id: nextId(), level: 2 }] },
    alt: { images: [{ id: nextId(), type: 'informative', alt: '' }, { id: nextId(), type: 'decorative', alt: '' }] },
    labels: { fields: [{ id: nextId(), name: 'Email', hasLabel: true }, { id: nextId(), name: 'Пароль', hasLabel: false }] },
    motion: { hz: 2 },
    checklist: { checked: {} },
  }
}

export default function AccessibilityLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('target')
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
    pushRecentLab('accessibility')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Accessibility Lab"
      subtitle="Перевірка інтерфейсу: розмір цілей, ієрархія заголовків, alt-текст, підписи форм, безпека мигання й загальний чекліст."
      icon="🔓"
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
          {tab === 'target' && <TargetTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'headings' && <HeadingsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'alt' && <AltTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'labels' && <LabelsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'motion' && <MotionTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'checklist' && <ChecklistTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
