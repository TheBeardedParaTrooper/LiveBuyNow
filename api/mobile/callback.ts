import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query } from '../db';

// This endpoint simulates provider webhooks. In production, secure and verify provider signatures.
const CallbackSchema = z.object({
  provider_tx_id: z.string(),
  status: z.enum(['success', 'failed']),
  provider: z.enum(['tigo_pesa', 'airtel_money', 'vodacom', 'halo_pesa']).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const parsed = CallbackSchema.parse(req.body);
    const { provider_tx_id, status, provider } = parsed;

    // Find order to determine provider
    const ord = await query('SELECT id, provider FROM orders WHERE provider_tx_id = $1 LIMIT 1', [provider_tx_id]);
    if (ord.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    const order = ord.rows[0];

    // Attempt to route to adapter
    try {
      const idx = await import('./providers/index');
      const adapter = await idx.getAdapter(provider || order.provider);
      if (adapter && adapter.handleCallback) {
        const handled = await adapter.handleCallback(parsed);
        return res.status(200).json({ success: true, handled });
      }
    } catch (err) {
      console.warn('Adapter callback handler failed', err?.message || err);
    }

    // Generic fallback
    const paid = status === 'success' ? 'paid' : 'failed';
    const result = await query('UPDATE orders SET payment_status = $1, provider = COALESCE($2, provider), paid_at = NOW() WHERE provider_tx_id = $3 RETURNING id, payment_status', [
      paid,
      provider || null,
      provider_tx_id,
    ]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    return res.status(200).json({ success: true, order: result.rows[0] });
  } catch (err: any) {
    console.error('mobile/callback error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
