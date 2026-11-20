import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const eventTypesController = {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { userSlug, teamSlug } = req.query;

      let whereClause: any = {};

      if (userSlug) {
        const targetUser = await prisma.user.findUnique({
          where: { username: String(userSlug) },
        });
        if (!targetUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        whereClause.userId = targetUser.id;
      } else if (teamSlug) {
        const targetTeam = await prisma.team.findUnique({
          where: { slug: String(teamSlug) },
        });
        if (!targetTeam) {
          return res.status(404).json({ error: 'Team not found' });
        }
        whereClause.teamId = targetTeam.id;
      } else if (req.userId) {
        whereClause.OR = [
          { userId: req.userId },
          { teamId: { not: null } },
        ];
      }

      const eventTypes = await prisma.eventType.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, username: true, timezone: true },
          },
          team: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const parsed = eventTypes.map((et) => ({
        ...et,
        customQuestions: JSON.parse(et.customQuestionsJson || '[]'),
      }));

      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req: AuthenticatedRequest, res: Response) {
    try {
      const { idOrSlug } = req.params;
      const eventType = await prisma.eventType.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, username: true, timezone: true, title: true },
          },
          team: {
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, avatar: true, timezone: true } },
                },
              },
            },
          },
        },
      });

      if (!eventType) {
        return res.status(404).json({ error: 'Event type not found' });
      }

      res.json({
        ...eventType,
        customQuestions: JSON.parse(eventType.customQuestionsJson || '[]'),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        name,
        duration,
        color,
        description,
        locationType,
        locationDetails,
        bufferBefore,
        bufferAfter,
        schedulingType,
        maxInvitees,
        isPrivate,
        requiresPayment,
        price,
        currency,
        customQuestions,
        teamId,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newEventType = await prisma.eventType.create({
        data: {
          userId: req.userId,
          teamId: teamId || null,
          slug: slug || `meeting-${Date.now().toString(36)}`,
          name,
          duration: Number(duration) || 30,
          color: color || '#3b82f6',
          description: description || '',
          locationType: locationType || 'google_meet',
          locationDetails: locationDetails || 'https://meet.google.com/new',
          bufferBefore: Number(bufferBefore) || 0,
          bufferAfter: Number(bufferAfter) || 0,
          schedulingType: schedulingType || 'one_on_one',
          maxInvitees: Number(maxInvitees) || 1,
          isPrivate: Boolean(isPrivate),
          requiresPayment: Boolean(requiresPayment),
          price: Number(price) || 0,
          currency: currency || 'USD',
          customQuestionsJson: JSON.stringify(customQuestions || []),
        },
      });

      res.status(201).json({
        ...newEventType,
        customQuestions: JSON.parse(newEventType.customQuestionsJson),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        duration,
        color,
        description,
        locationType,
        locationDetails,
        bufferBefore,
        bufferAfter,
        schedulingType,
        maxInvitees,
        isPrivate,
        requiresPayment,
        price,
        currency,
        customQuestions,
      } = req.body;

      const updated = await prisma.eventType.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(duration !== undefined && { duration: Number(duration) }),
          ...(color && { color }),
          ...(description !== undefined && { description }),
          ...(locationType && { locationType }),
          ...(locationDetails && { locationDetails }),
          ...(bufferBefore !== undefined && { bufferBefore: Number(bufferBefore) }),
          ...(bufferAfter !== undefined && { bufferAfter: Number(bufferAfter) }),
          ...(schedulingType && { schedulingType }),
          ...(maxInvitees !== undefined && { maxInvitees: Number(maxInvitees) }),
          ...(isPrivate !== undefined && { isPrivate: Boolean(isPrivate) }),
          ...(requiresPayment !== undefined && { requiresPayment: Boolean(requiresPayment) }),
          ...(price !== undefined && { price: Number(price) }),
          ...(currency && { currency }),
          ...(customQuestions && { customQuestionsJson: JSON.stringify(customQuestions) }),
        },
      });

      res.json({
        ...updated,
        customQuestions: JSON.parse(updated.customQuestionsJson),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const bookings = await prisma.booking.findMany({ where: { eventTypeId: id }, select: { id: true } });
      const bookingIds = bookings.map((b) => b.id);
      if (bookingIds.length > 0) {
        await prisma.followUp.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.booking.deleteMany({ where: { eventTypeId: id } });
      }
      await prisma.eventType.delete({ where: { id } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
