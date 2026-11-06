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
        console.log('--- Scanner Migration: Starting ---');

        // 1. Create scanner_scans table
        console.log('Creating scanner_scans table...');
        await sql.query(`
            CREATE TABLE IF NOT EXISTS public.scanner_scans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                patient_id TEXT,
                patient_name TEXT,
                patient_cpf TEXT,
                original_image_url TEXT,
                image_type TEXT,
                ocr_text TEXT,
                extracted_data JSONB,
                confidence_score DOUBLE PRECISION DEFAULT 0,
                status TEXT DEFAULT 'PENDENTE',
                scan_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                user_id TEXT,
                user_name TEXT,
                approved_by TEXT,
                approved_at TIMESTAMP WITH TIME ZONE,
                pdf_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            )
        `);

        // 2. Create scanner_scan_history table
        console.log('Creating scanner_scan_history table...');
        await sql.query(`
            CREATE TABLE IF NOT EXISTS public.scanner_scan_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                scan_id UUID REFERENCES public.scanner_scans(id) ON DELETE CASCADE,
                field_name TEXT,
                old_value TEXT,
                new_value TEXT,
                changed_by TEXT,
                changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                reason TEXT
            )
        `);

        console.log('--- Scanner Migration completed successfully! ---');

    } catch (err) {
        console.error('Scanner Migration failed:', err.message);
    }
}

runMigration();
