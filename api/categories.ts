import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await query('SELECT id, name, slug FROM categories ORDER BY name');
    return res.status(200).json(result.rows);
  } catch (err: any) {
    console.error('categories handler error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
