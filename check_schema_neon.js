const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const url = process.env.NEON_DATABASE_URL;
if (!url) {
    console.error('NEON_DATABASE_URL is missing in .env');
    process.exit(1);
}

const sql = neon(url);

async function checkSchema() {
    try {
        console.log('--- Checking tables ---');
        const tables = await sql.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.map(t => t.table_name).join(', '));

        console.log('\n--- Checking columns in appointments ---');
        const cols = await sql.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments' AND table_schema = 'public'");
        console.table(cols);

        if (tables.some(t => t.table_name === 'qr_codes')) {
            console.log('\n--- Checking columns in qr_codes ---');
            const qrCols = await sql.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'qr_codes' AND table_schema = 'public'");
            console.table(qrCols);
        } else {
            console.log('\n--- Table qr_codes is MISSING ---');
        }

    } catch (err) {
        console.error('Database error:', err.message);
    }
}

checkSchema();
