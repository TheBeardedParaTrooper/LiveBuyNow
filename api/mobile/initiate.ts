import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query } from '../db';

const InitiateSchema = z.object({
  order_id: z.string().uuid(),
  provider: z.enum(['tigo_pesa', 'airtel_money', 'vodacom', 'halo_pesa']),
  phone_number: z.string(),
});

function providerInstructions(provider: string, amount: number) {
  // Placeholder instructions. Real integrations should call provider APIs.
  const amountStr = amount.toLocaleString();
  switch (provider) {
    case 'tigo_pesa':
      return `Send TZS ${amountStr} to Tigo Pesa business number or follow provider prompt.`;
    case 'airtel_money':
      return `Send TZS ${amountStr} via Airtel Money to the merchant number and include the order reference.`;
    case 'vodacom':
      return `Use M-Pesa/Vodacom USSD or app to pay TZS ${amountStr} to the merchant pay number.`;
    case 'halo_pesa':
      return `Use HaloPesa to transfer TZS ${amountStr} to the merchant number.`;
    default:
      return `Follow provider instructions to pay TZS ${amountStr}.`;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const parsed = InitiateSchema.parse(req.body);
    const { order_id, provider, phone_number } = parsed;

    // Load order to ensure it exists and is pending
    const ord = await query('SELECT id, total_amount, payment_status FROM orders WHERE id = $1 LIMIT 1', [order_id]);
    if (ord.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    const order = ord.rows[0];
    if (order.payment_status === 'paid') return res.status(400).json({ error: 'Order already paid' });

    // Try to use a provider adapter if available to initiate the payment
    try {
      const idx = await import('./providers/index');
      const adapter = await idx.getAdapter(provider);
      if (adapter && adapter.initiatePayment) {
        const result = await adapter.initiatePayment(order, phone_number);
        await idx.markOrderProvider(order_id, provider, result.provider_tx_id);
        return res.status(200).json({ order_id, provider, provider_tx_id: result.provider_tx_id, instructions: result.instructions });
      }
    } catch (err) {
      console.warn('provider adapter missing or error', err?.message || err);
    }

    // Fallback generic behavior
    const provider_tx_id = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12);
    const instructions = providerInstructions(provider, Number(order.total_amount || 0));

    await query('UPDATE orders SET provider = $1, provider_tx_id = $2, phone_number = $3, payment_method = $4, payment_status = $5 WHERE id = $6', [
      provider,
      provider_tx_id,
      phone_number,
      'mobile_money',
      'pending',
      order_id,
    ]);

    return res.status(200).json({ order_id, provider, provider_tx_id, instructions });
  } catch (err: any) {
    console.error('mobile/initiate error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
