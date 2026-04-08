require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NEON_DATABASE_URL);

async function repair() {
  try {
    console.log('Repairing database schema...');
    
    // 1. Add background_url if it somehow disappeared (redundant but safe)
    await sql`ALTER TABLE configuracoes_carteirinha ADD COLUMN IF NOT EXISTS background_url TEXT;`;
    
    // 2. Add id column if missing (UUID for consistency with patients)
    // We check if it exists first via information_schema
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'configuracoes_carteirinha' AND column_name = 'id';
    `;

    if (columns.length === 0) {
      console.log('Adding ID column to configuracoes_carteirinha...');
      // To add a primary key to an existing table with rows, we add a nullable column, populate it, then set to not null
      await sql`ALTER TABLE configuracoes_carteirinha ADD COLUMN id UUID DEFAULT gen_random_uuid();`;
      await sql`ALTER TABLE configuracoes_carteirinha ADD PRIMARY KEY (id);`;
    } else {
      console.log('ID column already exists.');
    }

    // 3. Ensure updated_at exists
    await sql`ALTER TABLE configuracoes_carteirinha ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`;

    // 4. Ensure there is only one row (or clean up duplicates)
    const allRows = await sql`SELECT id FROM configuracoes_carteirinha;`;
    if (allRows.length > 1) {
      console.log('Cleaning up duplicate rows, keeping only the most recent...');
      await sql`
        DELETE FROM configuracoes_carteirinha 
        WHERE id NOT IN (
          SELECT id FROM configuracoes_carteirinha ORDER BY updated_at DESC LIMIT 1
        );
      `;
    }

    console.log('Database repair completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database repair failed:', err);
    process.exit(1);
  }
}

repair();
