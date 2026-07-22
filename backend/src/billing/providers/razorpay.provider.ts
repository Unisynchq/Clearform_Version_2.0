import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type RazorpayPaymentEntity = {
  id: string;
  order_id?: string;
  email?: string;
  amount: number;
  currency: string;
  status: string;
  created_at?: number;
  notes?: Record<string, string>;
};

type RazorpayClient = {
  subscriptions: {
    create: (
      params: Record<string, unknown>,
    ) => Promise<{ id: string; status: string }>;
  };
  payments: {
    fetch: (paymentId: string) => Promise<RazorpayPaymentEntity>;
  };
  orders: {
    create: (params: Record<string, unknown>) => Promise<{
      id: string;
      amount: number;
      currency: string;
    }>;
    fetch: (orderId: string) => Promise<{
      id: string;
      notes?: Record<string, string>;
    }>;
    fetchPayments: (orderId: string) => Promise<{
      items: RazorpayPaymentEntity[];
    }>;
  };
};

// Razorpay publishes CJS (`export =`); default ESM import breaks at runtime in Nest.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RazorpayConstructor = require('razorpay') as new (config: {
  key_id: string;
  key_secret: string;
}) => RazorpayClient;

@Injectable()
export class RazorpayProvider implements OnModuleInit {
  private readonly logger = new Logger(RazorpayProvider.name);
  private client: RazorpayClient | null = null;
  private keyId: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) {
      this.keyId = keyId;
      this.client = new RazorpayConstructor({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      this.logger.warn('Razorpay keys not configured');
    }
  }

  isConfigured(): boolean {
    return this.client != null && this.keyId != null;
  }

  getKeyId(): string {
    if (!this.keyId) {
      throw new BadRequestException('Razorpay is not configured');
    }
    return this.keyId;
  }

  async createOrder(params: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    if (!this.client) {
      throw new BadRequestException('Razorpay is not configured');
    }
    return this.client.orders.create({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    });
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPaymentEntity> {
    if (!this.client) {
      throw new BadRequestException('Razorpay is not configured');
    }
    return this.client.payments.fetch(paymentId);
  }

  async fetchOrder(orderId: string): Promise<{
    id: string;
    notes?: Record<string, string>;
  }> {
    if (!this.client) {
      throw new BadRequestException('Razorpay is not configured');
    }
    return this.client.orders.fetch(orderId);
  }

  async fetchCapturedPaymentForOrder(
    orderId: string,
  ): Promise<RazorpayPaymentEntity | null> {
    if (!this.client) {
      throw new BadRequestException('Razorpay is not configured');
    }
    const result = await this.client.orders.fetchPayments(orderId);
    const captured = result.items?.find((p) => p.status === 'captured');
    return captured ?? null;
  }

  async createSubscription(params: Record<string, unknown>) {
    if (!this.client) {
      throw new BadRequestException('Razorpay is not configured');
    }
    return this.client.subscriptions.create(params);
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
    secret: string,
  ): boolean {
    const crypto = require('crypto') as typeof import('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }
}
