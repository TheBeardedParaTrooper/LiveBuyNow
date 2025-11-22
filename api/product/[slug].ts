import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { slug } = req.query as { slug?: string };
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    const sql = `
      SELECT id, name, slug, description, price::float, compare_at_price::float, image_url, images, stock_quantity, specifications
      FROM products
      WHERE slug = $1
      LIMIT 1
    `;

    const result = await query(sql, [slug]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(result.rows[0]);
  } catch (err: any) {
    console.error('product/[slug] handler error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
