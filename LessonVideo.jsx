import { useState } from 'react'

// Показує відео-урок, ЛИШЕ якщо файл реально існує в public/lesson-videos/
// (див. README.md там). Якщо module.video === true, а файла ще нема
// (пілотний урок, відео в процесі виготовлення) — плеєр просто НІЧОГО не
// рендерить замість того, щоб показати зламаний/порожній плеєр. Це
// свідомо: показана користувачу функція має працювати, а не мовчки ні.
//
// Шлях будується через import.meta.env.BASE_URL, а не як /lesson-videos/…
// напряму — сайт задеплоєний не в корінь домену (vite.config.js: base
// "/-skilloraa12-ctrl-Designlab-/"), тож абсолютний шлях без цього
// префіксу в проді просто не знайде файл.
export default function LessonVideo({ video, moduleId }) {
  const [failed, setFailed] = useState(false)
  if (!video || failed) return null

  const base = import.meta.env.BASE_URL + 'lesson-videos/'

  return (
    <div className="lesson-video">
      <p className="eyebrow">🎬 Відео-урок</p>
      <video
        controls
        preload="metadata"
        poster={base + moduleId + '.jpg'}
        onError={() => setFailed(true)}
        className="lesson-video-player"
      >
        <source src={base + moduleId + '.mp4'} type="video/mp4" />
      </video>
    </div>
  )
}
