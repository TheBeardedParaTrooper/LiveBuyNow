import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query } from '../db';

const StatusQuery = z.object({
  order_id: z.string().uuid().optional(),
  provider_tx_id: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const parsed = StatusQuery.parse(req.query);
    const { order_id, provider_tx_id } = parsed;

    if (!order_id && !provider_tx_id) return res.status(400).json({ error: 'Missing order_id or provider_tx_id' });

    const sql = order_id
      ? 'SELECT id, payment_status, provider, provider_tx_id FROM orders WHERE id = $1 LIMIT 1'
      : 'SELECT id, payment_status, provider, provider_tx_id FROM orders WHERE provider_tx_id = $1 LIMIT 1';

    const val = order_id || provider_tx_id;
    const result = await query(sql, [val]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json(result.rows[0]);
  } catch (err: any) {
    console.error('mobile/status error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
