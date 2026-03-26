const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.NEON_DATABASE_URL);
async function checkProfiles() {
    try {
        const rows = await sql.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public'");
        console.table(rows);
        const r = await sql.query("SELECT DISTINCT role FROM public.profiles");
        console.log("Roles found:", r.map(row => row.role));
    } catch(err) { console.error(err); }
}
checkProfiles();
