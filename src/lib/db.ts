// src/lib/db.ts
import { DataSource } from 'typeorm';
import { Product } from '../models/Product';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Product, User],
    synchronize: true,
    logging: true,
});

// Test the connection
export async function testConnection() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully!');
        const productCount = await AppDataSource.getRepository(Product).count();
        console.log(`📊 Total products in database: ${productCount}`);
        await AppDataSource.destroy();
        return true;
    } catch (error) {
        console.error('❌ Database connection error:', error);
        return false;
    }
}