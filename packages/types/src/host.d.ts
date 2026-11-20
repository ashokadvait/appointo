export interface WorkingHours {
    start: string;
    end: string;
}
export interface HostProfile {
    name: string;
    email: string;
    title: string;
    avatar: string;
    timezone: string;
    workingDays: number[];
    workingHours: WorkingHours;
    bufferNoticeMinutes: number;
    maxDaysAhead: number;
    defaultSlotDuration?: number;
}
