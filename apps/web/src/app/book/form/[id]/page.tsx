'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EventType } from '@calendly/types';
import { api } from '@/lib/api-client';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { RefreshCw } from 'lucide-react';

export default function FormBookingPage() {
  const params = useParams();
  const formId = params?.id as string;

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [host, setHost] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getEventTypes(), api.getHost(), api.getSchedules(), api.getBookings()])
      .then(([types, hostData, schedulesData, bookingsData]) => {
        setEventTypes(types);
        setHost(hostData);
        setSchedules(schedulesData || []);
        setBookings(bookingsData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold text-slate-500">Loading booking form...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <BookingWizard
          eventTypes={eventTypes}
          host={host}
          schedules={schedules}
          existingBookings={bookings}
          selectedFormId={formId}
          isPublicView={true}
        />
      </div>
    </div>
  );
}

