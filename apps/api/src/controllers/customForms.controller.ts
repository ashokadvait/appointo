import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function serializeForm(form: any) {
  return {
    id: form.id,
    title: form.title,
    description: form.description ?? '',
    organizationName: form.organizationName ?? '',
    fields: safeJsonParse(form.fieldsJson, []),
    targetEventTypeIds: safeJsonParse(form.targetEventTypeIdsJson, []),
    isDefault: Boolean(form.isDefault),
    createdAt: form.createdAt instanceof Date ? form.createdAt.toISOString() : form.createdAt,
    updatedAt: form.updatedAt instanceof Date ? form.updatedAt.toISOString() : form.updatedAt,
  };
}

export const customFormsController = {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const where = req.userId ? { userId: req.userId } : {};
      const forms = await prisma.customForm.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      res.json(forms.map(serializeForm));
    } catch (err: any) {
      console.error('[customForms.list]', err);
      res.status(500).json({ error: 'Unable to load custom forms right now.' });
    }
  },

  async getOne(req: AuthenticatedRequest, res: Response) {
    try {
      const form = await prisma.customForm.findUnique({
        where: { id: req.params.id },
      });
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }
      res.json(serializeForm(form));
    } catch (err: any) {
      console.error('[customForms.getOne]', err);
      res.status(500).json({ error: 'Unable to load custom form right now.' });
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        id,
        title,
        description,
        organizationName,
        fields,
        targetEventTypeIds,
        isDefault,
      } = req.body;

      if (!title || !String(title).trim()) {
        return res.status(400).json({ error: 'Form title is required' });
      }

      if (isDefault && req.userId) {
        await prisma.customForm.updateMany({
          where: { userId: req.userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const data = {
        userId: req.userId ?? null,
        title: String(title).trim(),
        description: description ?? '',
        organizationName: organizationName ?? '',
        fieldsJson: JSON.stringify(Array.isArray(fields) ? fields : []),
        targetEventTypeIdsJson: JSON.stringify(
          Array.isArray(targetEventTypeIds) ? targetEventTypeIds : []
        ),
        isDefault: Boolean(isDefault),
      };

      const saved = id
        ? await prisma.customForm.upsert({
            where: { id: String(id) },
            update: data,
            create: { id: String(id), ...data },
          })
        : await prisma.customForm.create({ data });

      res.status(201).json(serializeForm(saved));
    } catch (err: any) {
      console.error('[customForms.create]', err);
      res.status(500).json({ error: 'Unable to save custom form right now.' });
    }
  },

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const formId = req.params.id;
      const {
        title,
        description,
        organizationName,
        fields,
        targetEventTypeIds,
        isDefault,
      } = req.body;

      if (isDefault && req.userId) {
        await prisma.customForm.updateMany({
          where: { userId: req.userId, isDefault: true, NOT: { id: formId } },
          data: { isDefault: false },
        });
      }

      const existing = await prisma.customForm.findUnique({ where: { id: formId } });

      if (existing) {
        const updated = await prisma.customForm.update({
          where: { id: formId },
          data: {
            ...(title !== undefined && { title: String(title).trim() }),
            ...(description !== undefined && { description }),
            ...(organizationName !== undefined && { organizationName }),
            ...(fields !== undefined && {
              fieldsJson: JSON.stringify(Array.isArray(fields) ? fields : []),
            }),
            ...(targetEventTypeIds !== undefined && {
              targetEventTypeIdsJson: JSON.stringify(
                Array.isArray(targetEventTypeIds) ? targetEventTypeIds : []
              ),
            }),
            ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
          },
        });
        return res.json(serializeForm(updated));
      }

      if (!title || !String(title).trim()) {
        return res.status(400).json({ error: 'Form title is required' });
      }

      const created = await prisma.customForm.create({
        data: {
          id: formId,
          userId: req.userId ?? null,
          title: String(title).trim(),
          description: description ?? '',
          organizationName: organizationName ?? '',
          fieldsJson: JSON.stringify(Array.isArray(fields) ? fields : []),
          targetEventTypeIdsJson: JSON.stringify(
            Array.isArray(targetEventTypeIds) ? targetEventTypeIds : []
          ),
          isDefault: Boolean(isDefault),
        },
      });
      res.status(201).json(serializeForm(created));
    } catch (err: any) {
      console.error('[customForms.update]', err);
      res.status(500).json({ error: 'Unable to save custom form right now.' });
    }
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      await prisma.customForm.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error('[customForms.delete]', err);
      res.status(404).json({ error: 'Form not found' });
    }
  },
};

