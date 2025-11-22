import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-08-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, user_id, metadata } = req.body as any;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // Map items to Stripe line items. NOTE: currency and amounts might need adjustment for your market.
    const line_items = items.map((it: any) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: it.name },
        unit_amount: Math.round(Number(it.price) * 100),
      },
      quantity: Number(it.quantity || 1),
    }));

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&user_id=${user_id}`,
      cancel_url: `${baseUrl}/checkout`,
      metadata: {
        user_id,
        ...metadata,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('create-checkout-session error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
