import { createClient } from '@supabase/supabase-js';

// Support both VITE_ prefixed (frontend) and unprefixed (backend) env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
