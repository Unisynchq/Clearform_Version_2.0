declare module 'razorpay' {
  interface RazorpaySubscription {
    id: string;
    status: string;
  }

  interface RazorpayPayment {
    id: string;
    order_id?: string;
    email?: string;
    amount: number;
    currency: string;
    status: string;
    created_at?: number;
  }

  interface RazorpaySubscriptions {
    create(params: {
      plan_id: string;
      total_count: number;
      customer_notify?: number;
      notes?: Record<string, string>;
    }): Promise<RazorpaySubscription>;
  }

  interface RazorpayPayments {
    fetch(paymentId: string): Promise<RazorpayPayment>;
  }

  interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
  }

  interface RazorpayOrders {
    create(params: {
      amount: number;
      currency: string;
      receipt: string;
      notes?: Record<string, string>;
    }): Promise<RazorpayOrder>;
    fetchPayments(orderId: string): Promise<{ items: RazorpayPayment[] }>;
  }

  export default class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    subscriptions: RazorpaySubscriptions;
    payments: RazorpayPayments;
    orders: RazorpayOrders;
  }
}
