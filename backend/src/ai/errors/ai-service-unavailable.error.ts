import { HttpException, HttpStatus } from '@nestjs/common';

export type AiUnavailableReason =
  | 'llm_not_configured'
  | 'llm_failed'
  | 'nudge_failed';

export type AiServiceUnavailablePayload = {
  statusCode: typeof HttpStatus.SERVICE_UNAVAILABLE;
  error: 'Service Unavailable';
  code: 'AI_SERVICE_UNAVAILABLE';
  reason: AiUnavailableReason;
  message: string;
};

export function aiServiceUnavailable(
  reason: AiUnavailableReason,
  message = 'AI response coaching is temporarily unavailable. Please try again in a moment.',
): HttpException {
  const payload: AiServiceUnavailablePayload = {
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    error: 'Service Unavailable',
    code: 'AI_SERVICE_UNAVAILABLE',
    reason,
    message,
  };
  return new HttpException(payload, HttpStatus.SERVICE_UNAVAILABLE);
}
