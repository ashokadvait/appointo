import { EventType, HostProfile, Booking, AvailableSlotsResponse, AvailabilitySchedule } from '@calendly/types';
/**
 * Parses a date string (YYYY-MM-DD) and time string (HH:mm) in a specific timezone
 * and returns the corresponding Date object (in UTC).
 */
export declare function parseDateTimeInTimezone(dateStr: string, timeStr: string, timeZone: string): Date;
/**
 * Computes available booking slots for a specific date and event type,
 * accounting for host availability schedule (declared daily intervals, overrides, defaultSlotDuration),
 * custom event time slots, buffers before/after, minimum advance notice, past date/time disabling,
 * and collision checks with active bookings.
 */
export declare function computeAvailableSlots(eventType: EventType, host: HostProfile, activeBookings: Booking[], dateString: string, requestedTimezone?: string, allEventTypes?: EventType[], slotDurationMinutes?: number, schedule?: AvailabilitySchedule): AvailableSlotsResponse;
