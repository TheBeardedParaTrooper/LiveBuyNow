// Save as list-dbs.js
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  password: 'bouquet97',
  host: 'localhost',
  port: 5432
});

async function listDatabases() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT datname FROM pg_database;');
    console.log('Available databases:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

listDatabases();
