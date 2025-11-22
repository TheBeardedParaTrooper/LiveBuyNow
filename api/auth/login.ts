import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';
const JWT_EXP = '7d';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = LoginSchema.parse(req.body);

    const userRes = await query('SELECT id, email, password_hash, full_name, phone FROM users WHERE email = $1 LIMIT 1', [email]);
    if (userRes.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = userRes.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXP });

    // Return token and user (without password)
    return res.status(200).json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone } });
  } catch (err: any) {
    console.error('login error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
