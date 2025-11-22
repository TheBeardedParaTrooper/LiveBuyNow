import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import db from './db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-08-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id, user_id } = req.body as any;

    if (!session_id) return res.status(400).json({ error: 'session_id required' });

    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['line_items'] });

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Begin DB transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const total = Number((session.amount_total ?? 0) / 100);
      const orderNumber = `STRIPE-${session.id}`;

      const insertOrderSql = `INSERT INTO orders (user_id, order_number, status, total_amount, payment_method, payment_status, phone_number, delivery_address, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`;
      const orderRes = await client.query(insertOrderSql, [user_id || null, orderNumber, 'processing', total, 'card', 'completed', session.metadata?.phone_number || '', session.metadata?.delivery_address || '', session.metadata?.notes || null]);
      const order = orderRes.rows[0];

      const insertItemSql = `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES ($1,$2,$3,$4,$5,$6)`;
      for (const li of (session.line_items?.data || [])) {
        const price = Number((li.price?.unit_amount ?? 0) / 100);
        const quantity = li.quantity || 1;
        const name = li.description || li.price?.product?.name || 'Item';
        await client.query(insertItemSql, [order.id, null, name, price, quantity, price * quantity]);
      }

      await client.query('COMMIT');
      return res.status(200).json({ ok: true, order_id: order.id });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('fulfill-order error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
