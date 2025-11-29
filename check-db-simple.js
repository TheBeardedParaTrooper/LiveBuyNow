// Save this as check-db-simple.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  password: 'bouquet97',
  host: 'localhost',
  port: 5432,
  database: 'live_buy_now'
});

async function checkDb() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = ', ['public']);
    console.log('Tables in database:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDb();
