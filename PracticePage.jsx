import { useEffect, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { getModule } from './modules.js'
import { useProgress } from './ProgressContext.jsx'
import { getPracticeTask } from './practice/practiceTasks.js'
import { createEmptyPracticeProject } from './practice/practiceProject.js'
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
  const { practiceProjects, savePracticeProject, xp, level } = useProgress()
  const task = module ? getPracticeTask(module) : null
  const existing = task ? practiceProjects.find((p) => p.taskId === task.taskId) : null
  const [localProject, setLocalProject] = useState(null)

  // Перший візит на це завдання: записи ще нема в ProgressContext, тож
  // створюємо його побічним ефектом (не під час рендеру — інакше React
  // попереджає "setState під час рендеру іншого компонента").
  useEffect(() => {
    if (task && !existing && !localProject) {
      const fresh = createEmptyPracticeProject(task)
      setLocalProject(fresh)
      savePracticeProject(fresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.taskId, existing, localProject])

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

  const practiceProject = existing || localProject
  if (!practiceProject) return <p style={{ padding: 24, color: 'var(--muted)' }}>Завантаження…</p>

  const editorInfo = EDITORS[task.editor]

  function onPatch(patch) {
    savePracticeProject({ ...practiceProject, ...patch, id: practiceProject.id })
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
