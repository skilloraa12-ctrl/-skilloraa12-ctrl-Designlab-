-- Спільна (не per-браузер) пам'ять помічника уроку: 👍/👎 від УСІХ учнів
-- зберігаються тут і разом впливають на те, які фрагменти уроку
-- підіймаються вище при схожих питаннях у будь-кого. Один рядок = один
-- голос одного учня по одному фрагменту одного уроку; "unique" не дає
-- одній людині наголосувати кілька разів за той самий фрагмент — новий
-- клік перезаписує її попередній голос (upsert), а не додає ще один.
--
-- Я (агент) не маю service-role доступу до цього Supabase-проєкту, тому
-- виконати цей файл треба самостійно: Supabase Dashboard → SQL Editor →
-- вставити весь файл → Run. Одноразова дія, після якої LessonMentor.jsx
-- і mentorFeedback.js запрацюють з цією таблицею автоматично.

create table if not exists mentor_feedback (
  id bigint generated always as identity primary key,
  module_id integer not null,
  passage_text text not null,
  voter_email text not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, passage_text, voter_email)
);

create index if not exists mentor_feedback_module_idx on mentor_feedback (module_id);

alter table mentor_feedback enable row level security;

-- Читати сумарні оцінки (для ранжування відповідей) може будь-хто
-- залогінений — це не приватні дані, а спільний "рейтинг корисності".
drop policy if exists mentor_feedback_select_all on mentor_feedback;
create policy mentor_feedback_select_all
  on mentor_feedback for select
  to authenticated
  using (true);

-- Але писати/змінювати можна лише свій власний голос (voter_email
-- має збігатися з email залогіненого користувача) — ніхто не може
-- проголосувати від чужого імені чи стерти чужу оцінку.
drop policy if exists mentor_feedback_insert_own on mentor_feedback;
create policy mentor_feedback_insert_own
  on mentor_feedback for insert
  to authenticated
  with check (voter_email = auth.jwt() ->> 'email');

drop policy if exists mentor_feedback_update_own on mentor_feedback;
create policy mentor_feedback_update_own
  on mentor_feedback for update
  to authenticated
  using (voter_email = auth.jwt() ->> 'email')
  with check (voter_email = auth.jwt() ->> 'email');

drop policy if exists mentor_feedback_delete_own on mentor_feedback;
create policy mentor_feedback_delete_own
  on mentor_feedback for delete
  to authenticated
  using (voter_email = auth.jwt() ->> 'email');
