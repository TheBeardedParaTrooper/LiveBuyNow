import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { query } from './db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-08-16' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items, currency = 'usd', metadata = {} } = req.body as any;
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Missing items' });

    // Calculate total server-side by fetching current prices from DB to prevent tampering
    const ids = items.map((it: any) => it.product_id);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const prodRes = await query(`SELECT id, price FROM products WHERE id IN (${placeholders})`, ids);

    const priceMap: Record<string, number> = {};
    for (const r of prodRes.rows) {
      priceMap[r.id] = Number(r.price);
    }

    let amount = 0;
    for (const it of items) {
      const p = priceMap[it.product_id];
      if (p == null) return res.status(400).json({ error: 'Invalid product in items' });
      amount += Number(p) * Number(it.quantity || 1);
    }

    // NOTE: Stripe requires amount in the smallest currency unit (cents). Ensure your DB prices match the currency.
    const stripeAmount = Math.round(Number(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency,
      metadata,
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error('create-payment-intent error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
