// Спільна "пам'ять" помічника уроку — 👍/👎 від УСІХ учнів зберігаються
// в Supabase (таблиця mentor_feedback, supabase/mentor_feedback.sql) і
// разом впливають на ранжування відповідей, а не лише в тому браузері,
// де хтось проголосував. Якщо таблиці ще немає (SQL-міграцію не
// виконали) — усі функції тихо повертають "немає даних", щоб решта
// помічника продовжувала працювати без оцінок, а не падала.
import { supabase } from './supabaseClient.js'

// На мережевому збої (наприклад немає інтернету) запит Supabase іноді не
// відхиляється з помилкою, а просто зависає без відповіді — звичайний
// try/catch це не ловить. Тому кожен запит обмежуємо таймаутом: якщо за
// цей час немає відповіді, вважаємо запит невдалим і йдемо далі без
// оцінок, а не чекаємо вічно й не блокуємо чат.
function withTimeout(promise, ms = 4000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут запиту до mentor_feedback')), ms)),
  ])
}

// Повертає { aggregate, mine }:
// aggregate — сумарний бал по кожному фрагменту від усіх учнів (для
// ранжування відповідей); mine — власний голос поточного користувача
// по кожному фрагменту (щоб підсвітити, що вже натиснуто).
export async function loadFeedback(moduleId, userEmail) {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('mentor_feedback')
        .select('passage_text, value, voter_email')
        .eq('module_id', moduleId)
    )

    if (error) {
      console.warn('Не вдалося завантажити спільні оцінки помічника (можливо, таблицю mentor_feedback ще не створено)', error)
      return { aggregate: {}, mine: {} }
    }

    const aggregate = {}
    const mine = {}
    for (const row of data) {
      aggregate[row.passage_text] = (aggregate[row.passage_text] || 0) + row.value
      if (userEmail && row.voter_email === userEmail) mine[row.passage_text] = row.value
    }
    return { aggregate, mine }
  } catch (err) {
    // Мережева помилка (немає інтернету, Supabase недоступний тощо) —
    // не резолвиться як {data, error}, а кидає виняток. Помічник має
    // й далі відповідати за ключовими словами, просто без оцінок.
    console.warn('Мережева помилка при завантаженні спільних оцінок помічника', err)
    return { aggregate: {}, mine: {} }
  }
}

// newValue: -1 | 1. currentValue: власний попередній голос користувача
// по цьому фрагменту (0, якщо ще не голосував). Повторний клік по тій
// самій кнопці прибирає голос (toggle off).
export async function rate(moduleId, passageText, newValue, currentValue, userEmail) {
  if (!userEmail) return currentValue

  try {
    if (newValue === currentValue) {
      const { error } = await withTimeout(
        supabase
          .from('mentor_feedback')
          .delete()
          .eq('module_id', moduleId)
          .eq('passage_text', passageText)
          .eq('voter_email', userEmail)
      )
      if (error) {
        console.warn('Не вдалося прибрати голос', error)
        return currentValue
      }
      return 0
    }

    const { error } = await withTimeout(
      supabase
        .from('mentor_feedback')
        .upsert(
          { module_id: moduleId, passage_text: passageText, voter_email: userEmail, value: newValue, updated_at: new Date().toISOString() },
          { onConflict: 'module_id,passage_text,voter_email' }
        )
    )
    if (error) {
      console.warn('Не вдалося зберегти голос (можливо, таблицю mentor_feedback ще не створено)', error)
      return currentValue
    }
    return newValue
  } catch (err) {
    console.warn('Мережева помилка при збереженні голосу', err)
    return currentValue
  }
}
