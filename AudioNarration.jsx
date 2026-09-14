import { useState, useEffect, useRef } from 'react'

// Озвучення тексту через вбудований у браузер Web Speech API — без
// сторонніх сервісів чи файлів. Якість і наявність української voice
// залежить від браузера й ОС користувача (Chrome/Edge зазвичай мають
// хоча б одну), тому компонент чесно попереджає, якщо озвучення
// недоступне взагалі.

export default function AudioNarration({ text }) {
  const [supported, setSupported] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const utteranceRef = useRef(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Скидаємо відтворення, якщо користувач перейшов на інший модуль
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
    setPaused(false)
  }, [text])

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices()
    return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('uk')) || null
  }

  function play() {
    const synth = window.speechSynthesis
    if (paused) {
      synth.resume()
      setPaused(false)
      setSpeaking(true)
      return
    }
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickVoice()
    if (voice) utterance.voice = voice
    utterance.lang = voice ? voice.lang : 'uk-UA'
    utterance.rate = 1
    utterance.onend = () => { setSpeaking(false); setPaused(false) }
    utterance.onerror = () => { setSpeaking(false); setPaused(false) }
    utteranceRef.current = utterance
    synth.speak(utterance)
    setSpeaking(true)
    setPaused(false)
  }

  function pause() {
    window.speechSynthesis.pause()
    setPaused(true)
    setSpeaking(false)
  }

  function stop() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  if (!supported) {
    return (
      <p className="audio-unsupported">
        🔇 Ваш браузер не підтримує озвучення тексту (Web Speech API). Спробуйте Chrome чи Edge.
      </p>
    )
  }

  return (
    <div className="audio-narration">
      {!speaking && !paused && (
        <button className="harmony-btn" onClick={play}>🔊 Прослухати теорію</button>
      )}
      {speaking && (
        <button className="harmony-btn" onClick={pause}>⏸ Пауза</button>
      )}
      {paused && (
        <button className="harmony-btn" onClick={play}>▶ Продовжити</button>
      )}
      {(speaking || paused) && (
        <button className="harmony-btn" onClick={stop}>⏹ Стоп</button>
      )}
      <span className="audio-note">Озвучення — голос браузера, якість залежить від вашої ОС</span>
    </div>
  )
}
