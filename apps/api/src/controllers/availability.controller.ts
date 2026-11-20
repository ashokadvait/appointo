import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const availabilityController = {
  async getSchedules(req: AuthenticatedRequest, res: Response) {
    try {
      const schedules = await prisma.availabilitySchedule.findMany({
        where: { userId: req.userId },
        orderBy: { isDefault: 'desc' },
      });

      const parsed = schedules.map((s) => ({
        ...s,
        days: JSON.parse(s.daysJson || '[]'),
        overrides: JSON.parse(s.overridesJson || '[]'),
      }));

      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, timezone, days, overrides, bufferNoticeMinutes, maxDaysAhead } = req.body;

      const updated = await prisma.availabilitySchedule.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(timezone && { timezone }),
          ...(days && { daysJson: JSON.stringify(days) }),
          ...(overrides !== undefined && { overridesJson: JSON.stringify(overrides) }),
          ...(bufferNoticeMinutes !== undefined && { bufferNoticeMinutes: Number(bufferNoticeMinutes) }),
          ...(maxDaysAhead !== undefined && { maxDaysAhead: Number(maxDaysAhead) }),
        },
      });

      res.json({
        ...updated,
        days: JSON.parse(updated.daysJson),
        overrides: JSON.parse(updated.overridesJson),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getConnectedCalendars(req: AuthenticatedRequest, res: Response) {
    try {
      const calendars = await prisma.connectedCalendar.findMany({
        where: { userId: req.userId },
      });
      res.json(calendars);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async addConnectedCalendar(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider, email } = req.body;
      const created = await prisma.connectedCalendar.create({
        data: {
          userId: req.userId!,
          provider: provider || 'google',
          email: email || '',
          isPrimary: false,
          checkConflicts: true,
          addEvents: true,
        },
      });
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async toggleCalendar(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { checkConflicts, isPrimary, addEvents } = req.body;

      const updated = await prisma.connectedCalendar.update({
        where: { id },
        data: {
          ...(checkConflicts !== undefined && { checkConflicts }),
          ...(isPrimary !== undefined && { isPrimary }),
          ...(addEvents !== undefined && { addEvents }),
        },
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
