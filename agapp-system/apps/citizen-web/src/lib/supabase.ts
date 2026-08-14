import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jrureblhypfdljwflout.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydXJlYmxoeXBmZGxqd2Zsb3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mjg2ODksImV4cCI6MjA5NTEwNDY4OX0.0K5ffr84phW5YQucrAS_2TngZcyTIc-PnTrHX6MMvBQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
