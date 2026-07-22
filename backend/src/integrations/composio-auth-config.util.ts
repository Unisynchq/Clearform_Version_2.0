import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Composio } from '@composio/core';

type ComposioProviderSlug = 'google_sheets' | 'slack' | 'google_drive' | 'notion';

/** Clearform provider slug → Composio toolkit slug (v3). */
export const PROVIDER_TOOLKIT_SLUG: Record<ComposioProviderSlug, string> = {
  google_sheets: 'googlesheets',
  slack: 'slack',
  google_drive: 'googledrive',
  notion: 'notion',
};

const AUTH_CONFIG_ENV_KEYS: Record<ComposioProviderSlug, string> = {
  google_sheets: 'COMPOSIO_AUTH_CONFIG_GOOGLE_SHEETS',
  slack: 'COMPOSIO_AUTH_CONFIG_SLACK',
  google_drive: 'COMPOSIO_AUTH_CONFIG_GOOGLE_DRIVE',
  notion: 'COMPOSIO_AUTH_CONFIG_NOTION',
};

/**
 * OAuth callback with workspace + provider so v3 link flow can finalize without legacy entityId/appName.
 */
export function buildComposioOAuthCallbackUrl(
  baseCallbackUrl: string,
  workspaceId: string,
  provider: ComposioProviderSlug,
): string {
  const url = new URL(baseCallbackUrl);
  url.searchParams.set('workspaceId', workspaceId);
  url.searchParams.set('provider', provider);
  return url.toString();
}

/**
 * Resolves Composio auth config id for a toolkit (env override, else first ENABLED config from API).
 */
export async function resolveComposioAuthConfigId(
  composio: Composio,
  config: ConfigService,
  provider: ComposioProviderSlug,
): Promise<string> {
  const envKey = AUTH_CONFIG_ENV_KEYS[provider];
  const fromEnv = config.get<string>(envKey)?.trim();
  if (fromEnv) return fromEnv;

  const toolkitSlug = PROVIDER_TOOLKIT_SLUG[provider];
  const list = await composio.authConfigs.list({ toolkit: toolkitSlug });
  const match = list.items.find((item) => item.status === 'ENABLED');
  if (match?.id) return match.id;

  throw new BadRequestException(
    `No Composio auth config for "${provider}" (toolkit ${toolkitSlug}). ` +
      `Create one in the Composio dashboard (Composio-managed OAuth) or set ${envKey}=ac_... on the API server.`,
  );
}
