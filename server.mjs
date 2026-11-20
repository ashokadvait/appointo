import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Safe Database Operations
function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { host: {}, eventTypes: [], bookings: [], workflows: {}, activityLogs: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ics': 'text/calendar; charset=utf-8',
};

// RFC 5545 iCalendar Formatter
function formatIcsDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

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
    `DESCRIPTION:Meeting scheduled via Calendly Recreate.\\nAttendee: ${booking.inviteeName} (${booking.inviteeEmail})\\nLocation: ${booking.location}`,
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

// Helper to parse date and time in a specific timezone
function parseDateTimeInTimezone(dateStr, timeStr, timeZone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, min, 0));
  try {
    const invDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone }));
    const diffMs = targetDate.getTime() - invDate.getTime();
    return new Date(utcDate.getTime() - diffMs);
  } catch {
    return new Date(`${dateStr}T${timeStr}:00Z`);
  }
}

function getTodayStringInTimezone(timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Generate Time Slots based on working hours, custom event slots, buffers, and active bookings
function computeAvailableSlots(eventTypeId, dateString, timezone, slotDuration) {
  const db = readDb();
  const eventType = db.eventTypes.find((e) => e.id === eventTypeId || e.slug === eventTypeId);
  if (!eventType) return { error: 'Event type not found', slots: [] };

  const host = db.host;
  const targetTimezone = timezone || host?.timezone || 'America/New_York';
  const todayStr = getTodayStringInTimezone(targetTimezone);

  // 1. Disable past dates
  if (dateString < todayStr) {
    return { slots: [], hostTimezone: host?.timezone, requestedTimezone: targetTimezone, reason: 'Past dates cannot be scheduled' };
  }

  // 2. Check Event Type Date Availability constraints
  if (eventType.dateType === 'specific_date' && eventType.specificDate) {
    if (dateString !== eventType.specificDate) {
      return { slots: [], hostTimezone: host?.timezone, requestedTimezone: targetTimezone, reason: `This event is only available on ${eventType.specificDate}` };
    }
  } else if (eventType.dateType === 'range') {
    if (eventType.startDate && dateString < eventType.startDate) {
      return { slots: [], hostTimezone: host?.timezone, requestedTimezone: targetTimezone, reason: `Bookings open on ${eventType.startDate}` };
    }
    if (eventType.endDate && dateString > eventType.endDate) {
      return { slots: [], hostTimezone: host?.timezone, requestedTimezone: targetTimezone, reason: `Bookings closed on ${eventType.endDate}` };
    }
  }

  // 3. Check if day is a working day
  const [year, month, day] = dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  if (host?.workingDays && !host.workingDays.includes(dayOfWeek)) {
    return { slots: [], hostTimezone: host.timezone, requestedTimezone: targetTimezone, reason: 'Host is closed on this day' };
  }

  // 4. Determine Time Windows
  let timeWindows = [];
  if (eventType.customTimeSlots && eventType.customTimeSlots.length > 0) {
    timeWindows = eventType.customTimeSlots;
  } else if (host?.workingHours) {
    timeWindows = [{ start: host.workingHours.start || '09:00', end: host.workingHours.end || '17:00' }];
  } else {
    timeWindows = [{ start: '09:00', end: '17:00' }];
  }

  const chosenDuration = (eventType?.duration && Number(eventType.duration) > 0)
    ? Number(eventType.duration)
    : (slotDuration && slotDuration > 0 ? slotDuration : 15);
  const durationMs = chosenDuration * 60 * 1000;
  const bufferBeforeMs = (eventType.bufferBefore || 0) * 60 * 1000;
  const bufferAfterMs = (eventType.bufferAfter || 0) * 60 * 1000;
  const noticeMs = (host?.bufferNoticeMinutes || 30) * 60 * 1000;
  const now = Date.now();

  const activeBookings = db.bookings.filter((b) => b.status === 'scheduled');
  
  // Other scheduled meetings on this date
  const otherOccupiedWindows = [];
  if (db.eventTypes && db.eventTypes.length > 0) {
    for (const otherEt of db.eventTypes) {
      if (otherEt.id === eventType.id) continue;
      const appliesToDate =
        (otherEt.dateType === 'specific_date' && otherEt.specificDate === dateString) ||
        (otherEt.dateType === 'range' &&
          otherEt.startDate &&
          otherEt.endDate &&
          dateString >= otherEt.startDate &&
          dateString <= otherEt.endDate);

      if (appliesToDate && otherEt.customTimeSlots && otherEt.customTimeSlots.length > 0) {
        const otherBufBeforeMs = (otherEt.bufferBefore || 0) * 60 * 1000;
        const otherBufAfterMs = (otherEt.bufferAfter || 0) * 60 * 1000;
        for (const slot of otherEt.customTimeSlots) {
          const startMs = parseDateTimeInTimezone(dateString, slot.start, targetTimezone).getTime();
          const endMs = parseDateTimeInTimezone(dateString, slot.end, targetTimezone).getTime();
          otherOccupiedWindows.push({
            name: otherEt.name,
            startMs,
            endMs,
            effectiveStartMs: startMs - otherBufBeforeMs,
            effectiveEndMs: endMs + otherBufAfterMs,
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

    // The entire window is divided into consecutive slots of chosenDuration
    const stepMs = durationMs;

    while (currentSlotStart + durationMs <= windowEndMs) {
      const currentSlotEnd = currentSlotStart + durationMs;

      // Notice constraint: Must be in the future and satisfy notice
      const isPastOrTooSoon = currentSlotStart < now + noticeMs;

      // Overlap constraint with bookings
      const bookingConflict = activeBookings.find((b) => {
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return (
          currentSlotStart - bufferBeforeMs < bEnd &&
          currentSlotEnd + bufferAfterMs > bStart
        );
      });

      // Overlap constraint with other scheduled meetings
      const meetingConflict = otherOccupiedWindows.find((w) => {
        return (
          currentSlotStart - bufferBeforeMs < w.effectiveEndMs &&
          currentSlotEnd + bufferAfterMs > w.effectiveStartMs
        );
      });

      const isDisabled = isPastOrTooSoon || Boolean(bookingConflict) || Boolean(meetingConflict);

      let disabledReason = undefined;
      if (bookingConflict) {
        disabledReason = `Booked (${bookingConflict.eventTypeName || 'Scheduled Meeting'})`;
      } else if (meetingConflict) {
        disabledReason = `Reserved (${meetingConflict.name})`;
      } else if (isPastOrTooSoon) {
        disabledReason = 'Past time or notice period';
      }

      const slotUtc = new Date(currentSlotStart).toISOString();
      if (!seenTimes.has(slotUtc)) {
        seenTimes.add(slotUtc);
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: targetTimezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        slots.push({
          timeUtc: slotUtc,
          timeFormatted: timeFormatter.format(new Date(currentSlotStart)),
          duration: chosenDuration,
          available: !isDisabled,
          disabled: isDisabled,
          disabledReason,
        });
      }

      currentSlotStart += stepMs;
    }
  }

  slots.sort((a, b) => new Date(a.timeUtc).getTime() - new Date(b.timeUtc).getTime());
  return { slots, hostTimezone: host?.timezone, requestedTimezone: targetTimezone, slotDuration: chosenDuration };
}

// Request Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Response helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // --- API ROUTES ---

  // GET /api/host
  if (method === 'GET' && pathname === '/api/host') {
    const db = readDb();
    sendJson(res, 200, db.host);
    return;
  }

  // PUT /api/host
  if (method === 'PUT' && pathname === '/api/host') {
    try {
      const updates = await parseJsonBody(req);
      const db = readDb();
      db.host = { ...db.host, ...updates };
      writeDb(db);
      sendJson(res, 200, db.host);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  // GET /api/event-types
  if (method === 'GET' && pathname === '/api/event-types') {
    const db = readDb();
    sendJson(res, 200, db.eventTypes);
    return;
  }

  // GET /api/event-types/:idOrSlug
  if (method === 'GET' && pathname.startsWith('/api/event-types/')) {
    const idOrSlug = pathname.replace('/api/event-types/', '');
    const db = readDb();
    const eventType = db.eventTypes.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
    if (!eventType) {
      sendJson(res, 404, { error: 'Event type not found' });
      return;
    }
    sendJson(res, 200, { eventType, host: db.host });
    return;
  }

  // POST /api/event-types
  if (method === 'POST' && pathname === '/api/event-types') {
    try {
      const data = await parseJsonBody(req);
      const db = readDb();
      const newEventType = {
        id: `evt-${Date.now().toString(36)}`,
        slug: (data.name || 'custom-meeting')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        name: data.name || 'Custom Consultation',
        duration: Number(data.duration) || 30,
        color: data.color || '#3b82f6',
        description: data.description || '',
        locationType: data.locationType || 'google_meet',
        locationDetails: data.locationDetails || 'https://meet.google.com/new',
        bufferBefore: Number(data.bufferBefore) || 0,
        bufferAfter: Number(data.bufferAfter) || 0,
        customQuestions: data.customQuestions || [],
      };
      db.eventTypes.push(newEventType);
      writeDb(db);
      sendJson(res, 201, newEventType);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  // PUT /api/event-types/:id
  if (method === 'PUT' && pathname.startsWith('/api/event-types/')) {
    const id = pathname.replace('/api/event-types/', '');
    try {
      const updates = await parseJsonBody(req);
      const db = readDb();
      const index = db.eventTypes.findIndex((e) => e.id === id);
      if (index === -1) {
        sendJson(res, 404, { error: 'Event type not found' });
        return;
      }
      db.eventTypes[index] = { ...db.eventTypes[index], ...updates };
      writeDb(db);
      sendJson(res, 200, db.eventTypes[index]);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  // DELETE /api/event-types/:id
  if (method === 'DELETE' && pathname.startsWith('/api/event-types/')) {
    const id = pathname.replace('/api/event-types/', '');
    const db = readDb();
    const beforeCount = db.eventTypes.length;
    db.eventTypes = db.eventTypes.filter((e) => e.id !== id);
    if (db.eventTypes.length === beforeCount) {
      sendJson(res, 404, { error: 'Event type not found' });
      return;
    }
    writeDb(db);
    sendJson(res, 200, { success: true });
    return;
  }

  // GET /api/available-slots?eventTypeId=...&date=YYYY-MM-DD&timezone=...
  if (method === 'GET' && pathname === '/api/available-slots') {
    const eventTypeId = reqUrl.searchParams.get('eventTypeId');
    const date = reqUrl.searchParams.get('date');
    const timezone = reqUrl.searchParams.get('timezone');
    const slotDuration = reqUrl.searchParams.get('slotDuration') ? Number(reqUrl.searchParams.get('slotDuration')) : undefined;

    if (!eventTypeId || !date) {
      sendJson(res, 400, { error: 'Missing required parameters: eventTypeId and date' });
      return;
    }

    const result = computeAvailableSlots(eventTypeId, date, timezone, slotDuration);
    sendJson(res, 200, result);
    return;
  }

  // GET /api/bookings
  if (method === 'GET' && pathname === '/api/bookings') {
    const db = readDb();
    sendJson(res, 200, db.bookings);
    return;
  }

  // POST /api/bookings
  if (method === 'POST' && pathname === '/api/bookings') {
    try {
      const data = await parseJsonBody(req);
      const db = readDb();
      const eventType = db.eventTypes.find(
        (e) => e.id === data.eventTypeId || e.slug === data.eventTypeId
      );

      if (!eventType) {
        sendJson(res, 404, { error: 'Event type not found' });
        return;
      }

      if (!data.startTime || !data.inviteeName || !data.inviteeEmail) {
        sendJson(res, 400, { error: 'Missing required booking fields' });
        return;
      }

      const start = new Date(data.startTime);
      const end = new Date(start.getTime() + eventType.duration * 60 * 1000);

      // Past Date / Time Validation: strictly reject creating meetings in the past
      if (start.getTime() <= Date.now()) {
        sendJson(res, 400, { error: 'Cannot book meetings for past dates or times. Please select an upcoming slot.' });
        return;
      }

      // Conflict Check: prevent double booking the same time slot
      const bufferBeforeMs = (eventType.bufferBefore || 0) * 60 * 1000;
      const bufferAfterMs = (eventType.bufferAfter || 0) * 60 * 1000;
      const startMs = start.getTime();
      const endMs = end.getTime();

      const hasConflict = db.bookings.some((b) => {
        if (b.status !== 'scheduled') return false;
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return (
          startMs - bufferBeforeMs < bEnd &&
          endMs + bufferAfterMs > bStart
        );
      });

      if (hasConflict) {
        sendJson(res, 409, { error: 'This time slot is already booked. Please select another time.' });
        return;
      }

      const bookingId = `bk-${Date.now().toString(36)}`;
      const nowIso = new Date().toISOString();

      // Automatically construct the 4 core follow-up steps
      const followUps = [
        {
          type: 'confirmation',
          status: 'sent',
          sentAt: nowIso,
          channel: 'email',
        },
        {
          type: 'reminder_24h',
          status: 'pending',
          scheduledFor: new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          channel: 'email',
        },
        {
          type: 'reminder_1h',
          status: 'pending',
          scheduledFor: new Date(start.getTime() - 60 * 60 * 1000).toISOString(),
          channel: 'email',
        },
        {
          type: 'followup_post',
          status: 'pending',
          scheduledFor: new Date(end.getTime() + 60 * 60 * 1000).toISOString(),
          channel: 'email',
        },
      ];

      const newBooking = {
        id: bookingId,
        eventTypeId: eventType.id,
        eventTypeName: eventType.name,
        inviteeName: data.inviteeName,
        inviteeEmail: data.inviteeEmail,
        inviteeTimezone: data.inviteeTimezone || db.host.timezone,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        location: eventType.locationDetails,
        status: 'scheduled',
        customAnswers: data.customAnswers || {},
        createdAt: nowIso,
        followUps,
      };

      db.bookings.unshift(newBooking);

      // Log activity
      db.activityLogs.unshift({
        id: `log-${Date.now().toString(36)}`,
        timestamp: nowIso,
        bookingId,
        type: 'BOOKING_CREATED',
        recipient: data.inviteeEmail,
        description: `Booking confirmed for ${eventType.name} on ${start.toDateString()} with automated confirmation sent`,
      });

      writeDb(db);

      sendJson(res, 201, {
        booking: newBooking,
        icsUrl: `/api/bookings/${bookingId}/ics`,
      });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  // GET /api/bookings/:id/ics
  if (method === 'GET' && pathname.endsWith('/ics') && pathname.startsWith('/api/bookings/')) {
    const bookingId = pathname.replace('/api/bookings/', '').replace('/ics', '');
    const db = readDb();
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      sendJson(res, 404, { error: 'Booking not found' });
      return;
    }

    const icsContent = generateIcs(booking, db.host);
    res.writeHead(200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${booking.id}.ics"`,
      'Content-Length': Buffer.byteLength(icsContent),
    });
    res.end(icsContent);
    return;
  }

  // POST /api/bookings/:id/follow-up
  if (method === 'POST' && pathname.endsWith('/follow-up') && pathname.startsWith('/api/bookings/')) {
    const bookingId = pathname.replace('/api/bookings/', '').replace('/follow-up', '');
    try {
      const data = await parseJsonBody(req);
      const db = readDb();
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) {
        sendJson(res, 404, { error: 'Booking not found' });
        return;
      }

      const targetType = data.type || 'manual_followup';
      const existing = booking.followUps.find((f) => f.type === targetType);
      const nowIso = new Date().toISOString();

      if (existing) {
        existing.status = 'sent';
        existing.sentAt = nowIso;
      } else {
        booking.followUps.push({
          type: targetType,
          status: 'sent',
          sentAt: nowIso,
          channel: data.channel || 'email',
          message: data.message,
        });
      }

      // Add to activity logs
      db.activityLogs.unshift({
        id: `log-${Date.now().toString(36)}`,
        timestamp: nowIso,
        bookingId: booking.id,
        type: `FOLLOWUP_SENT_${targetType.toUpperCase()}`,
        recipient: booking.inviteeEmail,
        description: `Follow-up (${targetType}) dispatched to ${booking.inviteeName}`,
      });

      writeDb(db);
      sendJson(res, 200, { success: true, booking });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  // PATCH /api/bookings/:id/status
  if (method === 'PATCH' && pathname.endsWith('/status') && pathname.startsWith('/api/bookings/')) {
    const bookingId = pathname.replace('/api/bookings/', '').replace('/status', '');
    try {
      const data = await parseJsonBody(req);
      const db = readDb();
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) {
        sendJson(res, 404, { error: 'Booking not found' });
        return;
      }

      booking.status = data.status || booking.status;
      const nowIso = new Date().toISOString();

      db.activityLogs.unshift({
        id: `log-${Date.now().toString(36)}`,
        timestamp: nowIso,
        bookingId: booking.id,
        type: `STATUS_UPDATED_${booking.status.toUpperCase()}`,
        recipient: booking.inviteeEmail,
        description: `Booking status changed to ${booking.status}`,
      });

      writeDb(db);
      sendJson(res, 200, { success: true, booking });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  // GET /api/workflows
  if (method === 'GET' && pathname === '/api/workflows') {
    const db = readDb();
    sendJson(res, 200, db.workflows);
    return;
  }

  // PUT /api/workflows
  if (method === 'PUT' && pathname === '/api/workflows') {
    try {
      const updates = await parseJsonBody(req);
      const db = readDb();
      db.workflows = { ...db.workflows, ...updates };
      writeDb(db);
      sendJson(res, 200, db.workflows);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  // GET /api/logs
  if (method === 'GET' && pathname === '/api/logs') {
    const db = readDb();
    sendJson(res, 200, db.activityLogs);
    return;
  }

  // POST /api/webhooks/test
  if (method === 'POST' && pathname === '/api/webhooks/test') {
    try {
      const data = await parseJsonBody(req);
      const targetUrl = data.url;
      if (!targetUrl) {
        sendJson(res, 400, { error: 'Target URL is required' });
        return;
      }

      // Simulate webhook trigger payload
      const testPayload = {
        event: 'booking.created',
        timestamp: new Date().toISOString(),
        payload: {
          booking_id: 'bk-test-webhook',
          event_type: '30-Minute Strategy Call',
          attendee_name: 'Webhook Tester',
          attendee_email: 'tester@example.com',
          meeting_time: new Date(Date.now() + 86400000).toISOString(),
          status: 'confirmed',
        },
      };

      sendJson(res, 200, {
        success: true,
        message: 'Webhook payload formatted and queued for dispatch',
        targetUrl,
        dispatchedPayload: testPayload,
      });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: avoid directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // If path doesn't exist, fallback to index.html for SPA-style routes like /book/30min
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

function startServer(portToTry) {
  server.listen(portToTry, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Calendly Recreate running at: http://localhost:${portToTry}`);
    console.log(`👉 Client Booking View:        http://localhost:${portToTry}/#book`);
    console.log(`👉 Follow-Up Command Center:    http://localhost:${portToTry}/#followups`);
    console.log(`======================================================\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = PORT + 1;
    console.warn(`⚠️ Port ${PORT} is already in use. Retrying on port ${nextPort}...`);
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);
