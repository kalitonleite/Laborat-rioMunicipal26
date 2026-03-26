const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.NEON_DATABASE_URL);
async function checkQrs() {
    try {
        const rows = await sql.query("SELECT token, atendimento_id, status, created_at FROM public.qr_codes ORDER BY created_at DESC LIMIT 10");
        console.table(rows);
    } catch(err) { console.error(err); }
}
checkQrs();
