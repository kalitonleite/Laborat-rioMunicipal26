import { createClient } from '@supabase/supabase-js';

// Fallback values for the production environment (Project: vmbwqmsfjeveeghgitoq)
const FALLBACK_URL = 'https://vmbwqmsfjeveeghgitoq.supabase.co';
// Using the legacy JWT anon key for maximum compatibility with all browsers/environments
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtYndxbXNmamV2ZWVnaGdpdG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTczNjAsImV4cCI6MjA4NDc3MzM2MH0.I3P08ZIOspdh_pt4swfc_1Mvg8bFSkMaTVEjnOTJLwI';

// Helper to get environment variables with robust validation
const getEnv = (name: string, fallback: string): string => {
    try {
        const val = import.meta.env[name];

        // Explicitly check for invalid values (null, undefined, literal "undefined", too short)
        if (typeof val === 'string' && val.length > 20 && val !== 'undefined') {
            return val.trim();
        }
    } catch (e) {
        console.warn(`Error reading ${name}, using fallback.`);
    }
    return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', FALLBACK_URL);
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', FALLBACK_KEY);

// Extra safety: ensure no whitespace or weird characters that break Headers.set()
const finalUrl = supabaseUrl.trim().replace(/[\n\r]/g, '');
const finalKey = supabaseAnonKey.trim().replace(/[\n\r]/g, '');

export const supabase = createClient(finalUrl, finalKey);
