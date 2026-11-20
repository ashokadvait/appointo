export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number; // in cents or currency unit
  currency: Currency;
  status: PaymentStatus;
  provider: 'stripe' | 'paypal' | 'manual';
  transactionId?: string;
  customerEmail: string;
  createdAt: string;
  refundedAt?: string;
}

export interface PaymentSettings {
  requiresPayment: boolean;
  price: number;
  currency: Currency;
  allowRefunds: boolean;
}
