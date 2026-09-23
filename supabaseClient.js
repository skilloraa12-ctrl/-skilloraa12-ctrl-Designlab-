import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// This Supabase project also backs a separate platform (00100101-platform),
// sharing the same auth.users pool — APP_ID is what tells the two apart in
// the shared course_access table (see 00100101-platform's
// supabase/course_access.sql for the table + RLS policy + has_course_access
// RPC; same table, this platform's own app_id).
export const APP_ID = 'designlab'
