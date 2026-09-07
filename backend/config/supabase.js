import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️ [SUPABASE CONFIG WARNING] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in backend/.env.\n' +
    'Please configure your Supabase credentials in backend/.env to connect to your live database.'
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Create and export initialized Supabase client with auth auto-refresh disabled for service role
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Quick connectivity checker
export const checkSupabaseConnection = async () => {
  if (!supabaseUrl || !supabaseKey) {
    return { connected: false, message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' };
  }
  try {
    const { error } = await supabase.from('categories').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Supabase PostgreSQL connected successfully' };
  } catch (err) {
    return { connected: false, message: err.message };
  }
};
