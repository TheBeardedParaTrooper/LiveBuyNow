import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Query params: category, min_price, max_price, q (search), limit, offset
    const { category, min_price, max_price, q, limit = '100', offset = '0' } = req.query as any;

    const where: string[] = ['is_active = true'];
    const params: any[] = [];
    let idx = 1;

    if (category) {
      where.push(`category_id = $${idx++}`);
      params.push(category);
    }

    if (min_price) {
      where.push(`price >= $${idx++}`);
      params.push(Number(min_price));
    }

    if (max_price) {
      where.push(`price <= $${idx++}`);
      params.push(Number(max_price));
    }

    if (q) {
      where.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const sql = `
      SELECT id, name, slug, description, price::float, compare_at_price::float, image_url, stock_quantity
      FROM products
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(Number(limit));
    params.push(Number(offset));

    const result = await query(sql, params);
    return res.status(200).json(result.rows);
  } catch (err: any) {
    console.error('products handler error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
