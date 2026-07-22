import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

/** Composio OAuth callback query `appName` → Clearform provider slug (legacy v2 redirects) */
export const COMPOSIO_APP_NAME_TO_PROVIDER: Record<string, string> = {
  googlesheets: 'google_sheets',
  slack: 'slack',
  googledrive: 'google_drive',
};

type ComposioLikeError = Error & {
  errCode?: string;
  code?: string;
  description?: string;
  possibleFix?: string;
  possibleFixes?: string[];
  statusCode?: number;
  metadata?: { statusCode?: number };
  cause?: unknown;
};

function composioStatus(err: ComposioLikeError): number | undefined {
  return err.statusCode ?? err.metadata?.statusCode ?? httpStatusFromCause(err);
}

function httpStatusFromCause(err: ComposioLikeError): number | undefined {
  const cause = err.cause as { status?: number; response?: { status?: number } };
  return cause?.status ?? cause?.response?.status;
}

function composioMessage(err: ComposioLikeError): string {
  const fixes = err.possibleFixes?.length
    ? err.possibleFixes.join(' ')
    : err.possibleFix;
  const parts = [err.message, err.description, fixes].filter(Boolean);
  return parts.join(' — ') || 'Composio request failed';
}

function isLegacySdkCrash(err: Error): boolean {
  return (
    err instanceof TypeError &&
    err.message.includes("reading 'message'")
  );
}

function unwrapErrorChain(err: unknown): ComposioLikeError[] {
  const chain: ComposioLikeError[] = [];
  let current: unknown = err;
  for (let i = 0; i < 5 && current instanceof Error; i++) {
    chain.push(current as ComposioLikeError);
    current = (current as ComposioLikeError).cause;
  }
  return chain;
}

/**
 * Maps Composio SDK / config errors to Nest HTTP exceptions (never opaque 500 for setup issues).
 */
export function toComposioHttpException(err: unknown): HttpException {
  if (err instanceof HttpException) return err;

  const message = err instanceof Error ? err.message : String(err);

  if (message.includes('Composio not configured')) {
    return new ServiceUnavailableException(
      'Integrations are not configured. Set COMPOSIO_API_KEY on the API server.',
    );
  }

  if (message.startsWith('Unsupported integration provider')) {
    return new BadRequestException(message);
  }

  if (message.includes('No Composio auth config for')) {
    return new BadRequestException(message);
  }

  if (err instanceof Error && isLegacySdkCrash(err)) {
    return new BadGatewayException(
      'Composio OAuth API changed (v2 retired). Deploy the latest API build using @composio/core connectedAccounts.link.',
    );
  }

  if (!(err instanceof Error)) {
    return new BadGatewayException('Integration provider request failed');
  }

  for (const node of unwrapErrorChain(err)) {
    const mapped = mapComposioLikeError(node);
    if (mapped) return mapped;
  }

  return new BadGatewayException(composioMessage(err as ComposioLikeError));
}

export type DispatchErrorKind = 'retryable' | 'auth' | 'permanent';

/**
 * Classifies a dispatch failure for the integrations retry queue.
 * - 'auth': credentials rejected — verify/deactivate the connection, don't retry
 * - 'permanent': config/target problems (bad request, sheet/database gone) — don't retry
 * - 'retryable': rate limits, 5xx, network — exponential backoff will handle it
 * Unknown errors default to retryable so transient network failures recover.
 */
export function classifyDispatchError(err: unknown): DispatchErrorKind {
  if (!(err instanceof Error)) return 'retryable';
  for (const node of unwrapErrorChain(err)) {
    const status = composioStatus(node);
    const code = node.errCode ?? node.code ?? '';
    if (status === 401 || status === 403 || code.includes('API_KEY')) {
      return 'auth';
    }
    if (status === 429 || code === 'BACKEND::RATE_LIMIT') return 'retryable';
    if (status && status >= 500) return 'retryable';
    if (
      status === 400 ||
      status === 404 ||
      status === 410 ||
      code === 'BACKEND::BAD_REQUEST' ||
      code === 'BACKEND::NOT_FOUND' ||
      code.includes('VALIDATION') ||
      code.includes('AUTH_CONFIG_NOT_FOUND') ||
      code.includes('TOOLKIT_NOT_FOUND')
    ) {
      return 'permanent';
    }
  }
  return 'retryable';
}

function mapComposioLikeError(
  composioErr: ComposioLikeError,
): HttpException | null {
  const status = composioStatus(composioErr);
  const detail = composioMessage(composioErr);
  const code = composioErr.errCode ?? composioErr.code ?? '';

  if (
    code.includes('API_KEY') ||
    composioErr.errCode === 'COMMON::API_KEY_INVALID' ||
    status === 401 ||
    status === 403
  ) {
    return new UnauthorizedException(
      'Invalid or unauthorized Composio API key. Check COMPOSIO_API_KEY in the Composio dashboard.',
    );
  }

  if (status === 410) {
    return new BadGatewayException(
      'Composio OAuth v2 endpoint is retired. Deploy the latest API using connectedAccounts.link (v3).',
    );
  }

  if (
    status === 400 ||
    composioErr.errCode === 'BACKEND::BAD_REQUEST' ||
    code.includes('VALIDATION')
  ) {
    return new BadRequestException(
      `${detail}. Ensure the toolkit auth config exists in Composio and OAuth redirect URL matches COMPOSIO_OAUTH_CALLBACK_URL.`,
    );
  }

  if (
    status === 404 ||
    composioErr.errCode === 'BACKEND::NOT_FOUND' ||
    code.includes('AUTH_CONFIG_NOT_FOUND') ||
    code.includes('TOOLKIT_NOT_FOUND')
  ) {
    return new BadRequestException(
      `${detail}. Enable the toolkit in Composio (googlesheets, slack, googledrive) and create a Composio-managed auth config.`,
    );
  }

  if (status === 429 || composioErr.errCode === 'BACKEND::RATE_LIMIT') {
    return new ServiceUnavailableException(
      'Composio rate limit exceeded. Try again shortly.',
    );
  }

  if (status && status >= 500) {
    return new BadGatewayException(
      `Composio service is temporarily unavailable. ${detail}`,
    );
  }

  if (
    code.includes('FAILED_TO_CREATE_CONNECTED_ACCOUNT_LINK') ||
    detail.toLowerCase().includes('connected account link')
  ) {
    return new BadGatewayException(detail);
  }

  return null;
}
