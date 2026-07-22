import { Controller, Get, Logger, Query, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';
import { COMPOSIO_APP_NAME_TO_PROVIDER } from './composio-error.util';
import { IntegrationsService } from './integrations.service';

@Controller('api/v1/integrations')
export class ComposioCallbackController {
  private readonly logger = new Logger(ComposioCallbackController.name);

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Composio redirects here after OAuth completes.
   * Task 6.1 — surface connectionStatus in redirect URL so the FE can show
   * "pending verification" instead of assuming the integration is active.
   */
  @Public()
  @Get('callback')
  @Redirect()
  async callback(
    @Query('workspaceId') workspaceId: string,
    @Query('provider') provider: string,
    @Query('entityId') entityId: string,
    @Query('appName') appName: string,
    @Query('status') status?: string,
    @Query('connected_account_id') connectedAccountId?: string,
  ) {
    const appUrl =
      this.config.get<string>('APP_URL') ?? 'https://app.clearform.in';
    const workspaceKey = workspaceId || entityId;
    const providerSlug =
      provider ||
      (appName && COMPOSIO_APP_NAME_TO_PROVIDER[appName.toLowerCase()]) ||
      appName;
    const oauthFailed =
      status === 'failed' || status === 'error' || status === 'cancelled';

    let connectionStatus: 'connected' | 'pending' | 'error' | 'oauth_failed' =
      'connected';

    if (workspaceKey && !oauthFailed) {
      try {
        const result = await this.integrationsService.finalizeConnection(
          workspaceKey,
          providerSlug || undefined,
        );
        connectionStatus = result.status;
        this.logger.log(
          `Composio OAuth callback workspaceId=${workspaceKey} provider=${providerSlug ?? 'all'} status=${result.status} connectedAccountId=${connectedAccountId ?? 'n/a'}`,
        );
      } catch (err) {
        this.logger.warn(
          `Composio callback finalize failed workspaceId=${workspaceKey}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        connectionStatus = 'error';
      }
    } else if (oauthFailed) {
      connectionStatus = 'oauth_failed';
    }

    const connectedParam = providerSlug ?? appName ?? '';
    return {
      url: `${appUrl}/dashboard/profile?tab=integrations&connected=${encodeURIComponent(connectedParam)}&connectionStatus=${connectionStatus}`,
    };
  }
}
