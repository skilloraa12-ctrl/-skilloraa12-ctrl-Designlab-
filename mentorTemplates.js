// Будує відповідь помічника для розпізнаного НАМІРУ (mentorIntents.js).
// Два типи намірів:
//  - "контентні" (isMeta:false) — делегують у mentorMatch.answerFromLesson,
//    той самий пошук по тексту уроку, що й раніше, лише з іншим заголовком
//    відповіді залежно від того, ЩО саме учень питає (визначення, причина,
//    порівняння...).
//  - "метанаміри" (isMeta:true) — НЕ пошук по тексту, а детермінована
//    відповідь, зібрана з реальних полів уроку (practice/selfCheck/
//    keyPoints/topics/quiz/сусідні уроки). Це не вигадування — лише інше
//    компонування вже існуючого матеріалу уроку під конкретну потребу
//    учня ("з чого почати", "дай підказку", "що далі"...).
// Жодна відповідь не посилається на аналіз скріншотів чи "живе" розуміння —
// бот завжди просить описати проблему словами, якщо не вистачає контексту.

import { answerFromLesson } from './mentorMatch.js'

function firstSentence(text) {
  if (!text) return ''
  const m = text.match(/^.+?[.!?](?=\s|$)/)
  return (m ? m[0] : text).trim()
}

function notFoundInLesson(module, question) {
  return {
    intro: `🤔 Не знайшла в матеріалах уроку «${module.title}» прямої відповіді на «${question}».`,
    footer: 'Спробуй сформулювати інакше ключовими словами з уроку, або подивись розділи ТЕОРІЯ, КЛЮЧОВІ ПРИНЦИПИ й ПРАКТИКА вище — я шукаю відповіді лише там.',
  }
}

function contentSearch(module, question, feedback, introMatched, introMistake) {
  const result = answerFromLesson(module, question, feedback)
  if (!result.matched) return notFoundInLesson(module, question)
  if (result.flaggedMistake) {
    return {
      intro: introMistake || '⚠️ Схоже, це поширена помилка, про яку прямо каже урок:',
      passages: [{ label: 'Типова помилка', text: result.flaggedMistake.text }, ...result.passages.filter((p) => p.text !== result.flaggedMistake.text)],
      footer: 'Якщо мала на увазі не це — спробуй перефразувати питання.',
    }
  }
  return { intro: introMatched || '📘 За матеріалом уроку:', passages: result.passages }
}

export function buildIntentAnswer(intentId, { module, question, prev, next, feedback = {} }) {
  switch (intentId) {
    case 'what_is_this':
      return contentSearch(module, question, feedback, '📖 Визначення за матеріалом уроку:')

    case 'why_is_this_needed':
      return contentSearch(module, question, feedback, '💡 Навіщо це потрібно:')

    case 'how_to_figma': {
      const r = contentSearch(module, question, feedback, '🎨 За матеріалом уроку:')
      r.footer = (r.footer ? r.footer + ' ' : '') + 'Інтерфейс Figma міг трохи змінитись — якщо не знаходиш саме цей пункт, опиши словами, що бачиш на екрані, і я спробую підказати інакше (надсилати скриншот не потрібно — я не вмію їх переглядати).'
      return r
    }

    case 'compare':
      return contentSearch(module, question, feedback, '⚖️ За матеріалом уроку:')

    case 'confirm_understanding': {
      const result = answerFromLesson(module, question, feedback)
      if (!result.matched) {
        return {
          intro: '🤔 Не можу впевнено підтвердити це по тексту уроку.',
          footer: 'Спробуй сформулювати це як пряме питання ключовими словами з уроку — так легше знайти відповідний принцип.',
        }
      }
      return { intro: '✅ Схоже, так — ось відповідний принцип уроку:', passages: result.passages.slice(0, 1) }
    }

    case 'example': {
      if (module.example) {
        return { intro: '💬 Приклад виконання з цього уроку:', passages: [{ label: 'Приклад', text: module.example }], norate: true }
      }
      return contentSearch(module, question, feedback, '💬 Приклад за матеріалом уроку:')
    }

    case 'lesson_not_understood': {
      const passages = []
      if (module.theory) passages.push({ label: 'Простими словами', text: firstSentence(module.theory) })
      for (const kp of (module.keyPoints || []).slice(0, 3)) passages.push({ label: 'Головне', text: kp })
      if (module.example) passages.push({ label: 'Приклад', text: module.example })
      return {
        intro: `📘 Коротко про урок «${module.title}»:`,
        passages,
        footer: 'Якщо якась конкретна частина все ще незрозуміла — постав про неї окреме питання своїми словами.',
        norate: true,
      }
    }

    case 'task_not_understood': {
      if (!module.practice) return { intro: 'У цього уроку немає окремого практичного завдання — тут лише теорія й міні-тест нижче.' }
      const passages = [{ label: 'Суть завдання', text: module.practice }]
      for (const c of (module.selfCheck || []).slice(0, 4)) passages.push({ label: 'Як зрозуміти, що готово', text: c })
      return { intro: '📋 Розберемо завдання:', passages, norate: true }
    }

    case 'question_not_understood':
      return {
        intro: '❔ Скопіюй сюди точний текст питання, яке незрозуміле — так я зможу підказати, про що воно, не видаючи готову відповідь, якщо це тест.',
        footer: 'Я не знаю заздалегідь, яке саме питання ти маєш на увазі — тут немає доступу до конкретного тесту, який ти бачиш.',
      }

    case 'stuck': {
      const step = module.practice ? firstSentence(module.practice) : (module.topics || [])[0]
      if (!step) return { intro: 'У цього уроку практики немає — переглянь теорію й ключові принципи вище, і переходь до міні-тесту.' }
      return { intro: '🚧 Перший крок:', passages: [{ label: 'Почни з цього', text: step }], footer: 'Зроби лише цей крок — про наступний спитаєш, коли дійдеш.', norate: true }
    }

    case 'check_my_work': {
      const checks = module.selfCheck || []
      return {
        intro: 'Я не можу подивитись на файл чи зображення — опиши текстом, що саме ти зробила, і я звірю це з критеріями уроку.',
        passages: checks.length ? checks.map((c) => ({ label: 'Критерій', text: c })) : undefined,
        footer: checks.length ? 'Звір свою роботу з цими пунктами.' : undefined,
        norate: true,
      }
    }

    case 'design_feedback':
      return {
        intro: 'Розкладемо це на конкретні речі замість "красиво/некрасиво":',
        passages: [
          { label: 'Перевір', text: 'Композиція — чи є один явний фокус уваги, чи око не блукає.' },
          { label: 'Перевір', text: 'Spacing — чи однакові відступи між схожими елементами.' },
          { label: 'Перевір', text: 'Вирівнювання — чи елементи стоять на спільних лініях.' },
          { label: 'Перевір', text: 'Ієрархія — чи зрозуміло з першого погляду, що головне.' },
          { label: 'Перевір', text: 'Типографіка — чи не більше 2 шрифтів і чи читабельні розміри.' },
          { label: 'Перевір', text: 'Колір і контраст — чи текст легко читається на фоні.' },
          { label: 'Перевір', text: 'Послідовність — чи однакові стилі повторюються по всій роботі.' },
        ],
        footer: 'Опиши текстом, що саме зроблено — і я скажу, який із цих пунктів найімовірніше причина.',
        norate: true,
      }

    case 'can_do_differently':
    case 'obligatory_or_not': {
      const checks = module.selfCheck || []
      return {
        intro: 'Приклад виконання в уроці — орієнтовний, а не єдиний правильний варіант. Обов\'язкове — те, що перевіряється критеріями нижче:',
        passages: checks.length ? checks.map((c) => ({ label: 'Це перевіряється', text: c })) : undefined,
        footer: 'Колір, шрифт, конкретне компонування — можна своє, якщо суть завдання виконана.',
        norate: true,
      }
    }

    case 'need_hint': {
      const hint = (module.selfCheck || [])[0] || (module.topics || [])[0]
      if (!hint) return { intro: 'Для цього уроку підказки поки немає — подивись розділ ПРАКТИКА вище.' }
      return { intro: '🎯 Підказка (без готової відповіді):', passages: [{ label: 'Зверни увагу на', text: hint }], norate: true }
    }

    case 'want_answer': {
      const hint = (module.selfCheck || [])[0] || (module.topics || [])[0]
      return {
        intro: 'Я не робитиму завдання замість тебе — це не допоможе навчитись. Але ось підказка, з чого почати:',
        passages: hint ? [{ label: 'Зверни увагу на', text: hint }] : undefined,
        footer: 'Спробуй сама, а я перевірю логіку, якщо опишеш, що вийшло.',
        norate: true,
      }
    }

    case 'technical_problem':
      return {
        intro: 'Опиши текстом: що мало статися, що сталося натомість, і на якому кроці саме.',
        footer: 'Я не бачу твій екран і не аналізую зображення — але за описом кроків часто видно, де саме розбіжність з уроком.',
      }

    case 'learning_difficulty': {
      const step = module.practice ? firstSentence(module.practice) : (module.topics || [])[0]
      return {
        intro: 'Це нормально — тут справді багато нового. Не думай про все завдання одразу.',
        passages: step ? [{ label: 'Зроби тільки це зараз', text: step }] : undefined,
        footer: 'Один маленький крок — і вже прогрес. Решта почекає.',
        norate: true,
      }
    }

    case 'memorize_check': {
      const passages = (module.keyPoints || []).slice(0, 4).map((kp) => ({ label: 'Варто розуміти', text: kp }))
      return {
        intro: 'Ключові принципи варто розуміти (не завчати дослівно) — до них можна повертатись. Приклади в уроці — орієнтовні.',
        passages: passages.length ? passages : undefined,
        norate: true,
      }
    }

    case 'what_next':
      if (next) return { intro: `▶️ Наступний урок: «${next.title}».`, footer: 'Натисни посилання внизу сторінки або перейди туди зі списку уроків підрозділу.' }
      return { intro: '🎉 Це останній урок у цьому підрозділі.', footer: 'Повернись до списку підрозділів Академії, щоб обрати наступний.' }

    case 'repeat_remind':
    case 'cheat_sheet': {
      const passages = (module.keyPoints || []).map((kp) => ({ label: 'Ключовий принцип', text: kp }))
      if (!passages.length) return { intro: 'Для цього уроку короткого списку принципів немає — подивись розділ ТЕОРІЯ вище.' }
      return { intro: '📝 Коротка шпаргалка уроку:', passages, norate: true }
    }

    case 'additional_practice':
      return {
        intro: 'Я не можу згенерувати нове індивідуальне завдання — але можеш:',
        passages: [
          { label: 'Варіант 1', text: 'Повторити те саме завдання на новому ескізі — з іншим наповненням (інша назва сайту, інші блоки).' },
          { label: 'Варіант 2', text: next ? `Перейти до наступного уроку «${next.title}» — там практика складніша.` : 'Повернутись до попередніх уроків підрозділу й повторити їхню практику.' },
        ],
        norate: true,
      }

    case 'what_to_ask':
      return {
        intro: 'Можеш запитати, наприклад:',
        passages: [
          { label: 'Приклад питання', text: '«Що таке ' + (module.topics?.[0] || 'цей термін') + '?»' },
          { label: 'Приклад питання', text: '«Я не зрозуміла завдання»' },
          { label: 'Приклад питання', text: '«Дай підказку»' },
          { label: 'Приклад питання', text: '«Що далі?»' },
        ],
        footer: 'Або натисни одну з кнопок-підказок над полем вводу.',
        norate: true,
      }

    case 'phrase_help':
      return {
        intro: 'Не обов\'язково формулювати правильно — напиши своїми словами, навіть уривками.',
        footer: 'Скриншот я не переглядаю, але можеш написати «я не розумію ось це» і описати, що саме бачиш.',
      }

    case 'plan_sequence': {
      const passages = (module.topics || []).map((t, i) => ({ label: `Крок ${i + 1}`, text: t }))
      if (!passages.length) return { intro: 'Для цього уроку окремого плану кроків немає.' }
      return { intro: '📋 Порядок тем цього уроку:', passages, norate: true }
    }

    case 'visual_explanation':
      return {
        intro: 'Я не малюю нових схем автоматично, але можеш побудувати її сама у вбудованому ескізнику цього уроку (кнопка «🖊 Створити ескіз у застосунку» нижче) — блоками й лініями це часто зрозуміліше, ніж текстом.',
      }

    case 'prerequisite':
      if (prev) return { intro: `Перед цим варто розуміти попередній урок: «${prev.title}».`, footer: 'Якщо там теж є прогалини — постав питання і про нього, коли відкриєш той урок.' }
      return { intro: 'Це перший урок підрозділу — окремих передумов із попередніх уроків тут немає.' }

    case 'what_is_evaluated': {
      const checks = module.selfCheck || []
      if (!checks.length) return { intro: 'Для цього уроку окремого списку критеріїв немає — орієнтуйся на суть завдання в розділі ПРАКТИКА.' }
      return { intro: '📋 На це варто звернути увагу:', passages: checks.map((c) => ({ label: 'Критерій', text: c })), norate: true }
    }

    case 'test_me':
      if (module.quiz && module.quiz.length) return { intro: 'Міні-тест до цього уроку вже є нижче на сторінці — прогортай і спробуй відповісти.', footer: 'Я туди підказки не видаю — це вже перевірка.' }
      return { intro: 'У цього уроку немає окремого міні-тесту.' }

    default:
      return notFoundInLesson(module, question)
  }
}

export function unsureRecognitionAnswer() {
  return {
    intro: 'Я хочу правильно тебе зрозуміти 🙂 Ти питаєш:',
    passages: [
      { label: '1', text: 'що це означає' },
      { label: '2', text: 'як це зробити' },
      { label: '3', text: 'навіщо це потрібно' },
    ],
    footer: 'Напиши номер або уточни своїми словами.',
    norate: true,
  }
}

export function wordlessAnswer() {
  return {
    intro: 'Я тут 🙂',
    footer: 'Ти не розумієш урок, завдання, термін чи свою роботу? Опиши в кількох словах — скриншоти я не переглядаю, але текстом поясню залюбки.',
  }
}

export function fallbackAnswer() {
  return {
    intro: 'Я тут 🙂',
    footer: 'Напиши трохи більше словами, або навіть «я не розумію ось це» і вкажи, яку саме частину уроку маєш на увазі.',
  }
}
