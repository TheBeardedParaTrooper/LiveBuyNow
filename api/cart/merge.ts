import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { guest_token, user_id } = req.body as any;
    if (!guest_token || !user_id) return res.status(400).json({ error: 'Missing guest_token or user_id' });

    // Move guest cart items into user's cart with upsert to aggregate quantities
    // We'll select guest items and upsert them into cart_items for the user
    const guestItemsRes = await query('SELECT product_id, quantity FROM cart_items WHERE guest_token = $1', [guest_token]);

    for (const row of guestItemsRes.rows) {
      // Upsert: insert (user_id, product_id, quantity) ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      await query(`INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3)
        ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`, [user_id, row.product_id, row.quantity]);
    }

    // Delete guest entries
    await query('DELETE FROM cart_items WHERE guest_token = $1', [guest_token]);

    return res.status(200).json({ ok: true, migrated: guestItemsRes.rowCount });
  } catch (err: any) {
    console.error('cart/merge error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
