const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  password: 'bouquet97',
  host: 'localhost',
  port: 5432,
  database: 'live_buy_now'
});

async function checkTables() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables in live_buy_now:');
    console.log(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTables();
