import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const slotsController = {
  async getAvailableSlots(req: AuthenticatedRequest, res: Response) {
    try {
      const { eventTypeId, date, timezone, slotDuration } = req.query;

      if (!eventTypeId || !date) {
        return res.status(400).json({ error: 'eventTypeId and date are required' });
      }

      const requestedId = String(eventTypeId);
      const isDefaultFallback = requestedId === 'default';

      const eventType = isDefaultFallback
        ? null
        : await prisma.eventType.findFirst({
            where: {
              OR: [{ id: requestedId }, { slug: requestedId }],
            },
            include: {
              user: true,
              team: {
                include: {
                  members: { include: { user: true } },
                },
              },
            },
          });

      if (!eventType && !isDefaultFallback) {
        return res.status(404).json({ error: 'Event type not found', slots: [] });
      }

      // Determine Host User
      let hostUser = eventType?.user || req.user || null;
      if (!hostUser && eventType?.team?.members.length) {
        hostUser = eventType.team.members[0].user;
      }
      if (!hostUser) {
        hostUser = await prisma.user.findFirst();
      }

      const hostTimezone = hostUser?.timezone || 'America/New_York';
      const targetTimezone = String(timezone || hostTimezone);

      // Load Host Availability Schedule
      const schedule = await prisma.availabilitySchedule.findFirst({
        where: { userId: hostUser?.id, isDefault: true },
      });

      const days: any[] = schedule ? JSON.parse(schedule.daysJson) : [
        { dayOfWeek: 1, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 2, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 3, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 4, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 5, enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 6, enabled: false, intervals: [] },
        { dayOfWeek: 0, enabled: false, intervals: [] },
      ];

      const overrides: any[] = schedule ? JSON.parse(schedule.overridesJson || '[]') : [];

      const targetDate = new Date(`${date}T00:00:00Z`);
      const dayOfWeek = targetDate.getUTCDay();

      // Check date override first
      const override = overrides.find((o) => o.date === date);
      let dayIntervals: { start: string; end: string }[] = [];

      if (override) {
        if (!override.enabled) {
          return res.json({
            slots: [],
            hostTimezone,
            requestedTimezone: targetTimezone,
            reason: override.reason || 'Host is unavailable on this date',
          });
        }
        dayIntervals = override.intervals || [];
      } else {
        const dayConfig = days.find((d) => d.dayOfWeek === dayOfWeek);
        if (!dayConfig || !dayConfig.enabled || !dayConfig.intervals?.length) {
          return res.json({
            slots: [],
            hostTimezone,
            requestedTimezone: targetTimezone,
            reason: 'Host is closed on this day of the week',
          });
        }
        dayIntervals = dayConfig.intervals;
      }

      // Helper for timezone parsing
      const parseTimeInTz = (dateStr: string, timeStr: string, tz: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, min] = timeStr.split(':').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day, hour, min, 0));
        try {
          const invDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'UTC' }));
          const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone: tz }));
          const diffMs = targetDate.getTime() - invDate.getTime();
          return new Date(utcDate.getTime() - diffMs);
        } catch {
          return new Date(`${dateStr}T${timeStr}:00Z`);
        }
      };

      // Load existing active bookings for host collision check
      const bookingFilters: any[] = [];
      if (eventType?.id) bookingFilters.push({ eventTypeId: eventType.id });
      if (hostUser?.id) bookingFilters.push({ hostUserId: hostUser.id });

      const activeBookings = bookingFilters.length
        ? await prisma.booking.findMany({
            where: {
              OR: bookingFilters,
              status: 'scheduled',
            },
          })
        : [];

      const chosenDurationMinutes = Number(eventType?.duration) > 0
        ? Number(eventType!.duration)
        : (slotDuration ? Number(slotDuration) : ((schedule as any)?.defaultSlotDuration || 15));
      const durationMs = chosenDurationMinutes * 60 * 1000;
      const bufferBeforeMs = (eventType?.bufferBefore || 0) * 60 * 1000;
      const bufferAfterMs = (eventType?.bufferAfter || 0) * 60 * 1000;
      const noticeMs = (schedule?.bufferNoticeMinutes ?? 30) * 60 * 1000;
      const now = Date.now();

      const slots: any[] = [];
      const seenTimes = new Set<string>();

      for (const interval of dayIntervals) {
        const intervalStart = parseTimeInTz(String(date), interval.start, targetTimezone);
        const intervalEnd = parseTimeInTz(String(date), interval.end, targetTimezone);

        let currentSlotStart = intervalStart.getTime();
        const stepMs = Math.min(durationMs, 30 * 60 * 1000);

        while (currentSlotStart + durationMs <= intervalEnd.getTime()) {
          const currentSlotEnd = currentSlotStart + durationMs;

          // Check past time and notice threshold
          const isTooSoon = currentSlotStart < now + noticeMs;

          // Check booking collisions including buffer windows
          const hasConflict = activeBookings.some((b) => {
            const bStart = new Date(b.startTime).getTime();
            const bEnd = new Date(b.endTime).getTime();
            return (
              currentSlotStart - bufferBeforeMs < bEnd &&
              currentSlotEnd + bufferAfterMs > bStart
            );
          });

          if (!isTooSoon && !hasConflict) {
            const slotUtc = new Date(currentSlotStart).toISOString();
            if (!seenTimes.has(slotUtc)) {
              seenTimes.add(slotUtc);
              let timeFormatted = '';

              try {
                const timeFormatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: targetTimezone,
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                timeFormatted = timeFormatter.format(new Date(currentSlotStart));
              } catch {
                timeFormatted = new Date(currentSlotStart).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
              }

              slots.push({
                timeUtc: slotUtc,
                timeFormatted,
                duration: chosenDurationMinutes,
                availableHostUserId: hostUser?.id,
              });
            }
          }

          // Step by event duration or 30 min intervals
          currentSlotStart += stepMs;
        }
      }

      res.json({
        slots,
        hostTimezone,
        requestedTimezone: targetTimezone,
        hostName: hostUser?.name,
        hostAvatar: hostUser?.avatar,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
