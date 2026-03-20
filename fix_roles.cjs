const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  try {
    console.log('Updating roles to match App UserRole enum...');
    
    // Update existing users if they have the wrong string
    await sql.query("UPDATE public.profiles SET role = 'RECEPTION' WHERE role = 'RECEPTIONIST'");
    await sql.query("UPDATE public.profiles SET role = 'MEDICAL' WHERE role = 'DOCTOR'");
    
    // Upsert correct ones
    await sql.query(`
      INSERT INTO public.profiles (id, cpf, name, role) 
      VALUES 
        (gen_random_uuid(), '11111111111', 'RECEPÇÃO', 'RECEPTION'),
        (gen_random_uuid(), '22222222222', 'MÉDICO', 'MEDICAL'),
        (gen_random_uuid(), '33333333333', 'GESTOR', 'ADMIN') 
      ON CONFLICT (cpf) DO UPDATE SET 
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        password_hash = NULL;
    `);
    
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
}

main();
