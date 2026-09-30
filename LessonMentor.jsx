import { useState, useRef, useEffect } from 'react'
import { answerFromLesson } from './mentorMatch.js'
import { loadFeedback, rate } from './mentorFeedback.js'
import { classifyIntent, isWordless, QUICK_REPLIES } from './mentorIntents.js'
import { buildIntentAnswer, unsureRecognitionAnswer, wordlessAnswer, fallbackAnswer } from './mentorTemplates.js'
import { useAuth } from './AuthContext.jsx'

let nextMsgId = 1

export default function LessonMentor({ module, prev, next, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState(() => [
    {
      id: nextMsgId++,
      role: 'bot',
      intro: `Привіт! Запитай мене про щось із уроку «${module.title}» своїми словами — можна з помилками, коротко, навіть без термінів.`,
      footer: 'Я не жива розмова й не штучний інтелект — розпізнаю тип питання (не зрозуміла урок/завдання, підказка, що далі...) і відповідаю матеріалом цього уроку. Постав 👍/👎 під відповіддю — це спільна оцінка від УСІХ учнів курсу. Я не переглядаю зображення й скриншоти — якщо щось не виходить, просто опиши це словами.',
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  // Власні голоси поточного користувача по тексту фрагмента (не по
  // конкретному повідомленню — той самий фрагмент може випасти в кількох
  // відповідях, і голос по ньому має бути один спільний).
  const [myVotes, setMyVotes] = useState({})
  // Намір попереднього повідомлення — потрібен, щоб короткі репліки типу
  // "а навіщо?" чи "ще?" розумілися в контексті того, про що щойно йшлося.
  const [lastIntentId, setLastIntentId] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send(overrideText) {
    const question = (overrideText ?? input).trim()
    if (!question || sending) return
    setSending(true)

    let botMsg = { id: nextMsgId++, role: 'bot' }

    if (isWordless(question)) {
      botMsg = { ...botMsg, ...wordlessAnswer() }
      setLastIntentId(null)
    } else {
      const intent = classifyIntent(question, { lastIntentId })

      if (intent && intent.isMeta) {
        // Метанаміри ("не зрозуміла завдання", "що далі", "дай підказку"...)
        // не потребують мережі — відповідь будується з полів уроку синхронно.
        botMsg = { ...botMsg, ...buildIntentAnswer(intent.intentId, { module, question, prev, next }) }
        setLastIntentId(intent.intentId)
      } else {
        // Контентне питання (або нерозпізнаний намір) — як і раніше, шукаємо
        // збіг у тексті уроку; голоси всіх учнів підвантажуємо з Supabase.
        const { aggregate, mine } = await loadFeedback(module.id, user?.email)
        setMyVotes((prevVotes) => ({ ...mine, ...prevVotes }))

        if (intent) {
          botMsg = { ...botMsg, ...buildIntentAnswer(intent.intentId, { module, question, prev, next, feedback: aggregate }) }
          setLastIntentId(intent.intentId)
        } else {
          const result = answerFromLesson(module, question, aggregate)
          if (!result.matched) {
            // Дуже коротке/невиразне повідомлення — швидше за все, просто
            // не вистачило слів, щоб зрозуміти запит (rule 55). Довше
            // повідомлення, яке все одно не збіглось ні з наміром, ні з
            // текстом уроку, — справжня невпевненість: пропонуємо 3
            // найімовірніші варіанти, що саме малось на увазі (rule 54).
            const wordCount = question.trim().split(/\s+/).length
            botMsg = { ...botMsg, ...(wordCount <= 2 ? fallbackAnswer() : unsureRecognitionAnswer()) }
          } else if (result.flaggedMistake) {
            botMsg.intro = '⚠️ Схоже, це поширена помилка, про яку прямо каже урок:'
            botMsg.passages = [{ label: 'Типова помилка', text: result.flaggedMistake.text }, ...result.passages.filter((p) => p.text !== result.flaggedMistake.text)]
            botMsg.footer = 'Якщо мала на увазі не це — спробуй перефразувати питання.'
          } else {
            botMsg.intro = '📘 За матеріалом уроку:'
            botMsg.passages = result.passages
          }
          setLastIntentId(null)
        }
      }
    }

    setMessages((prev2) => [...prev2, { id: nextMsgId++, role: 'user', text: question }, botMsg])
    setInput('')
    setSending(false)
  }

  async function handleRate(passageText, value) {
    if (!user?.email) return
    const current = myVotes[passageText] || 0
    // Оптимістично оновлюємо кнопку одразу, не чекаючи відповіді мережі.
    setMyVotes((prev2) => ({ ...prev2, [passageText]: value === current ? 0 : value }))
    const saved = await rate(module.id, passageText, value, current, user.email)
    setMyVotes((prev2) => ({ ...prev2, [passageText]: saved }))
  }

  return (
    <div className="lesson-mentor">
      <div className="lesson-mentor-header">
        <p className="eyebrow">Помічник за матеріалом уроку</p>
        <button className="harmony-btn" onClick={onClose}>Закрити</button>
      </div>

      <div className="lesson-mentor-messages" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className={'lesson-mentor-msg lesson-mentor-msg--' + m.role}>
            {m.role === 'user' ? (
              <p>{m.text}</p>
            ) : (
              <>
                {m.intro && <p className="lesson-mentor-intro">{m.intro}</p>}
                {m.passages && m.passages.length > 0 && (
                  <ul className="lesson-mentor-passages">
                    {m.passages.map((p, i) => {
                      const voted = myVotes[p.text] || 0
                      return (
                        <li key={i}>
                          <span className="lesson-mentor-passage-label">{p.label}</span>
                          {p.text}
                          {!m.norate && (
                            <span className="lesson-mentor-rate">
                              <button
                                className={voted === 1 ? 'active' : ''}
                                onClick={() => handleRate(p.text, 1)}
                                aria-label="Корисно"
                                title="Корисно"
                              >👍</button>
                              <button
                                className={voted === -1 ? 'active' : ''}
                                onClick={() => handleRate(p.text, -1)}
                                aria-label="Не допомогло"
                                title="Не допомогло"
                              >👎</button>
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {m.footer && <p className="lesson-mentor-footer">{m.footer}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="lesson-mentor-quick-replies">
        {QUICK_REPLIES.map((q) => (
          <button key={q.id} className="lesson-mentor-quick-btn" disabled={sending} onClick={() => send(q.label)}>
            {q.emoji} {q.label}
          </button>
        ))}
      </div>

      <div className="lesson-mentor-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Запитай про цей урок своїми словами…"
          className="lesson-mentor-input"
          disabled={sending}
        />
        <button className="pf-add-btn" onClick={() => send()} disabled={sending}>
          {sending ? '…' : 'Надіслати'}
        </button>
      </div>
    </div>
  )
}
