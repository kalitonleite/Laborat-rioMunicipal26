const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  try {
    console.log('Upserting default users and clearing password_hashes...');
    await sql.query(`
      INSERT INTO public.profiles (id, cpf, name, role) 
      VALUES 
        (gen_random_uuid(), '11111111111', 'RECEPCAO', 'RECEPTIONIST'),
        (gen_random_uuid(), '22222222222', 'MEDICO', 'MEDICAL'),
        (gen_random_uuid(), '33333333333', 'GESTOR', 'ADMIN') 
      ON CONFLICT (cpf) DO UPDATE SET 
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        password_hash = NULL;
    `);
    
    // Also clear the hash for KALITON just in case.
    await sql.query("UPDATE public.profiles SET password_hash = NULL WHERE cpf = '81119119200'");
    
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
}

main();
