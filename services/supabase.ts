
import { createClient } from '@supabase/supabase-js';

// Fallback values for the production environment
const FALLBACK_URL = 'https://vmbwqmsfjeveeghgitoq.supabase.co';
const FALLBACK_KEY = 'sb_publishable_0KDtbUzi7d6LiOUnzTfbZQ_z6pvKSUB';

// Helper to get environment variables with robust validation
const getEnv = (name: string, fallback: string): string => {
    const val = import.meta.env[name];

    // Explicitly check for invalid values (null, undefined, literal "undefined", too short)
    if (val && typeof val === 'string' && val !== 'undefined' && val.trim().length > 10) {
        return val.trim();
    }

    console.warn(`Supabase: Using fallback for ${name}`);
    return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', FALLBACK_URL);
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', FALLBACK_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
