// test-db-connection.ts
import { AppDataSource } from './src/lib/db.js';  // Add .js extension
import { Product } from './src/models/Product.js'; // Add .js extension

async function testConnection() {
  let connection;
  try {
    console.log('🔄 Initializing database connection...');
    connection = await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    console.log('📋 Checking for products...');
    const productRepository = AppDataSource.getRepository(Product);
    const products = await productRepository.find();
    console.log(`📦 Found ${products.length} products in the database`);

    if (products.length > 0) {
      console.log('Sample product:', {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
      });
    }

    console.log('📊 Checking database tables...');
    const queryRunner = AppDataSource.manager.connection.createQueryRunner();
    const tables = await queryRunner.getTables();
    console.log('📋 Database tables:', tables.map(t => t.name));
    await queryRunner.release();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

testConnection();