
import { createClient } from '@supabase/supabase-js';

// Helper to get environment variables with fallback
const getEnv = (name: string, fallback: string): string => {
    const val = import.meta.env[name];
    if (val && typeof val === 'string' && val !== 'undefined') return val;
    return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://vmbwqmsfjeveeghgitoq.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_0KDtbUzi7d6LiOUnzTfbZQ_z6pvKSUB');

if (!supabaseUrl || supabaseUrl === 'undefined') {
    console.error('CRITICAL: Supabase URL is undefined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
