import type { QueryResult } from 'pg';
import { query } from '../db';

type Adapter = {
  initiatePayment?: (order: any, phone_number: string) => Promise<{ provider_tx_id: string; instructions: string }>;
  handleCallback?: (payload: any) => Promise<any>;
};

export async function getAdapter(name: string): Promise<Adapter | null> {
  try {
    // dynamic import of adapter
    const mod = await import(`./${name}`);
    return mod.default || mod;
  } catch (err) {
    console.warn('Adapter not found:', name);
    return null;
  }
}

export async function markOrderProvider(orderId: string, provider: string, provider_tx_id?: string) {
  await query('UPDATE orders SET provider = $1, provider_tx_id = COALESCE($2, provider_tx_id) WHERE id = $3', [provider, provider_tx_id || null, orderId]);
}

export default { getAdapter, markOrderProvider };
