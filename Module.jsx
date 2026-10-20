import { useState } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { getModule, MODULES } from './modules.js'
import { getSubcategory } from './subcategories.js'
import { useProgress } from './ProgressContext.jsx'
import { createEmptyMotionProject } from './motionProject.js'
import { createEmptyUxProject } from './uxProject.js'
import { createEmptyGameArtProject, GAME_ART_SUBCAT_SECTION } from './gameArtProject.js'
import { createEmptyLogoProject, LOGO_SUBCAT_SECTION } from './logoProject.js'
import { createEmptyGraphicProject, GRAPHIC_SUBCAT_SECTION } from './graphicProject.js'
import { createEmptyAdProject, AD_SUBCAT_SECTION } from './adProject.js'
import { createEmptyThreeDProject, THREED_SUBCAT_SECTION } from './threeDProject.js'
import Quiz from './Quiz.jsx'
import SketchPad from './SketchPad.jsx'
import GameDesignStudio from './GameDesignStudio.jsx'
import GraphicDesignStudio from './GraphicDesignStudio.jsx'
import LessonMentor from './LessonMentor.jsx'
import AudioNarration from './AudioNarration.jsx'
import PresentationMode from './PresentationMode.jsx'
import GlossaryText from './GlossaryText.jsx'
import LessonVideo from './LessonVideo.jsx'
import LessonReel from './LessonReel.jsx'
import { getPracticeTools } from './practiceTools.js'

// Ці 2 підкатегорії Game Design свідомо спираються на окремий Game
// Design Lab (/labs/game, HUD/меню-білдер), а не на загальний Game
// Design Studio — так само, як прокоментовано в subcategories.js.
const GAME_LAB_SUBCATS = ['hud-ingame-ui', 'game-menus-navigation']

// Кожен урок Motion Design веде в конкретний етап реального Motion
// Design Studio (канва + таймлайн + keyframes), а не в загальний,
// однаковий для всіх завдань Motion Lab — підкатегорія уроку визначає,
// який етап студії відкриється.
const MOTION_SUBCAT_STAGE = {
  'motion-basics': 'idea',
  'motion-principles': 'animation',
  'motion-timing-easing': 'animation',
  'motion-ui': 'animation',
  'motion-typography': 'animation',
  'motion-shape-logo': 'animation',
  'motion-storyboard': 'storyboard',
  'motion-sound': 'sound',
  'motion-tools-export': 'export',
  'motion-process': 'idea',
  'motion-portfolio': 'presentation',
}

// Кожен урок UX Design веде в конкретний етап реальної UX Design
// Studio — підкатегорія уроку буквально повторює крок UX-процесу
// (uxProject.js: UX_STAGES), тож мапінг тут прямий, 1-в-1.
const UX_SUBCAT_STAGE = {
  'ux-basics': 'research',
  'ux-research': 'research',
  'ux-analysis': 'research',
  'ux-problem': 'problem',
  'ux-persona': 'persona',
  'ux-journey': 'journey',
  'ux-ia': 'ia',
  'ux-flow': 'flow',
  'ux-wireframe': 'wireframe',
  'ux-prototype': 'prototype',
  'ux-testing': 'testing',
  'ux-iteration': 'audit',
  'ux-case-portfolio': 'presentation',
}

export default function Module() {
  const { id } = useParams()
  const module = getModule(id)
  const { completed, toggleModule, quizPassed, passQuiz, addPortfolioItem, motionProjects, saveMotionProject, uxProjects, saveUxProject, gameArtProjects, saveGameArtProject, logoProjects, saveLogoProject, adProjects, saveAdProject, threeDProjects, saveThreeDProject, graphicProjects, saveGraphicProject } = useProgress()
  const navigate = useNavigate()
  const [sketchOpen, setSketchOpen] = useState(false)
  const [presentationOpen, setPresentationOpen] = useState(false)
  const [mentorOpen, setMentorOpen] = useState(false)

  if (!module) return <Navigate to="/academy" replace />

  const done = !!completed[module.id]
  const testDone = !!quizPassed[module.id]
  const usesGameLab = module.level === 'game-design' && GAME_LAB_SUBCATS.includes(module.subcategory)
  // Motion Design відкриває справжню Motion Studio (канва+таймлайн+
  // keyframes), так само, як Graphic/Branding відкривають Graphic
  // Design Studio — замість посилання на спільний, однаковий для всіх
  // уроків Motion Lab.
  const usesMotionStudio = module.level === 'motion-design'
  // UX Design відкриває справжню UX Design Studio (research/persona/
  // journey/flow/wireframe/prototype/...) замість загального ескізу.
  const usesUxStudio = module.level === 'ux-design'
  // Game Art відкриває справжню Game Art Studio (асети/рев'ю/версії)
  // замість загального ескізу.
  const usesGameArtStudio = module.level === 'game-art'
  // Logo Design відкриває справжню Logo Design Studio (SVG-конструктор/
  // кольорові варіанти/перевірка масштабу) замість загального ескізу.
  const usesLogoStudio = module.level === 'logo-design'
  // Advertising Design відкриває справжню Advertising Design Studio
  // (конструктор оголошення/перевірка форматів/A-B-варіанти) замість
  // загального ескізу.
  const usesAdStudio = module.level === 'advertising-design'
  // 3D Design відкриває справжню 3D Design Studio (облік об'єктів/сцен
  // побудованих у 3D Lab, матеріали, вимоги, рев'ю, версії) замість
  // загального ескізу.
  const usesThreeDStudio = module.level === '3d-design'
  // Graphic Design відкриває справжню Graphic Design Studio (вже наявний
  // растрово-векторний редактор + палітра з WCAG-контрастом + перевірка
  // форматів) замість загального ескізу. Branding свідомо лишається на
  // модальному GraphicDesignStudio — окремий практичний інструмент для
  // логотипу всередині свого напряму, не спільний проєкт.
  const usesGraphicStudio = module.level === 'graphic-design'
  const subcategory = getSubcategory(module.subcategory)
  const lessonsInSubcat = MODULES.filter((m) => m.subcategory === module.subcategory)
  const idx = lessonsInSubcat.findIndex((m) => m.id === module.id)
  const prev = lessonsInSubcat[idx - 1]
  const next = lessonsInSubcat[idx + 1]
  const practiceTools = getPracticeTools(module.subcategory)

  return (
    <div>
      <Link to={`/academy/${module.level}/${module.subcategory}`} className="back-link">← {subcategory?.title || 'Академія'}</Link>
      <p className="eyebrow">{subcategory?.emoji} {subcategory?.title} · Урок {String(idx + 1).padStart(2, '0')} з {lessonsInSubcat.length}</p>

      <div className="module-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>{module.title}</h1>
        <button
          className={'complete-btn' + (done ? ' done' : '')}
          onClick={() => toggleModule(module.id)}
        >
          {done ? '✓ Пройдено' : 'Позначити пройденим'}
        </button>
      </div>

      <LessonReel module={module} />
      <LessonVideo video={module.video} moduleId={module.id} />

      {module.theory && <p className="module-theory"><GlossaryText text={module.theory} /></p>}

      {module.theory && (
        <div className="module-media-row">
          <button className="harmony-btn" onClick={() => setPresentationOpen(true)}>
            🗣️ Слайди з голосом (автоматично)
          </button>
          <AudioNarration
            key={module.id}
            text={`${module.title}. ${module.theory} ${(module.keyPoints || []).join('. ')}`}
          />
          <a
            className="harmony-btn"
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(module.title + ' дизайн урок')}`}
            target="_blank"
            rel="noreferrer"
          >
            🎥 Знайти відео на YouTube
          </a>
        </div>
      )}

      {presentationOpen && (
        <PresentationMode module={module} onClose={() => setPresentationOpen(false)} />
      )}

      {module.keyPoints && module.keyPoints.length > 0 && (
        <div className="callout callout--points">
          <p className="eyebrow">КЛЮЧОВІ ПРИНЦИПИ</p>
          <ul className="callout-list">
            {module.keyPoints.map((p, i) => <li key={i}><GlossaryText text={p} /></li>)}
          </ul>
        </div>
      )}

      {module.mistakes && module.mistakes.length > 0 && (
        <div className="callout callout--mistakes">
          <p className="eyebrow" style={{ color: 'var(--coral)' }}>ТИПОВІ ПОМИЛКИ</p>
          <ul className="callout-list">
            {module.mistakes.map((m, i) => <li key={i}><GlossaryText text={m} /></li>)}
          </ul>
        </div>
      )}

      <p className="eyebrow" style={{ marginTop: 28 }}>ТЕМИ МОДУЛЯ</p>
      <ul className="topic-list">
        {module.topics.map((t, i) => <li key={i}>{t}</li>)}
      </ul>

      {module.practice && (
        <div className="practice-box">
          <p className="eyebrow">ПРАКТИКА</p>
          <p>{module.practice}</p>

          {module.example && (
            <div className="example-block">
              <p className="eyebrow" style={{ marginTop: 16 }}>ПРИКЛАД ВИКОНАННЯ</p>
              <p className="example-text">{module.example}</p>
            </div>
          )}

          {module.tools && (module.tools.free.length > 0 || module.tools.paid.length > 0) && (
            <div className="tools-block">
              <p className="eyebrow" style={{ marginTop: 16 }}>ДЕ ВИКОНАТИ ЗАВДАННЯ</p>
              <div className="tools-row">
                {module.tools.free.map((t, i) => {
                  if (t.url) {
                    return <a key={'f' + i} href={t.url} target="_blank" rel="noreferrer" className="tool-badge tool-badge--free">{t.name} · безкоштовно</a>
                  }
                  // Бейдж про вбудований ескізник має сам відкривати SketchPad,
                  // а не бути просто написом, що дублює кнопку нижче —
                  // інакше клік по ньому виглядає як кнопка, що не працює.
                  if (t.name.includes('ескізник') || t.name.includes('Game Design Studio') || t.name.includes('Graphic Design Studio')) {
                    return (
                      <button
                        key={'f' + i}
                        type="button"
                        className="tool-badge tool-badge--free tool-badge--action"
                        onClick={() => setSketchOpen(true)}
                      >
                        {t.name} · безкоштовно
                      </button>
                    )
                  }
                  return <span key={'f' + i} className="tool-badge tool-badge--free">{t.name} · безкоштовно</span>
                })}
                {module.tools.paid.map((t, i) => (
                  <a key={'p' + i} href={t.url} target="_blank" rel="noreferrer" className="tool-badge tool-badge--paid">{t.name} · платно</a>
                ))}
              </div>
            </div>
          )}

          {practiceTools.length > 0 && (
            <div className="practice-tools">
              <p className="practice-tools-title">Де ще можна попрактикуватися</p>
              <div className="tools-row">
                {practiceTools.map((t, i) => {
                  const href = t.internal ? `/tools/${t.category}/${t.id}` : t.href
                  const label = `${t.name} · ${t.tag === 'free' ? 'безкоштовно' : t.tag === 'paid' ? 'платно' : 'freemium'}`
                  return t.internal ? (
                    <Link key={i} to={href} title={t.note} className={`tool-badge tool-badge--${t.tag}`}>{label}</Link>
                  ) : (
                    <a key={i} href={href} target="_blank" rel="noreferrer" title={t.note} className={`tool-badge tool-badge--${t.tag}`}>{label}</a>
                  )
                })}
              </div>
              <p className="practice-tools-note">Це не «або-або»: ескізник у застосунку теж рахується як виконане завдання — ці інструменти корисні, якщо вже хочеш попрацювати в справжньому сервісі.</p>
            </div>
          )}

          {module.selfCheck && module.selfCheck.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 16 }}>ЯК ЗРОЗУМІТИ, ЩО ГОТОВО</p>
              <ul className="callout-list">
                {module.selfCheck.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {usesGameLab ? (
              <Link to="/labs/game" className="complete-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                🎯 Відкрити «Game Design Lab»
              </Link>
            ) : usesMotionStudio ? (
              <button
                className="complete-btn"
                onClick={() => {
                  const stage = MOTION_SUBCAT_STAGE[module.subcategory] || 'animation'
                  const existing = motionProjects[0]
                  const id = existing ? existing.id : saveMotionProject(createEmptyMotionProject())
                  navigate(`/motion-studio/${id}`, { state: { stage } })
                }}
              >
                🎬 Відкрити «Motion Design Studio»
              </button>
            ) : usesUxStudio ? (
              <button
                className="complete-btn"
                onClick={() => {
                  const stage = UX_SUBCAT_STAGE[module.subcategory] || 'research'
                  const existing = uxProjects[0]
                  const id = existing ? existing.id : saveUxProject(createEmptyUxProject('Новий UX-проєкт'))
                  navigate(`/ux-studio/${id}`, { state: { stage } })
                }}
              >
                🧠 Відкрити «UX Design Studio»
              </button>
            ) : usesGameArtStudio ? (
              <button
                className="complete-btn"
                onClick={() => {
                  const section = GAME_ART_SUBCAT_SECTION[module.subcategory] || 'concepts2d'
                  const existing = gameArtProjects[0]
                  const id = existing ? existing.id : saveGameArtProject(createEmptyGameArtProject('Новий проєкт Game Art'))
                  navigate(`/game-art-studio/${id}`, { state: { section, subcategory: module.subcategory } })
                }}
              >
                🎨 Відкрити «Game Art Studio»
              </button>
            ) : usesLogoStudio ? (
              <button
                className="complete-btn"
                onClick={() => {
                  const section = LOGO_SUBCAT_SECTION[module.subcategory] || 'builder'
                  const existing = logoProjects[0]
                  const id = existing ? existing.id : saveLogoProject(createEmptyLogoProject('Новий проєкт логотипа'))
                  navigate(`/logo-design-studio/${id}`, { state: { section, subcategory: module.subcategory } })
                }}
              >
                🏷️ Відкрити «Logo Design Studio»
              </button>
            ) : usesAdStudio ? (
              <button
                className="complete-btn"
                onClick={() => {
                  const section = AD_SUBCAT_SECTION[module.subcategory] || 'builder'
                  const existing = adProjects[0]
                  const id = existing ? existing.id : saveAdProject(createEmptyAdProject('Новий рекламний проєкт'))
                  navigate(`/advertising-design-studio/${id}`, { state: { section, subcategory: module.subcategory } })
                }}
              >
                📢 Відкрити «Advertising Design Studio»
              </button>
            ) : usesThreeDStudio ? (
              <button
                className="complete-btn"
                onClick={() => {
                  const section = THREED_SUBCAT_SECTION[module.subcategory] || 'objects'
                  const existing = threeDProjects[0]
                  const id = existing ? existing.id : saveThreeDProject(createEmptyThreeDProject('Новий 3D-проєкт'))
                  navigate(`/3d-design-studio/${id}`, { state: { section, subcategory: module.subcategory } })
                }}
              >
                🧊 Відкрити «3D Design Studio»
              </button>
            ) : usesGraphicStudio ? (
              <button
                className="complete-btn"
                onClick={() => {
                  const section = GRAPHIC_SUBCAT_SECTION[module.subcategory] || 'builder'
                  const existing = graphicProjects[0]
                  const id = existing ? existing.id : saveGraphicProject(createEmptyGraphicProject('Новий графічний проєкт'))
                  navigate(`/graphic-design-studio/${id}`, { state: { section, subcategory: module.subcategory } })
                }}
              >
                🖼️ Відкрити «Graphic Design Studio»
              </button>
            ) : (
              <button className="complete-btn" onClick={() => setSketchOpen(true)}>
                {module.level === 'game-design' ? '🖊 Відкрити «Game Design Studio»'
                  : module.level === 'branding' ? '🖊 Відкрити «Graphic Design Studio»'
                  : '🖊 Створити ескіз у застосунку'}
              </button>
            )}
            <Link to={`/practice/${module.id}`} className="complete-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              🧪 Практика
            </Link>
            <button className="mentor-cta" onClick={() => setMentorOpen(true)}>
              <span className="mentor-cta-icon">💬<span className="dot" /></span>
              <span>
                <span className="mentor-cta-title" style={{ display: 'block' }}>Запитати про урок</span>
                <span className="mentor-cta-sub" style={{ display: 'block' }}>Чат-бот відповість, якщо щось незрозуміло</span>
              </span>
            </button>
            <Link
              to="/portfolio"
              state={{ prefillTitle: module.title, prefillTags: [module.title] }}
              className="complete-btn"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              Додати виконану роботу в портфоліо →
            </Link>
          </div>

          {mentorOpen && (
            <LessonMentor module={module} prev={prev} next={next} onClose={() => setMentorOpen(false)} />
          )}

          {sketchOpen && module.level === 'game-design' && !usesGameLab && (
            <GameDesignStudio module={module} onClose={() => setSketchOpen(false)} />
          )}

          {sketchOpen && module.level === 'branding' && (
            <GraphicDesignStudio module={module} onClose={() => setSketchOpen(false)} />
          )}

          {sketchOpen && module.level !== 'game-design' && module.level !== 'graphic-design' && module.level !== 'branding' && (
            <SketchPad
              module={module}
              onClose={() => setSketchOpen(false)}
              onSave={(dataUrl) => {
                addPortfolioItem({
                  title: module.title + ' — ескіз',
                  desc: 'Створено у вбудованому Sketch Pad для практичного завдання цього модуля.',
                  tags: [module.title, 'sketch'],
                  image: dataUrl,
                })
                setSketchOpen(false)
              }}
            />
          )}
        </div>
      )}

      {module.quiz && (
        <>
          {testDone && (
            <p className="quiz-passed-note">✓ Тест уже пройдено — +20 XP нараховано.</p>
          )}
          <Quiz
            key={module.id}
            questions={module.quiz}
            onComplete={() => passQuiz(module.id)}
          />
        </>
      )}

      <div className="module-nav">
        {prev ? <Link to={`/module/${prev.id}`} className="link">← {prev.title}</Link> : <span />}
        {next ? <Link to={`/module/${next.id}`} className="link">{next.title} →</Link> : <span />}
      </div>
    </div>
  )
}
