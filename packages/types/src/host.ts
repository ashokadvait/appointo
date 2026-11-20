export interface WorkingHours {
  start: string; // HH:mm format, e.g. "09:00"
  end: string;   // HH:mm format, e.g. "17:00"
}

export interface HostProfile {
  name: string;
  email: string;
  title: string;
  avatar: string;
  timezone: string;
  workingDays: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  workingHours: WorkingHours;
  bufferNoticeMinutes: number; // e.g. 60 min advance notice required
  maxDaysAhead: number;       // e.g. 30 days ahead allowed
  defaultSlotDuration?: number; // declared default slot duration
}
