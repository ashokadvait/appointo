export interface TimeInterval {
    start: string;
    end: string;
}
export interface DayAvailability {
    dayOfWeek: number;
    enabled: boolean;
    intervals: TimeInterval[];
}
export interface DateOverride {
    date: string;
    enabled: boolean;
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
    bufferNoticeMinutes: number;
    maxDaysAhead: number;
    defaultSlotDuration?: number;
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
