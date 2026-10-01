import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import {
  BUTTON_SIZES, BUTTON_STATES, buttonStyle, buttonCss,
  INPUT_STATES, inputStyle, inputCss,
  TOGGLE_STATES, toggleStyle, toggleCss,
  BADGE_VARIANTS, badgeStyle, badgeCss,
  CARD_STATES, cardStyle, cardCss,
  CHECK_STATES, checkboxStyle, checkboxCss, radioStyle, radioCss,
} from './labs/componentBuilder.js'

const TABS = [
  { key: 'button', icon: '🔘', label: 'Кнопка' },
  { key: 'input', icon: '⌨️', label: 'Поле вводу' },
  { key: 'toggle', icon: '🎚️', label: 'Перемикач' },
  { key: 'badge', icon: '🏷️', label: 'Бейдж' },
  { key: 'card', icon: '🗂️', label: 'Картка' },
  { key: 'check', icon: '☑️', label: 'Чекбокс/Радіо' },
]

const STATE_LABELS = {
  default: 'Звичайний', hover: 'Наведення', focus: 'Фокус', active: 'Натиснутий',
  disabled: 'Вимкнений', filled: 'Заповнений', off: 'Вимкнено', on: 'Увімкнено', checked: 'Вибрано',
}

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

function StateCell({ label, children }) {
  return (
    <div className="cp-state-cell">
      <div className="cp-state-stage">{children}</div>
      <div className="cp-state-label">{label}</div>
    </div>
  )
}

function CssOut({ css, toastApi }) {
  return (
    <div>
      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function ButtonTab({ state, patch, toastApi }) {
  const cfg = state.button
  const css = buttonCss(cfg)
  return (
    <div>
      <p className="cl-tab-desc">Кнопка в усіх станах одразу — звичайний вигляд, наведення, фокус (клавіатурна навігація), натискання й вимкнений стан.</p>
      <HelpBox>
        <p>Кожен стан — окремий CSS-селектор (<code>:hover</code>, <code>:focus-visible</code>, <code>:active</code>, <code>:disabled</code>), який браузер застосовує автоматично. Тут вони показані поруч, щоб відразу бачити всі варіанти.</p>
        <p>Важливо: <code>:focus-visible</code>, а не просто <code>:focus</code> — перший показує кільце фокусу лише при навігації клавіатурою (Tab), а не при звичайному кліку мишею. Це усуває стару скаргу дизайнерів "чому рамка зʼявляється при кліку" й водночас зберігає доступність для клавіатурних користувачів.</p>
      </HelpBox>

      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={cfg.bg} onChange={(e) => patch('button', { bg: e.target.value })} />
        <input className="cl-hex-input" value={cfg.bg} onChange={(e) => patch('button', { bg: e.target.value })} />
      </div>
      <div className="cl-editrow"><label>Радіус<input type="range" min={0} max={30} value={cfg.radius} onChange={(e) => patch('button', { radius: parseInt(e.target.value, 10) })} /><span>{cfg.radius}px</span></label></div>
      <div className="cl-section-title">Розмір</div>
      <div className="cl-btn-row">
        {Object.keys(BUTTON_SIZES).map((s) => (
          <button key={s} className={'harmony-btn' + (cfg.size === s ? ' active' : '')} onClick={() => patch('button', { size: s })}>{s.toUpperCase()}</button>
        ))}
      </div>

      <div className="cl-section-title">Усі стани</div>
      <div className="cp-state-grid">
        {BUTTON_STATES.map((s) => (
          <StateCell key={s} label={STATE_LABELS[s]}>
            <button style={buttonStyle(cfg, s)} disabled={s === 'disabled'}>Кнопка</button>
          </StateCell>
        ))}
      </div>

      <CssOut css={css} toastApi={toastApi} />
    </div>
  )
}

function InputTab({ state, patch, toastApi }) {
  const cfg = state.input
  const css = inputCss(cfg)
  return (
    <div>
      <p className="cl-tab-desc">Текстове поле: звичайний стан, наведення, фокус (з кільцем акцентного кольору), заповнене значенням і вимкнене.</p>
      <HelpBox>
        <p>Focus ring — акцентна рамка навколо поля при фокусі — критично важлива для доступності: вона показує, який елемент активний при навігації клавіатурою (Tab).</p>
        <p>Стан "Заповнений" (filled) навмисно показаний окремо від "Звичайного": порожнє поле з плейсхолдером і поле з реальним значенням мають виглядати по-різному (тут — темніша рамка), інакше користувач не завжди зрозуміє, чи він вже щось ввів, особливо при швидкому скролі довгої форми.</p>
      </HelpBox>

      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Акцент</span>
        <input type="color" className="cl-swatch-input" value={cfg.accent} onChange={(e) => patch('input', { accent: e.target.value })} />
        <input className="cl-hex-input" value={cfg.accent} onChange={(e) => patch('input', { accent: e.target.value })} />
      </div>
      <div className="cl-editrow"><label>Радіус<input type="range" min={0} max={20} value={cfg.radius} onChange={(e) => patch('input', { radius: parseInt(e.target.value, 10) })} /><span>{cfg.radius}px</span></label></div>
      <div className="cl-editrow"><label>Товщина рамки<input type="range" min={1} max={4} value={cfg.borderWidth} onChange={(e) => patch('input', { borderWidth: parseInt(e.target.value, 10) })} /><span>{cfg.borderWidth}px</span></label></div>

      <div className="cl-section-title">Усі стани</div>
      <div className="cp-state-grid">
        {INPUT_STATES.map((s) => (
          <StateCell key={s} label={STATE_LABELS[s]}>
            <input
              className="cp-input-el"
              style={inputStyle(cfg, s)}
              placeholder="Текст..."
              value={s === 'filled' ? 'Готове значення' : ''}
              disabled={s === 'disabled'}
              readOnly
            />
          </StateCell>
        ))}
      </div>

      <CssOut css={css} toastApi={toastApi} />
    </div>
  )
}

function ToggleTab({ state, patch, toastApi }) {
  const cfg = state.toggle
  const css = toggleCss(cfg)
  return (
    <div>
      <p className="cl-tab-desc">Перемикач (switch) — альтернатива чекбоксу для миттєвих on/off-налаштувань.</p>
      <HelpBox>
        <p>Позиція кружечка (knob) кодує стан: зліва — вимкнено, справа — увімкнено. Колір доріжки змінюється разом з позицією, тому стан зрозумілий навіть без підпису.</p>
        <p>Перемикач проти чекбоксу: toggle підходить для налаштувань, які діють негайно (режим "темна тема", "сповіщення увімкнено") — дія застосовується в момент кліку. Чекбокс краще для форм, де вибір підтверджується окремою кнопкою "Зберегти" — toggle у формі зі збереженням уводить в оману, бо виглядає як миттєва дія.</p>
      </HelpBox>

      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Акцент</span>
        <input type="color" className="cl-swatch-input" value={cfg.accent} onChange={(e) => patch('toggle', { accent: e.target.value })} />
        <input className="cl-hex-input" value={cfg.accent} onChange={(e) => patch('toggle', { accent: e.target.value })} />
      </div>

      <div className="cl-section-title">Усі стани</div>
      <div className="cp-state-grid">
        {TOGGLE_STATES.map((s) => {
          const st = toggleStyle(cfg, s)
          return (
            <StateCell key={s} label={STATE_LABELS[s]}>
              <div style={st.track}><div style={st.knob} /></div>
            </StateCell>
          )
        })}
      </div>

      <CssOut css={css} toastApi={toastApi} />
    </div>
  )
}

function BadgeTab({ state, patch, toastApi }) {
  const cfg = state.badge
  const css = badgeCss(cfg)
  return (
    <div>
      <p className="cl-tab-desc">Бейджі (теги/лейбли) для статусів: нейтральний, успіх, попередження, помилка.</p>
      <HelpBox>
        <p>Семантичний колір бейджа — це теж свого роду «стан», тільки не інтерактивний: він одразу повідомляє значення (успішно / потребує уваги / помилка) без додаткового тексту.</p>
        <p>Не покладайтесь лише на колір: приблизно 8% чоловіків мають якусь форму дальтонізму й можуть не розрізнити success (зелений) і error (червоний) при слабкому контрасті. Додайте іконку (✓ / ⚠ / ✕) або текстовий лейбл поруч із кольором — колір підсилює значення, а не єдиний носій інформації.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Радіус<input type="range" min={0} max={20} value={cfg.radius} onChange={(e) => patch('badge', { radius: parseInt(e.target.value, 10) })} disabled={cfg.pill} /><span>{cfg.pill ? 'pill' : `${cfg.radius}px`}</span></label></div>
      <div className="cl-picker-top">
        <button className={'harmony-btn' + (cfg.pill ? ' active' : '')} onClick={() => patch('badge', { pill: !cfg.pill })}>Форма пігулки (pill)</button>
      </div>

      <div className="cl-section-title">Варіанти</div>
      <div className="cp-state-grid">
        {BADGE_VARIANTS.map((v) => (
          <StateCell key={v.key} label={v.label}>
            <span style={badgeStyle(cfg, v)}>{v.label}</span>
          </StateCell>
        ))}
      </div>

      <CssOut css={css} toastApi={toastApi} />
    </div>
  )
}

function CardTab({ state, patch, toastApi }) {
  const cfg = state.card
  const css = cardCss(cfg)
  return (
    <div>
      <p className="cl-tab-desc">Картка — базовий контейнер для списків і сіток контенту, зі станами наведення, фокуса й вимкненим.</p>
      <HelpBox>
        <p>Підняття картки (box-shadow + зсув вгору) при наведенні — звичний сигнал «цей елемент клікабельний».</p>
        <p>Якщо картка НЕ клікабельна (просто контейнер для вмісту), не додавайте їй hover-ефект — це створює хибне очікування кліку й дратує, коли нічого не відбувається. Залиште підняття тільки для карток, обгорнутих у посилання чи кнопку, адже hover-стан — це обіцянка інтерактивності, яку потрібно виконати.</p>
      </HelpBox>

      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Акцент</span>
        <input type="color" className="cl-swatch-input" value={cfg.accent} onChange={(e) => patch('card', { accent: e.target.value })} />
        <input className="cl-hex-input" value={cfg.accent} onChange={(e) => patch('card', { accent: e.target.value })} />
      </div>
      <div className="cl-editrow"><label>Радіус<input type="range" min={0} max={24} value={cfg.radius} onChange={(e) => patch('card', { radius: parseInt(e.target.value, 10) })} /><span>{cfg.radius}px</span></label></div>

      <div className="cl-section-title">Усі стани</div>
      <div className="cp-state-grid">
        {CARD_STATES.map((s) => (
          <StateCell key={s} label={STATE_LABELS[s]}>
            <div className="cp-card-demo" style={cardStyle(cfg, s)}>
              <div className="cp-card-demo-title">Заголовок</div>
              <div className="cp-card-demo-text">Короткий опис картки.</div>
            </div>
          </StateCell>
        ))}
      </div>

      <CssOut css={css} toastApi={toastApi} />
    </div>
  )
}

function CheckTab({ state, patch, toastApi }) {
  const cfg = state.check
  const cbCss = checkboxCss(cfg)
  const rCss = radioCss(cfg)
  return (
    <div>
      <p className="cl-tab-desc">Чекбокс (множинний вибір) і радіо-кнопка (вибір одного варіанта з кількох) — у всіх станах поруч.</p>
      <HelpBox>
        <p>Форма — головна підказка значення: квадрат = «можна вибрати кілька» (чекбокс), коло = «лише один варіант із групи» (радіо). Міняти ці форми місцями — класична помилка, яка плутає користувача ще до того, як він прочитає підписи.</p>
        <p>Для обох компонентів справжній HTML-елемент (<code>&lt;input type="checkbox"&gt;</code>/<code>radio</code>) зазвичай ховають візуально (не <code>display: none</code>, а через clip/opacity), а стилізований квадрат чи коло — це сусідній елемент, синхронізований через CSS-селектор <code>:checked + .box</code>. Це зберігає нативну доступність (клавіатура, скрінрідери) при повністю кастомному вигляді.</p>
      </HelpBox>

      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Акцент</span>
        <input type="color" className="cl-swatch-input" value={cfg.accent} onChange={(e) => patch('check', { accent: e.target.value })} />
        <input className="cl-hex-input" value={cfg.accent} onChange={(e) => patch('check', { accent: e.target.value })} />
      </div>

      <div className="cl-section-title">Чекбокс — усі стани</div>
      <div className="cp-state-grid">
        {CHECK_STATES.map((s) => (
          <StateCell key={s} label={STATE_LABELS[s]}>
            <div style={checkboxStyle(cfg, s)}>{s === 'checked' && <span style={{ color: '#fff', fontSize: 13, lineHeight: 1 }}>✓</span>}</div>
          </StateCell>
        ))}
      </div>
      <CssOut css={cbCss} toastApi={toastApi} />

      <div className="cl-section-title">Радіо-кнопка — усі стани</div>
      <div className="cp-state-grid">
        {CHECK_STATES.map((s) => {
          const st = radioStyle(cfg, s)
          return (
            <StateCell key={s} label={STATE_LABELS[s]}>
              <div style={st.ring}><div style={st.dot} /></div>
            </StateCell>
          )
        })}
      </div>
      <CssOut css={rCss} toastApi={toastApi} />
    </div>
  )
}

function defaultState() {
  return {
    button: { bg: '#3E37E0', color: '#FFFFFF', radius: 10, size: 'md' },
    input: { accent: '#3E37E0', radius: 8, borderWidth: 1 },
    toggle: { accent: '#3E37E0' },
    badge: { radius: 6, pill: false },
    card: { accent: '#3E37E0', radius: 14 },
    check: { accent: '#3E37E0' },
  }
}

export default function ComponentLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('button')
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
    pushRecentLab('components')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Component Lab"
      subtitle="UI-компоненти в усіх станах: default, hover, focus, disabled, checked — поруч, для швидкого порівняння."
      icon="🧩"
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
          {tab === 'button' && <ButtonTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'input' && <InputTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'toggle' && <ToggleTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'badge' && <BadgeTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'card' && <CardTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'check' && <CheckTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
