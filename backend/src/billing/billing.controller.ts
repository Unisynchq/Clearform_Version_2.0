import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CheckoutSessionService } from './checkout/checkout-session.service';
import { ClaimPurchaseDto } from './dto/claim-purchase.dto';
import { RedeemPromoDto } from './promo/dto/redeem-promo.dto';
import { PromoCodeService } from './promo/promo-code.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('api/v1/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly checkoutSessions: CheckoutSessionService,
    private readonly promoCodeService: PromoCodeService,
  ) {}

  @Get('status')
  getStatus(@CurrentUser() user: { id: string }) {
    return this.billingService.getStatus(user.id);
  }

  @Get('platform-stats')
  getPlatformStats(@CurrentUser() user: { id: string; email?: string }) {
    const email = typeof user.email === 'string' ? user.email : '';
    return this.billingService.getPlatformPlanStats(email);
  }

  @Post('claim-purchase')
  claimPurchase(
    @CurrentUser() user: { id: string },
    @Body() body: ClaimPurchaseDto,
  ) {
    if (!body.paymentId?.trim() && !body.orderId?.trim()) {
      throw new BadRequestException('paymentId or orderId is required');
    }
    return this.billingService.claimPurchase(user.id, {
      paymentId: body.paymentId?.trim(),
      orderId: body.orderId?.trim(),
    });
  }

  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  @Post('checkout-sessions/pilot')
  createPilotCheckoutSession(@CurrentUser() user: { id: string }) {
    return this.checkoutSessions.createPilotCheckoutSession(user.id);
  }

  @Post('create-checkout')
  createCheckout(@CurrentUser() user: { id: string }) {
    return this.billingService.createCheckout(user.id);
  }

  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @Post('redeem-promo')
  redeemPromo(
    @CurrentUser() user: { id: string },
    @Body() body: RedeemPromoDto,
  ) {
    return this.promoCodeService.redeem(user.id, body.code);
  }

  @Post('confirm-return')
  confirmReturn(@CurrentUser() user: { id: string }) {
    return this.billingService.confirmPaymentLinkReturn(user.id);
  }

  // Pro monthly/yearly subscriptions — not in scope for pilot launch.
  // Re-enable when RAZORPAY_PLAN_ID_* plans exist in Dashboard.
  @Post('create-subscription')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  createSubscription() {
    throw new BadRequestException(
      'Recurring Pro plans are not available yet. Use pilot checkout from Profile → Billing.',
    );
  }

  @Public()
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  @Post('webhook')
  webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing webhook body or signature');
    }
    return this.billingService.handleWebhook(Buffer.from(rawBody), signature);
  }
}
