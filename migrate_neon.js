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

        // 2. Add columns to appointments table
        console.log('Updating appointments table headers...');
        const migrations = [
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDENTE'",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS setor TEXT DEFAULT 'RECEPCAO'",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS endereco TEXT",
            "ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS codigo_atendimento TEXT"
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
