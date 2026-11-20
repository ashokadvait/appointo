import { SchedulingType } from './team';
import { Currency } from './payment';
export type LocationType = 'google_meet' | 'zoom' | 'phone' | 'in_person' | 'custom';
export type DateAvailabilityType = 'indefinite' | 'range' | 'specific_date';
export interface CustomTimeSlot {
    start: string;
    end: string;
}
export interface IntakeQuestion {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    required: boolean;
    options?: string[];
}
export interface EventType {
    id: string;
    userId?: string;
    teamId?: string;
    slug: string;
    name: string;
    duration: number;
    color: string;
    description: string;
    locationType: LocationType;
    locationDetails: string;
    bufferBefore: number;
    bufferAfter: number;
    dateType?: DateAvailabilityType;
    startDate?: string;
    endDate?: string;
    specificDate?: string;
    customTimeSlots?: CustomTimeSlot[];
    schedulingType?: SchedulingType;
    maxInvitees?: number;
    isPrivate?: boolean;
    requiresPayment?: boolean;
    price?: number;
    currency?: Currency;
    customQuestions: IntakeQuestion[];
}
export interface CreateEventTypeInput {
    userId?: string;
    teamId?: string;
    name: string;
    duration: number;
    color?: string;
    description?: string;
    locationType?: LocationType;
    locationDetails?: string;
    bufferBefore?: number;
    bufferAfter?: number;
    dateType?: DateAvailabilityType;
    startDate?: string;
    endDate?: string;
    specificDate?: string;
    customTimeSlots?: CustomTimeSlot[];
    schedulingType?: SchedulingType;
    maxInvitees?: number;
    isPrivate?: boolean;
    requiresPayment?: boolean;
    price?: number;
    currency?: Currency;
    customQuestions?: IntakeQuestion[];
}
