import { Booking, FollowUpItem, HostProfile, WorkflowTemplate } from '@calendly/types';

/**
 * Creates the standard 4-stage follow-up pipeline for a new booking
 */
export function createDefaultFollowUpPipeline(
  startTimeIso: string,
  endTimeIso: string,
  nowIso: string = new Date().toISOString()
): FollowUpItem[] {
  const start = new Date(startTimeIso).getTime();
  const end = new Date(endTimeIso).getTime();

  return [
    {
      type: 'confirmation',
      status: 'sent',
      sentAt: nowIso,
      channel: 'email',
    },
    {
      type: 'reminder_24h',
      status: 'pending',
      scheduledFor: new Date(start - 24 * 60 * 60 * 1000).toISOString(),
      channel: 'email',
    },
    {
      type: 'reminder_1h',
      status: 'pending',
      scheduledFor: new Date(start - 60 * 60 * 1000).toISOString(),
      channel: 'email',
    },
    {
      type: 'followup_post',
      status: 'pending',
      scheduledFor: new Date(end + 60 * 60 * 1000).toISOString(),
      channel: 'email',
    },
  ];
}

/**
 * Replaces template variables in workflow templates with real booking data
 */
export function interpolateTemplate(
  templateText: string,
  booking: Booking,
  host: HostProfile,
  rescheduleUrl?: string
): string {
  const startDate = new Date(booking.startTime);
  const eventDateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: booking.inviteeTimezone || host.timezone,
  });

  const eventTimeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: booking.inviteeTimezone || host.timezone,
  });

  return templateText
    .replace(/{event_name}/g, booking.eventTypeName)
    .replace(/{host_name}/g, host.name)
    .replace(/{invitee_name}/g, booking.inviteeName)
    .replace(/{event_date}/g, eventDateStr)
    .replace(/{event_time}/g, eventTimeStr)
    .replace(/{invitee_timezone}/g, booking.inviteeTimezone || host.timezone)
    .replace(/{meeting_link}/g, booking.location)
    .replace(/{booking_id}/g, booking.id)
    .replace(/{reschedule_url}/g, rescheduleUrl || `http://localhost:3000/book?reschedule=${booking.id}`);
}
