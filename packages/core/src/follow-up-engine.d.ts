import { Booking, FollowUpItem, HostProfile } from '@calendly/types';
/**
 * Creates the standard 4-stage follow-up pipeline for a new booking
 */
export declare function createDefaultFollowUpPipeline(startTimeIso: string, endTimeIso: string, nowIso?: string): FollowUpItem[];
/**
 * Replaces template variables in workflow templates with real booking data
 */
export declare function interpolateTemplate(templateText: string, booking: Booking, host: HostProfile, rescheduleUrl?: string): string;
