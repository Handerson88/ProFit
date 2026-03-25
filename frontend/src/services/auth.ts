import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://idywcqgqalmjljgygjra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkeXdjcWdxYWxtamxqZ3lnanJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjI3NDUsImV4cCI6MjA5MDAzODc0NX0.bPTuGpYBySD88myWYQYD04n0kSaoR42HKWMs-28Exdc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAuth = supabase.auth;
