import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'bouquet97',
  database: process.env.DB_NAME || 'live_buy_now',
  entities: ['src/models/*.ts'],
  synchronize: false,
  logging: true
});

async function checkDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database successfully!');
    
    const tables = await AppDataSource.query(
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    );
    
    console.log('Tables in database:');
    console.table(tables);
    
    if (tables.length > 0) {
      for (const table of tables) {
        const tableName = table.table_name;
        const count = await AppDataSource.query(SELECT COUNT(*) FROM "");
        console.log(Table  has  rows);
      }
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkDatabase();
