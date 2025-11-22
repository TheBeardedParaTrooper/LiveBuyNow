import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '../db';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().optional(),
  phone: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const parsed = RegisterSchema.parse(req.body);
    const { email, password, full_name = null, phone = null } = parsed;

    // Check existing user
    const exists = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (exists.rowCount > 0) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    const insertSql = `INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1,$2,$3,$4) RETURNING id, email, full_name, phone, created_at`;
    const result = await query(insertSql, [email, hashed, full_name, phone]);

    const user = result.rows[0];
    // Do not return password
    return res.status(201).json({ user });
  } catch (err: any) {
    console.error('register error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
