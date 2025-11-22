const { Client } = require('pg');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const sql = `
  CREATE SCHEMA IF NOT EXISTS auth;

  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
  );
  `;

  try {
    await client.query(sql);
    console.log('Auth schema and auth.users created');
  } catch (err) {
    console.error('Error creating auth schema:', err.message || err);
  } finally {
    await client.end();
  }
}

run();
