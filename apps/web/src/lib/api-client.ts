import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterInput,
  AvailabilitySchedule,
  ConnectedCalendar,
  EventType,
  CreateEventTypeInput,
  Booking,
  CreateBookingInput,
  AvailableSlotsResponse,
  Team,
  RoutingForm,
  Payment,
  Contact,
  AnalyticsOverview,
  WorkflowsMap,
  ActivityLog,
  CustomBookingForm,
} from '@calendly/types';

function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("calendly_token");
  }
  return null;
}

export function setStoredToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("calendly_token", token);
    } else {
      localStorage.removeItem("calendly_token");
      localStorage.removeItem("calendly_user");
    }
  }
}

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", "Bearer " + token);
  }
  return fetch(url, { ...init, headers });
}

export const api = {
  logout() {
    setStoredToken(null);
  },

  getStoredUser(): User | null {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("calendly_user");
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          // ignore
        }
      }
    }
    return null;
  },

  getStoredToken(): string | null {
    return getStoredToken();
  },

  setSession(user: User, token: string) {
    setStoredToken(token);
    if (typeof window !== "undefined") {
      localStorage.setItem("calendly_user", JSON.stringify(user));
    }
  },

  // 1. Auth & Profile
  async login(creds: LoginCredentials): Promise<AuthResponse> {
    const res = await authFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to login");
    const data: AuthResponse = await res.json();
    if (data.token) {
      setStoredToken(data.token);
      if (typeof window !== "undefined" && data.user) {
        localStorage.setItem("calendly_user", JSON.stringify(data.user));
      }
    }
    return data;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await authFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to register");
    const authData: AuthResponse = await res.json();
    if (authData.token) {
      setStoredToken(authData.token);
      if (typeof window !== "undefined" && authData.user) {
        localStorage.setItem("calendly_user", JSON.stringify(authData.user));
      }
    }
    return authData;
  },

  async me(): Promise<User> {
    const res = await authFetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async getHost(): Promise<User> {
    return this.me();
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await authFetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async listUsers(): Promise<User[]> {
    const res = await authFetch('/api/auth/users');
    if (!res.ok) throw new Error('Failed to list users');
    return res.json();
  },

  // 2. Availability & Calendars
  async getSchedules(): Promise<AvailabilitySchedule[]> {
    const res = await authFetch('/api/availability/schedules');
    if (!res.ok) throw new Error('Failed to fetch availability schedules');
    return res.json();
  },

  async updateSchedule(id: string, updates: Partial<AvailabilitySchedule>): Promise<AvailabilitySchedule> {
    const res = await authFetch(`/api/availability/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update availability schedule');
    return res.json();
  },

  async getConnectedCalendars(): Promise<ConnectedCalendar[]> {
    const res = await authFetch('/api/availability/calendars');
    if (!res.ok) throw new Error('Failed to fetch connected calendars');
    return res.json();
  },

  async addConnectedCalendar(provider: string, email: string): Promise<ConnectedCalendar> {
    const res = await authFetch('/api/availability/calendars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email }),
    });
    if (!res.ok) throw new Error('Failed to add calendar');
    return res.json();
  },

  async toggleCalendar(id: string, updates: Partial<ConnectedCalendar>): Promise<ConnectedCalendar> {
    const res = await authFetch(`/api/availability/calendars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update calendar configuration');
    return res.json();
  },

  // 3. Event Types
  async getEventTypes(params?: { userSlug?: string; teamSlug?: string }): Promise<EventType[]> {
    const qs = new URLSearchParams(params as any).toString();
    const res = await authFetch(`/api/event-types${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch event types');
    return res.json();
  },

  async getEventType(idOrSlug: string): Promise<EventType & { user?: User }> {
    const res = await authFetch(`/api/event-types/${idOrSlug}`);
    if (!res.ok) throw new Error('Failed to fetch event type');
    return res.json();
  },

  async createEventType(input: CreateEventTypeInput): Promise<EventType> {
    const res = await authFetch('/api/event-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to create event type');
    }
    return res.json();
  },

  async updateEventType(id: string, updates: Partial<EventType>): Promise<EventType> {
    const res = await authFetch(`/api/event-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to update event type');
    }
    return res.json();
  },

  async deleteEventType(id: string): Promise<void> {
    const res = await authFetch(`/api/event-types/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to delete event type');
    }
  },

  // 4. Slots & Booking Engine
  async getAvailableSlots(
    eventTypeId: string | undefined,
    date: string,
    timezone?: string,
    slotDuration?: number
  ): Promise<AvailableSlotsResponse> {
    const params = new URLSearchParams({ eventTypeId: eventTypeId || 'default', date });
    if (timezone) params.append('timezone', timezone);
    if (slotDuration) params.append('slotDuration', String(slotDuration));
    const res = await authFetch(`/api/available-slots?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to calculate available slots');
    return res.json();
  },

  // 5. Appointments & Bookings
  async getBookings(status?: string): Promise<Booking[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await authFetch(`/api/bookings${qs}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  async getBooking(id: string): Promise<Booking> {
    const res = await authFetch(`/api/bookings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch booking details');
    return res.json();
  },

  async createBooking(input: CreateBookingInput & { paymentDetails?: any }): Promise<{ booking: Booking; icsUrl: string }> {
    const res = await authFetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create booking');
    }
    return res.json();
  },

  async updateBookingStatus(id: string, status: string, privateNotes?: string): Promise<Booking> {
    const res = await authFetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, privateNotes }),
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    return res.json();
  },

  async rescheduleBooking(id: string, newStartTime: string): Promise<Booking> {
    const res = await authFetch(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStartTime }),
    });
    if (!res.ok) throw new Error('Failed to reschedule booking');
    return res.json();
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const res = await authFetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update meeting');
    }
    return res.json();
  },

  async deleteBooking(id: string): Promise<void> {
    const res = await authFetch(`/api/bookings/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to delete booking');
    }
  },

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const res = await authFetch(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to cancel booking');
    return res.json();
  },

  async dispatchFollowUp(bookingId: string, type: string, channel: string = 'email'): Promise<any> {
    const res = await authFetch(`/api/bookings/${bookingId}/follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, channel }),
    });
    if (!res.ok) throw new Error('Failed to dispatch follow-up');
    return res.json();
  },

  // 6. Teams & Employees
  async getTeams(): Promise<Team[]> {
    const res = await authFetch('/api/teams');
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  async createTeam(data: { name: string; description?: string }): Promise<Team> {
    const res = await authFetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },

  async addTeamMember(teamId: string, userId: string, role: string = 'member'): Promise<any> {
    const res = await authFetch(`/api/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) throw new Error('Failed to add team member');
    return res.json();
  },

  async removeTeamMember(teamId: string, memberId: string): Promise<any> {
    const res = await authFetch(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove team member');
    return res.json();
  },

  // 7. Routing Forms & Qualification
  async getRoutingForms(): Promise<RoutingForm[]> {
    const res = await authFetch('/api/routing-forms');
    if (!res.ok) throw new Error('Failed to fetch routing forms');
    return res.json();
  },

  async getRoutingForm(id: string): Promise<RoutingForm> {
    const res = await authFetch(`/api/routing-forms/${id}`);
    if (!res.ok) throw new Error('Failed to fetch routing form');
    return res.json();
  },

  async createRoutingForm(data: Partial<RoutingForm>): Promise<RoutingForm> {
    const res = await authFetch('/api/routing-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create routing form');
    return res.json();
  },

  async updateRoutingForm(id: string, updates: Partial<RoutingForm>): Promise<RoutingForm> {
    const res = await authFetch(`/api/routing-forms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update routing form');
    return res.json();
  },

  async submitRoutingForm(id: string, answers: Record<string, string>): Promise<any> {
    const res = await authFetch(`/api/routing-forms/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error('Failed to submit routing questionnaire');
    return res.json();
  },

  // 8. Payments & Billing
  async getPayments(): Promise<Payment[]> {
    const res = await authFetch('/api/payments');
    if (!res.ok) throw new Error('Failed to fetch payment history');
    return res.json();
  },

  async createCheckoutSession(eventTypeId: string, customerEmail?: string): Promise<any> {
    const res = await authFetch('/api/payments/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTypeId, customerEmail }),
    });
    if (!res.ok) throw new Error('Failed to initiate checkout session');
    return res.json();
  },

  async refundPayment(id: string): Promise<Payment> {
    const res = await authFetch(`/api/payments/${id}/refund`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to refund payment');
    return res.json();
  },

  // 9. CRM & Contacts
  async getContacts(search?: string): Promise<Contact[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await authFetch(`/api/crm/contacts${qs}`);
    if (!res.ok) throw new Error('Failed to fetch contacts directory');
    return res.json();
  },

  async getContact(id: string): Promise<Contact & { meetingsHistory?: Booking[] }> {
    const res = await authFetch(`/api/crm/contacts/${id}`);
    if (!res.ok) throw new Error('Failed to fetch contact profile');
    return res.json();
  },

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const res = await authFetch(`/api/crm/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update contact');
    return res.json();
  },

  async addContactNote(id: string, content: string): Promise<Contact> {
    const res = await authFetch(`/api/crm/contacts/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
  },

  // 10. Analytics & Reporting
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await authFetch('/api/analytics/overview');
    if (!res.ok) throw new Error('Failed to calculate analytics metrics');
    return res.json();
  },

  // 11. Workflows & Automations
  async getWorkflows(): Promise<WorkflowsMap> {
    const res = await authFetch('/api/workflows');
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },

  async updateWorkflows(updates: Partial<WorkflowsMap>): Promise<any> {
    const res = await authFetch('/api/workflows', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update workflows');
    return res.json();
  },

  async getLogs(): Promise<ActivityLog[]> {
    const res = await authFetch('/api/logs');
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    return res.json();
  },

  async testWebhook(url: string): Promise<any> {
    const res = await authFetch('/api/webhooks/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Failed to test webhook');
    return res.json();
  },

  // 12. Custom Organization Booking Forms
  async getCustomForms(): Promise<CustomBookingForm[]> {
    const res = await authFetch('/api/custom-forms');
    if (!res.ok) throw new Error('Failed to load custom forms');
    return res.json();
  },

  async getCustomForm(id: string): Promise<CustomBookingForm> {
    const res = await authFetch(`/api/custom-forms/${id}`);
    if (!res.ok) throw new Error('Failed to load custom form');
    return res.json();
  },

  async saveCustomForm(form: Partial<CustomBookingForm>): Promise<CustomBookingForm> {
    const isEdit = Boolean(form.id);
    const url = isEdit ? `/api/custom-forms/${form.id}` : '/api/custom-forms';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error('Failed to save custom form');
    return res.json();
  },

  async deleteCustomForm(id: string): Promise<boolean> {
    const res = await authFetch(`/api/custom-forms/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete custom form');
    return true;
  },
};
