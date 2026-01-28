
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vmbwqmsfjeveeghgitoq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0KDtbUzi7d6LiOUnzTfbZQ_z6pvKSUB';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
