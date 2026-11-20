export interface TimeInterval {
  start: string; // HH:mm format, e.g. "09:00"
  end: string;   // HH:mm format, e.g. "17:00"
}

export interface DayAvailability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  enabled: boolean;
  intervals: TimeInterval[]; // e.g. [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "17:00"}]
}

export interface DateOverride {
  date: string; // YYYY-MM-DD
  enabled: boolean; // if false -> blackout day / out of office
  intervals: TimeInterval[];
  reason?: string;
}

export interface AvailabilitySchedule {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  timezone: string;
  days: DayAvailability[];
  overrides: DateOverride[];
  bufferNoticeMinutes: number; // e.g. 60
  maxDaysAhead: number;       // e.g. 60
  defaultSlotDuration?: number; // declared slot duration in minutes (e.g. 10, 15, 20, 30, 45, 60)
}

export interface ConnectedCalendar {
  id: string;
  userId: string;
  provider: 'google' | 'outlook' | 'apple';
  email: string;
  isPrimary: boolean;
  checkConflicts: boolean;
  addEvents: boolean;
}
