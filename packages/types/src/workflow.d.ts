export interface WorkflowTemplate {
    id: string;
    enabled: boolean;
    title: string;
    trigger: 'immediately_after_booking' | '24_hours_before' | '1_hour_before' | '1_hour_after';
    channel: 'email' | 'sms' | 'webhook';
    subject: string;
    body: string;
}
export type WorkflowsMap = {
    confirmation: WorkflowTemplate;
    reminder_24h: WorkflowTemplate;
    reminder_1h: WorkflowTemplate;
    followup_post: WorkflowTemplate;
    [key: string]: WorkflowTemplate | undefined;
};
export interface ActivityLog {
    id: string;
    timestamp: string;
    bookingId?: string;
    type: string;
    recipient: string;
    description: string;
}
export interface DatabaseSchema {
    host: import('./host').HostProfile;
    eventTypes: import('./event-type').EventType[];
    bookings: import('./booking').Booking[];
    schedules?: import('./availability').AvailabilitySchedule[];
    workflows: WorkflowsMap;
    activityLogs: ActivityLog[];
}
