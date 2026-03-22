const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  try {
    console.log("Starting migration...");
    
    // 1. Add email and phone columns
    await sql`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT`;
    await sql`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT`;
    console.log("Added email and phone columns (if not existed).");

    // 2. Drop unique constraints on cpf and sus_number
    await sql`ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cpf_key`;
    await sql`ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_cpf`;
    await sql`ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_sus_number_key`;
    console.log("Dropped unique constraints on cpf and sus_number.");

    // 3. (Optional) Add unique constraint on (cpf, role) to prevent exact duplicates of same role
    // This allows same CPF with DIFFERENT roles.
    await sql`ALTER TABLE public.profiles ADD CONSTRAINT unique_cpf_role UNIQUE (cpf, role)`;
    console.log("Added unique constraint on (cpf, role).");

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

main();
