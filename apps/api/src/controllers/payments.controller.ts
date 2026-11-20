import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const paymentsController = {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const payments = await prisma.payment.findMany({
        include: {
          booking: {
            include: { eventType: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createCheckoutSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { eventTypeId, customerEmail } = req.body;
      const eventType = await prisma.eventType.findUnique({
        where: { id: eventTypeId },
      });

      if (!eventType || !eventType.requiresPayment) {
        return res.status(400).json({ error: 'This meeting does not require payment' });
      }

      const sessionId = `cs_test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const clientSecret = `pi_test_secret_${Date.now().toString(36)}`;

      res.json({
        sessionId,
        clientSecret,
        amount: eventType.price,
        currency: eventType.currency,
        eventName: eventType.name,
        customerEmail,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async refund(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const payment = await prisma.payment.findUnique({ where: { id } });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const updated = await prisma.payment.update({
        where: { id },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
        },
      });

      await prisma.activityLog.create({
        data: {
          bookingId: payment.bookingId,
          type: 'PAYMENT_REFUNDED',
          recipient: payment.customerEmail,
          description: `Refunded ${payment.currency} ${payment.amount} for booking`,
        },
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
