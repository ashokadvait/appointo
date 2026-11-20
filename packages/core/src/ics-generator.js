"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIcs = generateIcs;
function formatIcsDate(date) {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
/**
 * Generates an RFC 5545 compliant .ics calendar invitation string
 */
function generateIcs(booking, host) {
    const dtStamp = formatIcsDate(new Date());
    const dtStart = formatIcsDate(booking.startTime);
    const dtEnd = formatIcsDate(booking.endTime);
    const uid = `${booking.id}@calendly-clone.local`;
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendly Recreate//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${booking.eventTypeName} - ${host.name} & ${booking.inviteeName}`,
        `DESCRIPTION:Meeting scheduled via Calendly.\\nAttendee: ${booking.inviteeName} (${booking.inviteeEmail})\\nLocation: ${booking.location}`,
        `LOCATION:${booking.location}`,
        `ORGANIZER;CN="${host.name}":mailto:${host.email}`,
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="${booking.inviteeName}":mailto:${booking.inviteeEmail}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Meeting Reminder',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
}
