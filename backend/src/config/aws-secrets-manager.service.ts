import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSecretsManagerService {
  private readonly logger = new Logger(AwsSecretsManagerService.name);
  private cache = new Map<string, string>();

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const region = this.configService.get<string>('AWS_REGION');
    if (!region) {
      this.logger.log('AWS Secrets Manager not configured — using env vars');
      return;
    }

    try {
      const secretName = this.configService.get<string>('AWS_SECRET_NAME');
      if (!secretName) {
        this.logger.warn('AWS_REGION set but AWS_SECRET_NAME missing');
        return;
      }

      const { SecretsManagerClient, GetSecretValueCommand } =
        await import('@aws-sdk/client-secrets-manager');

      const client = new SecretsManagerClient({
        region,
        credentials: {
          accessKeyId:
            this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.getOrThrow<string>(
            'AWS_SECRET_ACCESS_KEY',
          ),
        },
      });

      const response = await client.send(
        new GetSecretValueCommand({ SecretId: secretName }),
      );

      if (response.SecretString) {
        const secrets = JSON.parse(response.SecretString) as Record<
          string,
          string
        >;
        for (const [key, value] of Object.entries(secrets)) {
          this.cache.set(key, value);
        }
        this.logger.log(
          `Loaded ${this.cache.size} secrets from AWS Secrets Manager`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed to load secrets from AWS Secrets Manager: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  getSecret(key: string): string | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    return this.configService.get<string>(key);
  }

  getSecretOrThrow(key: string): string {
    const value = this.getSecret(key);
    if (!value) {
      throw new Error(`Required secret "${key}" is not configured`);
    }
    return value;
  }
}
