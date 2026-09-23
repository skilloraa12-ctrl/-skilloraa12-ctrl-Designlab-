import { useState, useEffect, useRef } from 'react'
import { synthesizeSpeechWav } from './piperTts.js'

// Real neural voice (Piper, uk_UA-lada-x_low) reused from 00100101-platform,
// with eSpeak-NG as an automatic fallback — see piperTts.js. Replaces the
// old Web Speech API version: that only worked if the learner's OS happened
// to have a Ukrainian voice installed, which silently failed on a lot of
// real machines. This runs entirely client-side, no OS dependency.

export default function AudioNarration({ text }) {
  const [state, setState] = useState('idle') // idle | loading | playing | paused | error
  const [errorMsg, setErrorMsg] = useState(null)
  const audioRef = useRef(null)
  const blobUrlRef = useRef(null)
  const requestIdRef = useRef(0)

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
      cleanupAudio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Скидаємо відтворення, якщо користувач перейшов на інший модуль
  useEffect(() => {
    requestIdRef.current += 1
    cleanupAudio()
    setState('idle')
    setErrorMsg(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  if (!text) return null

  async function play() {
    if (state === 'paused' && audioRef.current) {
      audioRef.current.play()
      setState('playing')
      return
    }
    const myId = ++requestIdRef.current
    setErrorMsg(null)
    setState('loading')
    try {
      const blob = await synthesizeSpeechWav(text)
      if (myId !== requestIdRef.current) return
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { if (myId === requestIdRef.current) setState('idle') }
      audio.onerror = () => { if (myId === requestIdRef.current) { setErrorMsg('Не вдалося відтворити аудіо.'); setState('error') } }
      await audio.play()
      if (myId !== requestIdRef.current) return
      setState('playing')
    } catch (err) {
      if (myId !== requestIdRef.current) return
      setErrorMsg(String(err.message || err))
      setState('error')
    }
  }

  function pause() {
    if (!audioRef.current) return
    audioRef.current.pause()
    setState('paused')
  }

  function stop() {
    requestIdRef.current += 1
    cleanupAudio()
    setState('idle')
    setErrorMsg(null)
  }

  return (
    <div className="audio-narration">
      {(state === 'idle' || state === 'error') && (
        <button className="harmony-btn" onClick={play}>🔊 Прослухати теорію</button>
      )}
      {state === 'loading' && (
        <span className="audio-note">Готую озвучення… (для довгого тексту може тривати до хвилини)</span>
      )}
      {state === 'playing' && (
        <>
          <button className="harmony-btn" onClick={pause}>⏸ Пауза</button>
          <button className="harmony-btn" onClick={stop}>⏹ Стоп</button>
        </>
      )}
      {state === 'paused' && (
        <>
          <button className="harmony-btn" onClick={play}>▶ Продовжити</button>
          <button className="harmony-btn" onClick={stop}>⏹ Стоп</button>
        </>
      )}
      {state === 'error' && errorMsg && <span className="audio-note">{errorMsg}</span>}
    </div>
  )
}
