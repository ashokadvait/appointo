import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSchema, HostProfile, EventType, Booking, WorkflowsMap, ActivityLog } from '@calendly/types';

function resolveDbPath(): string {
  // Check common monorepo locations
  const potentialPaths = [
    path.resolve(process.cwd(), 'data', 'db.json'),
    path.resolve(process.cwd(), '..', '..', 'data', 'db.json'),
    path.resolve(process.cwd(), 'apps', 'web', 'data', 'db.json'),
  ];

  for (const p of potentialPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to primary workspace path
  return path.resolve(process.cwd(), 'data', 'db.json');
}

const DB_PATH = resolveDbPath();

export function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const data: DatabaseSchema = JSON.parse(raw);
      if (!data.schedules) {
        data.schedules = [];
      }
      return data;
    }
  } catch (err) {
    console.error('Failed reading db.json:', err);
  }

  return {
    host: {
      name: '',
      email: '',
      title: '',
      avatar: '',
      timezone: 'America/New_York',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '17:00' },
      bufferNoticeMinutes: 60,
      maxDaysAhead: 30,
    },
    eventTypes: [],
    bookings: [],
    workflows: {
      confirmation: {
        id: 'wf-confirm',
        enabled: true,
        title: 'Immediate Booking Confirmation',
        trigger: 'immediately_after_booking',
        channel: 'email',
        subject: 'Confirmed: {event_name} with {host_name} on {event_date}',
        body: 'Hi {invitee_name},\n\nYour meeting has been scheduled!\n\nDate: {event_date} at {event_time}\nJoin Link: {meeting_link}\n\nBest,\n{host_name}',
      },
      reminder_24h: {
        id: 'wf-remind-24h',
        enabled: true,
        title: '24-Hour Advance Reminder',
        trigger: '24_hours_before',
        channel: 'email',
        subject: 'Reminder: {event_name} tomorrow at {event_time}',
        body: 'Hi {invitee_name},\n\nUpcoming meeting reminder for tomorrow at {event_time}.\nJoin Link: {meeting_link}\n\nSee you then,\n{host_name}',
      },
      reminder_1h: {
        id: 'wf-remind-1h',
        enabled: true,
        title: '1-Hour Final Notice Reminder',
        trigger: '1_hour_before',
        channel: 'email',
        subject: 'Starting in 1 hour: {event_name}',
        body: 'Hi {invitee_name},\n\nOur call starts in 1 hour!\nJoin Link: {meeting_link}\n\nBest,\n{host_name}',
      },
      followup_post: {
        id: 'wf-followup-post',
        enabled: true,
        title: 'Post-Meeting Follow-Up & Action Items',
        trigger: '1_hour_after',
        channel: 'email',
        subject: 'Thank you for meeting! Next steps from {host_name}',
        body: 'Hi {invitee_name},\n\nThank you for taking the time to connect today regarding {event_name}!\n\nBest regards,\n{host_name}',
      },
    },
    activityLogs: [],
  };
}

export function writeDb(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing db.json:', err);
  }
}
