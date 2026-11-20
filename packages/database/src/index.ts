import { readDb, writeDb } from './db-client';
import {
  HostProfile,
  EventType,
  CreateEventTypeInput,
  Booking,
  WorkflowsMap,
  ActivityLog,
  WorkflowTemplate,
  AvailabilitySchedule,
  CustomBookingForm,
} from '@calendly/types';

export { readDb, writeDb };

export function getSchedules(): AvailabilitySchedule[] {
  const db = readDb();
  return db.schedules || [];
}

export function getSchedule(idOrUserId?: string): AvailabilitySchedule | undefined {
  const db = readDb();
  const schedules = db.schedules || [];
  if (!idOrUserId) {
    return schedules.find((s) => s.isDefault) || schedules[0];
  }
  return schedules.find((s) => s.id === idOrUserId || s.userId === idOrUserId) || schedules.find((s) => s.isDefault) || schedules[0];
}

export function updateSchedule(id: string, updates: Partial<AvailabilitySchedule>): AvailabilitySchedule | null {
  const db = readDb();
  if (!db.schedules) db.schedules = [];
  const idx = db.schedules.findIndex((s) => s.id === id);
  if (idx === -1) {
    if (db.schedules.length > 0) {
      db.schedules[0] = { ...db.schedules[0], ...updates, id };
      writeDb(db);
      return db.schedules[0];
    }
    const newSchedule: AvailabilitySchedule = {
      id,
      userId: updates.userId || '',
      name: updates.name || 'Working Hours',
      isDefault: updates.isDefault ?? true,
      timezone: updates.timezone || db.host.timezone || 'Asia/Kolkata',
      days: updates.days || [],
      overrides: updates.overrides || [],
      bufferNoticeMinutes: updates.bufferNoticeMinutes ?? 60,
      maxDaysAhead: updates.maxDaysAhead ?? 60,
      defaultSlotDuration: updates.defaultSlotDuration ?? 15,
    };
    db.schedules.push(newSchedule);
    writeDb(db);
    return newSchedule;
  }

  db.schedules[idx] = { ...db.schedules[idx], ...updates };
  writeDb(db);
  return db.schedules[idx];
}

export function getHost(): HostProfile {
  const db = readDb();
  return db.host;
}

export function updateHost(updates: Partial<HostProfile>): HostProfile {
  const db = readDb();
  db.host = { ...db.host, ...updates };
  writeDb(db);
  return db.host;
}

export function getEventTypes(): EventType[] {
  const db = readDb();
  return db.eventTypes;
}

export function getEventType(idOrSlug: string): EventType | undefined {
  const db = readDb();
  return db.eventTypes.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
}

export function createEventType(input: CreateEventTypeInput): EventType {
  const db = readDb();
  const baseSlug = (input.name || 'custom-meeting')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `meeting-${Date.now().toString(36)}`;

  let uniqueSlug = baseSlug;
  let counter = 2;
  while (db.eventTypes.some((e) => e.slug === uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const newEventType: EventType = {
    id: `evt-${Date.now().toString(36)}`,
    slug: uniqueSlug,
    name: input.name,
    duration: Number(input.duration) || 30,
    color: input.color || '#3b82f6',
    description: input.description || '',
    locationType: input.locationType || 'google_meet',
    locationDetails: input.locationDetails || 'https://meet.google.com/new',
    bufferBefore: Number(input.bufferBefore) || 0,
    bufferAfter: Number(input.bufferAfter) || 0,
    dateType: input.dateType || 'indefinite',
    startDate: input.startDate,
    endDate: input.endDate,
    specificDate: input.specificDate,
    customTimeSlots: input.customTimeSlots || [],
    customQuestions: input.customQuestions || [],
  };

  db.eventTypes.push(newEventType);
  writeDb(db);
  return newEventType;
}

export function updateEventType(id: string, updates: Partial<EventType>): EventType | null {
  const db = readDb();
  const index = db.eventTypes.findIndex((e) => e.id === id);
  if (index === -1) return null;

  db.eventTypes[index] = { ...db.eventTypes[index], ...updates };
  writeDb(db);
  return db.eventTypes[index];
}

export function deleteEventType(id: string): boolean {
  const db = readDb();
  const initialLength = db.eventTypes.length;
  db.eventTypes = db.eventTypes.filter((e) => e.id !== id);
  if (db.eventTypes.length === initialLength) return false;

  // Cascade delete associated bookings
  db.bookings = db.bookings.filter((b) => b.eventTypeId !== id);
  writeDb(db);
  return true;
}

export function deleteBooking(id: string): boolean {
  const db = readDb();
  const idx = db.bookings.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  db.bookings.splice(idx, 1);
  writeDb(db);
  return true;
}

export function getBookings(): Booking[] {
  const db = readDb();
  return db.bookings;
}

export function getBooking(id: string): Booking | undefined {
  const db = readDb();
  return db.bookings.find((b) => b.id === id);
}

export function saveBooking(booking: Booking): Booking {
  const db = readDb();
  db.bookings.unshift(booking);
  writeDb(db);
  return booking;
}

export function updateBooking(id: string, updates: Partial<Booking>): Booking | null {
  const db = readDb();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;

  db.bookings[index] = { ...db.bookings[index], ...updates };
  writeDb(db);
  return db.bookings[index];
}

export function getWorkflows(): WorkflowsMap {
  const db = readDb();
  return db.workflows;
}

export function updateWorkflows(updates: Partial<WorkflowsMap>): WorkflowsMap {
  const db = readDb();
  db.workflows = { ...db.workflows, ...updates } as WorkflowsMap;
  writeDb(db);
  return db.workflows;
}

export function getActivityLogs(): ActivityLog[] {
  const db = readDb();
  return db.activityLogs;
}

export function addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
  const db = readDb();
  const newLog: ActivityLog = {
    ...log,
    id: `log-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
  };
  db.activityLogs.unshift(newLog);
  writeDb(db);
  return newLog;
}

export function getCustomForms(): CustomBookingForm[] {
  const db = readDb();
  return db.customForms || [];
}

export function getCustomForm(id: string): CustomBookingForm | undefined {
  const forms = getCustomForms();
  return forms.find((f) => f.id === id);
}

export function saveCustomForm(form: CustomBookingForm): CustomBookingForm {
  const db = readDb();
  if (!db.customForms) db.customForms = [];
  const idx = db.customForms.findIndex((f) => f.id === form.id);
  const now = new Date().toISOString();
  if (idx >= 0) {
    db.customForms[idx] = { ...db.customForms[idx], ...form, updatedAt: now };
    writeDb(db);
    return db.customForms[idx];
  } else {
    const newForm: CustomBookingForm = {
      ...form,
      id: form.id || `form-${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
    };
    db.customForms.push(newForm);
    writeDb(db);
    return newForm;
  }
}

export function deleteCustomForm(id: string): boolean {
  const db = readDb();
  if (!db.customForms) return false;
  const initialLen = db.customForms.length;
  db.customForms = db.customForms.filter((f) => f.id !== id);
  if (db.customForms.length !== initialLen) {
    writeDb(db);
    return true;
  }
  return false;
}

