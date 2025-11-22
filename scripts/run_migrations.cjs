const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set in environment');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log('Found migrations:', files);

  for (const file of files) {
    const p = path.join(migrationsDir, file);
    const sql = fs.readFileSync(p, 'utf8');
    console.log('Applying', file);
    try {
      await client.query(sql);
      console.log('Applied', file);
    } catch (err) {
      console.error('Error applying', file, err.message || err);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('Migrations complete');
}

run();
