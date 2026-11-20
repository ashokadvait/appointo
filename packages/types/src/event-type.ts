import { SchedulingType } from './team';
import { Currency } from './payment';

export type LocationType = 'google_meet' | 'zoom' | 'phone' | 'in_person' | 'custom';

export type DateAvailabilityType = 'indefinite' | 'range' | 'specific_date';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'url';

export interface CustomTimeSlot {
  start: string; // "09:00" (HH:mm)
  end: string;   // "17:00" (HH:mm)
}

export interface IntakeQuestion {
  id: string;
  label: string;
  type: FormFieldType | string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // for select, radio, checkbox
  defaultValue?: string;
  min?: number;
  max?: number;
}

export interface CustomBookingForm {
  id: string;
  title: string;
  description?: string;
  organizationName?: string;
  fields: IntakeQuestion[];
  targetEventTypeIds?: string[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventType {
  id: string;
  userId?: string;
  teamId?: string;
  slug: string;
  name: string;
  duration: number; // in minutes (e.g. 15, 30, 45, 60)
  color: string;    // HEX color code (e.g. #3b82f6)
  description: string;
  locationType: LocationType;
  locationDetails: string;
  bufferBefore: number; // in minutes
  bufferAfter: number;  // in minutes
  dateType?: DateAvailabilityType;
  startDate?: string;   // 'YYYY-MM-DD'
  endDate?: string;     // 'YYYY-MM-DD'
  specificDate?: string; // 'YYYY-MM-DD'
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

