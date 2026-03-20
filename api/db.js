const { neon } = require('@neondatabase/serverless');

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL nao definida.');
}

// neon() returns an object that:
// 1. Can be used as a tagged template literal (sql`...`)
// 2. Has a .query(queryString, params) method for conventional queries
const sql = neon(process.env.NEON_DATABASE_URL);

module.exports = { sql };
