// pages/api/products.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { AppDataSource } from '../../src/lib/db';
import { Product } from '../../src/models/Product';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('📦 Products API called');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔄 Initializing database connection...');
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log('🔍 Fetching products...');
        const products = await AppDataSource.getRepository(Product).find();
        console.log(`✅ Found ${products.length} products`);
        
        return res.status(200).json(products);
    } catch (error) {
        console.error('❌ Error in /api/products:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch products',
            details: error.message 
        });
    }
}