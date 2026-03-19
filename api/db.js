const { neon } = require('@neondatabase/serverless');

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL nao definida.');
}

const sql = neon(process.env.NEON_DATABASE_URL);

module.exports = { sql };
