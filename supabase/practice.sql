-- Таблиця вкладки «Практика» (практичні редактори). Один рядок = один
-- прогрес студента по одному завданню (practiceProject, task_id —
-- "task-<lessonId>" з practice/practiceTasks.js). ТЗ практичних
-- редакторів просив три окремі таблиці (practice_tasks/practice_projects/
-- practice_snapshots) — тут лише practice_projects:
--   • practice_tasks НЕ таблиця: самі завдання — статичний код
--     (practice/practiceTasks.js), за тим самим принципом, що й уроки
--     в modules.js, а не контент із CMS.
--   • practice_snapshots злито В ЦЮ Ж таблицю як jsonb-масив snapshots
--     (до 10 елементів, FR-SH-004) — вони завжди читаються разом із
--     самим проєктом, тож окрема таблиця додала б лише зайвий join без
--     вигоди.
--
-- Я (агент) не маю service-role доступу до цього Supabase-проєкту —
-- виконати цей файл треба самостійно: Supabase Dashboard → SQL Editor →
-- вставити весь файл → Run. Той самий порядок дій, що й у
-- supabase/mentor_feedback.sql. Одноразова дія, після якої
-- PracticePage.jsx і practice/practiceSupabase.js запрацюють з цією
-- таблицею автоматично — до того моменту вкладка «Практика» й далі
-- працює, просто без збереження між пристроями (practiceSupabase.js
-- тихо повертає null при відсутній таблиці, PracticePage.jsx тоді
-- створює проєкт лише в пам'яті браузера для цього відвідування).

create table if not exists practice_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  lesson_id integer not null,
  editor text not null,
  profile text not null,
  version text not null default 'v1',
  project jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'passed')),
  score integer not null default 0,
  attempts integer not null default 0,
  hints_used integer not null default 0,
  earned_xp integer not null default 0,
  last_results jsonb not null default '[]'::jsonb,
  snapshots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_id)
);

create index if not exists practice_projects_user_idx on practice_projects (user_id);

alter table practice_projects enable row level security;

-- Власник читає й пише лише свої записи. Коли колись з'явиться реальний
-- ментор (зараз свідомо відкладено — немає ролі/людини), сюди додасться
-- ще одна select-політика: "ментор читає рядки зі status = 'submitted'",
-- за зразком mentor-ролі, якщо вона з'явиться в profiles.
drop policy if exists practice_projects_select_own on practice_projects;
create policy practice_projects_select_own
  on practice_projects for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists practice_projects_insert_own on practice_projects;
create policy practice_projects_insert_own
  on practice_projects for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists practice_projects_update_own on practice_projects;
create policy practice_projects_update_own
  on practice_projects for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists practice_projects_delete_own on practice_projects;
create policy practice_projects_delete_own
  on practice_projects for delete
  to authenticated
  using (user_id = auth.uid());
