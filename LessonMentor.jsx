import { useState, useRef, useEffect } from 'react'
import { answerFromLesson } from './mentorMatch.js'

let nextMsgId = 1

export default function LessonMentor({ module, onClose }) {
  const [messages, setMessages] = useState(() => [
    {
      id: nextMsgId++,
      role: 'bot',
      intro: `Привіт! Запитай мене про щось із уроку «${module.title}» своїми словами.`,
      footer: 'Я не жива розмова й не штучний інтелект — лише шукаю збіги в тексті цього уроку (теорія, ключові принципи, типові помилки, практика). Якщо питання не стосується уроку, чесно так і скажу.',
    },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function send() {
    const question = input.trim()
    if (!question) return

    const result = answerFromLesson(module, question)
    const botMsg = { id: nextMsgId++, role: 'bot' }

    if (!result.matched) {
      botMsg.intro = `🤔 Не знайшла в матеріалах уроку «${module.title}» прямої відповіді на «${question}».`
      botMsg.footer = 'Спробуй сформулювати інакше ключовими словами з уроку, або подивись розділи ТЕОРІЯ, КЛЮЧОВІ ПРИНЦИПИ й ПРАКТИКА вище — я шукаю відповіді лише там.'
    } else if (result.flaggedMistake) {
      botMsg.intro = '⚠️ Схоже, це поширена помилка, про яку прямо каже урок:'
      botMsg.passages = [{ label: 'Типова помилка', text: result.flaggedMistake.text }, ...result.passages.filter((p) => p.text !== result.flaggedMistake.text)]
      botMsg.footer = 'Якщо мала на увазі не це — спробуй перефразувати питання.'
    } else {
      botMsg.intro = '📘 За матеріалом уроку:'
      botMsg.passages = result.passages
    }

    setMessages((prev) => [...prev, { id: nextMsgId++, role: 'user', text: question }, botMsg])
    setInput('')
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
                    {m.passages.map((p, i) => (
                      <li key={i}>
                        <span className="lesson-mentor-passage-label">{p.label}</span>
                        {p.text}
                      </li>
                    ))}
                  </ul>
                )}
                {m.footer && <p className="lesson-mentor-footer">{m.footer}</p>}
              </>
            )}
          </div>
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
        />
        <button className="pf-add-btn" onClick={send}>Надіслати</button>
      </div>
    </div>
  )
}
