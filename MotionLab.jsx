import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import {
  TRANSITION_TYPES, transitionStyle, buildTransitionCss,
  EASING_PRESETS, sampleCubicBezier,
  defaultKeyframeSteps, buildKeyframesCss,
  staggerDelays, buildScrollRevealSnippet,
  LOADER_TYPES, buildLoaderCss,
} from './labs/motionBuilder.js'

const TABS = [
  { key: 'transitions', icon: '🎬', label: 'Переходи' },
  { key: 'keyframes', icon: '🗝️', label: 'Keyframes' },
  { key: 'easing', icon: '📈', label: 'Easing' },
  { key: 'stagger', icon: '☰', label: 'Stagger' },
  { key: 'scroll', icon: '🖱️', label: 'Scroll Reveal' },
  { key: 'loaders', icon: '⏳', label: 'Завантаження' },
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

function useReplay() {
  const [phase, setPhase] = useState('hidden')
  const [runKey, setRunKey] = useState(0)
  function play() {
    setPhase('hidden')
    setRunKey((k) => k + 1)
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase('visible')))
  }
  return { phase, runKey, play }
}

function TransitionsTab({ state, patch, toastApi }) {
  const cfg = state.transitions
  const easing = EASING_PRESETS.find((e) => e.key === cfg.easingKey)
  const { phase, runKey, play } = useReplay()
  const fromStyle = transitionStyle(cfg.type, cfg.direction, false)
  const toStyle = transitionStyle(cfg.type, cfg.direction, true)
  const transitionProp = Object.keys(toStyle).map((p) => (p === 'opacity' ? 'opacity' : 'transform')).join(', ')
  const css = buildTransitionCss({ type: cfg.type, direction: cfg.direction, durationMs: cfg.durationMs, delayMs: cfg.delayMs, easing: easing.css })

  return (
    <div>
      <p className="cl-tab-desc">Базові CSS-переходи: елемент анімується зі стану "приховано" у "видимо" при зміні властивості.</p>
      <HelpBox>
        <p><code>transition</code> анімує зміну CSS-властивості між двома станами — тут це перехід від прихованого до видимого при натисканні Play.</p>
        <p>Анімуйте лише <code>opacity</code> і <code>transform</code> — браузер рахує їх на GPU без перерахунку layout, тож анімація лишається плавною навіть на слабких пристроях. Анімація <code>width</code>, <code>top</code> чи <code>margin</code> змушує браузер перераховувати позиції всіх сусідніх елементів на кожному кадрі — звідси "рваний" рух.</p>
        <p>Затримка (delay) корисна не лише для декоративного ефекту — вона дозволяє "узгодити" кілька елементів, що зʼявляються послідовно (наприклад, спершу заголовок, через 100мс — підзаголовок, ще через 100мс — кнопка), не вдаючись до повноцінного stagger-списку (вкладка «Stagger» нижче — саме для таких послідовностей з багатьма однаковими елементами).</p>
      </HelpBox>

      <div className="cl-section-title">Тип</div>
      <div className="cl-btn-row">
        {TRANSITION_TYPES.map((t) => <button key={t.key} className={'harmony-btn' + (cfg.type === t.key ? ' active' : '')} onClick={() => patch('transitions', { type: t.key })}>{t.label}</button>)}
      </div>

      {(cfg.type === 'slide' || cfg.type === 'slideFade') && (
        <>
          <div className="cl-section-title">Напрямок</div>
          <div className="cl-btn-row">
            {[['up', '↑'], ['down', '↓'], ['left', '←'], ['right', '→']].map(([d, arrow]) => (
              <button key={d} className={'harmony-btn' + (cfg.direction === d ? ' active' : '')} onClick={() => patch('transitions', { direction: d })}>{arrow}</button>
            ))}
          </div>
        </>
      )}

      <div className="cl-editrow"><label>Тривалість<input type="range" min={100} max={1500} step={50} value={cfg.durationMs} onChange={(e) => patch('transitions', { durationMs: parseInt(e.target.value, 10) })} /><span>{cfg.durationMs}мс</span></label></div>
      <div className="cl-editrow"><label>Затримка<input type="range" min={0} max={800} step={50} value={cfg.delayMs} onChange={(e) => patch('transitions', { delayMs: parseInt(e.target.value, 10) })} /><span>{cfg.delayMs}мс</span></label></div>

      <div className="cl-section-title">Easing</div>
      <div className="cl-btn-row">
        {EASING_PRESETS.slice(0, 5).map((e) => <button key={e.key} className={'harmony-btn' + (cfg.easingKey === e.key ? ' active' : '')} onClick={() => patch('transitions', { easingKey: e.key })}>{e.label}</button>)}
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="mo-stage">
        <div key={runKey} className="mo-box" style={{ ...(phase === 'visible' ? toStyle : fromStyle), transition: `${transitionProp} ${cfg.durationMs}ms ${easing.css} ${cfg.delayMs}ms` }} />
      </div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={play}>▶ Play</button>
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function KeyframesTab({ state, patch, toastApi }) {
  const steps = state.keyframes.steps
  const { durationMs, loop } = state.keyframes
  const [playKey, setPlayKey] = useState(0)
  const css = buildKeyframesCss(steps)
  function update(id, partial) {
    patch('keyframes', { steps: steps.map((s) => (s.id === id ? { ...s, ...partial } : s)) })
  }
  function remove(id) {
    if (steps.length <= 2) { toastApi.show('Потрібно щонайменше 2 точки'); return }
    patch('keyframes', { steps: steps.filter((s) => s.id !== id) })
  }
  function add() {
    if (steps.length >= 6) { toastApi.show('Максимум 6 точок'); return }
    const maxId = Math.max(...steps.map((s) => s.id))
    patch('keyframes', { steps: [...steps, { id: maxId + 1, pct: 50, opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }] })
  }
  return (
    <div>
      <p className="cl-tab-desc">Власна багатокрокова анімація через <code>@keyframes</code> — задайте кілька точок по шкалі 0–100%.</p>
      <HelpBox>
        <p>Кожна точка — стан елемента (прозорість, зсув, масштаб, обертання) на певному відсотку тривалості. Браузер плавно інтерполює між сусідніми точками.</p>
        <p>Keyframes зручні там, де <code>transition</code> не вистачає — наприклад, "підстрибування" кнопки після кліку: точка на 0% (норма) → точка на 40% (збільшена) → точка на 70% (трохи менша) → точка на 100% (норма). Такий рух із "перельотом" у двох напрямках просто неможливо описати одним <code>transition</code> між двома станами.</p>
        <p>Прапорець «Loop» вмикає <code>animation-iteration-count: infinite</code> — корисно для постійних декоративних циклів (плаваючі елементи, пульсація іконки), але для одноразових акцентів (підтвердження дії, поява повідомлення) лишайте вимкненим, інакше анімація ніколи не зупиниться й почне відволікати, а не підкреслювати момент.</p>
      </HelpBox>

      <div className="l3d-object-list">
        {[...steps].sort((a, b) => a.pct - b.pct).map((s) => (
          <div key={s.id} className="l3d-object-row" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', width: 36 }}>{s.pct}%</span>
            <input type="range" min={0} max={100} value={s.pct} onChange={(e) => update(s.id, { pct: parseInt(e.target.value, 10) })} style={{ width: 70 }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>opacity</span>
            <input type="range" min={0} max={1} step={0.1} value={s.opacity} onChange={(e) => update(s.id, { opacity: parseFloat(e.target.value) })} style={{ width: 60 }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>y</span>
            <input type="range" min={-40} max={40} value={s.y} onChange={(e) => update(s.id, { y: parseInt(e.target.value, 10) })} style={{ width: 60 }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>scale</span>
            <input type="range" min={0.5} max={1.5} step={0.05} value={s.scale} onChange={(e) => update(s.id, { scale: parseFloat(e.target.value) })} style={{ width: 60 }} />
            <button className="cl-mini-btn" onClick={() => remove(s.id)} title="Видалити">✕</button>
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={add}>+ Додати точку</button>
      </div>

      <div className="cl-editrow"><label>Тривалість<input type="range" min={300} max={3000} step={100} value={durationMs} onChange={(e) => patch('keyframes', { durationMs: parseInt(e.target.value, 10) })} /><span>{durationMs}мс</span></label></div>
      <div className="cl-picker-top">
        <button className={'harmony-btn' + (loop ? ' active' : '')} onClick={() => patch('keyframes', { loop: !loop })}>🔁 Loop</button>
      </div>

      <style>{css}</style>
      <div className="cl-section-title">Превʼю</div>
      <div className="mo-stage">
        <div key={playKey} className="mo-box" style={{ animation: `customAnim ${durationMs}ms ease ${loop ? 'infinite' : '1'} both` }} />
      </div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => setPlayKey((k) => k + 1)}>▶ Play</button>
        <button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button>
      </div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function EasingTab({ state, patch }) {
  const easing = EASING_PRESETS.find((e) => e.key === state.easing.key)
  const points = sampleCubicBezier(easing.p, 50)
  const W = 220, H = 160
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${(x * W).toFixed(1)},${(H - y * H).toFixed(1)}`).join(' ')
  const { phase, runKey, play } = useReplay()
  return (
    <div>
      <p className="cl-tab-desc">Крива легкості (easing) визначає швидкість анімації в часі — лінійна, із прискоренням, із "пружним" перельотом.</p>
      <HelpBox>
        <p>Графік показує прогрес анімації (вісь Y) залежно від часу (вісь X). "Spring" і "Bounce" виходять за межі 0–1 — елемент на мить "перелітає" ціль, що й дає відчуття пружності.</p>
        <p>Правило вибору: "Ease Out" — для елементів, що зʼявляються (вони мають різко стартувати й плавно зупинитись, як природний рух); "Ease In" — для тих, що зникають; "Spring"/"Bounce" — для акцентних UI-реакцій (модалки, тултіпи, лайк-кнопки), де трохи "живого" перельоту підсилює відчуття відгуку. "Linear" майже ніколи не виглядає природно для руху — залиште його для прогрес-барів і обертання лоадерів.</p>
        <p>Cubic-bezier easing — це лише наближення «пружності» за допомогою двох контрольних точок кривої; справжня фізична пружина (маса + жорсткість + демпфування, як у Framer Motion чи iOS) рахується окремим диференціальним рівнянням і може «дотягувати» коливання довше або коротше за фіксовану тривалість. Для більшості інтерфейсних переходів cubic-bezier-наближення (як-от пресет «Spring» тут) виглядає практично нерозрізненим і значно простіше в підтримці чистим CSS.</p>
      </HelpBox>

      <div className="cl-section-title">Пресет</div>
      <div className="cl-btn-row">
        {EASING_PRESETS.map((e) => <button key={e.key} className={'harmony-btn' + (state.easing.key === e.key ? ' active' : '')} onClick={() => patch('easing', { key: e.key })}>{e.label}</button>)}
      </div>

      <div className="cl-section-title">Графік прогресу</div>
      <svg className="mo-curve-box" width={W} height={H} viewBox={`-10 -10 ${W + 20} ${H + 20}`}>
        <line x1={0} y1={H} x2={W} y2={H} stroke="var(--line)" strokeWidth={1} />
        <line x1={0} y1={0} x2={0} y2={H} stroke="var(--line)" strokeWidth={1} />
        <path d={path} fill="none" stroke="#3E37E0" strokeWidth={2.5} />
      </svg>

      <div className="cl-section-title">Превʼю руху</div>
      <div className="mo-easing-track">
        <div key={runKey} className="mo-easing-ball" style={{ left: phase === 'visible' ? 'calc(100% - 36px)' : 4, transition: `left 1200ms ${easing.css}` }} />
      </div>
      <div className="cl-picker-top"><button className="harmony-btn" onClick={play}>▶ Play</button></div>
      <pre className="cl-code-block">transition-timing-function: {easing.css};</pre>
    </div>
  )
}

function StaggerTab({ state, patch }) {
  const { count, baseDelayMs, durationMs } = state.stagger
  const delays = staggerDelays(count, baseDelayMs)
  const { phase, runKey, play } = useReplay()
  return (
    <div>
      <p className="cl-tab-desc">Stagger — елементи списку з'являються по черзі, а не всі одразу, що читається природніше для ока.</p>
      <HelpBox>
        <p>Кожен наступний елемент отримує <code>transition-delay</code> на крок більший за попередній — весь список "каскадом" входить в кадр.</p>
        <p>Крок затримки 50–100мс читається як "природна черга" і не сповільнює сприйняття; при 200мс+ список починає здаватись "повільним", особливо якщо елементів багато (10 елементів × 200мс = 2 секунди лише на останній). Для довгих списків (картки товарів, стрічка) обмежте stagger першими 5–6 елементами, а решту показуйте без затримки.</p>
        <p>У чистому CSS без JS той самий ефект роблять через <code>:nth-child()</code> і функцію <code>calc()</code> у значенні <code>animation-delay</code> (приклад — у коді нижче) — React тут лише обчислює конкретні мілісекунди для демонстрації, а в реальному проєкті з фіксованою кількістю елементів CSS-формула працює без жодного JavaScript.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Кількість<input type="range" min={3} max={10} value={count} onChange={(e) => patch('stagger', { count: parseInt(e.target.value, 10) })} /><span>{count}</span></label></div>
      <div className="cl-editrow"><label>Крок затримки<input type="range" min={20} max={200} step={10} value={baseDelayMs} onChange={(e) => patch('stagger', { baseDelayMs: parseInt(e.target.value, 10) })} /><span>{baseDelayMs}мс</span></label></div>
      <div className="cl-editrow"><label>Тривалість<input type="range" min={150} max={800} step={50} value={durationMs} onChange={(e) => patch('stagger', { durationMs: parseInt(e.target.value, 10) })} /><span>{durationMs}мс</span></label></div>

      <div className="cl-section-title">Превʼю</div>
      <div className="mo-stage">
        <div key={runKey} className="mo-stagger-row">
          {delays.map((d, i) => (
            <div
              key={i}
              className="mo-stagger-item"
              style={{
                opacity: phase === 'visible' ? 1 : 0,
                transform: phase === 'visible' ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity ${durationMs}ms ease ${d}ms, transform ${durationMs}ms ease ${d}ms`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="cl-picker-top"><button className="harmony-btn" onClick={play}>▶ Play</button></div>
      <pre className="cl-code-block">{`.item:nth-child(n) { transition-delay: calc((n - 1) * ${baseDelayMs}ms); }`}</pre>
    </div>
  )
}

function ScrollRevealItem({ transitionCss, hiddenTransform, threshold, repeat, children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (repeat) setVisible(entry.isIntersecting)
        else if (entry.isIntersecting) { setVisible(true); io.unobserve(el) }
      },
      { root: el.closest('.mo-scroll-stage'), threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, repeat])
  return (
    <div ref={ref} className="mo-scroll-item" style={{ transition: transitionCss, opacity: visible ? 1 : 0, transform: visible ? 'none' : hiddenTransform }}>
      {children}
    </div>
  )
}

function ScrollRevealTab({ state, patch, toastApi }) {
  const cfg = state.scroll
  const snippet = buildScrollRevealSnippet(cfg)
  const hiddenTransform = transitionStyle(cfg.type, cfg.direction, false).transform || 'none'
  const items = Array.from({ length: 6 }, (_, i) => i)
  return (
    <div>
      <p className="cl-tab-desc">Елементи з'являються, коли користувач доскролив до них — класичний ефект "reveal on scroll" на лендингах.</p>
      <HelpBox>
        <p>На відміну від інших вкладок, тут анімацію запускає не клік, а сам факт, що елемент заїхав у видиму область екрана. Для цього потрібен <code>IntersectionObserver</code> — браузерний API, який повідомляє, коли елемент перетинає межі контейнера (або viewport), без постійного опитування позиції скролу (що було б повільно і "сіпалось" би).</p>
        <p>Поріг (threshold) — яка частка елемента має бути видно, щоб спрацювала поява: 0 — досить одного пікселя, 1 — елемент має бути видимий повністю. Для карток контенту зазвичай достатньо 0.2–0.4, щоб анімація стартувала трохи заздалегідь і виглядала плавно, а не "вистрибувала" в останній момент.</p>
        <p>Прапорець "Повторювати" вирішує типову дилему дизайну: показати ефект лише один раз (елемент назавжди лишається видимим після першої появи — менше відволікає при скролі вгору-вниз) чи ховати елемент знову щоразу, як він виходить з екрана (більш "живо", але може набриднути при частому скролі).</p>
        <p>Важливо для доступності: ефект reveal-on-scroll варто вимикати (або робити миттєвим) для людей із налаштуванням <code>prefers-reduced-motion: reduce</code> в ОС — медіа-запит <code>@media (prefers-reduced-motion: reduce)</code> у CSS дозволяє прибрати transition саме для таких користувачів, не змінюючи поведінку для решти.</p>
      </HelpBox>

      <div className="cl-section-title">Тип і напрямок</div>
      <div className="cl-btn-row">
        {TRANSITION_TYPES.map((t) => <button key={t.key} className={'harmony-btn' + (cfg.type === t.key ? ' active' : '')} onClick={() => patch('scroll', { type: t.key })}>{t.label}</button>)}
      </div>
      {(cfg.type === 'slide' || cfg.type === 'slideFade') && (
        <div className="cl-btn-row">
          {[['up', '↑'], ['down', '↓'], ['left', '←'], ['right', '→']].map(([d, arrow]) => (
            <button key={d} className={'harmony-btn' + (cfg.direction === d ? ' active' : '')} onClick={() => patch('scroll', { direction: d })}>{arrow}</button>
          ))}
        </div>
      )}

      <div className="cl-editrow"><label>Поріг (threshold)<input type="range" min={0} max={1} step={0.1} value={cfg.threshold} onChange={(e) => patch('scroll', { threshold: parseFloat(e.target.value) })} /><span>{cfg.threshold}</span></label></div>
      <div className="cl-editrow"><label>Тривалість<input type="range" min={200} max={1200} step={50} value={cfg.durationMs} onChange={(e) => patch('scroll', { durationMs: parseInt(e.target.value, 10) })} /><span>{cfg.durationMs}мс</span></label></div>
      <div className="cl-picker-top">
        <button className={'harmony-btn' + (cfg.repeat ? ' active' : '')} onClick={() => patch('scroll', { repeat: !cfg.repeat })}>🔁 Повторювати</button>
      </div>

      <div className="cl-section-title">Превʼю — скрольте вниз у рамці</div>
      <div className="mo-scroll-stage">
        {items.map((i) => (
          <ScrollRevealItem
            key={i}
            transitionCss={`opacity ${cfg.durationMs}ms ease-out, transform ${cfg.durationMs}ms ease-out`}
            hiddenTransform={hiddenTransform}
            threshold={cfg.threshold}
            repeat={cfg.repeat}
          >
            Блок {i + 1}
          </ScrollRevealItem>
        ))}
      </div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(snippet); toastApi.show('✓ CSS + JS скопійовано') }}>Copy CSS + JS</button>
      </div>
      <pre className="cl-code-block">{snippet}</pre>
    </div>
  )
}

function LoadersTab({ state, patch, toastApi }) {
  const { type, durationMs, color } = state.loaders
  const css = buildLoaderCss(type, { durationMs, color })
  return (
    <div>
      <p className="cl-tab-desc">Анімації стану завантаження — нескінченні цикли, які повідомляють "зачекайте, щось відбувається", на відміну від усіх інших вкладок, що анімують одноразову зміну стану.</p>
      <HelpBox>
        <p>Усі чотири варіанти побудовані на тих самих "дешевих" властивостях (<code>transform</code>, <code>opacity</code>, <code>background-position</code>), що й решта вкладок цієї лабораторії — завантажувач, який сам гальмує сторінку через важку анімацію, іронічно погіршує саме той момент, коли й так щось повільне відбувається.</p>
        <p>Spinner і Dots підходять для коротких очікувань (клік по кнопці, запит до API) — вони не дають уявлення про прогрес, лише сигналізують активність. Skeleton (імітація контуру контенту, що завантажується) краще підходить для довших завантажень сторінки, бо одразу показує приблизну структуру майбутнього контенту й зменшує відчуття "порожнечі", поки дані ще не прийшли.</p>
        <p>Для Dots затримка між крапками — це <code>durationMs / 6</code>: при тривалості циклу 1000мс кожна наступна крапка стартує на ~167мс пізніше за попередню, що й дає ефект "хвилі", а не синхронного стрибання всіх трьох одночасно.</p>
      </HelpBox>

      <div className="cl-section-title">Тип</div>
      <div className="cl-btn-row">
        {LOADER_TYPES.map((t) => <button key={t.key} className={'harmony-btn' + (type === t.key ? ' active' : '')} onClick={() => patch('loaders', { type: t.key })}>{t.label}</button>)}
      </div>

      <div className="cl-editrow"><label>Тривалість циклу<input type="range" min={400} max={2400} step={100} value={durationMs} onChange={(e) => patch('loaders', { durationMs: parseInt(e.target.value, 10) })} /><span>{durationMs}мс</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Колір</span>
        <input type="color" className="cl-swatch-input" value={color} onChange={(e) => patch('loaders', { color: e.target.value })} />
        <input className="cl-hex-input" value={color} onChange={(e) => patch('loaders', { color: e.target.value })} />
      </div>

      <style>{css}</style>
      <div className="cl-section-title">Превʼю</div>
      <div className="mo-stage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {type === 'dots' ? (
          <div className="loader"><span /><span /><span /></div>
        ) : (
          <div className="loader" />
        )}
      </div>
      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function defaultState() {
  return {
    transitions: { type: 'fade', direction: 'up', durationMs: 500, delayMs: 0, easingKey: 'ease' },
    keyframes: { steps: defaultKeyframeSteps(), durationMs: 900, loop: false },
    easing: { key: 'spring' },
    stagger: { count: 6, baseDelayMs: 70, durationMs: 350 },
    scroll: { type: 'slideFade', direction: 'up', durationMs: 500, threshold: 0.4, repeat: false },
    loaders: { type: 'spinner', durationMs: 900, color: '#3E37E0' },
  }
}

export default function MotionLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('transitions')
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
    pushRecentLab('motion')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Motion Lab"
      subtitle="CSS-переходи, keyframe-анімації, криві легкості (easing), stagger-ефекти, scroll-reveal й анімації завантаження з живим превʼю."
      icon="🎞️"
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
          {tab === 'transitions' && <TransitionsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'keyframes' && <KeyframesTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'easing' && <EasingTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'stagger' && <StaggerTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'scroll' && <ScrollRevealTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'loaders' && <LoadersTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
