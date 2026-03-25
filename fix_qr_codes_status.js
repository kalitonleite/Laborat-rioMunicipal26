const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const url = process.env.NEON_DATABASE_URL;
if (!url) {
    console.error('NEON_DATABASE_URL is missing in .env');
    process.exit(1);
}

const sql = neon(url);

async function addStatusColumn() {
    try {
        console.log('--- Informing Neon: Adding "status" to qr_codes ---');
        await sql.query(`
            ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
        `);
        console.log('--- Column added successfully! ---');
    } catch (err) {
        console.error('Migration failed:', err.message);
    }
}

addStatusColumn();
