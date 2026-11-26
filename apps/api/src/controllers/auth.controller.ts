import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AuthenticatedRequest, JWT_SECRET } from '../middleware/auth';

export const authController = {
  async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name, username, timezone } = req.body;
      if (!email || !name || !username || !password) {
        return res.status(400).json({ error: 'Email, name, username, and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });
      if (existing) {
        return res.status(400).json({ error: 'User with this email or username already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          username: username.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
          timezone: timezone || 'America/New_York',
        },
      });

      // Initialize default schedule
      const defaultDays = [
        { dayOfWeek: 1, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 2, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 3, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 4, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 5, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 6, enabled: false, intervals: [] },
        { dayOfWeek: 0, enabled: false, intervals: [] },
      ];

      await prisma.availabilitySchedule.create({
        data: {
          userId: user.id,
          name: 'Working Hours',
          isDefault: true,
          timezone: user.timezone,
          daysJson: JSON.stringify(defaultDays),
        },
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json({ user: safeUser, token });
    } catch (err: any) {
      console.error('[auth.register]', err);
      res.status(500).json({ error: 'Unable to create your account right now. Please try again later.' });
    }
  },

  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      const { passwordHash: _, ...safeUser } = user;
      res.json({ user: safeUser, token });
    } catch (err: any) {
      console.error('[auth.login]', err);
      res.status(500).json({ error: 'Unable to sign in right now. Please try again later.' });
    }
  },

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          schedules: true,
          calendars: true,
        },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      console.error('[auth.me]', err);
      res.status(500).json({ error: 'Unable to load your profile right now. Please try again later.' });
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, title, avatar, timezone, bio, username } = req.body;
      const updated = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(name && { name }),
          ...(title && { title }),
          ...(avatar && { avatar }),
          ...(timezone && { timezone }),
          ...(bio !== undefined && { bio }),
          ...(username && { username: username.toLowerCase() }),
        },
      });
      const { passwordHash: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      console.error('[auth.updateProfile]', err);
      res.status(400).json({ error: 'Unable to update your profile. Please check your details and try again.' });
    }
  },

  async forgotPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { email } = req.body;
      if (!email || !String(email).trim()) {
        return res.status(400).json({ error: 'Please enter your account email address.' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return res.status(404).json({ error: 'No account found with that email address.' });
      }

      // Sign with JWT_SECRET + current passwordHash so the token is automatically invalidated after one password change
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, purpose: 'password_reset' },
        `${JWT_SECRET}:${user.passwordHash}`,
        { expiresIn: '15m' }
      );

      res.json({
        message: 'Account verified. Enter your new password below.',
        resetToken,
      });
    } catch (err: any) {
      console.error('[auth.forgotPassword]', err);
      res.status(500).json({ error: 'Unable to start password reset right now. Please try again later.' });
    }
  },

  async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Reset token and new password are required.' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      const unverified = jwt.decode(String(token)) as { userId?: string; purpose?: string } | null;
      if (!unverified?.userId || unverified.purpose !== 'password_reset') {
        return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
      }

      const user = await prisma.user.findUnique({ where: { id: unverified.userId } });
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
      }

      try {
        jwt.verify(String(token), `${JWT_SECRET}:${user.passwordHash}`);
      } catch {
        return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
      }

      const passwordHash = await bcrypt.hash(String(newPassword), 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      res.json({ message: 'Your password has been updated. You can now sign in with your new password.' });
    } catch (err: any) {
      console.error('[auth.resetPassword]', err);
      res.status(500).json({ error: 'Unable to reset your password right now. Please try again later.' });
    }
  },

  async listUsers(_req: AuthenticatedRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          title: true,
          avatar: true,
          username: true,
          timezone: true,
        },
      });
      res.json(users);
    } catch (err: any) {
      console.error('[auth.listUsers]', err);
      res.status(500).json({ error: 'Unable to load users right now. Please try again later.' });
    }
  },
};
