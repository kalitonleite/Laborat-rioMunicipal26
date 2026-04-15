const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const url = process.env.NEON_DATABASE_URL;
if (!url) {
    console.error('NEON_DATABASE_URL is missing in .env');
    process.exit(1);
}

const sql = neon(url);

async function runMigration() {
    try {
        console.log('--- Informing Neon: Starting Migration ---');

        // 1. Create qr_codes table
        console.log('Creating qr_codes table...');
        await sql.query(`
            CREATE TABLE IF NOT EXISTS public.qr_codes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token TEXT UNIQUE NOT NULL,
                atendimento_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            )
        `);

        // 2. Update profiles table (for Carteirinha Sync)
        console.log('Updating profiles table...');
        const profileMigrations = [
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mother_name TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS father_name TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resides_in_uarini BOOLEAN DEFAULT TRUE",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS civil_status TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS naturalness TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS race_color TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_number TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_type TEXT",
            "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies TEXT"
        ];

        for (const migration of profileMigrations) {
            try {
                await sql.query(migration);
            } catch (e) {
                console.warn(`Profile Migration step failed: ${migration}`, e.message);
            }
        }

        // 3. Update appointments table
        console.log('Updating appointments table...');
        const migrations = [
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDENTE'",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS setor TEXT DEFAULT 'RECEPCAO'",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS endereco TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS codigo_atendimento TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_mother_name TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_father_name TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS resides_in_uarini BOOLEAN DEFAULT TRUE",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_civil_status TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_naturalness TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_race_color TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_neighborhood TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_responsible_name TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_responsible_relationship TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_urgency BOOLEAN DEFAULT FALSE"
        ];

        for (const migration of migrations) {
            try {
                await sql.query(migration);
            } catch (e) {
                console.warn(`Migration step failed (maybe column exists?): ${migration}`, e.message);
            }
        }

        console.log('--- Migration completed successfully! ---');

    } catch (err) {
        console.error('Migration failed:', err.message);
    }
}

runMigration();
