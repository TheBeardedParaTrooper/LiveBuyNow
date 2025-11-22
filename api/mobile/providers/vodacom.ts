import { query } from '../../db';

const MERCHANT_NUMBER = process.env.MOBILE_VODACOM_MERCHANT_NUMBER || 'mpesa-merchant';
const SANDBOX = (process.env.MOBILE_VODACOM_SANDBOX || 'true') === 'true';

export async function initiatePayment(order: any, phone_number: string) {
  const provider_tx_id = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12);
  const amount = Number(order.total_amount || 0);
  const instructions = SANDBOX
    ? `SANDBOX: M-Pesa: send TZS ${amount.toLocaleString()} from ${phone_number} to ${MERCHANT_NUMBER} and reference ${provider_tx_id}`
    : `M-Pesa: send TZS ${amount.toLocaleString()} from ${phone_number} to ${MERCHANT_NUMBER} and reference ${provider_tx_id}`;
  await query('UPDATE orders SET provider_tx_id = $1 WHERE id = $2', [provider_tx_id, order.id]);
  return { provider_tx_id, instructions };
}

export async function handleCallback(payload: any) {
  const { provider_tx_id, status } = payload;
  const paid = status === 'success' ? 'paid' : 'failed';
  const result = await query('UPDATE orders SET payment_status = $1, paid_at = NOW() WHERE provider_tx_id = $2 RETURNING id', [paid, provider_tx_id]);
  return result.rows[0];
}

export default { initiatePayment, handleCallback };
