import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { RazorpayProvider } from './providers/razorpay.provider';
import { CheckoutSessionService } from './checkout/checkout-session.service';
import { BillingEntitlementsService } from './entitlements/billing-entitlements.service';
import { AiEntitlementsService } from './entitlements/ai-entitlements.service';
import { EntitlementsGuard } from './entitlements/entitlements.guard';
import { PilotPurchaseService } from './purchases/pilot-purchase.service';
import { RazorpayWebhookHandler } from './webhooks/razorpay-webhook.handler';
import { PromoCodeService } from './promo/promo-code.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [
    RazorpayProvider,
    CheckoutSessionService,
    BillingEntitlementsService,
    AiEntitlementsService,
    EntitlementsGuard,
    PilotPurchaseService,
    RazorpayWebhookHandler,
    PromoCodeService,
    BillingService,
  ],
  controllers: [BillingController],
  exports: [
    BillingService,
    BillingEntitlementsService,
    AiEntitlementsService,
    EntitlementsGuard,
  ],
})
export class BillingModule {}
