const { sql } = require('./api/db');

async function migrate() {
    try {
        console.log('Iniciando migração...');
        await sql.query(`
            ALTER TABLE public.appointments 
            ADD COLUMN IF NOT EXISTS patient_birth_date TEXT,
            ADD COLUMN IF NOT EXISTS patient_address TEXT
        `);
        console.log('Migração concluída com sucesso!');
    } catch (e) {
        console.error('Erro na migração:', e);
    }
}

migrate();
