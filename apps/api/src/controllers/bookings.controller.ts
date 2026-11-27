import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateIcs } from '@calendly/core';

export const bookingsController = {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { status } = req.query;

      const whereClause: any = {};
      if (status && status !== 'all') {
        whereClause.status = String(status);
      }
      if (req.userId) {
        whereClause.OR = [
          { hostUserId: req.userId },
          { eventType: { userId: req.userId } },
        ];
      }

      const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
          eventType: true,
          followUps: true,
          payment: true,
          hostUser: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      const parsed = bookings.map((b) => ({
        ...b,
        eventTypeName: b.eventType.name,
        customAnswers: JSON.parse(b.customAnswersJson || '{}'),
      }));

      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          eventType: true,
          followUps: true,
          payment: true,
          hostUser: true,
        },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json({
        ...booking,
        eventTypeName: booking.eventType.name,
        customAnswers: JSON.parse(booking.customAnswersJson || '{}'),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        eventTypeId,
        hostUserId,
        inviteeName,
        inviteeEmail,
        inviteeTimezone,
        startTime,
        duration,
        customAnswers,
        paymentDetails,
      } = req.body;

      if (!eventTypeId || !startTime) {
        return res.status(400).json({ error: 'eventTypeId and startTime are required' });
      }

      const resolvedInviteeName = String(inviteeName || '').trim() || 'Guest';
      const resolvedInviteeEmail = String(inviteeEmail || '').trim();

      let eventType = await prisma.eventType.findFirst({
        where: {
          OR: [{ id: eventTypeId }, { slug: eventTypeId }],
        },
        include: { user: true },
      });

      if (!eventType && eventTypeId === 'default') {
        const defaultHost =
          (hostUserId ? await prisma.user.findUnique({ where: { id: hostUserId } }) : null) ||
          req.user ||
          (await prisma.user.findFirst());

        if (defaultHost) {
          eventType = await prisma.eventType.create({
            data: {
              userId: defaultHost.id,
              slug: 'default',
              name: 'Appointment',
              duration: Number(duration) > 0 ? Number(duration) : 30,
              description: 'Scheduled via custom booking form',
            },
            include: { user: true },
          });
        }
      }

      if (!eventType) {
        return res.status(404).json({ error: 'Event type not found' });
      }

      const hostId = hostUserId || eventType.userId || (await prisma.user.findFirst())?.id;
      const start = new Date(startTime);
      const effectiveDuration = Number(duration) > 0 ? Number(duration) : eventType.duration;
      const end = new Date(start.getTime() + effectiveDuration * 60 * 1000);
      const now = new Date();

      // Past Date / Time Validation: strictly reject creating meetings in the past
      if (start.getTime() <= now.getTime()) {
        return res.status(400).json({ error: 'Cannot book meetings for past dates or times. Please select an upcoming slot.' });
      }

      // Check for conflict
      const conflict = await prisma.booking.findFirst({
        where: {
          OR: [
            { eventTypeId: eventType.id },
            { hostUserId: hostId },
          ],
          status: 'scheduled',
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (conflict) {
        return res.status(409).json({ error: 'This time slot is no longer available. Please select another time.' });
      }

      // 4-Stage Follow-Up schedule
      const followUpsData = [
        {
          type: 'confirmation',
          status: 'sent',
          sentAt: now,
          channel: 'email',
        },
        {
          type: 'reminder_24h',
          status: 'pending',
          scheduledFor: new Date(start.getTime() - 24 * 60 * 60 * 1000),
          channel: 'email',
        },
        {
          type: 'reminder_1h',
          status: 'pending',
          scheduledFor: new Date(start.getTime() - 60 * 60 * 1000),
          channel: 'email',
        },
        {
          type: 'followup_post',
          status: 'pending',
          scheduledFor: new Date(end.getTime() + 60 * 60 * 1000),
          channel: 'email',
        },
      ];

      const newBooking = await prisma.booking.create({
        data: {
          eventTypeId: eventType.id,
          hostUserId: hostId,
          inviteeName: resolvedInviteeName,
          inviteeEmail: resolvedInviteeEmail,
          inviteeTimezone: inviteeTimezone || eventType.user?.timezone || 'America/New_York',
          startTime: start,
          endTime: end,
          location: eventType.locationDetails,
          status: 'scheduled',
          customAnswersJson: JSON.stringify(customAnswers || {}),
          followUps: { create: followUpsData },
        },
        include: { followUps: true, eventType: true },
      });

      // Handle payment if required
      if (eventType.requiresPayment && eventType.price > 0) {
        await prisma.payment.create({
          data: {
            bookingId: newBooking.id,
            amount: eventType.price,
            currency: eventType.currency || 'USD',
            status: paymentDetails?.status || 'paid',
            provider: paymentDetails?.provider || 'stripe',
            transactionId: paymentDetails?.transactionId || `tx_${Date.now().toString(36)}`,
            customerEmail: resolvedInviteeEmail,
          },
        });
      }

      // Automatically sync or upsert Contact in CRM when an email is provided
      if (hostId && resolvedInviteeEmail) {
        const existingContact = await prisma.contact.findFirst({
          where: { userId: hostId, email: resolvedInviteeEmail },
        });

        if (existingContact) {
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              totalBookings: { increment: 1 },
              totalSpend: { increment: eventType.requiresPayment ? eventType.price : 0 },
              lastMeetingAt: start,
            },
          });
        } else {
          await prisma.contact.create({
            data: {
              userId: hostId,
              name: resolvedInviteeName,
              email: resolvedInviteeEmail,
              timezone: inviteeTimezone,
              tagsJson: JSON.stringify(['Inbound Lead', eventType.requiresPayment ? 'Paying Client' : 'Free Consultation']),
              totalBookings: 1,
              totalSpend: eventType.requiresPayment ? eventType.price : 0,
              lastMeetingAt: start,
            },
          });
        }
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: hostId,
          bookingId: newBooking.id,
          type: 'BOOKING_CREATED',
          recipient: resolvedInviteeEmail || resolvedInviteeName,
          description: `Booking confirmed for ${eventType.name} on ${start.toDateString()}`,
        },
      });

      res.status(201).json({
        booking: {
          ...newBooking,
          eventTypeName: eventType.name,
          customAnswers: customAnswers || {},
        },
        icsUrl: `/api/bookings/${newBooking.id}/ics`,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, privateNotes } = req.body;

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(privateNotes !== undefined && { privateNotes }),
        },
        include: { eventType: true, followUps: true },
      });

      await prisma.activityLog.create({
        data: {
          userId: updated.hostUserId,
          bookingId: updated.id,
          type: `STATUS_UPDATED_${status.toUpperCase()}`,
          recipient: updated.inviteeEmail,
          description: `Appointment marked as ${status}`,
        },
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async reschedule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { newStartTime } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { eventType: true },
      });
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const start = new Date(newStartTime);
      const end = new Date(start.getTime() + booking.eventType.duration * 60 * 1000);

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          startTime: start,
          endTime: end,
          status: 'rescheduled',
        },
        include: { eventType: true, followUps: true },
      });

      await prisma.activityLog.create({
        data: {
          userId: updated.hostUserId,
          bookingId: updated.id,
          type: 'BOOKING_RESCHEDULED',
          recipient: updated.inviteeEmail,
          description: `Appointment rescheduled to ${start.toLocaleString()}`,
        },
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancellationReason: reason || 'Cancelled by attendee or host',
        },
        include: { eventType: true, followUps: true },
      });

      // Cancel all pending follow-ups
      await prisma.followUp.updateMany({
        where: { bookingId: id, status: 'pending' },
        data: { status: 'cancelled' },
      });

      await prisma.activityLog.create({
        data: {
          userId: updated.hostUserId,
          bookingId: updated.id,
          type: 'BOOKING_CANCELLED',
          recipient: updated.inviteeEmail,
          description: `Appointment cancelled: ${reason || 'No reason provided'}`,
        },
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        inviteeName,
        inviteeEmail,
        startTime,
        endTime,
        location,
        status,
        privateNotes,
        customAnswers,
      } = req.body;

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          ...(inviteeName && { inviteeName }),
          ...(inviteeEmail && { inviteeEmail }),
          ...(startTime && { startTime: new Date(startTime) }),
          ...(endTime && { endTime: new Date(endTime) }),
          ...(location && { location }),
          ...(status && { status }),
          ...(privateNotes !== undefined && { privateNotes }),
          ...(customAnswers && { customAnswersJson: JSON.stringify(customAnswers) }),
        },
        include: { eventType: true, followUps: true },
      });

      res.json({
        ...updated,
        eventTypeName: updated.eventType.name,
        customAnswers: JSON.parse(updated.customAnswersJson || '{}'),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      await prisma.followUp.deleteMany({ where: { bookingId: id } });
      await prisma.payment.deleteMany({ where: { bookingId: id } });
      await prisma.booking.delete({ where: { id } });

      res.json({ success: true, removedId: id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async downloadIcs(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { eventType: true, hostUser: true },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const hostProfile: any = {
        name: booking.hostUser?.name || 'Host',
        email: booking.hostUser?.email || '',
      };

      const ics = generateIcs(
        {
          id: booking.id,
          eventTypeId: booking.eventTypeId,
          eventTypeName: booking.eventType.name,
          inviteeName: booking.inviteeName,
          inviteeEmail: booking.inviteeEmail,
          inviteeTimezone: booking.inviteeTimezone,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          location: booking.location,
          status: booking.status as any,
          customAnswers: {},
          createdAt: booking.createdAt.toISOString(),
          followUps: [],
        },
        hostProfile
      );

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${booking.id}.ics"`);
      res.send(ics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
