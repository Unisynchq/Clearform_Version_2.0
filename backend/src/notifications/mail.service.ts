import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Resend } from 'resend';
import { PILOT_35_PLAN } from '../config/plans';
import { EmailLogService } from './email-log.service';
import {
  formatTopAnswersHtml,
  renderResponseCreatedEmail,
  renderTierUpgradeEmail,
  renderWelcomeSignInEmail,
} from './mail-template.util';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private from: string;
  private appUrl: string;
  private supportEmail: string;

  constructor(
    private readonly config: ConfigService,
    private readonly emailLogs: EmailLogService,
  ) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not configured — email notifications disabled',
      );
    } else {
      this.resend = new Resend(apiKey);
    }
    this.from =
      config.get<string>('RESEND_FROM') ?? 'Clearform <hello@app.clearform.in>';
    this.appUrl = config.get<string>('APP_URL') ?? 'https://app.clearform.in';
    this.supportEmail =
      config.get<string>('RESEND_REPLY_TO') ?? 'hello@app.clearform.in';
  }

  async sendNewResponseNotification(opts: {
    toEmail: string;
    toName: string;
    formTitle: string;
    formId: string;
    responseId: string;
    topAnswers?: { label: string; value: string }[];
  }) {
    const analyticsUrl = `${this.appUrl}/dashboard/analytics?form=${opts.formId}`;
    const topAnswersHtml = formatTopAnswersHtml(opts.topAnswers ?? []);
    const html = renderResponseCreatedEmail({
      toName: opts.toName,
      formTitle: opts.formTitle,
      formId: opts.formId,
      responseId: opts.responseId,
      analyticsUrl,
      topAnswersHtml,
    });

    await this.sendTransactional({
      toEmail: opts.toEmail,
      template: 'notifications.response_created',
      subject: `New response on "${opts.formTitle}"`,
      html,
      resendVariables: {
        TO_NAME: opts.toName,
        FORM_TITLE: opts.formTitle,
        TOP_ANSWERS_HTML:
          topAnswersHtml || '<p>No preview answers available.</p>',
        ANALYTICS_URL: analyticsUrl,
        RESPONSE_ID: opts.responseId,
      },
      metadata: {
        formId: opts.formId,
        responseId: opts.responseId,
        idempotencyKey: `response:${opts.responseId}`,
      },
    });
  }

  async sendTierUpgradeEmail(opts: {
    userId: string;
    toEmail: string;
    toName: string;
    planName?: string;
    tierLabel?: string;
    responsesLimit?: number;
    durationDays?: number;
    expiresAt: Date;
    paymentId: string;
  }) {
    const planName = opts.planName ?? PILOT_35_PLAN.name;
    const tierLabel = opts.tierLabel ?? 'Tier 2 · Pilot';
    const responsesLimit = opts.responsesLimit ?? PILOT_35_PLAN.responsesLimit;
    const durationDays = opts.durationDays ?? PILOT_35_PLAN.durationDays;
    const expiresAtLabel = opts.expiresAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const billingUrl = `${this.appUrl}/dashboard/profile?tab=billing`;
    const dashboardUrl = `${this.appUrl}/dashboard`;

    const html = renderTierUpgradeEmail({
      toName: opts.toName,
      planName,
      tierLabel,
      responsesLimit,
      durationDays,
      expiresAtLabel,
      billingUrl,
      dashboardUrl,
      paymentId: opts.paymentId,
    });

    await this.sendTransactional({
      userId: opts.userId,
      toEmail: opts.toEmail,
      template: 'billing.tier_upgraded',
      subject: `You're on ${planName} — upgrade confirmed`,
      html,
      resendVariables: {
        TO_NAME: opts.toName,
        PLAN_NAME: planName,
        TIER_LABEL: tierLabel,
        RESPONSES_LIMIT: responsesLimit,
        DURATION_DAYS: durationDays,
        EXPIRES_AT_LABEL: expiresAtLabel,
        PAYMENT_ID: opts.paymentId,
        BILLING_URL: billingUrl,
        DASHBOARD_URL: dashboardUrl,
      },
      metadata: {
        paymentId: opts.paymentId,
        planId: PILOT_35_PLAN.id,
        idempotencyKey: `billing.tier_upgraded:${opts.paymentId}`,
      },
    });
  }

  async sendWelcomeSignInEmail(opts: {
    userId: string;
    toEmail: string;
    toName: string;
  }) {
    const dashboardUrl = `${this.appUrl}/dashboard`;
    const billingUrl = `${this.appUrl}/dashboard/profile?tab=billing`;

    const html = renderWelcomeSignInEmail({
      toName: opts.toName,
      dashboardUrl,
      billingUrl,
      supportEmail: this.supportEmail,
    });

    await this.sendTransactional({
      userId: opts.userId,
      toEmail: opts.toEmail,
      template: 'auth.welcome',
      subject: 'Welcome to Clearform',
      html,
      resendVariables: {
        TO_NAME: opts.toName,
        DASHBOARD_URL: dashboardUrl,
        BILLING_URL: billingUrl,
        SUPPORT_EMAIL: this.supportEmail,
      },
      metadata: {
        idempotencyKey: `auth.welcome:${opts.userId}`,
      },
    });
  }

  private async sendTransactional(opts: {
    userId?: string;
    toEmail: string;
    template: string;
    subject: string;
    html: string;
    resendVariables?: Record<string, string | number>;
    metadata?: Prisma.InputJsonValue;
  }) {
    if (!this.resend) return;

    const idempotencyKey = getIdempotencyKey(opts.metadata);

    if (idempotencyKey) {
      const existing = await this.emailLogs.findByIdempotency(
        opts.template,
        idempotencyKey,
      );
      if (existing && existing.status !== 'failed') {
        this.logger.debug(
          `Skipping duplicate ${opts.template} for ${idempotencyKey}`,
        );
        return;
      }
    }

    const log = await this.emailLogs.createQueued({
      userId: opts.userId,
      toEmail: opts.toEmail,
      template: opts.template,
      subject: opts.subject,
      metadata: opts.metadata,
    });

    try {
      const resendTemplateId = this.getResendTemplateId(opts.template);
      const result = resendTemplateId
        ? await this.resend.emails.send({
            from: this.from,
            to: opts.toEmail,
            subject: opts.subject,
            replyTo: this.supportEmail,
            template: {
              id: resendTemplateId,
              variables: opts.resendVariables ?? {},
            },
          })
        : await this.resend.emails.send({
            from: this.from,
            to: opts.toEmail,
            subject: opts.subject,
            html: opts.html,
            replyTo: this.supportEmail,
          });

      const resendEmailId = result.data?.id;
      if (resendEmailId) {
        await this.emailLogs.markSent(log.id, resendEmailId);
      }

      this.logger.log(
        `${opts.template} sent to ${opts.toEmail}${resendEmailId ? ` (${resendEmailId})` : ''}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.emailLogs.markFailed(log.id, message);
      this.logger.error(`Resend failed for ${opts.toEmail}: ${message}`);
    }
  }

  private getResendTemplateId(template: string): string | undefined {
    const envByTemplate: Record<string, string> = {
      'auth.welcome': 'RESEND_TEMPLATE_WELCOME',
      'billing.tier_upgraded': 'RESEND_TEMPLATE_TIER_UPGRADE',
      'notifications.response_created': 'RESEND_TEMPLATE_RESPONSE_CREATED',
    };
    const envKey = envByTemplate[template];
    if (!envKey) return undefined;
    const value = this.config.get<string>(envKey)?.trim();
    return value || undefined;
  }
}

function getIdempotencyKey(
  metadata: Prisma.InputJsonValue | undefined,
): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }
  const value = (metadata as Record<string, unknown>).idempotencyKey;
  return typeof value === 'string' ? value : undefined;
}
