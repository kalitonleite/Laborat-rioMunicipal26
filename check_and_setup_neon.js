
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NEON_DATABASE_URL);

async function main() {
  console.log('🔌 Conectando ao Neon...');

  // Listar tabelas existentes
  const existing = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name;
  `;
  console.log('\n📋 Tabelas existentes:', existing.map(r => r.table_name));

  // Criar tabelas necessárias
  console.log('\n🔧 Criando/verificando schema...');

  await sql`
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      password TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  console.log('✅ profiles OK');

  await sql`
    CREATE TABLE IF NOT EXISTS public.authorization_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  console.log('✅ authorization_codes OK');

  await sql`
    CREATE TABLE IF NOT EXISTS public.exams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      patient_name TEXT,
      exam_type TEXT,
      results JSONB,
      status TEXT DEFAULT 'pending',
      doctor_id UUID,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  console.log('✅ exams OK');

  await sql`
    CREATE TABLE IF NOT EXISTS public.campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  console.log('✅ campaigns OK');

  await sql`
    CREATE TABLE IF NOT EXISTS public.appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      patient_name TEXT,
      exam_type TEXT,
      scheduled_at TIMESTAMPTZ,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  console.log('✅ appointments OK');

  await sql`
    CREATE TABLE IF NOT EXISTS public.lab_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT UNIQUE NOT NULL,
      value JSONB,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  console.log('✅ lab_settings OK');

  await sql`
    CREATE TABLE IF NOT EXISTS public.doctor_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
      doctor_id UUID,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  console.log('✅ doctor_notes OK');

  // Verificar tabelas finais
  const final = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name;
  `;
  console.log('\n✅ Tabelas no banco:', final.map(r => r.table_name).join(', '));
  console.log('\n🎉 Sincronização com Neon concluída!');
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
