require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NEON_DATABASE_URL);

async function addColumn() {
  try {
    console.log('Adding background_url column to configuracoes_carteirinha...');
    
    await sql`
      ALTER TABLE configuracoes_carteirinha 
      ADD COLUMN IF NOT EXISTS background_url TEXT;
    `;
    
    console.log('Column added successfully!');
  } catch (error) {
    console.error('Failed to add column:', error);
    process.exit(1);
  }
}

addColumn();
