const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.NEON_DATABASE_URL, { ssl: 'require' });

async function check() {
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'configuracoes_carteirinha';
    `;
    console.log('Columns in configuracoes_carteirinha:');
    columns.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
    
    const rows = await sql`SELECT * FROM configuracoes_carteirinha LIMIT 1;`;
    console.log('\nData in first row:');
    console.log(JSON.stringify(rows[0], null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
