const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  await sql`INSERT INTO public.authorization_codes (code, role) VALUES ('UARINI2026', 'ADMIN') ON CONFLICT (code) DO NOTHING`;
  const rows = await sql`SELECT * FROM public.authorization_codes`;
  console.log(JSON.stringify(rows, null, 2));
}

main();
