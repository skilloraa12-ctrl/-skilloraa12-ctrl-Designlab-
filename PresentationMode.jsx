import { useState, useEffect, useMemo } from 'react'

function buildSlides(module) {
  const slides = [{ label: 'Модуль', text: `${module.title}. ${module.theory || ''}` }]
  ;(module.keyPoints || []).forEach((p) => slides.push({ label: 'Ключовий принцип', text: p }))
  ;(module.mistakes || []).forEach((m) => slides.push({ label: 'Типова помилка', text: m }))
  if (module.practice) slides.push({ label: 'Практика', text: module.practice })
  if (module.example) slides.push({ label: 'Приклад виконання', text: module.example })
  return slides
}

export default function PresentationMode({ module, onClose }) {
  const slides = useMemo(() => buildSlides(module), [module])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (!supported) return
    if (playing) {
      const synth = window.speechSynthesis
      synth.cancel()
      const voices = synth.getVoices()
      const voice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('uk'))
      const utt = new SpeechSynthesisUtterance(slides[index].text)
      if (voice) utt.voice = voice
      utt.lang = voice ? voice.lang : 'uk-UA'
      utt.onend = () => {
        if (index < slides.length - 1) setIndex((i) => i + 1)
        else setPlaying(false)
      }
      synth.speak(utt)
    } else {
      window.speechSynthesis.cancel()
    }
    return () => { if (supported) window.speechSynthesis.cancel() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing])

  function next() { setPlaying(false); setIndex((i) => Math.min(i + 1, slides.length - 1)) }
  function prev() { setPlaying(false); setIndex((i) => Math.max(i - 1, 0)) }
  function close() {
    if (supported) window.speechSynthesis.cancel()
    onClose()
  }

  const slide = slides[index]

  return (
    <div className="presentation-overlay" onClick={close}>
      <div className="presentation-card" onClick={(e) => e.stopPropagation()}>
        <div className="presentation-progress">
          {slides.map((_, i) => (
            <span key={i} className={'presentation-dot' + (i === index ? ' active' : i < index ? ' done' : '')} />
          ))}
        </div>

        <p className="eyebrow" style={{ color: 'var(--coral)' }}>{slide.label.toUpperCase()}</p>
        <p className="presentation-text">{slide.text}</p>

        {!supported && (
          <p className="audio-unsupported">🔇 Голосове відтворення недоступне у вашому браузері — можна гортати слайди вручну.</p>
        )}

        <div className="presentation-controls">
          <button className="harmony-btn" onClick={prev} disabled={index === 0}>← Назад</button>
          {supported && (
            <button className="pf-add-btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? '⏸ Пауза' : '▶ Відтворити з голосом'}
            </button>
          )}
          <button className="harmony-btn" onClick={next} disabled={index === slides.length - 1}>Далі →</button>
        </div>

        <button className="complete-btn" onClick={close} style={{ marginTop: 14 }}>Закрити презентацію</button>
      </div>
    </div>
  )
}
