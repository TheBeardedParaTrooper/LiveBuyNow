import { NextApiRequest, NextApiResponse } from 'next';
import { AppDataSource } from '@/lib/db';
import { Product } from '@/models/Product';
import { withAuth } from '@/middleware/auth';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    await AppDataSource.initialize();
    const productRepository = AppDataSource.getRepository(Product);

    if (req.method === 'GET') {
      // Get all products
      const products = await productRepository.find();
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      // Create new product (admin only)
      const { name, description, price, stock, imageUrl } = req.body;
      
      const product = new Product();
      product.name = name;
      product.description = description;
      product.price = price;
      product.stock = stock;
      product.imageUrl = imageUrl || null;

      const savedProduct = await productRepository.save(product);
      return res.status(201).json(savedProduct);
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await AppDataSource.destroy();
  }
}

export default withAuth(handler);
