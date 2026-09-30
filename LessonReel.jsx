import { useState, useRef, useEffect } from 'react'
import { synthesizeSpeechWav } from './piperTts.js'

// Той самий захист, що й у mentorFeedback.js: мережевий збій під час
// завантаження голосової моделі іноді не відхиляється з помилкою, а просто
// зависає без відповіді — звичайний try/catch це не ловить. Обмежуємо
// таймаутом, щоб огляд не застряг на "завантажую" назавжди.
function withTimeout(promise, ms = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут озвучення')), ms)),
  ])
}

// Короткий (~15с) анімований огляд уроку — БЕЗ жодного платного відео-API.
// Замість того, щоб генерувати й хостити окремий AI-відеофайл на кожен із
// 254 уроків вручну (дорого, впирається в ліміти, не масштабується),
// "ролик" збирається з уже наявних даних уроку (title/theory/keyPoints/
// mistakes) і озвучується вже вбудованим у сайт безкоштовним голосом
// (Piper TTS, той самий, що й кнопка «Прослухати теорію»). Працює
// однаково для будь-якого уроку без жодної ручної роботи.
function buildScenes(module) {
  const scenes = []
  const hook = (module.theory || '').match(/^.+?[.!?](?=\s|$)/)
  scenes.push({ kind: 'intro', title: module.title, caption: hook ? hook[0].trim() : module.title })
  for (const kp of (module.keyPoints || []).slice(0, 2)) {
    scenes.push({ kind: 'point', caption: kp })
  }
  if (module.mistakes && module.mistakes[0]) {
    scenes.push({ kind: 'mistake', caption: module.mistakes[0] })
  }
  return scenes
}

function BrowserMockup({ kind }) {
  return (
    <svg viewBox="0 0 200 260" className="lesson-reel-mockup">
      <rect x="10" y="10" width="180" height="240" rx="10" fill="#1c1c22" stroke="#3a3a44" />
      <rect x="10" y="10" width="180" height="26" rx="10" fill="#26262e" />
      <circle cx="24" cy="23" r="4" fill="#e0523e" />
      <circle cx="38" cy="23" r="4" fill="#c8912b" />
      <circle cx="52" cy="23" r="4" fill="#2fa36b" />
      <rect x="66" y="18" width="100" height="10" rx="5" fill="#3a3a44" />
      {/* header */}
      <rect x="20" y="46" width="160" height="22" rx="4" fill={kind === 'mistake' ? '#e0523e' : '#3e37e0'} opacity="0.85" />
      {/* hero */}
      <rect x="20" y="74" width="160" height="60" rx="4" fill="#2a2a34" />
      <rect x="32" y="90" width="100" height="10" rx="5" fill="#8a8a9a" />
      <rect x="32" y="106" width="70" height="10" rx="5" fill="#8a8a9a" />
      <rect x="32" y="122" width="40" height="12" rx="6" fill={kind === 'mistake' ? '#e0523e' : '#2fa36b'} />
      {/* content blocks */}
      <rect x="20" y="142" width="75" height="44" rx="4" fill="#2a2a34" />
      <rect x="105" y="142" width="75" height="44" rx="4" fill="#2a2a34" />
      {/* footer */}
      <rect x="20" y="196" width="160" height="34" rx="4" fill="#26262e" />
    </svg>
  )
}

// Час "на читання" для мовчазного режиму (без голосу) — орієнтовно
// швидкість читання дорослою людиною, з розумними межами, щоб і короткий,
// і довгий підпис встигали прочитатись, не затягуючи огляд надовго.
function readingDuration(text) {
  return Math.min(6000, Math.max(2200, text.length * 55))
}

export default function LessonReel({ module }) {
  const scenes = buildScenes(module)
  const [state, setState] = useState('idle') // idle | loading | playing | error | done
  const [sceneIndex, setSceneIndex] = useState(0)
  const [voiceOn, setVoiceOn] = useState(true)
  const audioRef = useRef(null)
  const blobUrlRef = useRef(null)
  const requestIdRef = useRef(0)
  const timeoutRef = useRef(null)

  function cleanup() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; audioRef.current = null }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }

  useEffect(() => () => cleanup(), [])

  async function playScene(i, myId, withVoice) {
    if (i >= scenes.length) {
      if (myId === requestIdRef.current) { setState('done'); cleanup() }
      return
    }
    setSceneIndex(i)

    if (!withVoice) {
      // Беззвучний режим — просто текстові слайди, що гортаються за часом
      // на читання, без жодного звернення до голосового рушія.
      setState('playing')
      timeoutRef.current = setTimeout(() => { if (myId === requestIdRef.current) playScene(i + 1, myId, withVoice) }, readingDuration(scenes[i].caption))
      return
    }

    setState('loading')
    try {
      const blob = await withTimeout(synthesizeSpeechWav(scenes[i].caption))
      if (myId !== requestIdRef.current) return
      cleanup()
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { if (myId === requestIdRef.current) playScene(i + 1, myId, withVoice) }
      audio.onerror = () => { if (myId === requestIdRef.current) playScene(i + 1, myId, withVoice) }
      await audio.play()
      if (myId !== requestIdRef.current) return
      setState('playing')
    } catch {
      // Озвучення не вдалося (мережа тощо) — все одно показуємо картку й
      // перейдемо далі за часом, щоб короткий огляд не завис назавжди.
      if (myId !== requestIdRef.current) return
      setState('playing')
      timeoutRef.current = setTimeout(() => { if (myId === requestIdRef.current) playScene(i + 1, myId, withVoice) }, 2500)
    }
  }

  function start() {
    const myId = ++requestIdRef.current
    playScene(0, myId, voiceOn)
  }

  function stop() {
    requestIdRef.current += 1
    cleanup()
    setState('idle')
    setSceneIndex(0)
  }

  if (scenes.length === 0) return null
  const scene = scenes[Math.min(sceneIndex, scenes.length - 1)]
  const isActive = state === 'playing' || state === 'loading'

  return (
    <div className="lesson-reel">
      <p className="eyebrow">🎬 Короткий огляд</p>
      <div className="lesson-reel-card">
        <BrowserMockup kind={isActive ? scene.kind : 'intro'} />

        {isActive ? (
          <div className="lesson-reel-caption-wrap">
            {scene.kind === 'mistake' && <span className="lesson-reel-flag">⚠️ Типова помилка</span>}
            <p className="lesson-reel-caption">{scene.caption}</p>
          </div>
        ) : (
          <div className="lesson-reel-cover">
            <p className="lesson-reel-cover-title">{module.title}</p>
          </div>
        )}

        {isActive && (
          <div className="lesson-reel-progress">
            {scenes.map((_, i) => (
              <span key={i} className={'lesson-reel-dot' + (i === sceneIndex ? ' active' : i < sceneIndex ? ' done' : '')} />
            ))}
          </div>
        )}
      </div>

      <div className="lesson-reel-controls">
        {!isActive && (
          <label className="lesson-reel-voice-toggle">
            <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} />
            🔊 Зі звуком
          </label>
        )}
        {!isActive && state !== 'done' && (
          <button className="pf-add-btn" onClick={start}>▶ Переглянути огляд</button>
        )}
        {state === 'done' && (
          <button className="harmony-btn" onClick={start}>↻ Переглянути ще раз</button>
        )}
        {isActive && (
          <button className="harmony-btn" onClick={stop}>⏹ Зупинити</button>
        )}
      </div>
    </div>
  )
}
