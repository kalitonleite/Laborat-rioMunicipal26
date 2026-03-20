const { neon } = require('@neondatabase/serverless');

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL nao definida.');
}

const sql_conn = neon(process.env.NEON_DATABASE_URL);

// Standard tagged template literal
const sql = (strings, ...values) => sql_conn(strings, ...values);

// Add .query method for dynamic queries (needed by data.js)
sql.query = (query, params) => sql_conn(query, params);

module.exports = { sql };
