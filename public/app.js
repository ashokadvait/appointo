// ==========================================================================
// CALENDLY RECREATE - CLIENT APPLICATION LOGIC
// ==========================================================================

const API_BASE = window.location.origin;

// State Store
const state = {
  host: null,
  eventTypes: [],
  selectedEventType: null,
  selectedDate: null,
  selectedSlot: null,
  calendarCurrentDate: new Date(),
  bookings: [],
  workflows: {},
  activityLogs: [],
  activeTab: 'dashboard',
  selectedTimezone: 'Asia/Kolkata',
  currentBookingFilter: 'all',
  editingQuestions: [],
};

// DOM Elements
const el = {
  // Tabs
  navTabs: document.querySelectorAll('.nav-tab'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  followupAlertCount: document.getElementById('followup-alert-count'),

  // Host Display
  hostDisplayName: document.getElementById('host-display-name'),
  hostAvatarImg: document.getElementById('host-avatar-img'),
  metricActiveBookings: document.getElementById('metric-active-bookings'),
  metricRemindersSent: document.getElementById('metric-reminders-sent'),
  metricFollowupsSent: document.getElementById('metric-followups-sent'),
  metricHostTz: document.getElementById('metric-host-tz'),

  // Dashboard
  eventTypesList: document.getElementById('event-types-list'),
  btnCreateEventType: document.getElementById('btn-create-event-type'),
  btnQuickPreviewBooking: document.getElementById('btn-quick-preview-booking'),

  // Booking Wizard
  bookingEventTitle: document.getElementById('booking-event-title'),
  bookingEventDuration: document.getElementById('booking-event-duration'),
  bookingEventLocation: document.getElementById('booking-event-location'),
  bookingEventBuffers: document.getElementById('booking-event-buffers'),
  bookingEventDesc: document.getElementById('booking-event-desc'),
  bookingEventSelect: document.getElementById('booking-event-select'),
  bookingTimezoneSelect: document.getElementById('booking-timezone-select'),
  calendarMonthTitle: document.getElementById('calendar-month-title'),
  btnPrevMonth: document.getElementById('btn-prev-month'),
  btnNextMonth: document.getElementById('btn-next-month'),
  calendarDaysGrid: document.getElementById('calendar-days-grid'),
  slotsDateLabel: document.getElementById('slots-date-label'),
  slotsSubtext: document.getElementById('slots-subtext'),
  slotsListContainer: document.getElementById('slots-list-container'),
  slotsEmptyState: document.getElementById('slots-empty-state'),

  // Booking Form Overlay
  bookingFormOverlay: document.getElementById('booking-form-overlay'),
  btnBackToSlots: document.getElementById('btn-back-to-slots'),
  formDisplayDateTime: document.getElementById('form-display-datetime'),
  formDisplayDuration: document.getElementById('form-display-duration'),
  bookingSubmissionForm: document.getElementById('booking-submission-form'),
  inputInviteeName: document.getElementById('input-invitee-name'),
  inputInviteeEmail: document.getElementById('input-invitee-email'),
  inputGuestEmails: document.getElementById('input-guest-emails'),
  customQuestionsContainer: document.getElementById('custom-questions-container'),
  inputNotes: document.getElementById('input-notes'),

  // Booking Success Overlay
  bookingSuccessOverlay: document.getElementById('booking-success-overlay'),
  confEventName: document.getElementById('conf-event-name'),
  confHostName: document.getElementById('conf-host-name'),
  confDateTime: document.getElementById('conf-datetime'),
  confMeetingUrl: document.getElementById('conf-meeting-url'),
  btnDownloadIcs: document.getElementById('btn-download-ics'),
  btnAddGoogleCal: document.getElementById('btn-add-google-cal'),
  btnAddOutlookCal: document.getElementById('btn-add-outlook-cal'),
  btnScheduleAnother: document.getElementById('btn-schedule-another'),

  // Follow-Up Hub
  bookingsTableBody: document.getElementById('bookings-table-body'),
  filterPills: document.querySelectorAll('.filter-pill'),
  activityStreamList: document.getElementById('activity-stream-list'),

  // Workflows
  workflowCardsStack: document.getElementById('workflow-cards-stack'),
  btnSaveWorkflows: document.getElementById('btn-save-workflows'),
  inputWebhookUrl: document.getElementById('input-webhook-url'),
  btnTestWebhook: document.getElementById('btn-test-webhook'),
  webhookOutputBox: document.getElementById('webhook-output-box'),
  webhookOutputPre: document.getElementById('webhook-output-pre'),

  // Embed & Share
  shareLinkInput: document.getElementById('share-link-input'),
  btnCopyShareLink: document.getElementById('btn-copy-share-link'),
  codeIframeEmbed: document.getElementById('code-iframe-embed'),
  btnCopyIframe: document.getElementById('btn-copy-iframe'),
  codeWidgetEmbed: document.getElementById('code-widget-embed'),
  btnCopyWidget: document.getElementById('btn-copy-widget'),

  // Modals
  modalEventType: document.getElementById('modal-event-type'),
  modalEventTypeTitle: document.getElementById('modal-event-type-title'),
  btnCloseModalEvent: document.getElementById('btn-close-modal-event'),
  btnCancelEventType: document.getElementById('btn-cancel-event-type'),
  formEventType: document.getElementById('form-event-type'),
  editEventId: document.getElementById('edit-event-id'),
  eventTitleInput: document.getElementById('event-title-input'),
  eventDurationInput: document.getElementById('event-duration-input'),
  eventColorInput: document.getElementById('event-color-input'),
  eventColorHex: document.getElementById('event-color-hex'),
  eventDescInput: document.getElementById('event-desc-input'),
  eventLocType: document.getElementById('event-loc-type'),
  eventLocDetails: document.getElementById('event-loc-details'),
  eventBufferBefore: document.getElementById('event-buffer-before'),
  eventBufferAfter: document.getElementById('event-buffer-after'),
  btnAddBuilderQuestion: document.getElementById('btn-add-builder-question'),
  builderQuestionsList: document.getElementById('builder-questions-list'),

  modalDispatchFollowup: document.getElementById('modal-dispatch-followup'),
  btnCloseModalDispatch: document.getElementById('btn-close-modal-dispatch'),
  btnCancelDispatch: document.getElementById('btn-cancel-dispatch'),
  formDispatchFollowup: document.getElementById('form-dispatch-followup'),
  dispatchBookingId: document.getElementById('dispatch-booking-id'),
  dispatchRecipient: document.getElementById('dispatch-recipient'),
  dispatchTypeSelect: document.getElementById('dispatch-type-select'),
  dispatchMessageText: document.getElementById('dispatch-message-text'),

  toastContainer: document.getElementById('toast-container'),
};

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${message}</span>
  `;
  el.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// DATA FETCHING & INITIALIZATION
// ==========================================================================
async function initApp() {
  try {
    const [hostRes, eventsRes, bookingsRes, workflowsRes, logsRes] = await Promise.all([
      fetch(`${API_BASE}/api/host`).then((r) => r.json()),
      fetch(`${API_BASE}/api/event-types`).then((r) => r.json()),
      fetch(`${API_BASE}/api/bookings`).then((r) => r.json()),
      fetch(`${API_BASE}/api/workflows`).then((r) => r.json()),
      fetch(`${API_BASE}/api/logs`).then((r) => r.json()),
    ]);

    state.host = hostRes;
    state.eventTypes = eventsRes;
    state.bookings = bookingsRes;
    state.workflows = workflowsRes;
    state.activityLogs = logsRes;

    if (state.eventTypes.length > 0) {
      state.selectedEventType = state.eventTypes[0];
    }

    renderHostHeader();
    renderEventTypes();
    renderBookingSidebar();
    renderCalendar();
    renderBookingsTable();
    renderActivityStream();
    renderWorkflows();
    updateEmbedCodes();

    // Check URL Hash for direct route
    if (window.location.hash === '#book') {
      switchTab('booking');
    } else if (window.location.hash === '#followups') {
      switchTab('followups');
    }
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('Failed to connect to backend server', 'error');
  }
}

// ==========================================================================
// TAB SWITCHING
// ==========================================================================
function switchTab(tabId) {
  state.activeTab = tabId;
  el.navTabs.forEach((btn) => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  el.tabPanes.forEach((pane) => {
    pane.classList.toggle('active', pane.id === `pane-${tabId}`);
  });

  if (tabId === 'booking') {
    renderBookingSidebar();
    renderCalendar();
  } else if (tabId === 'followups') {
    renderBookingsTable();
    renderActivityStream();
  }
}

el.navTabs.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ==========================================================================
// HOST HEADER & METRICS
// ==========================================================================
function renderHostHeader() {
  if (!state.host) return;
  el.hostDisplayName.textContent = state.host.name;
  if (state.host.avatar) el.hostAvatarImg.src = state.host.avatar;
  el.metricHostTz.textContent = state.host.timezone;

  // Active bookings count
  const activeCount = state.bookings.filter((b) => b.status === 'scheduled').length;
  el.metricActiveBookings.textContent = activeCount;

  // Sent reminders count
  let remindersCount = 0;
  let followupsCount = 0;
  state.bookings.forEach((b) => {
    (b.followUps || []).forEach((f) => {
      if (f.status === 'sent') {
        if (f.type.includes('reminder') || f.type === 'confirmation') remindersCount++;
        if (f.type.includes('followup')) followupsCount++;
      }
    });
  });
  el.metricRemindersSent.textContent = remindersCount;
  el.metricFollowupsSent.textContent = followupsCount;

  // Alert count on follow-up tab
  const needsFollowupCount = state.bookings.filter((b) => {
    return (
      b.status === 'completed' &&
      b.followUps &&
      b.followUps.some((f) => f.type === 'followup_post' && f.status === 'pending')
    );
  }).length;
  el.followupAlertCount.textContent = needsFollowupCount || '!';
}

// ==========================================================================
// TAB 1: EVENT TYPES
// ==========================================================================
function renderEventTypes() {
  el.eventTypesList.innerHTML = '';

  state.eventTypes.forEach((evt) => {
    const card = document.createElement('div');
    card.className = 'event-type-card';
    card.innerHTML = `
      <div class="event-card-color-stripe" style="background: ${evt.color || '#3b82f6'}"></div>
      <div class="event-card-body">
        <div class="event-card-top">
          <h3 class="event-card-name">${evt.name}</h3>
          <span class="meta-pill" style="border-left: 3px solid ${evt.color || '#3b82f6'}">${evt.duration} mins</span>
        </div>
        <p class="event-card-desc">${evt.description || 'No description provided.'}</p>
        <div class="event-card-meta">
          <span class="meta-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${evt.bufferBefore}m pre / ${evt.bufferAfter}m post buffer
          </span>
          <span class="meta-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            4 Follow-Up Workflows Active
          </span>
          <span class="meta-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${(evt.customQuestions || []).length} Intake Questions
          </span>
        </div>
        <div class="event-card-footer">
          <button class="btn btn-secondary btn-sm btn-open-booking" data-id="${evt.id}">
            Book Slot →
          </button>
          <div style="display:flex; gap: 0.35rem;">
            <button class="btn btn-outline btn-sm btn-edit-event" data-id="${evt.id}">Edit</button>
            <button class="btn btn-danger-outline btn-sm btn-delete-event" data-id="${evt.id}">Delete</button>
          </div>
        </div>
      </div>
    `;

    // Event Listeners for Card Actions
    card.querySelector('.btn-open-booking').addEventListener('click', () => {
      state.selectedEventType = evt;
      switchTab('booking');
    });

    card.querySelector('.btn-edit-event').addEventListener('click', () => {
      openEditEventTypeModal(evt);
    });

    card.querySelector('.btn-delete-event').addEventListener('click', () => {
      deleteEventType(evt.id);
    });

    el.eventTypesList.appendChild(card);
  });
}

// Quick Preview Button
el.btnQuickPreviewBooking.addEventListener('click', () => {
  switchTab('booking');
});

// ==========================================================================
// TAB 2: BOOKING WIZARD & CALENDAR ENGINE
// ==========================================================================
function renderBookingSidebar() {
  if (!state.selectedEventType) return;
  const evt = state.selectedEventType;

  el.bookingEventTitle.textContent = evt.name;
  el.bookingEventDuration.textContent = `${evt.duration} mins`;
  el.bookingEventBuffers.textContent = `${evt.bufferBefore || 0}m buffer before & ${evt.bufferAfter || 0}m after`;
  el.bookingEventDesc.textContent = evt.description || 'Schedule a meeting with our team.';
  el.bookingEventLocation.textContent =
    evt.locationType === 'google_meet'
      ? 'Google Meet Video Call'
      : evt.locationType === 'zoom'
      ? 'Zoom Meeting'
      : evt.locationDetails || 'Web conferencing link provided upon booking';

  // Populate Event Switcher Select
  el.bookingEventSelect.innerHTML = '';
  state.eventTypes.forEach((e) => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.name} (${e.duration}m)`;
    opt.selected = e.id === evt.id;
    el.bookingEventSelect.appendChild(opt);
  });
}

el.bookingEventSelect.addEventListener('change', (e) => {
  const selected = state.eventTypes.find((evt) => evt.id === e.target.value);
  if (selected) {
    state.selectedEventType = selected;
    state.selectedSlot = null;
    renderBookingSidebar();
    if (state.selectedDate) {
      fetchAvailableSlots(state.selectedDate);
    }
  }
});

el.bookingTimezoneSelect.addEventListener('change', (e) => {
  state.selectedTimezone = e.target.value;
  if (state.selectedDate) {
    fetchAvailableSlots(state.selectedDate);
  }
});

// Calendar Month Navigation
el.btnPrevMonth.addEventListener('click', () => {
  state.calendarCurrentDate.setMonth(state.calendarCurrentDate.getMonth() - 1);
  renderCalendar();
});

el.btnNextMonth.addEventListener('click', () => {
  state.calendarCurrentDate.setMonth(state.calendarCurrentDate.getMonth() + 1);
  renderCalendar();
});

function renderCalendar() {
  const current = state.calendarCurrentDate;
  const year = current.getFullYear();
  const month = current.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  el.calendarMonthTitle.textContent = `${monthNames[month]} ${year}`;

  el.calendarDaysGrid.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0-6
  const totalDays = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Blank days before first day
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'cal-day-cell empty';
    el.calendarDaysGrid.appendChild(emptyCell);
  }

  // Days of month
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = cellDate.getDay();

    const cell = document.createElement('button');
    cell.className = 'cal-day-cell';
    cell.textContent = day;
    cell.dataset.date = dateStr;

    const isPast = cellDate < today;
    const isWorkingDay = (state.host?.workingDays || [1, 2, 3, 4, 5]).includes(dayOfWeek);

    if (isPast || !isWorkingDay) {
      cell.classList.add(isPast ? 'past' : 'disabled');
      cell.disabled = true;
    } else {
      cell.classList.add('available');
      if (state.selectedDate === dateStr) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', () => {
        document.querySelectorAll('.cal-day-cell.selected').forEach((c) => c.classList.remove('selected'));
        cell.classList.add('selected');
        state.selectedDate = dateStr;
        fetchAvailableSlots(dateStr);
      });
    }

    el.calendarDaysGrid.appendChild(cell);
  }

  // Auto-select first available date if none selected
  if (!state.selectedDate) {
    const firstAvailable = el.calendarDaysGrid.querySelector('.cal-day-cell.available');
    if (firstAvailable) {
      firstAvailable.click();
    }
  }
}

// Fetch Slots from Server
async function fetchAvailableSlots(dateStr) {
  if (!state.selectedEventType) return;

  const eventTypeId = state.selectedEventType.id;
  const tz = state.selectedTimezone;

  const [y, m, d] = dateStr.split('-');
  const formattedDateHeader = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  el.slotsDateLabel.textContent = formattedDateHeader;
  el.slotsSubtext.textContent = `Available times in ${tz.replace('_', ' ')}`;
  el.slotsListContainer.innerHTML = '<div class="slots-empty-state"><p>Calculating available slots with buffers...</p></div>';

  try {
    const res = await fetch(
      `${API_BASE}/api/available-slots?eventTypeId=${eventTypeId}&date=${dateStr}&timezone=${encodeURIComponent(tz)}`
    );
    const data = await res.json();

    if (!data.slots || data.slots.length === 0) {
      el.slotsListContainer.innerHTML = `
        <div class="slots-empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <p>No available slots on this day.<br>${data.reason || 'All slots booked or outside working hours.'}</p>
        </div>
      `;
      return;
    }

    el.slotsListContainer.innerHTML = '';
    data.slots.forEach((slot) => {
      const btn = document.createElement('button');
      btn.className = 'slot-btn';
      btn.innerHTML = `
        <span>${slot.timeFormatted}</span>
        <span class="slot-arrow">Next →</span>
      `;

      btn.addEventListener('click', () => {
        state.selectedSlot = slot;
        openBookingForm(slot);
      });

      el.slotsListContainer.appendChild(btn);
    });
  } catch (err) {
    console.error('Error fetching slots:', err);
    el.slotsListContainer.innerHTML = '<div class="slots-empty-state"><p>Failed to load slots.</p></div>';
  }
}

// Open Booking Form
function openBookingForm(slot) {
  el.formDisplayDateTime.textContent = `${el.slotsDateLabel.textContent} at ${slot.timeFormatted}`;
  el.formDisplayDuration.textContent = `${state.selectedEventType.duration} minutes · ${state.selectedTimezone}`;

  // Render Custom Questions for this event type
  el.customQuestionsContainer.innerHTML = '';
  const questions = state.selectedEventType.customQuestions || [];

  questions.forEach((q) => {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = `${q.label} ${q.required ? '*' : ''}`;
    group.appendChild(label);

    let input;
    if (q.type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'form-textarea';
      input.rows = 2;
    } else if (q.type === 'select') {
      input = document.createElement('select');
      input.className = 'form-select';
      (q.options || []).forEach((optText) => {
        const opt = document.createElement('option');
        opt.value = optText;
        opt.textContent = optText;
        input.appendChild(opt);
      });
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input';
    }

    input.name = `custom_${q.id}`;
    input.dataset.qid = q.id;
    if (q.required) input.required = true;

    group.appendChild(input);
    el.customQuestionsContainer.appendChild(group);
  });

  el.bookingFormOverlay.classList.remove('hidden');
}

// Back to slots button
el.btnBackToSlots.addEventListener('click', () => {
  el.bookingFormOverlay.classList.add('hidden');
});

// Handle Booking Form Submission
el.bookingSubmissionForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const inviteeName = el.inputInviteeName.value.trim();
  const inviteeEmail = el.inputInviteeEmail.value.trim();
  const notes = el.inputNotes.value.trim();

  // Gather custom question answers
  const customAnswers = {};
  el.customQuestionsContainer.querySelectorAll('[data-qid]').forEach((input) => {
    customAnswers[input.dataset.qid] = input.value;
  });

  const payload = {
    eventTypeId: state.selectedEventType.id,
    inviteeName,
    inviteeEmail,
    inviteeTimezone: state.selectedTimezone,
    startTime: state.selectedSlot.timeUtc,
    notes,
    customAnswers,
  };

  try {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete booking');
    }

    const { booking, icsUrl } = await res.json();
    state.bookings.unshift(booking);

    // Refresh metrics & UI
    renderHostHeader();
    showToast('Meeting scheduled! Automated follow-up pipeline active.', 'success');

    // Show Confirmation Screen
    showBookingConfirmation(booking, icsUrl);
  } catch (err) {
    console.error('Booking failed:', err);
    showToast(err.message, 'error');
  }
});

// Show Confirmation Screen
function showBookingConfirmation(booking, icsUrl) {
  el.bookingFormOverlay.classList.add('hidden');

  el.confEventName.textContent = booking.eventTypeName;
  el.confHostName.textContent = state.host?.name || 'Host';

  const start = new Date(booking.startTime);
  el.confDateTime.textContent = `${start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} · ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (${booking.inviteeTimezone})`;

  el.confMeetingUrl.href = booking.location;
  el.confMeetingUrl.textContent = booking.location;

  // Set ICS Download Link
  el.btnDownloadIcs.href = `${API_BASE}${icsUrl}`;

  // Format Google Calendar Link
  const gStart = start.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const gEnd = new Date(new Date(booking.endTime)).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const gUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    booking.eventTypeName
  )}&dates=${gStart}/${gEnd}&details=${encodeURIComponent(
    `Meeting with ${state.host?.name}\nLocation: ${booking.location}`
  )}&location=${encodeURIComponent(booking.location)}`;
  el.btnAddGoogleCal.href = gUrl;

  // Format Outlook Web Calendar Link
  const oUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    booking.eventTypeName
  )}&startdt=${start.toISOString()}&enddt=${booking.endTime}&body=${encodeURIComponent(
    `Meeting with ${state.host?.name}\nLocation: ${booking.location}`
  )}&location=${encodeURIComponent(booking.location)}`;
  el.btnAddOutlookCal.href = oUrl;

  el.bookingSuccessOverlay.classList.remove('hidden');
}

// Schedule Another Button
el.btnScheduleAnother.addEventListener('click', () => {
  el.bookingSuccessOverlay.classList.add('hidden');
  el.bookingSubmissionForm.reset();
  state.selectedSlot = null;
  if (state.selectedDate) {
    fetchAvailableSlots(state.selectedDate);
  }
});

// ==========================================================================
// TAB 3: FOLLOW-UP COMMAND CENTER
// ==========================================================================
function renderBookingsTable() {
  el.bookingsTableBody.innerHTML = '';

  let filtered = state.bookings;
  if (state.currentBookingFilter === 'scheduled') {
    filtered = state.bookings.filter((b) => b.status === 'scheduled');
  } else if (state.currentBookingFilter === 'completed') {
    filtered = state.bookings.filter((b) => b.status === 'completed');
  } else if (state.currentBookingFilter === 'needs_followup') {
    filtered = state.bookings.filter((b) => {
      return (
        b.followUps &&
        b.followUps.some((f) => f.type === 'followup_post' && f.status === 'pending')
      );
    });
  }

  if (filtered.length === 0) {
    el.bookingsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">
          No bookings match the selected filter.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((b) => {
    const tr = document.createElement('tr');
    const start = new Date(b.startTime);
    const dateFormatted = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeFormatted = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Check pipeline steps
    const confFollowup = (b.followUps || []).find((f) => f.type === 'confirmation');
    const r24Followup = (b.followUps || []).find((f) => f.type === 'reminder_24h');
    const r1Followup = (b.followUps || []).find((f) => f.type === 'reminder_1h');
    const postFollowup = (b.followUps || []).find((f) => f.type === 'followup_post');

    const statusBadgeClass =
      b.status === 'scheduled' ? 'badge-emerald' : b.status === 'completed' ? 'badge-amber' : 'badge-gray';

    tr.innerHTML = `
      <td>
        <div class="attendee-cell">
          <span class="attendee-name">${b.inviteeName}</span>
          <span class="attendee-email">${b.inviteeEmail}</span>
        </div>
      </td>
      <td>
        <strong>${b.eventTypeName}</strong>
      </td>
      <td>
        <div>${dateFormatted}</div>
        <span style="font-size: 0.78rem; color: var(--text-tertiary);">${timeFormatted} (${b.inviteeTimezone || 'UTC'})</span>
      </td>
      <td>
        <span class="${statusBadgeClass}">${b.status.toUpperCase()}</span>
      </td>
      <td>
        <div class="pipeline-dots">
          <span class="pipe-badge ${confFollowup?.status === 'sent' ? 'pipe-sent' : 'pipe-pending'}" title="Immediate Confirmation">
            ✓ Confirmed
          </span>
          <span class="pipe-badge ${r24Followup?.status === 'sent' ? 'pipe-sent' : 'pipe-pending'}" title="24h Advance Reminder">
            ${r24Followup?.status === 'sent' ? '✓ 24h Sent' : '⏳ 24h Due'}
          </span>
          <span class="pipe-badge ${r1Followup?.status === 'sent' ? 'pipe-sent' : 'pipe-pending'}" title="1h Urgent Reminder">
            ${r1Followup?.status === 'sent' ? '✓ 1h Sent' : '⏳ 1h Due'}
          </span>
          <span class="pipe-badge ${postFollowup?.status === 'sent' ? 'pipe-sent' : 'pipe-pending'}" title="Post-Meeting Follow-Up">
            ${postFollowup?.status === 'sent' ? '✓ Follow-Up Sent' : '⏳ Follow-Up Due'}
          </span>
        </div>
      </td>
      <td>
        <div style="display:flex; gap: 0.4rem;">
          <button class="btn btn-primary btn-sm btn-action-dispatch" data-id="${b.id}">
            Dispatch Follow-Up
          </button>
          <button class="btn btn-secondary btn-sm btn-action-toggle-status" data-id="${b.id}" data-current="${b.status}">
            ${b.status === 'scheduled' ? 'Mark Completed' : 'Reactivate'}
          </button>
        </div>
      </td>
    `;

    // Action handlers
    tr.querySelector('.btn-action-dispatch').addEventListener('click', () => {
      openDispatchFollowupModal(b);
    });

    tr.querySelector('.btn-action-toggle-status').addEventListener('click', async () => {
      const nextStatus = b.status === 'scheduled' ? 'completed' : 'scheduled';
      await updateBookingStatus(b.id, nextStatus);
    });

    el.bookingsTableBody.appendChild(tr);
  });
}

// Booking Filter Pills
el.filterPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    el.filterPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    state.currentBookingFilter = pill.dataset.filter;
    renderBookingsTable();
  });
});

// Update Booking Status
async function updateBookingStatus(bookingId, status) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      const { booking } = await res.json();
      const index = state.bookings.findIndex((b) => b.id === bookingId);
      if (index !== -1) state.bookings[index] = booking;

      renderHostHeader();
      renderBookingsTable();
      showToast(`Booking status changed to ${status}`, 'success');
      refreshActivityLogs();
    }
  } catch (err) {
    showToast('Failed to update status', 'error');
  }
}

// Dispatch Follow-up Modal
function openDispatchFollowupModal(booking) {
  el.dispatchBookingId.value = booking.id;
  el.dispatchRecipient.value = `${booking.inviteeName} <${booking.inviteeEmail}>`;
  updateDispatchMessagePreview(booking, el.dispatchTypeSelect.value);

  el.modalDispatchFollowup.classList.remove('hidden');
}

el.dispatchTypeSelect.addEventListener('change', () => {
  const booking = state.bookings.find((b) => b.id === el.dispatchBookingId.value);
  if (booking) {
    updateDispatchMessagePreview(booking, el.dispatchTypeSelect.value);
  }
});

function updateDispatchMessagePreview(booking, type) {
  let text = '';
  if (type === 'reminder_urgent') {
    text = `Hi ${booking.inviteeName},\n\nOur call starts shortly! Here is your direct join link:\n${booking.location}\n\nSee you soon!`;
  } else if (type === 'followup_post') {
    text = `Hi ${booking.inviteeName},\n\nThank you for taking the time to meet today! It was great discussing ${booking.eventTypeName}.\n\nNext steps: We will follow up with the detailed architecture proposal by end of day.\n\nBest regards,\n${state.host?.name}`;
  } else if (type === 'no_show_recovery') {
    text = `Hi ${booking.inviteeName},\n\nSorry we missed each other today! Let's get this rescheduled at your convenience:\nhttp://localhost:3000/#book\n\nLooking forward to speaking soon.`;
  } else {
    text = `Hi ${booking.inviteeName},\n\nFollowing up regarding our scheduled meeting...`;
  }
  el.dispatchMessageText.value = text;
}

el.btnCloseModalDispatch.addEventListener('click', () => el.modalDispatchFollowup.classList.add('hidden'));
el.btnCancelDispatch.addEventListener('click', () => el.modalDispatchFollowup.classList.add('hidden'));

el.formDispatchFollowup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const bookingId = el.dispatchBookingId.value;
  const type = el.dispatchTypeSelect.value;
  const message = el.dispatchMessageText.value;

  try {
    const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message }),
    });

    if (res.ok) {
      const { booking } = await res.json();
      const index = state.bookings.findIndex((b) => b.id === bookingId);
      if (index !== -1) state.bookings[index] = booking;

      el.modalDispatchFollowup.classList.add('hidden');
      renderHostHeader();
      renderBookingsTable();
      showToast('Follow-up message dispatched successfully!', 'success');
      refreshActivityLogs();
    }
  } catch (err) {
    showToast('Failed to dispatch follow-up', 'error');
  }
});

// Render Activity Stream
function renderActivityStream() {
  el.activityStreamList.innerHTML = '';
  if (!state.activityLogs || state.activityLogs.length === 0) {
    el.activityStreamList.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.85rem;">No activity recorded yet.</p>';
    return;
  }

  state.activityLogs.forEach((log) => {
    const item = document.createElement('div');
    item.className = 'activity-item';

    const dotColor = log.type.includes('SENT') ? 'var(--emerald-500)' : 'var(--primary-500)';

    item.innerHTML = `
      <span class="activity-dot" style="background: ${dotColor};"></span>
      <div class="activity-meta">
        <div>
          <strong>${log.recipient || 'System'}</strong>: ${log.description}
        </div>
        <span class="activity-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
      </div>
    `;
    el.activityStreamList.appendChild(item);
  });
}

async function refreshActivityLogs() {
  try {
    const res = await fetch(`${API_BASE}/api/logs`);
    state.activityLogs = await res.json();
    renderActivityStream();
  } catch (err) {
    console.error('Error refreshing activity logs:', err);
  }
}

// ==========================================================================
// TAB 4: WORKFLOWS & TIMING
// ==========================================================================
function renderWorkflows() {
  el.workflowCardsStack.innerHTML = '';
  const wfKeys = Object.keys(state.workflows);

  wfKeys.forEach((key) => {
    const wf = state.workflows[key];
    const card = document.createElement('div');
    card.className = 'workflow-card';
    card.innerHTML = `
      <div class="workflow-card-header">
        <div class="workflow-title-wrap">
          <input type="checkbox" id="wf-check-${key}" class="form-check" ${wf.enabled ? 'checked' : ''}>
          <label for="wf-check-${key}" style="font-weight: 700; color: #fff; cursor: pointer;">${wf.title}</label>
        </div>
        <span class="workflow-trigger-badge">${wf.trigger.replace(/_/g, ' ')}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Email Subject</label>
        <input type="text" class="form-input wf-subject" data-key="${key}" value="${wf.subject}">
      </div>
      <div class="form-group">
        <label class="form-label">Email Body Template</label>
        <textarea class="form-textarea wf-body" data-key="${key}" rows="4">${wf.body}</textarea>
      </div>
    `;
    el.workflowCardsStack.appendChild(card);
  });
}

// Save Workflows
el.btnSaveWorkflows.addEventListener('click', async () => {
  const updatedWorkflows = { ...state.workflows };

  document.querySelectorAll('.wf-subject').forEach((input) => {
    const key = input.dataset.key;
    if (updatedWorkflows[key]) {
      updatedWorkflows[key].subject = input.value;
      updatedWorkflows[key].enabled = document.getElementById(`wf-check-${key}`)?.checked ?? true;
    }
  });

  document.querySelectorAll('.wf-body').forEach((textarea) => {
    const key = textarea.dataset.key;
    if (updatedWorkflows[key]) {
      updatedWorkflows[key].body = textarea.value;
    }
  });

  try {
    const res = await fetch(`${API_BASE}/api/workflows`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedWorkflows),
    });

    if (res.ok) {
      state.workflows = await res.json();
      showToast('All workflow templates saved!', 'success');
    }
  } catch (err) {
    showToast('Failed to save workflows', 'error');
  }
});

// Test Webhook Dispatch
el.btnTestWebhook.addEventListener('click', async () => {
  const url = el.inputWebhookUrl.value.trim();
  if (!url) {
    showToast('Please enter a webhook URL', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/webhooks/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const result = await res.json();

    el.webhookOutputPre.textContent = JSON.stringify(result, null, 2);
    el.webhookOutputBox.classList.remove('hidden');
    showToast('Webhook payload dispatched successfully!', 'success');
  } catch (err) {
    showToast('Webhook dispatch failed', 'error');
  }
});

// ==========================================================================
// TAB 5: EMBED & SHARE SUITE
// ==========================================================================
function updateEmbedCodes() {
  const origin = window.location.origin;
  el.shareLinkInput.value = `${origin}/#book`;

  el.codeIframeEmbed.textContent = `<iframe src="${origin}/#book" width="100%" height="700" frameborder="0" style="border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);"></iframe>`;

  el.codeWidgetEmbed.textContent = `<!-- Calendly Recreate Widget -->\n<link href="${origin}/style.css" rel="stylesheet">\n<script src="${origin}/embed.js" async></script>\n<script>\n  window.addEventListener('load', function() {\n    CalendlyRecreate.initBadgeWidget({\n      url: '${origin}/#book',\n      text: 'Schedule Time With Me',\n      color: '#3b82f6',\n      textColor: '#ffffff'\n    });\n  });\n</script>`;
}

el.btnCopyShareLink.addEventListener('click', () => {
  navigator.clipboard.writeText(el.shareLinkInput.value);
  showToast('Booking link copied to clipboard!', 'success');
});

el.btnCopyIframe.addEventListener('click', () => {
  navigator.clipboard.writeText(el.codeIframeEmbed.textContent);
  showToast('iFrame code copied to clipboard!', 'success');
});

el.btnCopyWidget.addEventListener('click', () => {
  navigator.clipboard.writeText(el.codeWidgetEmbed.textContent);
  showToast('Widget script copied to clipboard!', 'success');
});

// ==========================================================================
// MODAL: CREATE / EDIT EVENT TYPE
// ==========================================================================
el.btnCreateEventType.addEventListener('click', () => {
  el.modalEventTypeTitle.textContent = 'New Event Type';
  el.editEventId.value = '';
  el.formEventType.reset();
  el.eventColorHex.textContent = '#3b82f6';
  state.editingQuestions = [
    { id: 'q1', label: 'Primary topic or objective', type: 'text', required: true },
  ];
  renderBuilderQuestions();
  el.modalEventType.classList.remove('hidden');
});

function openEditEventTypeModal(evt) {
  el.modalEventTypeTitle.textContent = 'Edit Event Type';
  el.editEventId.value = evt.id;
  el.eventTitleInput.value = evt.name;
  el.eventDurationInput.value = evt.duration;
  el.eventColorInput.value = evt.color || '#3b82f6';
  el.eventColorHex.textContent = evt.color || '#3b82f6';
  el.eventDescInput.value = evt.description || '';
  el.eventLocType.value = evt.locationType || 'google_meet';
  el.eventLocDetails.value = evt.locationDetails || '';
  el.eventBufferBefore.value = evt.bufferBefore || 0;
  el.eventBufferAfter.value = evt.bufferAfter || 0;

  state.editingQuestions = JSON.parse(JSON.stringify(evt.customQuestions || []));
  renderBuilderQuestions();
  el.modalEventType.classList.remove('hidden');
}

el.eventColorInput.addEventListener('input', (e) => {
  el.eventColorHex.textContent = e.target.value;
});

function renderBuilderQuestions() {
  el.builderQuestionsList.innerHTML = '';
  state.editingQuestions.forEach((q, idx) => {
    const item = document.createElement('div');
    item.className = 'builder-q-item';
    item.innerHTML = `
      <input type="text" class="form-input q-label" value="${q.label}" placeholder="Question prompt..." style="flex: 2;">
      <select class="form-select q-type" style="flex: 1;">
        <option value="text" ${q.type === 'text' ? 'selected' : ''}>Text Input</option>
        <option value="textarea" ${q.type === 'textarea' ? 'selected' : ''}>Textarea</option>
        <option value="select" ${q.type === 'select' ? 'selected' : ''}>Dropdown Select</option>
      </select>
      <label style="display:flex; align-items:center; gap:4px; font-size:0.75rem;">
        <input type="checkbox" class="q-required" ${q.required ? 'checked' : ''}> Req
      </label>
      <button type="button" class="btn btn-danger-outline btn-sm q-delete" style="padding: 0.2rem 0.5rem;">&times;</button>
    `;

    item.querySelector('.q-label').addEventListener('input', (e) => { q.label = e.target.value; });
    item.querySelector('.q-type').addEventListener('change', (e) => { q.type = e.target.value; });
    item.querySelector('.q-required').addEventListener('change', (e) => { q.required = e.target.checked; });
    item.querySelector('.q-delete').addEventListener('click', () => {
      state.editingQuestions.splice(idx, 1);
      renderBuilderQuestions();
    });

    el.builderQuestionsList.appendChild(item);
  });
}

el.btnAddBuilderQuestion.addEventListener('click', () => {
  state.editingQuestions.push({
    id: `q${Date.now().toString(36)}`,
    label: 'New Question',
    type: 'text',
    required: false,
  });
  renderBuilderQuestions();
});

el.btnCloseModalEvent.addEventListener('click', () => el.modalEventType.classList.add('hidden'));
el.btnCancelEventType.addEventListener('click', () => el.modalEventType.classList.add('hidden'));

el.formEventType.addEventListener('submit', async (e) => {
  e.preventDefault();

  const isEdit = Boolean(el.editEventId.value);
  const payload = {
    name: el.eventTitleInput.value.trim(),
    duration: Number(el.eventDurationInput.value),
    color: el.eventColorInput.value,
    description: el.eventDescInput.value.trim(),
    locationType: el.eventLocType.value,
    locationDetails: el.eventLocDetails.value.trim(),
    bufferBefore: Number(el.eventBufferBefore.value),
    bufferAfter: Number(el.eventBufferAfter.value),
    customQuestions: state.editingQuestions,
  };

  try {
    const url = isEdit ? `${API_BASE}/api/event-types/${el.editEventId.value}` : `${API_BASE}/api/event-types`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to save event type');

    const saved = await res.json();
    if (isEdit) {
      const idx = state.eventTypes.findIndex((e) => e.id === saved.id);
      if (idx !== -1) state.eventTypes[idx] = saved;
    } else {
      state.eventTypes.push(saved);
    }

    el.modalEventType.classList.add('hidden');
    renderEventTypes();
    renderBookingSidebar();
    showToast(`Event type ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function deleteEventType(id) {
  if (!confirm('Are you sure you want to delete this event type?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/event-types/${id}`, { method: 'DELETE' });
    if (res.ok) {
      state.eventTypes = state.eventTypes.filter((e) => e.id !== id);
      renderEventTypes();
      showToast('Event type removed', 'success');
    }
  } catch (err) {
    showToast('Failed to delete event type', 'error');
  }
}

// Start application
window.addEventListener('DOMContentLoaded', initApp);
