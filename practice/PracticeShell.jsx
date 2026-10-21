import { useEffect, useRef, useState, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useLabHistory } from '../labs/useLabHistory.js'
import { VERSIONS, versionForLevel, versionRank, pushSnapshot } from './practiceProject.js'
import { runValidation } from './practiceValidators.js'

// Спільний каркас вкладки «Практика» — ТЗ розділ 3 (зони 1-7).
//
// Адаптація до React: ТЗ описує рушії через mount(container, ctx)/
// loadProject/getProject/validate()/destroy() — інтерфейс для рушія, що
// монтується у довільний DOM. Увесь сайт тут уже написаний на React, тож
// повторювати окрему vanilla-DOM систему монтування всередині React-дерева
// було б штучним дублюванням, а не чесним рішенням. Натомість кожен
// редактор — звичайний React-компонент із контрактом:
//   <Editor project version allowedTools onChange(nextProject) />
// Він сам відповідає за зони 2 (інструменти), 3 (полотно), 4 (властивості)
// і 6 (нижня панель) одним внутрішнім layout-ом — PracticeShell довкола
// нього відповідає лише за зони 1 (верхня панель), 5 (завдання) і 7 (рядок
// стану), спільні для всіх редакторів. getProject()/validate() не потрібні
// окремо: стан проєкту й так завжди в practiceProject.project, а
// validate() — це runValidation(project, task.goals) із practiceValidators.js.

export default function PracticeShell({ module, task, practiceProject, onPatch, xp, level, EditorComponent, editorLabel }) {
  const history = useLabHistory(practiceProject.project, 100)
  const project = history.value
  const saveTimer = useRef(null)
  const [saveState, setSaveState] = useState('saved') // saved | dirty | saving
  const [taskOpen, setTaskOpen] = useState(true)
  const [hintLevel, setHintLevel] = useState(practiceProject.hintsUsed || 0)
  const [checkResult, setCheckResult] = useState(practiceProject.lastResults?.length ? { results: practiceProject.lastResults, pct: practiceProject.score / 100 } : null)
  const [versionMenuOpen, setVersionMenuOpen] = useState(false)

  const maxVersion = versionForLevel(level)
  const version = practiceProject.version && versionRank(practiceProject.version) <= versionRank(maxVersion) ? practiceProject.version : maxVersion

  // Автозбереження через 10с бездіяльності після зміни — FR-SH-003.
  useEffect(() => {
    if (project === practiceProject.project) return
    setSaveState('dirty')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaveState('saving')
      onPatch({ project, attempts: practiceProject.attempts })
      setSaveState('saved')
    }, 10000)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  useEffect(() => {
    function onBlur() {
      if (saveState === 'dirty') {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        onPatch({ project })
        setSaveState('saved')
      }
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState, project])

  function saveNow() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    onPatch({ project })
    setSaveState('saved')
  }

  function handleCheck() {
    const r = runValidation(project, task.goals)
    setCheckResult(r)
    const attempts = (practiceProject.attempts || 0) + 1
    let patch = { project, attempts, lastResults: r.results, score: Math.round(r.pct * 100) }
    if (r.passed) {
      const hintPenalty = Math.max(0, 1 - Math.max(0, hintLevel - 1) * 0.1)
      const earnedXp = Math.round(task.xp * r.pct * hintPenalty)
      patch = { ...patch, status: 'passed', earnedXp: Math.max(practiceProject.earnedXp || 0, earnedXp) }
    }
    onPatch(patch)
    setSaveState('saved')
  }

  // Кнопка показує «Ctrl+Enter» — без цього слухача це був напис без дії.
  const handleCheckRef = useRef(handleCheck)
  useEffect(() => { handleCheckRef.current = handleCheck })
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCheckRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function useHint() {
    const next = Math.min(3, hintLevel + 1)
    setHintLevel(next)
    onPatch({ hintsUsed: next })
  }

  function resetTask() {
    history.reset(task.startProject)
    setCheckResult(null)
    setHintLevel(0)
    onPatch({ project: task.startProject, status: 'draft', score: 0, hintsUsed: 0, lastResults: [] })
  }

  function changeVersion(v) {
    if (versionRank(v) > versionRank(maxVersion)) return
    onPatch({ version: v })
    setVersionMenuOpen(false)
  }

  const exhausted = (practiceProject.attempts || 0) >= task.maxAttempts
  const checklistDone = checkResult ? checkResult.results.filter((r) => r.ok).length : 0
  const checklistTotal = task.goals.length

  return (
    <div className="practice-shell">
      {/* Зона 1 — верхня панель */}
      <div className="practice-topbar">
        <Link to={`/module/${module.id}`} className="practice-logo">DESIGNLAB · Практика</Link>
        <div className="practice-crumbs">
          <Link to={`/academy/${module.level}`}>{module.level}</Link>
          <span>›</span>
          <span className="practice-crumb-current">{module.title}</span>
        </div>
        <div className="practice-spacer" />
        {/* На мобільних (<768px) .practice-body/.practice-bottom ховаються
            честоvо заглушкою «відкрийте на більшому екрані» — ці елементи
            керування редактором (версія/undo/redo/збереження/XP) нічого не
            редагують без видимого редактора під ними, тож теж ховаємо їх
            класом .practice-topbar-controls, щоб не показувати нефункціональний UI. */}
        <div className="practice-topbar-controls">
          <div className="practice-version-wrap">
            <button className="cl-mini-btn" onClick={() => setVersionMenuOpen((v) => !v)}>
              {VERSIONS.find((v) => v.id === version)?.label} ({version}) ▾
            </button>
            {versionMenuOpen && (
              <div className="practice-version-menu">
                {VERSIONS.map((v) => {
                  const locked = versionRank(v.id) > versionRank(maxVersion)
                  return (
                    <button
                      key={v.id}
                      className={'practice-version-item' + (v.id === version ? ' active' : '') + (locked ? ' locked' : '')}
                      disabled={locked}
                      onClick={() => changeVersion(v.id)}
                      title={locked ? `Відкриється на рівні ${v.minLevel}` : ''}
                    >
                      {v.label} · {v.id}{locked && <span className="practice-lock">🔒 рівень {v.minLevel}</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button className="cl-mini-btn" disabled={!history.canUndo} onClick={history.undo} title="Ctrl+Z">↶</button>
          <button className="cl-mini-btn" disabled={!history.canRedo} onClick={history.redo} title="Ctrl+Shift+Z">↷</button>
          <button className="cl-mini-btn" onClick={saveNow} title="Ctrl+S">
            {saveState === 'saved' ? '✓ Збережено' : saveState === 'saving' ? '⏳ Збереження…' : '● Є зміни'}
          </button>
          <span className="gfx-xp-pill">XP {xp} · Рівень {level}</span>
        </div>
      </div>

      <div className="practice-body">
        {EditorComponent ? (
          <Suspense fallback={<div className="practice-coming-soon"><p className="cl-tab-desc">Завантаження редактора…</p></div>}>
            <EditorComponent
              project={project}
              version={version}
              allowedTools={task.allowedTools}
              onChange={(next) => history.set(next)}
            />
          </Suspense>
        ) : (
          <div className="practice-coming-soon">
            <p className="cl-section-title">{editorLabel} — редактор у розробці</p>
            <p className="cl-tab-desc">Цей рушій ще не збудовано в цьому заході. Чесно показуємо заглушку замість фейкового інструмента.</p>
          </div>
        )}

        {/* Зона 5 — завдання */}
        <div className={'practice-task-panel' + (taskOpen ? '' : ' collapsed')}>
          <button className="practice-task-toggle" onClick={() => setTaskOpen((v) => !v)}>
            {taskOpen ? '▾' : '▸'} Завдання
          </button>
          {taskOpen && (
            <div className="practice-task-body">
              <p className="practice-task-title">{task.title}</p>
              <p className="cl-tab-desc">{task.goal}</p>
              <div className="practice-progress-bar"><div className="practice-progress-fill" style={{ width: `${checklistTotal ? (checklistDone / checklistTotal) * 100 : 0}%` }} /></div>
              <p className="cl-tab-desc">{checklistDone} / {checklistTotal}</p>
              <ul className="practice-checklist">
                {task.goals.map((g) => {
                  const r = checkResult?.results.find((x) => x.id === g.id)
                  const icon = !r ? '○' : r.ok ? '✓' : '✗'
                  return (
                    <li key={g.id} className={r ? (r.ok ? 'ok' : 'fail') : ''}>
                      <span className="practice-check-icon">{icon}</span> {g.text}
                      {r && !r.ok && <span className="practice-check-reason"> — {r.message}</span>}
                    </li>
                  )
                })}
              </ul>
              <div className="cl-btn-row">
                <button className="harmony-btn active" onClick={handleCheck}>Перевірити (Ctrl+Enter)</button>
                <button className="cl-mini-btn" onClick={useHint} disabled={hintLevel >= 3}>
                  Підказка {hintLevel}/3
                </button>
                <button className="cl-mini-btn" onClick={resetTask}>Скинути</button>
              </div>
              {hintLevel > 0 && (
                <div className="practice-hints">
                  {task.hints.slice(0, hintLevel).map((h, i) => <p key={i} className="cl-tab-desc">💡 {h}</p>)}
                </div>
              )}
              {exhausted && (
                <p className="cl-tab-desc">Спроби вичерпано (0 XP за рішення). <code>task.solution</code> не заданий для цього завдання — покажи учню еталон уроку вручну.</p>
              )}
              <p className="cl-tab-desc">Нагорода: +{task.xp} XP · Спроб {practiceProject.attempts || 0} / {task.maxAttempts}</p>
              {checkResult?.passed && <p className="practice-passed">✓ Завдання зараховано — +{practiceProject.earnedXp || 0} XP</p>}
            </div>
          )}
        </div>
      </div>

      {/* Зона 7 — рядок стану */}
      <div className="practice-statusbar">
        <span>{editorLabel}</span>
        <span>Версія {version}</span>
        <span>{saveState === 'saved' ? 'Збережено' : saveState === 'saving' ? 'Збереження…' : 'Є незбережені зміни'}</span>
      </div>
    </div>
  )
}
