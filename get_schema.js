const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const rows = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'`;
  console.log(JSON.stringify(rows, null, 2));
}

main();
