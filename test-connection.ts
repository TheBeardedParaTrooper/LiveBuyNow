import 'dotenv/config';
import dataSource from './src/config/database.config';

async function testConnection() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await dataSource.query('SELECT version();');
    console.log('PostgreSQL Version:', result[0].version);
    
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
