const { sql } = require('./api/db');

async function checkSchema() {
    try {
        const res = await sql.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments'
        `);
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkSchema();
