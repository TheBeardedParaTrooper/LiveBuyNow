import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query } from './db';

const CreateOrderSchema = z.object({
  user_id: z.string().uuid().optional(),
  guest_token: z.string().optional(),
  phone_number: z.string(),
  delivery_address: z.string(),
  notes: z.string().optional(),
  payment_method: z.enum(['mobile_money', 'card', 'tigo_pesa', 'airtel_money', 'vodacom', 'halo_pesa']).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const parsed = CreateOrderSchema.parse(req.body);
      const { user_id, guest_token, phone_number, delivery_address, notes, payment_method = 'mobile_money' } = parsed;

      // Load cart items
      const cartSql = user_id
        ? 'SELECT ci.quantity, p.id as product_id, p.name, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1'
        : 'SELECT ci.quantity, p.id as product_id, p.name, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.guest_token = $1';

      const cartRes = await query(cartSql, [user_id || guest_token]);
      if (cartRes.rowCount === 0) return res.status(400).json({ error: 'Cart is empty' });

      // Use a DB transaction to create order and order_items and clear cart
      const client = await (await import('./db')).default.connect();
      try {
        await client.query('BEGIN');

        const total = cartRes.rows.reduce((s: number, r: any) => s + Number(r.price) * Number(r.quantity), 0);

        const insertOrderSql = `INSERT INTO orders (user_id, order_number, status, total_amount, payment_method, payment_status, phone_number, delivery_address, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`;
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random()*10000)}`;
        const orderRes = await client.query(insertOrderSql, [user_id || null, orderNumber, 'pending', total, payment_method, 'pending', phone_number, delivery_address, notes || null]);
        const order = orderRes.rows[0];

        // Insert order items
        const insertItemSql = `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES ($1,$2,$3,$4,$5,$6)`;
        for (const r of cartRes.rows) {
          await client.query(insertItemSql, [order.id, r.product_id, r.name, r.price, r.quantity, Number(r.price) * Number(r.quantity)]);
        }

        // Clear cart
        const clearSql = user_id ? 'DELETE FROM cart_items WHERE user_id = $1' : 'DELETE FROM cart_items WHERE guest_token = $1';
        await client.query(clearSql, [user_id || guest_token]);

        await client.query('COMMIT');
        return res.status(200).json({ order_id: order.id, order_number: order.order_number });
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    if (req.method === 'GET') {
      // List orders for a user or fetch by order_id
      const user_id = req.query.user_id as string | undefined;
      const order_id = req.query.order_id as string | undefined;

      if (!user_id && !order_id) return res.status(400).json({ error: 'Missing user_id or order_id' });

      if (order_id) {
        const sql = `SELECT o.*, (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) as order_items FROM orders o WHERE o.id = $1 LIMIT 1`;
        const result = await query(sql, [order_id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
        return res.status(200).json(result.rows[0]);
      }

      const sql = `SELECT o.*, (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) as order_items FROM orders o WHERE o.user_id = $1 ORDER BY created_at DESC`;
      const result = await query(sql, [user_id]);
      return res.status(200).json(result.rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('orders handler error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
