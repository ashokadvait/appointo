import { Booking, HostProfile } from '@calendly/types';
/**
 * Generates an RFC 5545 compliant .ics calendar invitation string
 */
export declare function generateIcs(booking: Booking, host: HostProfile): string;
