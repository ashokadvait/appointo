"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDateTimeInTimezone = parseDateTimeInTimezone;
exports.computeAvailableSlots = computeAvailableSlots;
/**
 * Parses a date string (YYYY-MM-DD) and time string (HH:mm) in a specific timezone
 * and returns the corresponding Date object (in UTC).
 */
function parseDateTimeInTimezone(dateStr, timeStr, timeZone) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, min] = timeStr.split(':').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, min, 0));
    try {
        const invDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'UTC' }));
        const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone }));
        const diffMs = targetDate.getTime() - invDate.getTime();
        return new Date(utcDate.getTime() - diffMs);
    }
    catch {
        return new Date(`${dateStr}T${timeStr}:00Z`);
    }
}
/**
 * Returns today's date formatted as YYYY-MM-DD in the target timezone.
 */
function getTodayStringInTimezone(timeZone) {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(new Date());
    }
    catch {
        return new Date().toISOString().split('T')[0];
    }
}
/**
 * Computes available booking slots for a specific date and event type,
 * accounting for host availability schedule (declared daily intervals, overrides, defaultSlotDuration),
 * custom event time slots, buffers before/after, minimum advance notice, past date/time disabling,
 * and collision checks with active bookings.
 */
function computeAvailableSlots(eventType, host, activeBookings, dateString, requestedTimezone, allEventTypes, slotDurationMinutes, schedule) {
    const targetTimezone = requestedTimezone || schedule?.timezone || host?.timezone || 'America/New_York';
    const todayStr = getTodayStringInTimezone(targetTimezone);
    // Slot duration selection: explicitly requested slot duration takes precedence, then eventType duration, then schedule/host default
    const chosenDuration = (slotDurationMinutes && slotDurationMinutes > 0)
        ? slotDurationMinutes
        : (Number(eventType?.duration) > 0
            ? Number(eventType.duration)
            : (schedule?.defaultSlotDuration || host?.defaultSlotDuration || 15));
    // 1. Disable past dates
    if (dateString < todayStr) {
        return {
            slots: [],
            hostTimezone: host?.timezone || 'America/New_York',
            requestedTimezone: targetTimezone,
            reason: 'Past dates cannot be scheduled.',
            slotDuration: chosenDuration,
        };
    }
    // 2. Check Event Type Date Availability constraints
    if (eventType.dateType === 'specific_date' && eventType.specificDate) {
        if (eventType.specificDate < todayStr || dateString !== eventType.specificDate) {
            return {
                slots: [],
                hostTimezone: host?.timezone || 'America/New_York',
                requestedTimezone: targetTimezone,
                reason: eventType.specificDate < todayStr
                    ? 'This event date has already passed.'
                    : `This event is only available on ${eventType.specificDate}.`,
                slotDuration: chosenDuration,
            };
        }
    }
    else if (eventType.dateType === 'range') {
        if (eventType.startDate && dateString < eventType.startDate) {
            return {
                slots: [],
                hostTimezone: host?.timezone || 'America/New_York',
                requestedTimezone: targetTimezone,
                reason: `Bookings open on ${eventType.startDate}.`,
                slotDuration: chosenDuration,
            };
        }
        if (eventType.endDate && dateString > eventType.endDate) {
            return {
                slots: [],
                hostTimezone: host?.timezone || 'America/New_York',
                requestedTimezone: targetTimezone,
                reason: `Bookings closed on ${eventType.endDate}.`,
                slotDuration: chosenDuration,
            };
        }
    }
    // 3. Check Schedule Date Overrides (e.g. Blackouts, Holidays)
    let timeWindows = [];
    if (schedule?.overrides && schedule.overrides.length > 0) {
        const override = schedule.overrides.find((o) => o.date === dateString);
        if (override) {
            if (!override.enabled) {
                return {
                    slots: [],
                    hostTimezone: schedule.timezone || host?.timezone || 'America/New_York',
                    requestedTimezone: targetTimezone,
                    reason: override.reason || 'Host is unavailable on this date (Configured in Availability).',
                    slotDuration: chosenDuration,
                };
            }
            if (override.intervals && override.intervals.length > 0 && (!eventType.customTimeSlots || eventType.customTimeSlots.length === 0)) {
                timeWindows = override.intervals;
            }
        }
    }
    // 4. Check Day of Week Working Hours & Declared Time Slots
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    if (schedule?.days && schedule.days.length > 0) {
        const dayConfig = schedule.days.find((d) => d.dayOfWeek === dayOfWeek);
        if (!dayConfig || !dayConfig.enabled) {
            return {
                slots: [],
                hostTimezone: schedule.timezone || host?.timezone || 'America/New_York',
                requestedTimezone: targetTimezone,
                reason: 'Host is closed on this day (Configured in Availability schedule).',
                slotDuration: chosenDuration,
            };
        }
        if ((!eventType.customTimeSlots || eventType.customTimeSlots.length === 0) && timeWindows.length === 0) {
            if (dayConfig.intervals && dayConfig.intervals.length > 0) {
                timeWindows = dayConfig.intervals;
            }
            else {
                return {
                    slots: [],
                    hostTimezone: schedule.timezone || host?.timezone || 'America/New_York',
                    requestedTimezone: targetTimezone,
                    reason: 'No availability intervals defined for this day.',
                    slotDuration: chosenDuration,
                };
            }
        }
    }
    else if (host?.workingDays && !host.workingDays.includes(dayOfWeek)) {
        return {
            slots: [],
            hostTimezone: host.timezone,
            requestedTimezone: targetTimezone,
            reason: 'Host is closed on this day.',
            slotDuration: chosenDuration,
        };
    }
    // 5. If time windows not established by schedule/override, use event custom slots or host working hours
    if (timeWindows.length === 0) {
        if (eventType.customTimeSlots && eventType.customTimeSlots.length > 0) {
            timeWindows = eventType.customTimeSlots;
        }
        else if (host?.workingHours) {
            timeWindows = [{ start: host.workingHours.start || '09:00', end: host.workingHours.end || '17:00' }];
        }
        else {
            timeWindows = [{ start: '09:00', end: '17:00' }];
        }
    }
    const durationMs = chosenDuration * 60 * 1000;
    const bufferBeforeMs = (eventType.bufferBefore || 0) * 60 * 1000;
    const bufferAfterMs = (eventType.bufferAfter || 0) * 60 * 1000;
    const noticeMs = (schedule?.bufferNoticeMinutes ?? host?.bufferNoticeMinutes ?? 30) * 60 * 1000;
    const now = Date.now();
    // Active scheduled bookings (for any event type of this host)
    const scheduledBookings = activeBookings.filter((b) => b.status === 'scheduled');
    // Other scheduled meetings on this date (e.g. meetings created in event type tab with custom timing)
    const otherOccupiedWindows = [];
    if (allEventTypes && allEventTypes.length > 0) {
        for (const otherEt of allEventTypes) {
            if (otherEt.id === eventType.id)
                continue;
            const appliesToDate = (otherEt.dateType === 'specific_date' && otherEt.specificDate === dateString) ||
                (otherEt.dateType === 'range' &&
                    otherEt.startDate &&
                    otherEt.endDate &&
                    dateString >= otherEt.startDate &&
                    dateString <= otherEt.endDate);
            if (appliesToDate && otherEt.customTimeSlots && otherEt.customTimeSlots.length > 0) {
                const otherBufferBeforeMs = (otherEt.bufferBefore || 0) * 60 * 1000;
                const otherBufferAfterMs = (otherEt.bufferAfter || 0) * 60 * 1000;
                for (const slot of otherEt.customTimeSlots) {
                    const startMs = parseDateTimeInTimezone(dateString, slot.start, targetTimezone).getTime();
                    const endMs = parseDateTimeInTimezone(dateString, slot.end, targetTimezone).getTime();
                    otherOccupiedWindows.push({
                        name: otherEt.name,
                        startMs,
                        endMs,
                        effectiveStartMs: startMs - otherBufferBeforeMs,
                        effectiveEndMs: endMs + otherBufferAfterMs,
                    });
                }
            }
        }
    }
    const slots = [];
    const seenTimes = new Set();
    for (const window of timeWindows) {
        const windowStartDate = parseDateTimeInTimezone(dateString, window.start, targetTimezone);
        const windowEndDate = parseDateTimeInTimezone(dateString, window.end, targetTimezone);
        let currentSlotStart = windowStartDate.getTime();
        const windowEndMs = windowEndDate.getTime();
        // The entire time window is divided into consecutive slots of chosenDuration
        const stepMs = durationMs;
        while (currentSlotStart + durationMs <= windowEndMs) {
            const currentSlotEnd = currentSlotStart + durationMs;
            // 1. Past times / notice requirement
            const isPastOrTooSoon = currentSlotStart < now + noticeMs;
            // 2. Collision check with scheduled bookings
            const bookingConflict = scheduledBookings.find((b) => {
                const bStart = new Date(b.startTime).getTime();
                const bEnd = new Date(b.endTime).getTime();
                return (currentSlotStart - bufferBeforeMs < bEnd &&
                    currentSlotEnd + bufferAfterMs > bStart);
            });
            // 3. Collision check with other meetings created in Event Types tab with custom timing
            const meetingConflict = otherOccupiedWindows.find((w) => {
                return (currentSlotStart - bufferBeforeMs < w.effectiveEndMs &&
                    currentSlotEnd + bufferAfterMs > w.effectiveStartMs);
            });
            const isDisabled = isPastOrTooSoon || Boolean(bookingConflict) || Boolean(meetingConflict);
            let disabledReason;
            if (bookingConflict) {
                disabledReason = `Booked (${bookingConflict.eventTypeName || 'Scheduled Meeting'})`;
            }
            else if (meetingConflict) {
                disabledReason = `Reserved (${meetingConflict.name})`;
            }
            else if (isPastOrTooSoon) {
                disabledReason = 'Past time or notice notice period';
            }
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
                }
                catch {
                    timeFormatted = new Date(currentSlotStart).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    });
                }
                slots.push({
                    timeUtc: slotUtc,
                    timeFormatted,
                    duration: chosenDuration,
                    available: !isDisabled,
                    disabled: isDisabled,
                    disabledReason,
                });
            }
            currentSlotStart += stepMs;
        }
    }
    // Sort slots chronologically
    slots.sort((a, b) => new Date(a.timeUtc).getTime() - new Date(b.timeUtc).getTime());
    return {
        slots,
        hostTimezone: host?.timezone || 'America/New_York',
        requestedTimezone: targetTimezone,
        slotDuration: chosenDuration,
    };
}
