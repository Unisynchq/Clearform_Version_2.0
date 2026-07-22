import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailLogService } from './email-log.service';

type ResendWebhookEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    bounce?: { message?: string };
    complaint?: { feedback_type?: string };
  };
};

@Injectable()
export class ResendWebhookHandler {
  private readonly logger = new Logger(ResendWebhookHandler.name);
  private readonly resend: Resend | null;
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly emailLogs: EmailLogService,
  ) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.webhookSecret = config.get<string>('RESEND_WEBHOOK_SECRET');
  }

  async handle(
    rawBody: Buffer,
    headers: {
      id?: string;
      timestamp?: string;
      signature?: string;
    },
  ) {
    const payloadText = rawBody.toString('utf8');
    const event = this.verifyAndParse(payloadText, headers);

    const emailId = event.data?.email_id?.trim();
    if (emailId) {
      await this.emailLogs.applyWebhookEvent({
        resendEmailId: emailId,
        eventType: event.type,
        payload: event as object,
      });
    }

    this.logger.log(
      `Resend webhook ${event.type}${emailId ? ` email=${emailId}` : ''}`,
    );

    return { received: true, type: event.type, emailId: emailId ?? null };
  }

  private verifyAndParse(
    payload: string,
    headers: {
      id?: string;
      timestamp?: string;
      signature?: string;
    },
  ): ResendWebhookEvent {
    if (!this.webhookSecret) {
      this.logger.warn(
        'RESEND_WEBHOOK_SECRET not set — accepting webhook without verification',
      );
      return JSON.parse(payload) as ResendWebhookEvent;
    }

    if (!headers.id || !headers.timestamp || !headers.signature) {
      throw new BadRequestException('Missing Svix webhook headers');
    }

    if (!this.resend) {
      throw new BadRequestException('RESEND_API_KEY not configured');
    }

    try {
      return this.resend.webhooks.verify({
        payload,
        headers: {
          id: headers.id,
          timestamp: headers.timestamp,
          signature: headers.signature,
        },
        webhookSecret: this.webhookSecret,
      }) as ResendWebhookEvent;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Resend webhook verification failed: ${message}`);
      throw new UnauthorizedException('Invalid Resend webhook signature');
    }
  }
}
