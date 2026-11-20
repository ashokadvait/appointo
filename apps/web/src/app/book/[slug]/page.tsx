'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EventType, HostProfile } from '@calendly/types';
import { api } from '@/lib/api-client';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { RefreshCw } from 'lucide-react';

export default function SlugBookingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [customForms, setCustomForms] = useState<any[]>([]);
  const [host, setHost] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getEventTypes(), api.getHost(), api.getSchedules(), api.getBookings(), api.getCustomForms()])
      .then(([types, hostData, schedulesData, bookingsData, formsData]) => {
        setEventTypes(types);
        setHost(hostData);
        setSchedules(schedulesData || []);
        setBookings(bookingsData || []);
        setCustomForms(formsData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold text-slate-500">Loading booking calendar...</span>
        </div>
      </div>
    );
  }

  // Determine whether slug is a custom form or event type
  const isFormMatch = customForms.some(
    (f) =>
      f.id === slug ||
      (f.title && f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <BookingWizard
          eventTypes={eventTypes}
          host={host}
          schedules={schedules}
          existingBookings={bookings}
          selectedEventTypeId={isFormMatch ? undefined : slug}
          selectedFormId={isFormMatch ? slug : undefined}
          isPublicView={true}
        />
      </div>
    </div>
  );
}
