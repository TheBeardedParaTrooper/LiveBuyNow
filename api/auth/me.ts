import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Missing token' });

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userRes = await query('SELECT id, email, full_name, phone, created_at FROM users WHERE id = $1 LIMIT 1', [payload.sub]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({ user: userRes.rows[0] });
  } catch (err: any) {
    console.error('me error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
