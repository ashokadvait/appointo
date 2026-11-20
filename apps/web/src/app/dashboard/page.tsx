'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  EventType,
  Booking,
  AvailabilitySchedule,
  ConnectedCalendar,
  Team,
  RoutingForm,
  Payment,
  Contact,
  AnalyticsOverview,
  WorkflowsMap,
  ActivityLog,
} from '@calendly/types';
import { api } from '@/lib/api-client';
import { Navbar } from '@/components/navbar';
import { MetricsRibbon } from '@/components/dashboard/metrics-ribbon';
import { EventTypeCard } from '@/components/dashboard/event-type-card';
import { EventTypeModal } from '@/components/dashboard/event-type-modal';
import { ScheduledAppointmentsSection } from '@/components/dashboard/scheduled-appointments-section';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { FollowUpCommandCenter } from '@/components/followups/followup-command-center';
import { AvailabilityManager } from '@/components/availability/availability-manager';
import { TeamManager } from '@/components/teams/team-manager';
import { RoutingFormsView } from '@/components/routing/routing-forms-view';
import { PaymentsView } from '@/components/payments/payments-view';
import { CRMView } from '@/components/crm/crm-view';
import { AnalyticsView } from '@/components/analytics/analytics-view';
import { CustomFormsView } from '@/components/forms/custom-forms-view';
import { WorkflowEditor } from '@/components/workflows/workflow-editor';
import { EmbedSuite } from '@/components/embed/embed-suite';
import { ShareLinksModal } from '@/components/booking/share-links-modal';
import { NotificationToast } from '@/components/ui/notification-toast';
import { useDialog } from '@/components/ui/dialog-provider';
import { Plus, Eye, RefreshCw, Sparkles, Layers, Clock, Link2 } from 'lucide-react';

export default function AppHomePage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Platform Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<AvailabilitySchedule[]>([]);
  const [calendars, setCalendars] = useState<ConnectedCalendar[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [routingForms, setRoutingForms] = useState<RoutingForm[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowsMap | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  // Selected event type for booking preview
  const [previewEventTypeId, setPreviewEventTypeId] = useState<string | undefined>(undefined);
  const [selectedFilterEventTypeId, setSelectedFilterEventTypeId] = useState<string | null>(null);

  const bookingCountByEventType = React.useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach((b) => {
      map[b.eventTypeId] = (map[b.eventTypeId] || 0) + 1;
    });
    return map;
  }, [bookings]);

  const notify = (msg: string) => {
    setNotification(msg);
  };

  const loadData = async () => {
    try {
      const [
        meData,
        usersData,
        typesData,
        bookingsData,
        schedulesData,
        calendarsData,
        teamsData,
        formsData,
        paymentsData,
        contactsData,
        analyticsData,
        workflowsData,
        logsData,
      ] = await Promise.all([
        api.me().catch(() => null),
        api.listUsers().catch(() => []),
        api.getEventTypes().catch(() => []),
        api.getBookings().catch(() => []),
        api.getSchedules().catch(() => []),
        api.getConnectedCalendars().catch(() => []),
        api.getTeams().catch(() => []),
        api.getRoutingForms().catch(() => []),
        api.getPayments().catch(() => []),
        api.getContacts().catch(() => []),
        api.getAnalyticsOverview().catch(() => null),
        api.getWorkflows().catch(() => null),
        api.getLogs().catch(() => []),
      ]);

      setCurrentUser(meData);
      setAllUsers(usersData);
      setEventTypes(typesData);
      setBookings(bookingsData);
      setSchedules(schedulesData);
      setCalendars(calendarsData);
      setTeams(teamsData);
      setRoutingForms(formsData);
      setPayments(paymentsData);
      setContacts(contactsData);
      setAnalytics(analyticsData);
      setWorkflows(workflowsData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load enterprise platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    notify(`Switched active user to ${user.name}`);
    loadData();
  };

  // Metrics calculation
  const activeBookingsCount = bookings.filter((b) => b.status === 'scheduled').length;
  const remindersSentCount = bookings.reduce((acc, b) => {
    const s = b.followUps?.filter((f) => f.status === 'sent' && f.type !== 'confirmation').length || 0;
    return acc + s;
  }, 0);
  const followupsCompletedCount = bookings.reduce((acc, b) => {
    const s = b.followUps?.filter((f) => f.status === 'sent' && f.type === 'followup_post').length || 0;
    return acc + s;
  }, 0);

  const pendingFollowupsCount = bookings.reduce((acc, b) => {
    if (b.status !== 'scheduled') return acc;
    const pending = b.followUps?.filter((f) => f.status === 'pending').length || 0;
    return acc + pending;
  }, 0);

  // Event Type handlers
  const handleCreateNewEventType = () => {
    setEditingEventType(null);
    setIsModalOpen(true);
  };

  const { showAlert, showConfirm, showToast } = useDialog();

  const handleEditEventType = (eventType: EventType) => {
    setEditingEventType(eventType);
    setIsModalOpen(true);
  };

  const handleDeleteEventType = async (id: string) => {
    const et = eventTypes.find((e) => e.id === id);
    const confirmed = await showConfirm({
      title: 'Delete Meeting Type?',
      message: `Are you sure you want to permanently delete "${et?.name || 'this event type'}"? Any existing appointments booked for this meeting type will also be removed.`,
      confirmText: 'Delete Meeting',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteEventType(id);
      showToast('Meeting type deleted successfully', 'success');
      notify('Meeting type deleted successfully');
      loadData();
    } catch (err: any) {
      showAlert({
        title: 'Delete Failed',
        message: err.message || 'Failed to delete meeting type. Please try again.',
        type: 'error',
      });
    }
  };

  const handlePreviewEventType = (eventType: EventType) => {
    setPreviewEventTypeId(eventType.id);
    setActiveTab('booking');
  };

  const handleSaveEventType = async (data: Partial<EventType>) => {
    if (editingEventType) {
      await api.updateEventType(editingEventType.id, data);
      notify(`Meeting "${data.name || editingEventType.name}" updated successfully`);
    } else {
      await api.createEventType(data as any);
      notify('New meeting created successfully');
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
          <span className="text-xs font-semibold text-slate-500">
            Initializing Appointo Enterprise Platform...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        pendingFollowupCount={bookings.length}
        onOpenShareLinks={() => setIsShareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: EVENT TYPES */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Command Center Banner */}
            {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-200/60 mb-2">
                  <Sparkles className="h-3 w-3" />
                  Enterprise Scheduling Platform
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Event Types, Availability & Routing
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Configure 1-on-1 calls, Collective meetings, and Round-Robin team distributions with intake qualification forms and Stripe billing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-2.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 transition active:scale-98"
                  title="View and copy shareable booking links by form type and purpose"
                >
                  <Link2 className="h-4 w-4 text-blue-600" />
                  <span>Share Booking Links</span>
                </button>
                <button
                  onClick={handleCreateNewEventType}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-98"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Event Type</span>
                </button>
                <button
                  onClick={() => {
                    const todayIso = new Date().toISOString().split('T')[0];
                    setEditingEventType({
                      id: '',
                      slug: '',
                      name: 'Custom Timing Meeting',
                      duration: 15,
                      color: '#6366f1',
                      description: 'Custom timing meeting configured to reserve specific hours.',
                      locationType: 'google_meet',
                      locationDetails: 'https://meet.google.com/new',
                      bufferBefore: 5,
                      bufferAfter: 5,
                      dateType: 'specific_date',
                      specificDate: todayIso,
                      customTimeSlots: [{ start: '10:00', end: '10:15' }],
                      customQuestions: [],
                    } as any);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 transition active:scale-98"
                  title="Create a meeting with custom date & timing that reserves time and disables it in further booking"
                >
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span>+ Custom Timing Meeting</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewEventTypeId(undefined);
                    setActiveTab('booking');
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                >
                  <Eye className="h-4 w-4 text-slate-500" />
                  <span>Booking Wizard</span>
                </button>
              </div>
            </div> */}

            {/* Metrics Ribbon */}
            <MetricsRibbon
              activeCount={activeBookingsCount}
              remindersCount={remindersSentCount}
              followupsCount={followupsCompletedCount}
            />

            {/* Event Types Grid */}
            {/* <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Active Event Types ({eventTypes.length})
                  </h2>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Share Links by Purpose</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventTypes.map((et) => (
                  <EventTypeCard
                    key={et.id}
                    eventType={et}
                    bookingCount={bookingCountByEventType[et.id] || 0}
                    onEdit={handleEditEventType}
                    onDelete={handleDeleteEventType}
                    onPreview={handlePreviewEventType}
                    onNotify={notify}
                    onViewBookings={(selectedEt) => {
                      setSelectedFilterEventTypeId(selectedEt.id);
                      const el = document.getElementById('scheduled-appointments-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />
                ))}
              </div>
            </div> */}

            {/* Scheduled Appointments & Bookings Section */}
            <ScheduledAppointmentsSection
              bookings={bookings}
              eventTypes={eventTypes}
              selectedEventTypeId={selectedFilterEventTypeId}
              onSelectEventType={setSelectedFilterEventTypeId}
              onRefresh={loadData}
              onNotify={notify}
              onNavigateToBooking={(etId) => {
                setPreviewEventTypeId(etId);
                setActiveTab('booking');
              }}
            />
          </div>
        )}

        {/* TAB 2: BOOKING WIZARD */}
        {activeTab === 'booking' && (
          <div className="animate-fade-in">
            <BookingWizard
              eventTypes={eventTypes}
              host={currentUser as any}
              schedules={schedules}
              existingBookings={bookings}
              selectedEventTypeId={previewEventTypeId}
              onBookingCreated={() => {
                loadData();
                notify('Appointment booked! Automated lifecycle started.');
              }}
              onEditEventType={handleEditEventType}
            />
          </div>
        )}

        {/* TAB: CUSTOM BOOKING FORMS */}
        {activeTab === 'forms' && (
          <div className="animate-fade-in">
            <CustomFormsView
              eventTypes={eventTypes}
              onOpenBookingWizard={(etId) => {
                setPreviewEventTypeId(etId);
                setActiveTab('booking');
              }}
              onRefreshEventTypes={loadData}
            />
          </div>
        )}

        {/* TAB 3: APPOINTMENTS & PIPELINE */}
        {activeTab === 'followups' && (
          <div className="animate-fade-in">
            <FollowUpCommandCenter
              bookings={bookings}
              logs={logs}
              onRefresh={loadData}
              onNotify={notify}
            />
          </div>
        )}

        {/* TAB 4: AVAILABILITY & CALENDARS */}
        {activeTab === 'availability' && (
          <div className="animate-fade-in">
            <AvailabilityManager
              schedules={schedules}
              calendars={calendars}
              onRefresh={loadData}
              onNotify={notify}
              onNavigateToForms={() => setActiveTab('forms')}
            />
          </div>
        )}

        {/* TAB 5: TEAMS & EMPLOYEES */}
        {/* {activeTab === 'teams' && (
          <div className="animate-fade-in">
            <TeamManager
              teams={teams}
              allUsers={allUsers}
              onRefresh={loadData}
              onNotify={notify}
            />
          </div>
        )} */}

        {/* TAB 6: ROUTING FORMS & QUALIFICATION */}
        {/* {activeTab === 'routing' && (
          <div className="animate-fade-in">
            <RoutingFormsView
              forms={routingForms}
              eventTypes={eventTypes}
              onRefresh={loadData}
              onNotify={notify}
            />
          </div>
        )} */}

        {/* TAB 7: CRM & CONTACTS */}
        {/* {activeTab === 'crm' && (
          <div className="animate-fade-in">
            <CRMView
              contacts={contacts}
              onRefresh={loadData}
              onNotify={notify}
            />
          </div>
        )} */}

        {/* TAB 8: PAYMENTS & BILLING */}
        {/* {activeTab === 'payments' && (
          <div className="animate-fade-in">
            <PaymentsView
              payments={payments}
              onRefresh={loadData}
              onNotify={notify}
            />
          </div>
        )} */}

        {/* TAB 9: ANALYTICS & REPORTING */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in">
            <AnalyticsView analytics={analytics} />
          </div>
        )}

        {/* TAB 10: WORKFLOWS & AUTOMATIONS */}
        {/* {activeTab === 'workflows' && workflows && (
          <div className="animate-fade-in">
            <WorkflowEditor
              workflows={workflows}
              onRefresh={loadData}
              onNotify={notify}
            />
          </div>
        )} */}

        {/* TAB 11: EMBED & SHARE */}
        {activeTab === 'embed' && (
          <div className="animate-fade-in">
            <EmbedSuite eventTypes={eventTypes} onNotify={notify} />
          </div>
        )}
      </main>

      {/* Modal */}
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

      {/* Share Links Modal by Form Type & Purpose */}
      <ShareLinksModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        eventTypes={eventTypes}
        onNotify={notify}
      />

      {/* Toast */}
      <NotificationToast
        message={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
