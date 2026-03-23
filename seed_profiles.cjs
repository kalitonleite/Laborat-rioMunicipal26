const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  try {
    console.log("Fixing schema...");
    await sql`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT`;
    await sql`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sus_number TEXT`;
    await sql`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT`;
    await sql`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    
    // Attempt constraint creation safely
    try { await sql`ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cpf_key`; } catch(e){}
    try { await sql`ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_cpf`; } catch(e){}
    try { await sql`ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_cpf_role`; } catch(e){}
    try { await sql`ALTER TABLE public.profiles ADD CONSTRAINT unique_cpf_role UNIQUE (cpf, role)`; } catch(e){ console.log("Constraint might exist", e.message); }
    
    console.log("Inserting default users...");
    await sql`
      INSERT INTO public.profiles (id, cpf, name, role) 
      VALUES 
        (gen_random_uuid(), '11111111111', 'RECEPCAO', 'RECEPTIONIST'),
        (gen_random_uuid(), '22222222222', 'MEDICO', 'MEDICAL'),
        (gen_random_uuid(), '33333333333', 'GESTOR', 'ADMIN') 
      ON CONFLICT (cpf, role) DO UPDATE SET 
        name = EXCLUDED.name,
        password_hash = NULL;
    `;
    
    console.log("Success! Users prepared. You can login with 22222222222 using the first 6 digits as password.");
  } catch (err) {
    console.error(err);
  }
}
main();
