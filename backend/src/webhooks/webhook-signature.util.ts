import { createHmac } from 'node:crypto';

/** HMAC-SHA256 hex digest for outbound webhook verification (n8n/Make compatible). */
export function signWebhookPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}
