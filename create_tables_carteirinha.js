require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NEON_DATABASE_URL);

async function createTables() {
  try {
    console.log('Creating tables...');
    
    // Create Pacientes table
    await sql`
      CREATE TABLE IF NOT EXISTS pacientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        cpf TEXT UNIQUE NOT NULL,
        numero_sus TEXT UNIQUE NOT NULL,
        data_nascimento DATE,
        foto_url TEXT,
        tipo_sanguineo TEXT,
        alergias TEXT,
        contato_emergencia TEXT,
        unidade_saude TEXT,
        status TEXT DEFAULT 'ativo',
        qr_token TEXT UNIQUE,
        data_emissao TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('Table pacientes created/ensured.');

    // Create Configuracoes table
    await sql`
      CREATE TABLE IF NOT EXISTS configuracoes_carteirinha (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        logo_url TEXT,
        cor_primaria TEXT DEFAULT '#0f2a44',
        cor_secundaria TEXT DEFAULT '#0a1f33',
        cor_destaque TEXT DEFAULT '#00ff95',
        nome_sistema TEXT DEFAULT 'LabLaudo - Carteirinha Digital SUS',
        texto_rodape TEXT DEFAULT 'Válido em todo território nacional',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('Table configuracoes_carteirinha created/ensured.');

    // Initialize one row of configurations if not exists
    const configExists = await sql`SELECT id FROM configuracoes_carteirinha LIMIT 1`;
    if (configExists.length === 0) {
      await sql`
        INSERT INTO configuracoes_carteirinha (cor_primaria, cor_secundaria, cor_destaque, nome_sistema)
        VALUES ('#0f2a44', '#0a1f33', '#00ff95', 'LabLaudo - Carteirinha Digital SUS');
      `;
      console.log('Initial configuration inserted.');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

createTables();
