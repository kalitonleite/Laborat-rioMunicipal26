require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NEON_DATABASE_URL);

async function check() {
  try {
    console.log('Checking database table configuracoes_carteirinha...');
    
    // Check columns
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'configuracoes_carteirinha';
    `;
    console.log('\nColumns found:');
    columns.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
    
    // Check if background_url exists
    const hasBackgroundUrl = columns.some(c => c.column_name === 'background_url');
    if (!hasBackgroundUrl) {
      console.log('\nWARNING: background_url column MISSING!');
      console.log('Attempting to add it now...');
      await sql`ALTER TABLE configuracoes_carteirinha ADD COLUMN background_url TEXT;`;
      console.log('Column added.');
    } else {
      console.log('\nbackground_url column IS PRESENT.');
    }

    // Check data
    const rows = await sql`SELECT * FROM configuracoes_carteirinha ORDER BY updated_at DESC LIMIT 1;`;
    console.log('\nLatest configuration row:');
    console.log(JSON.stringify(rows[0], null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error during check:', err);
    process.exit(1);
  }
}

check();
