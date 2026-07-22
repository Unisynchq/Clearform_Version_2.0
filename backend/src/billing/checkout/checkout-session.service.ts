import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PILOT_35_PLAN } from '../../config/plans';
import { RazorpayProvider } from '../providers/razorpay.provider';

export type PilotCheckoutSessionResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: string;
  callbackUrl: string;
  productName: string;
  description: string;
};

@Injectable()
export class CheckoutSessionService {
  constructor(
    private readonly razorpay: RazorpayProvider,
    private readonly config: ConfigService,
  ) {}

  async createPilotCheckoutSession(
    userId: string,
  ): Promise<PilotCheckoutSessionResponse> {
    if (!this.razorpay.isConfigured()) {
      throw new BadRequestException(
        'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      );
    }

    const appUrl =
      this.config.get<string>('APP_URL')?.replace(/\/$/, '') ??
      'https://app.clearform.in';

    const amount = Math.round(PILOT_35_PLAN.priceUsd * 100);
    const currency = 'USD';

    const order = await this.razorpay.createOrder({
      amount,
      currency,
      receipt: `pilot_${randomUUID().slice(0, 8)}`,
      notes: {
        planId: PILOT_35_PLAN.id,
        source: 'platform_checkout',
        userId,
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.razorpay.getKeyId(),
      planId: PILOT_35_PLAN.id,
      callbackUrl: `${appUrl}/dashboard/profile?tab=billing`,
      productName: 'Clearform',
      description: PILOT_35_PLAN.name,
    };
  }
}
