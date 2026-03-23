const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_YIa4hZu7PkFD@ep-frosty-leaf-ac7s9ybf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  try {
    const rows = await sql`SELECT * FROM lab_settings`;
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  }
}

main();
