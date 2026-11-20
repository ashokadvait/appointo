import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const analyticsController = {
  async getOverview(_req: AuthenticatedRequest, res: Response) {
    try {
      const allBookings = await prisma.booking.findMany({
        include: { eventType: true, payment: true },
      });

      const totalBookings = allBookings.length;
      const completedBookings = allBookings.filter((b) => b.status === 'completed').length;
      const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled').length;
      const noShowCount = allBookings.filter((b) => b.status === 'no_show').length;
      const rescheduledCount = allBookings.filter((b) => b.status === 'rescheduled').length;

      const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;
      const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;
      const noShowRate = totalBookings > 0 ? Math.round((noShowCount / totalBookings) * 100) : 0;

      // Revenue Calculation
      const payments = await prisma.payment.findMany({
        where: { status: 'paid' },
      });
      const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

      // Top Event Types
      const eventTypeMap: Record<string, { name: string; count: number; revenue: number }> = {};
      allBookings.forEach((b) => {
        const id = b.eventTypeId;
        if (!eventTypeMap[id]) {
          eventTypeMap[id] = { name: b.eventType.name, count: 0, revenue: 0 };
        }
        eventTypeMap[id].count += 1;
        if (b.payment?.status === 'paid') {
          eventTypeMap[id].revenue += b.payment.amount;
        }
      });

      const topEventTypes = Object.entries(eventTypeMap).map(([id, data]) => ({
        id,
        name: data.name,
        bookingsCount: data.count,
        revenue: data.revenue,
      }));

      // Popular Days
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      allBookings.forEach((b) => {
        const day = new Date(b.startTime).getDay();
        dayCounts[day] += 1;
      });

      const popularDays = dayNames.map((dayName, idx) => ({
        dayName,
        count: dayCounts[idx],
      }));

      // Team Workload
      const users = await prisma.user.findMany({
        select: { id: true, name: true, avatar: true },
      });
      const teamWorkload = users.map((u) => {
        const userBookings = allBookings.filter((b) => b.hostUserId === u.id);
        return {
          userId: u.id,
          name: u.name,
          avatar: u.avatar,
          totalMeetings: userBookings.length,
          completedMeetings: userBookings.filter((b) => b.status === 'completed').length,
        };
      });

      res.json({
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowCount,
        rescheduledCount,
        completionRate,
        cancellationRate,
        noShowRate,
        totalRevenue,
        popularDays,
        topEventTypes,
        teamWorkload,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
