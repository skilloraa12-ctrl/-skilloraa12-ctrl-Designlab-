-- Перевірка, що practice.sql застосувався правильно: RLS увімкнено і
-- всі 4 політики (select/insert/update/delete, кожна "лише свій
-- user_id") на місці. Запускати ПІСЛЯ practice.sql: Supabase Dashboard
-- → SQL Editor → вставити → Run → прочитати результат обох запитів.

-- Очікується: rls_enabled = true.
select
  relname as table_name,
  relrowsecurity as rls_enabled
from pg_class
where relname = 'practice_projects';

-- Очікується: рівно 4 рядки — practice_projects_select_own (SELECT),
-- practice_projects_insert_own (INSERT), practice_projects_update_own
-- (UPDATE), practice_projects_delete_own (DELETE), кожен з using/
-- with_check, що згадує "auth.uid()".
select
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where tablename = 'practice_projects'
order by policyname;
