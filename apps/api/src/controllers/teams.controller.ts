import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const teamsController = {
  async list(_req: AuthenticatedRequest, res: Response) {
    try {
      const teams = await prisma.team.findMany({
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true, title: true, timezone: true },
              },
            },
          },
          eventTypes: {
            select: { id: true, name: true, duration: true, schedulingType: true, price: true },
          },
        },
      });
      res.json(teams);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req: AuthenticatedRequest, res: Response) {
    try {
      const { idOrSlug } = req.params;
      const team = await prisma.team.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true, title: true, timezone: true },
              },
            },
          },
          eventTypes: true,
        },
      });

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json(team);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, avatar } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Team name is required' });
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const team = await prisma.team.create({
        data: {
          name,
          slug: slug || `team-${Date.now().toString(36)}`,
          description,
          avatar: avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
          members: {
            create: [
              { userId: req.userId!, role: 'owner' },
            ],
          },
        },
        include: {
          members: { include: { user: true } },
        },
      });

      res.status(201).json(team);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async addMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { teamId } = req.params;
      const { userId, role } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const member = await prisma.teamMember.create({
        data: {
          teamId,
          userId,
          role: role || 'member',
        },
        include: { user: true },
      });

      res.status(201).json(member);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async removeMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { teamId, memberId } = req.params;
      await prisma.teamMember.delete({
        where: { id: memberId },
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
