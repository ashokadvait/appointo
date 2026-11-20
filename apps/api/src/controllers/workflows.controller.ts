import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const workflowsController = {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const workflows = await prisma.workflow.findMany({
        where: req.userId ? { userId: req.userId } : {},
      });

      // Map by key for easy object lookup
      const map: Record<string, any> = {};
      workflows.forEach((w) => {
        map[w.key] = w;
      });

      res.json(map);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const updates = req.body; // map of key -> workflow fields

      for (const [key, val] of Object.entries(updates) as [string, any][]) {
        await prisma.workflow.upsert({
          where: {
            userId_key: {
              userId: req.userId!,
              key,
            },
          },
          update: {
            subject: val.subject,
            body: val.body,
            isEnabled: val.isEnabled !== undefined ? val.isEnabled : val.enabled,
          },
          create: {
            userId: req.userId!,
            key,
            title: val.title || key,
            trigger: val.trigger || 'immediately_after_booking',
            subject: val.subject || '',
            body: val.body || '',
            isEnabled: val.isEnabled !== undefined ? val.isEnabled : true,
          },
        });
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async dispatchFollowUp(req: AuthenticatedRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      const { type, channel, message } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { eventType: true },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const targetType = type || 'manual_followup';
      const now = new Date();

      const existing = await prisma.followUp.findFirst({
        where: { bookingId, type: targetType },
      });

      let followUp;
      if (existing) {
        followUp = await prisma.followUp.update({
          where: { id: existing.id },
          data: { status: 'sent', sentAt: now },
        });
      } else {
        followUp = await prisma.followUp.create({
          data: {
            bookingId,
            type: targetType,
            status: 'sent',
            channel: channel || 'email',
            sentAt: now,
            message,
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          userId: booking.hostUserId,
          bookingId: booking.id,
          type: `FOLLOWUP_SENT_${targetType.toUpperCase()}`,
          recipient: booking.inviteeEmail,
          description: `Dispatched follow-up (${targetType}) to ${booking.inviteeName}`,
        },
      });

      res.json({ success: true, followUp });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const logs = await prisma.activityLog.findMany({
        where: req.userId ? { userId: req.userId } : {},
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async testWebhook(req: Request, res: Response) {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Target URL is required' });
      }

      const testPayload = {
        event: 'booking.created',
        timestamp: new Date().toISOString(),
        payload: {
          booking_id: `bk_test_${Date.now().toString(36)}`,
          event_type: '30-Minute Strategy Call',
          attendee_name: 'Webhook Tester',
          attendee_email: 'tester@example.com',
          meeting_time: new Date(Date.now() + 86400000).toISOString(),
          status: 'confirmed',
        },
      };

      res.json({
        success: true,
        message: 'Webhook payload formatted and queued for external delivery',
        targetUrl: url,
        dispatchedPayload: testPayload,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
