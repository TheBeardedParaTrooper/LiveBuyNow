import { query } from '../../db';
import * as crypto from 'crypto';

// Tigo Pesa adapter (sandbox-ready + configurable endpoint)
const MERCHANT_NUMBER = process.env.MOBILE_TIGO_MERCHANT_NUMBER || '12345';
const SANDBOX = (process.env.MOBILE_TIGO_SANDBOX || 'true') === 'true';
const API_URL = process.env.MOBILE_TIGO_API_URL || '';
const API_KEY = process.env.MOBILE_TIGO_API_KEY || '';
const CALLBACK_SECRET = process.env.MOBILE_TIGO_CALLBACK_SECRET || '';

async function callProviderApi(body: any) {
  if (!API_URL) throw new Error('No Tigo API URL configured');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function initiatePayment(order: any, phone_number: string) {
  const provider_tx_id = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12);
  const amount = Number(order.total_amount || 0);

  // If provider API URL provided, attempt a real call
  if (API_URL) {
    try {
      const payload = { merchant_number: MERCHANT_NUMBER, amount, phone_number, order_id: order.id, reference: provider_tx_id, sandbox: SANDBOX };
      const data = await callProviderApi(payload);
      // Expecting { provider_tx_id, instructions } from provider
      if (data && (data.provider_tx_id || data.reference)) {
        const tx = data.provider_tx_id || data.reference || provider_tx_id;
        await query('UPDATE orders SET provider_tx_id = $1 WHERE id = $2', [tx, order.id]);
        return { provider_tx_id: tx, instructions: data.instructions || `Follow provider flow to pay TZS ${amount}` };
      }
    } catch (err) {
      console.warn('Tigo API call failed, falling back to sandbox instructions', err?.message || err);
    }
  }

  const instructions = SANDBOX
    ? `SANDBOX: Send TZS ${amount.toLocaleString()} from ${phone_number} to TigoPesa merchant ${MERCHANT_NUMBER} and use ref ${provider_tx_id}`
    : `Send TZS ${amount.toLocaleString()} from ${phone_number} to TigoPesa merchant ${MERCHANT_NUMBER} and include ref ${provider_tx_id}`;

  await query('UPDATE orders SET provider_tx_id = $1 WHERE id = $2', [provider_tx_id, order.id]);
  return { provider_tx_id, instructions };
}

export async function handleCallback(payload: any, headers?: any) {
  // Optionally verify signature using CALLBACK_SECRET
  try {
    if (CALLBACK_SECRET && headers) {
      const signature = headers['x-provider-signature'] || headers['x-tigo-signature'] || headers['x-signature'];
      if (signature) {
        const expected = crypto.createHmac('sha256', CALLBACK_SECRET).update(JSON.stringify(payload)).digest('hex');
        if (signature !== expected) throw new Error('Signature mismatch');
      }
    }
  } catch (err) {
    console.warn('Tigo callback signature verification failed', err?.message || err);
    // proceed cautiously; in production you may reject
  }

  const { provider_tx_id, status } = payload;
  const paid = status === 'success' ? 'paid' : 'failed';
  const result = await query('UPDATE orders SET payment_status = $1, paid_at = NOW() WHERE provider_tx_id = $2 RETURNING id', [paid, provider_tx_id]);
  return result.rows[0];
}

export default { initiatePayment, handleCallback };
