import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const crmController = {
  async listContacts(req: AuthenticatedRequest, res: Response) {
    try {
      const { search } = req.query;

      const whereClause: any = {};
      if (req.userId) {
        whereClause.userId = req.userId;
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: String(search) } },
          { email: { contains: String(search) } },
        ];
      }

      const contacts = await prisma.contact.findMany({
        where: whereClause,
        orderBy: { lastMeetingAt: 'desc' },
      });

      const parsed = contacts.map((c) => ({
        ...c,
        tags: JSON.parse(c.tagsJson || '[]'),
        notes: JSON.parse(c.notesJson || '[]'),
      }));

      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getContact(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const contact = await prisma.contact.findUnique({
        where: { id },
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Fetch meeting history
      const bookings = await prisma.booking.findMany({
        where: { inviteeEmail: contact.email },
        include: { eventType: true, payment: true },
        orderBy: { startTime: 'desc' },
      });

      res.json({
        ...contact,
        tags: JSON.parse(contact.tagsJson || '[]'),
        notes: JSON.parse(contact.notesJson || '[]'),
        meetingsHistory: bookings,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateContact(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { phone, tags } = req.body;

      const updated = await prisma.contact.update({
        where: { id },
        data: {
          ...(phone !== undefined && { phone }),
          ...(tags && { tagsJson: JSON.stringify(tags) }),
        },
      });

      res.json({
        ...updated,
        tags: JSON.parse(updated.tagsJson),
        notes: JSON.parse(updated.notesJson),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async addNote(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Note content is required' });
      }

      const contact = await prisma.contact.findUnique({ where: { id } });
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const existingNotes: any[] = JSON.parse(contact.notesJson || '[]');
      const newNote = {
        id: `note_${Date.now().toString(36)}`,
        authorName: req.user?.name || 'Host',
        content,
        createdAt: new Date().toISOString(),
      };

      existingNotes.unshift(newNote);

      const updated = await prisma.contact.update({
        where: { id },
        data: { notesJson: JSON.stringify(existingNotes) },
      });

      res.status(201).json({
        ...updated,
        tags: JSON.parse(updated.tagsJson),
        notes: existingNotes,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
