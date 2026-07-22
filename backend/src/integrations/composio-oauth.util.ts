import { ConfigService } from '@nestjs/config';

const DEFAULT_CALLBACK =
  'https://api.clearform.in/api/v1/integrations/callback';

/** OAuth return URL registered in Composio dashboard (no secrets). */
export function resolveComposioOAuthCallbackUrl(config: ConfigService): string {
  const explicit = config.get<string>('COMPOSIO_OAUTH_CALLBACK_URL')?.trim();
  if (explicit) return explicit;

  const apiPublic = config.get<string>('API_PUBLIC_URL')?.trim();
  if (apiPublic) {
    const base = apiPublic.replace(/\/+$/, '');
    return `${base}/api/v1/integrations/callback`;
  }

  return DEFAULT_CALLBACK;
}

export { buildComposioOAuthCallbackUrl } from './composio-auth-config.util';
