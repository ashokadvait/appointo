import { Payment } from './payment';
export type BookingStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
export type FollowUpType = 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'followup_post' | 'manual_followup';
export interface FollowUpItem {
    type: FollowUpType;
    status: 'pending' | 'sent' | 'cancelled';
    scheduledFor?: string;
    sentAt?: string;
    channel: 'email' | 'sms' | 'webhook';
    message?: string;
}
export interface Booking {
    id: string;
    hostUserId?: string;
    eventTypeId: string;
    eventTypeName: string;
    inviteeName: string;
    inviteeEmail: string;
    inviteeTimezone: string;
    startTime: string;
    endTime: string;
    location: string;
    status: BookingStatus;
    cancellationReason?: string;
    rescheduleToken?: string;
    privateNotes?: string;
    customAnswers: Record<string, string>;
    createdAt: string;
    followUps: FollowUpItem[];
    payment?: Payment;
}
export interface CreateBookingInput {
    hostUserId?: string;
    eventTypeId: string;
    inviteeName: string;
    inviteeEmail: string;
    inviteeTimezone?: string;
    startTime: string;
    duration?: number;
    customAnswers?: Record<string, string>;
    paymentId?: string;
}
export interface AvailableSlot {
    timeUtc: string;
    timeFormatted: string;
    duration: number;
    availableHostUserId?: string;
    available?: boolean;
    disabled?: boolean;
    disabledReason?: string;
}
export interface AvailableSlotsResponse {
    slots: AvailableSlot[];
    hostTimezone: string;
    requestedTimezone: string;
    reason?: string;
    error?: string;
    slotDuration?: number;
}
