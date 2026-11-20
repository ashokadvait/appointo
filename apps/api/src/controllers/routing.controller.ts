import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const routingController = {
  async listForms(req: AuthenticatedRequest, res: Response) {
    try {
      const forms = await prisma.routingForm.findMany({
        where: req.userId ? { userId: req.userId } : {},
        orderBy: { createdAt: 'desc' },
      });

      const parsed = forms.map((f) => ({
        ...f,
        questions: JSON.parse(f.questionsJson || '[]'),
        rules: JSON.parse(f.rulesJson || '[]'),
      }));

      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const form = await prisma.routingForm.findUnique({
        where: { id },
      });

      if (!form) {
        return res.status(404).json({ error: 'Routing form not found' });
      }

      res.json({
        ...form,
        questions: JSON.parse(form.questionsJson || '[]'),
        rules: JSON.parse(form.rulesJson || '[]'),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createForm(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, description, questions, rules, fallbackEventTypeId } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const form = await prisma.routingForm.create({
        data: {
          userId: req.userId!,
          title,
          description,
          questionsJson: JSON.stringify(questions || []),
          rulesJson: JSON.stringify(rules || []),
          fallbackEventTypeId,
        },
      });

      res.status(201).json({
        ...form,
        questions: JSON.parse(form.questionsJson),
        rules: JSON.parse(form.rulesJson),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateForm(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, questions, rules, fallbackEventTypeId, isPublished } = req.body;

      const updated = await prisma.routingForm.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(questions && { questionsJson: JSON.stringify(questions) }),
          ...(rules && { rulesJson: JSON.stringify(rules) }),
          ...(fallbackEventTypeId !== undefined && { fallbackEventTypeId }),
          ...(isPublished !== undefined && { isPublished }),
        },
      });

      res.json({
        ...updated,
        questions: JSON.parse(updated.questionsJson),
        rules: JSON.parse(updated.rulesJson),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async submitAndRoute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { answers } = req.body; // e.g. { q_budget: "$50,000+", q_scale: "Growth" }

      const form = await prisma.routingForm.findUnique({ where: { id } });
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      const rules: any[] = JSON.parse(form.rulesJson || '[]');
      let matchedRule: any = null;

      for (const rule of rules) {
        const answer = answers[rule.fieldId];
        if (!answer) continue;

        if (rule.operator === 'equals' && answer === rule.value) {
          matchedRule = rule;
          break;
        } else if (rule.operator === 'contains' && String(answer).includes(rule.value)) {
          matchedRule = rule;
          break;
        }
      }

      let targetEventTypeId = matchedRule?.targetId || form.fallbackEventTypeId;
      let targetUrl = `/book?slug=${targetEventTypeId}`;

      if (targetEventTypeId) {
        const et = await prisma.eventType.findUnique({ where: { id: targetEventTypeId } });
        if (et) {
          targetUrl = `/book/${et.slug || et.id}`;
        }
      }

      res.json({
        success: true,
        matchedRule,
        targetEventTypeId,
        redirectUrl: targetUrl,
        message: matchedRule ? 'Qualified for specialized advisory tier' : 'Routed to standard discovery sync',
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
