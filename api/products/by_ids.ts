import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ids = req.body?.ids as string[] | undefined;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Missing ids' });

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const sql = `SELECT id, stock_quantity, price FROM products WHERE id IN (${placeholders})`;
    const result = await query(sql, ids);
    return res.status(200).json(result.rows);
  } catch (err: any) {
    console.error('products/by_ids error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
