import { useEffect, useRef, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { getModule } from './modules.js'
import { useAuth } from './AuthContext.jsx'
import { useProgress } from './ProgressContext.jsx'
import { getPracticeTask } from './practice/practiceTasks.js'
import { createEmptyPracticeProject } from './practice/practiceProject.js'
import { loadPracticeProject, savePracticeProjectRemote } from './practice/practiceSupabase.js'
import PracticeShell from './practice/PracticeShell.jsx'
import VectorStudio from './practice/editors/VectorStudio.jsx'

const EDITORS = {
  vector: { Component: VectorStudio, label: 'Vector Studio' },
  threeD: { Component: null, label: '3D Studio' },
  flow: { Component: null, label: 'Flow & Layout Studio' },
  motion: { Component: null, label: 'Motion Studio' },
  gameBoard: { Component: null, label: 'Game Systems Board' },
}

export default function PracticePage() {
  const { id } = useParams()
  const module = getModule(id)
  const { user } = useAuth()
  const { xp, level, addPracticeXp } = useProgress()
  const task = module ? getPracticeTask(module) : null

  const [practiceProject, setPracticeProject] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef(null)

  // Завантаження: спершу з Supabase (practice_projects, FR-DAT-002), а
  // якщо таблиці/запису ще немає — новий проєкт лише в памʼяті браузера
  // (practiceSupabase.js сам розрізняє ці випадки лише через console.warn,
  // для UI вони однакові: "почни заново").
  useEffect(() => {
    let active = true
    setLoaded(false)
    setPracticeProject(null)
    if (!task || !user) return
    loadPracticeProject(user.id, task.taskId).then((remote) => {
      if (!active) return
      setPracticeProject(remote || createEmptyPracticeProject(task))
      setLoaded(true)
    })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.taskId, user?.id])

  if (!module) return <Navigate to="/academy" replace />

  if (!task) {
    return (
      <div style={{ maxWidth: 560 }}>
        <Link to={`/module/${module.id}`} className="back-link">← {module.title}</Link>
        <h1 className="page-title">Практика ще не готова</h1>
        <p className="page-sub">Для напряму «{module.level}» редактор практики ще не збудований цього заходу. Чесно показуємо це, а не підробку.</p>
      </div>
    )
  }

  if (!loaded || !practiceProject) return <p style={{ padding: 24, color: 'var(--muted)' }}>Завантаження…</p>

  const editorInfo = EDITORS[task.editor]

  function onPatch(patch) {
    setPracticeProject((prev) => {
      const next = { ...prev, ...patch }
      // XP з практики рахується в загальний рівень (щоб версії v2/v3
      // розблоковувались і від практики, не лише від пройдених уроків) —
      // але лише на ПРИРІСТ earnedXp цього конкретного завдання, щоб
      // повторне проходження не нараховувало те саме ще раз.
      if (typeof patch.earnedXp === 'number' && patch.earnedXp > (prev.earnedXp || 0)) {
        addPracticeXp(patch.earnedXp - (prev.earnedXp || 0))
      }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => savePracticeProjectRemote(user.id, next), 2000)
      return next
    })
  }

  return (
    <PracticeShell
      module={module}
      task={task}
      practiceProject={practiceProject}
      onPatch={onPatch}
      xp={xp}
      level={level}
      EditorComponent={editorInfo?.Component}
      editorLabel={editorInfo?.label || task.editor}
    />
  )
}
