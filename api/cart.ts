import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query } from './db';

const AddSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).optional(),
  user_id: z.string().uuid().optional(),
  guest_token: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const user_id = req.query.user_id as string | undefined;
      const guest_token = req.query.guest_token as string | undefined;

      if (!user_id && !guest_token) {
        return res.status(400).json({ error: 'Missing user_id or guest_token' });
      }

      const sql = user_id
        ? 'SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock_quantity FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1'
        : 'SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock_quantity FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.guest_token = $1';

      const result = await query(sql, [user_id || guest_token]);
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const parsed = AddSchema.parse(req.body);
      const { product_id, quantity = 1, user_id, guest_token } = parsed;

      const idSql = 'SELECT id FROM products WHERE id = $1 AND is_active = true LIMIT 1';
      const prod = await query(idSql, [product_id]);
      if (prod.rowCount === 0) return res.status(400).json({ error: 'Invalid product' });

      // Upsert cart item
      const upsertSql = user_id
        ? `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3)
           ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
           RETURNING *`
        : `INSERT INTO cart_items (guest_token, product_id, quantity) VALUES ($1,$2,$3)
           ON CONFLICT (guest_token, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
           RETURNING *`;

      const params = user_id ? [user_id, product_id, quantity] : [guest_token, product_id, quantity];
      const result = await query(upsertSql, params as any[]);
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, quantity } = req.body as any;
      if (!id || !quantity) return res.status(400).json({ error: 'Missing id or quantity' });
      const update = await query('UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *', [quantity, id]);
      return res.status(200).json(update.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id, user_id, guest_token } = req.body as any;
      if (id) {
        await query('DELETE FROM cart_items WHERE id = $1', [id]);
        return res.status(200).json({ ok: true });
      }
      if (user_id) {
        await query('DELETE FROM cart_items WHERE user_id = $1', [user_id]);
        return res.status(200).json({ ok: true });
      }
      if (guest_token) {
        await query('DELETE FROM cart_items WHERE guest_token = $1', [guest_token]);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'Missing id or user_id or guest_token' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('cart handler error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
