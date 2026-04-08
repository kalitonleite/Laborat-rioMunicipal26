require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NEON_DATABASE_URL);

async function addColumn() {
  try {
    console.log('Adding unidade_padrao column to configuracoes_carteirinha...');
    
    await sql`
      ALTER TABLE configuracoes_carteirinha 
      ADD COLUMN IF NOT EXISTS unidade_padrao TEXT DEFAULT 'UBS Central de Uarini';
    `;
    
    console.log('Column added successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to add column:', err);
    process.exit(1);
  }
}

addColumn();
