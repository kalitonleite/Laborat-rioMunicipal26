const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const rows = await sql`SELECT conname, contype FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'profiles'`;
  console.log(JSON.stringify(rows, null, 2));
}

main();
