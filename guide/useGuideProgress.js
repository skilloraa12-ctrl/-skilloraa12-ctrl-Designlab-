// Довідник progress: completed lessons (guideCompletedLessons), the lesson
// the user was last reading (guideCurrentLesson), and a combined
// guideProgress snapshot kept for quick per-category percentage lookups.
import { useState, useCallback, useEffect } from 'react'
import { loadJSON, saveJSON } from '../storage.js'

export function useGuideProgress() {
  const [completed, setCompleted] = useState(() => loadJSON('guideCompletedLessons', []))
  const [current, setCurrent] = useState(() => loadJSON('guideCurrentLesson', null))

  useEffect(() => {
    saveJSON('guideCompletedLessons', completed)
  }, [completed])

  useEffect(() => {
    saveJSON('guideCurrentLesson', current)
  }, [current])

  const markComplete = useCallback((lessonId) => {
    setCompleted((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]))
  }, [])

  const unmarkComplete = useCallback((lessonId) => {
    setCompleted((prev) => prev.filter((id) => id !== lessonId))
  }, [])

  const isComplete = useCallback((lessonId) => completed.includes(lessonId), [completed])

  const visitLesson = useCallback((lessonId) => {
    setCurrent(lessonId)
  }, [])

  return { completed, markComplete, unmarkComplete, isComplete, current, visitLesson }
}
