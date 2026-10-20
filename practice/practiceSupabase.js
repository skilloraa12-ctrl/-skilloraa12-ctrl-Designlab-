// Супабейз-шар вкладки «Практика» — таблиця practice_projects
// (supabase/practice.sql). Той самий відмовостійкий патерн, що й
// mentorFeedback.js: таймаут на запит (мережа інколи зависає замість
// явної помилки) і тихий, явно позначений fallback, якщо таблиці ще
// немає (SQL-міграцію не виконали) чи мережі немає — вкладка «Практика»
// тоді працює лише в межах цього відвідування, без синхронізації між
// пристроями, а не падає.
import { supabase } from '../supabaseClient.js'

function withTimeout(promise, ms = 4000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут запиту до practice_projects')), ms)),
  ])
}

function fromRow(r) {
  return {
    id: r.id,
    taskId: r.task_id,
    lessonId: r.lesson_id,
    editor: r.editor,
    profile: r.profile,
    version: r.version,
    project: r.project,
    status: r.status,
    score: r.score,
    attempts: r.attempts,
    hintsUsed: r.hints_used,
    earnedXp: r.earned_xp,
    lastResults: r.last_results,
    snapshots: r.snapshots,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toRow(userId, p) {
  return {
    id: p.id,
    user_id: userId,
    task_id: p.taskId,
    lesson_id: p.lessonId,
    editor: p.editor,
    profile: p.profile,
    version: p.version,
    project: p.project,
    status: p.status,
    score: p.score,
    attempts: p.attempts,
    hints_used: p.hintsUsed,
    earned_xp: p.earnedXp || 0,
    last_results: p.lastResults || [],
    snapshots: p.snapshots || [],
    updated_at: new Date().toISOString(),
  }
}

// Повертає practiceProject для цього завдання, null якщо ще немає
// запису АБО таблиця/мережа недоступні (виклик не відрізняє ці два
// випадки для простоти — в обох варто просто почати новий локальний
// проєкт, див. PracticePage.jsx).
export async function loadPracticeProject(userId, taskId) {
  if (!userId) return null
  try {
    const { data, error } = await withTimeout(
      supabase.from('practice_projects').select('*').eq('user_id', userId).eq('task_id', taskId).maybeSingle()
    )
    if (error) {
      console.warn('Не вдалося завантажити практичний проєкт (можливо, таблицю practice_projects ще не створено — supabase/practice.sql)', error)
      return null
    }
    return data ? fromRow(data) : null
  } catch (err) {
    console.warn('Мережева помилка при завантаженні практичного проєкту', err)
    return null
  }
}

export async function savePracticeProjectRemote(userId, practiceProject) {
  if (!userId) return
  try {
    const { error } = await withTimeout(
      supabase.from('practice_projects').upsert(toRow(userId, practiceProject), { onConflict: 'user_id,task_id' })
    )
    if (error) console.warn('Не вдалося зберегти практичний проєкт у Supabase — зміни лишились лише локально', error)
  } catch (err) {
    console.warn('Мережева помилка при збереженні практичного проєкту', err)
  }
}
