import { createClient } from '@supabase/supabase-js';

// Fallback values for the production environment (Project: LaboratorioMunicipal2026)
const FALLBACK_URL = 'https://wuqqnlocnuwgczvmwkrh.supabase.co';
// Using the legacy JWT anon key for compatibility
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFubG9jbnV3Z2N6dm13a3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjk1MzMsImV4cCI6MjA4NzcwNTUzM30.cQmkPtToIsTcf40taJAZO5VErzQvoJGHdLxPqJNLync';

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
