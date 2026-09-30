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

// Ключові слова сцени визначають, ЯКА картинка малюється — щоб урок
// запам'ятовувався не лише на слух/читанням, а й візуально: коли йдеться
// про кнопку, на екрані кнопка; коли про зображення — іконка картинки;
// коли про колір — палітра; коли про домен/адресу — рядок браузера. Не
// просто одна й та сама картинка сайту на всі сцени поспіль.
const FOCUS_RULES = [
  { id: 'button', words: ['кнопк', 'cta', 'заклик до дії', 'натисн'] },
  { id: 'image', words: ['зображен', 'картинк', 'фото', 'ілюстрац', 'іконк'] },
  { id: 'color', words: ['колір', 'кольор', 'палітр', 'контраст', 'відтінок'] },
  { id: 'typography', words: ['шрифт', 'типограф', 'текст', 'абзац', 'заголовок тексту'] },
  { id: 'header', words: ['шапк', 'header', 'логотип', 'навігац', 'меню'] },
  { id: 'footer', words: ['підвал', 'footer', 'контакти сайту'] },
  { id: 'form', words: ['форм', 'поле вводу', 'реєстрац', 'підписк'] },
  { id: 'layout', words: ['макет', 'композиц', 'сітк', 'grid', 'вирівнюван', 'відступ'] },
  { id: 'wireframe', words: ['wireframe', 'прототип', 'скелет сторінки'] },
]

function detectFocus(text) {
  const norm = (text || '').toLowerCase()
  for (const rule of FOCUS_RULES) {
    if (rule.words.some((w) => norm.includes(w))) return rule.id
  }
  return 'site'
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
  const hookText = hook ? hook[0].trim() : module.title
  scenes.push({ kind: 'intro', caption: hookText, focus: detectFocus(hookText + ' ' + module.title) })
  for (const kp of (module.keyPoints || []).slice(0, 2)) {
    scenes.push({ kind: 'point', caption: kp, focus: detectFocus(kp) })
  }
  if (module.mistakes && module.mistakes[0]) {
    scenes.push({ kind: 'mistake', caption: module.mistakes[0], focus: detectFocus(module.mistakes[0]) })
  }
  return scenes
}

function Frame({ alert, children }) {
  return (
    <svg viewBox="0 0 200 260" className="lesson-reel-mockup">
      <rect x="10" y="10" width="180" height="240" rx="10" fill="#1c1c22" stroke="#3a3a44" />
      <rect x="10" y="10" width="180" height="26" rx="10" fill="#26262e" />
      <circle cx="24" cy="23" r="4" fill="#e0523e" />
      <circle cx="38" cy="23" r="4" fill="#c8912b" />
      <circle cx="52" cy="23" r="4" fill="#2fa36b" />
      <rect x="66" y="18" width="100" height="10" rx="5" fill="#3a3a44" />
      {children}
    </svg>
  )
}

function BrowserMockup({ focus, alert }) {
  const accent = alert ? '#e0523e' : '#2fa36b'

  if (focus === 'button') {
    return (
      <Frame>
        <rect x="20" y="60" width="160" height="70" rx="4" fill="#2a2a34" />
        <rect x="55" y="150" width="90" height="38" rx="19" fill={accent} />
        <text x="72" y="174" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#17171a">Кнопка</text>
      </Frame>
    )
  }
  if (focus === 'image') {
    return (
      <Frame>
        <rect x="30" y="58" width="140" height="110" rx="6" fill="#2a2a34" stroke="#3a3a44" />
        <circle cx="62" cy="88" r="10" fill="#c8912b" />
        <path d="M 40 153 L 80 108 L 105 133 L 130 98 L 160 153 Z" fill="#3a3a44" />
        <rect x="55" y="186" width="90" height="10" rx="5" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'color') {
    return (
      <Frame>
        <rect x="20" y="56" width="35" height="120" rx="4" fill="#3e37e0" />
        <rect x="58" y="56" width="35" height="120" rx="4" fill="#e0523e" />
        <rect x="96" y="56" width="35" height="120" rx="4" fill="#c8912b" />
        <rect x="134" y="56" width="35" height="120" rx="4" fill="#2fa36b" />
        <rect x="20" y="186" width="160" height="10" rx="5" fill="#3a3a44" />
      </Frame>
    )
  }
  if (focus === 'typography') {
    return (
      <Frame>
        <text x="30" y="80" fontFamily="serif" fontSize="34" fontWeight="bold" fill="#e8e8ec">Aa</text>
        <rect x="30" y="98" width="130" height="8" rx="4" fill="#5a5a66" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="30" y={118 + i * 16} width={140 - i * 18} height="7" rx="3.5" fill="#3a3a44" />
        ))}
      </Frame>
    )
  }
  if (focus === 'header') {
    return (
      <Frame>
        <rect x="20" y="46" width="160" height="30" rx="4" fill={accent} opacity="0.9" />
        <circle cx="35" cy="61" r="7" fill="#17171a" />
        <rect x="120" y="55" width="16" height="6" rx="3" fill="#17171a" />
        <rect x="140" y="55" width="16" height="6" rx="3" fill="#17171a" />
        <rect x="160" y="55" width="12" height="6" rx="3" fill="#17171a" />
        <rect x="20" y="86" width="160" height="80" rx="4" fill="#2a2a34" opacity="0.6" />
      </Frame>
    )
  }
  if (focus === 'footer') {
    return (
      <Frame>
        <rect x="20" y="50" width="160" height="120" rx="4" fill="#2a2a34" opacity="0.4" />
        <rect x="20" y="182" width="160" height="40" rx="4" fill={accent} opacity="0.85" />
        <circle cx="45" cy="202" r="6" fill="#17171a" />
        <circle cx="65" cy="202" r="6" fill="#17171a" />
        <circle cx="85" cy="202" r="6" fill="#17171a" />
      </Frame>
    )
  }
  if (focus === 'form') {
    return (
      <Frame>
        <rect x="30" y="54" width="140" height="22" rx="4" fill="#2a2a34" stroke="#3a3a44" />
        <rect x="30" y="84" width="140" height="22" rx="4" fill="#2a2a34" stroke="#3a3a44" />
        <rect x="65" y="120" width="70" height="26" rx="13" fill={accent} />
        <text x="80" y="137" fontFamily="sans-serif" fontSize="9" fontWeight="bold" fill="#17171a">Готово</text>
      </Frame>
    )
  }
  if (focus === 'layout') {
    return (
      <Frame>
        <rect x="20" y="50" width="160" height="26" rx="3" fill="#2a2a34" />
        <rect x="20" y="82" width="48" height="90" rx="3" fill="#2a2a34" />
        <rect x="74" y="82" width="48" height="90" rx="3" fill={accent} opacity="0.85" />
        <rect x="128" y="82" width="52" height="90" rx="3" fill="#2a2a34" />
        <rect x="20" y="178" width="160" height="16" rx="3" fill="#2a2a34" />
      </Frame>
    )
  }
  if (focus === 'wireframe') {
    return (
      <Frame>
        <rect x="20" y="46" width="160" height="150" rx="4" fill="none" stroke="#5a5a66" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x="32" y="58" width="60" height="10" rx="2" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
        <rect x="32" y="80" width="136" height="50" rx="2" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
        <rect x="32" y="140" width="65" height="40" rx="2" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
        <rect x="103" y="140" width="65" height="40" rx="2" fill="none" stroke="#5a5a66" strokeWidth="1.5" />
      </Frame>
    )
  }
  // default: загальний макет сайту
  return (
    <Frame>
      <rect x="20" y="46" width="160" height="22" rx="4" fill={accent} opacity="0.85" />
      <rect x="20" y="74" width="160" height="60" rx="4" fill="#2a2a34" />
      <rect x="32" y="90" width="100" height="10" rx="5" fill="#8a8a9a" />
      <rect x="32" y="106" width="70" height="10" rx="5" fill="#8a8a9a" />
      <rect x="32" y="122" width="40" height="12" rx="6" fill={accent} />
      <rect x="20" y="142" width="75" height="44" rx="4" fill="#2a2a34" />
      <rect x="105" y="142" width="75" height="44" rx="4" fill="#2a2a34" />
      <rect x="20" y="196" width="160" height="34" rx="4" fill="#26262e" />
    </Frame>
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
  // playScene читає ЦЕ, а не параметр функції чи замкнене значення стану —
  // інакше кнопка звуку, натиснута ПІД ЧАС відтворення, ніяк не впливала б
  // на наступні сцени (voiceOn із замикання застиг би на моменті старту).
  const voiceOnRef = useRef(true)

  function cleanup() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; audioRef.current = null }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }

  useEffect(() => () => cleanup(), [])

  // Кнопка звуку працює в будь-який момент, і навіть коли аудіо вже
  // грає — миттєво вмикає/вимикає його через .muted, без перезапуску сцени.
  function toggleVoice() {
    setVoiceOn((v) => {
      const next = !v
      voiceOnRef.current = next
      if (audioRef.current) audioRef.current.muted = !next
      return next
    })
  }

  async function playScene(i, myId) {
    if (i >= scenes.length) {
      if (myId === requestIdRef.current) { setState('done'); cleanup() }
      return
    }
    setSceneIndex(i)

    if (!voiceOnRef.current) {
      // Беззвучний режим — просто текстові слайди, що гортаються за часом
      // на читання, без жодного звернення до голосового рушія.
      setState('playing')
      timeoutRef.current = setTimeout(() => { if (myId === requestIdRef.current) playScene(i + 1, myId) }, readingDuration(scenes[i].caption))
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
      audio.muted = !voiceOnRef.current
      audioRef.current = audio
      audio.onended = () => { if (myId === requestIdRef.current) playScene(i + 1, myId) }
      audio.onerror = () => { if (myId === requestIdRef.current) playScene(i + 1, myId) }
      await audio.play()
      if (myId !== requestIdRef.current) return
      setState('playing')
    } catch {
      // Озвучення не вдалося (мережа тощо) — все одно показуємо картку й
      // перейдемо далі за часом, щоб короткий огляд не завис назавжди.
      if (myId !== requestIdRef.current) return
      setState('playing')
      timeoutRef.current = setTimeout(() => { if (myId === requestIdRef.current) playScene(i + 1, myId) }, 2500)
    }
  }

  function start() {
    const myId = ++requestIdRef.current
    voiceOnRef.current = voiceOn
    playScene(0, myId)
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
        <BrowserMockup focus={isActive ? scene.focus : (scenes[0]?.focus || 'site')} alert={isActive && scene.kind === 'mistake'} />

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
        <button
          className="harmony-btn"
          onClick={toggleVoice}
          title={voiceOn ? 'Вимкнути звук' : 'Увімкнути звук'}
          aria-label={voiceOn ? 'Вимкнути звук' : 'Увімкнути звук'}
        >
          {voiceOn ? '🔊' : '🔇'}
        </button>
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
