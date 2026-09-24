// MODULES збирається з окремих файлів у lessons/ — по одному файлу на
// підкатегорію (subcategories.js), щоб кожен файл був невеликим і його
// можна було писати/переглядати незалежно. Назва MODULES історична,
// концептуально це окремі уроки всередині підкатегорії.
//
// Поля кожного уроку: id (унікальний, ідентифікатор блоку підкатегорії *
// 100 + порядковий номер, щоб гарантовано не перетинались між файлами),
// level (slug напрямку, напр. 'web-design'), subcategory (slug
// підкатегорії з subcategories.js), theory (розгорнуте пояснення),
// keyPoints (принципи), mistakes (типові помилки), topics (перелік тем),
// practice (завдання або null), selfCheck (критерії самоперевірки
// практики, якщо вона є), quiz (міні-тест).
//
// Ієрархія: напрямок (directions.js) → підкатегорія (subcategories.js,
// 24 штуки для Web Design) → уроки (файли в lessons/).
//
// Підкатегорії без власного файлу в lessons/ поки не мають написаних
// уроків - AcademySubcategory чесно показує заплановані теми (список,
// не посилання), а не фейкові порожні уроки; уроки додаються партіями,
// кожна підкатегорія отримує запис тут лише коли її файл готовий.
import { LESSONS as webDesignBasics } from './lessons/web-design-basics.js'

export const MODULES = [
  ...webDesignBasics,
]

export function getModule(id) {
  return MODULES.find((m) => m.id === Number(id))
}
