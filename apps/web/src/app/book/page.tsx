'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EventType, HostProfile, Booking } from '@calendly/types';
import { api } from '@/lib/api-client';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { EventTypeModal } from '@/components/dashboard/event-type-modal';
import { useDialog } from '@/components/ui/dialog-provider';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const slugParam = searchParams.get('slug');
  const formParam = searchParams.get('form') || searchParams.get('formId') || undefined;
  const durationParam = searchParams.get('duration') || searchParams.get('slotDuration') || undefined;
  const calendarParam = searchParams.get('calendar') || searchParams.get('cal') || undefined;
  const targetEventType = idParam || slugParam || undefined;
  const isPublicMode = searchParams.get('public') === 'true' || Boolean(formParam) || Boolean(durationParam);

  const { showAlert, showToast } = useDialog();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [host, setHost] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    Promise.all([api.getEventTypes(), api.getHost(), api.getBookings(), api.getSchedules()])
      .then(([types, hostData, bookingsData, schedulesData]) => {
        setEventTypes(types);
        setHost(hostData);
        setBookings(bookingsData || []);
        setSchedules(schedulesData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditEventType = (eventType: EventType) => {
    setEditingEventType(eventType);
    setIsModalOpen(true);
  };

  const handleDeleteEventType = async (id: string) => {
    try {
      await api.deleteEventType(id);
      showToast('Meeting deleted successfully', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      showAlert({
        title: 'Delete Failed',
        message: err.message || 'Failed to delete meeting',
        type: 'error',
      });
    }
  };

  const handleSaveEventType = async (data: Partial<EventType>) => {
    if (editingEventType) {
      await api.updateEventType(editingEventType.id, data);
    }
    setIsModalOpen(false);
    setEditingEventType(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold text-slate-500">Loading booking portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Navigation back to main platform (optional for host preview) */}
        {!isPublicMode && (
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        )}

        <BookingWizard
          eventTypes={eventTypes}
          host={host}
          schedules={schedules}
          selectedEventTypeId={targetEventType}
          selectedFormId={formParam}
          selectedDuration={durationParam ? Number(durationParam) : undefined}
          connectedCalendar={calendarParam}
          isPublicView={isPublicMode}
          existingBookings={bookings}
          onEditEventType={!isPublicMode ? handleEditEventType : undefined}
          onDeleteEventType={!isPublicMode ? handleDeleteEventType : undefined}
        />
      </div>

      <EventTypeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEventType(null);
        }}
        onSave={handleSaveEventType}
        editingEventType={editingEventType}
        existingBookings={bookings}
        existingEventTypes={eventTypes}
      />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
