import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { availabilityController } from '../controllers/availability.controller';
import { eventTypesController } from '../controllers/eventTypes.controller';
import { slotsController } from '../controllers/slots.controller';
import { bookingsController } from '../controllers/bookings.controller';
import { teamsController } from '../controllers/teams.controller';
import { routingController } from '../controllers/routing.controller';
import { paymentsController } from '../controllers/payments.controller';
import { crmController } from '../controllers/crm.controller';
import { analyticsController } from '../controllers/analytics.controller';
import { workflowsController } from '../controllers/workflows.controller';
import { customFormsController } from '../controllers/customForms.controller';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

// 1. Authentication & Profiles
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', requireAuth, authController.me);
router.put('/auth/profile', requireAuth, authController.updateProfile);
router.get('/auth/users', optionalAuth, authController.listUsers);

// 2. Calendar Integration & Availability
router.get('/availability/schedules', optionalAuth, availabilityController.getSchedules);
router.put('/availability/schedules/:id', optionalAuth, availabilityController.updateSchedule);
router.get('/availability/calendars', optionalAuth, availabilityController.getConnectedCalendars);
router.post('/availability/calendars', optionalAuth, availabilityController.addConnectedCalendar);
router.patch('/availability/calendars/:id', optionalAuth, availabilityController.toggleCalendar);

// 3. Event Type Management
router.get('/event-types', optionalAuth, eventTypesController.list);
router.get('/event-types/:idOrSlug', optionalAuth, eventTypesController.getOne);
router.post('/event-types', optionalAuth, eventTypesController.create);
router.put('/event-types/:id', optionalAuth, eventTypesController.update);
router.delete('/event-types/:id', optionalAuth, eventTypesController.delete);

// 4. Booking Engine & Available Slots
router.get('/available-slots', slotsController.getAvailableSlots);

// 5. Appointment Management
router.get('/bookings', optionalAuth, bookingsController.list);
router.get('/bookings/:id', optionalAuth, bookingsController.getOne);
router.post('/bookings', optionalAuth, bookingsController.create);
router.put('/bookings/:id', optionalAuth, bookingsController.update);
router.delete('/bookings/:id', optionalAuth, bookingsController.delete);
router.patch('/bookings/:id/status', optionalAuth, bookingsController.updateStatus);
router.post('/bookings/:id/reschedule', optionalAuth, bookingsController.reschedule);
router.post('/bookings/:id/cancel', optionalAuth, bookingsController.cancel);
router.post('/bookings/:id/follow-up', optionalAuth, workflowsController.dispatchFollowUp);
router.get('/bookings/:id/ics', bookingsController.downloadIcs);

// 6. Teams & Employee Management
router.get('/teams', optionalAuth, teamsController.list);
router.get('/teams/:idOrSlug', optionalAuth, teamsController.getOne);
router.post('/teams', optionalAuth, teamsController.create);
router.post('/teams/:teamId/members', optionalAuth, teamsController.addMember);
router.delete('/teams/:teamId/members/:memberId', optionalAuth, teamsController.removeMember);

// 7. Routing Forms & Lead Qualification
router.get('/routing-forms', optionalAuth, routingController.listForms);
router.get('/routing-forms/:id', routingController.getForm);
router.post('/routing-forms', optionalAuth, routingController.createForm);
router.put('/routing-forms/:id', optionalAuth, routingController.updateForm);
router.post('/routing-forms/:id/submit', routingController.submitAndRoute);

// 8. Payments & Billing
router.get('/payments', optionalAuth, paymentsController.list);
router.post('/payments/checkout-session', optionalAuth, paymentsController.createCheckoutSession);
router.post('/payments/:id/refund', optionalAuth, paymentsController.refund);

// 9. CRM & Contacts
router.get('/crm/contacts', optionalAuth, crmController.listContacts);
router.get('/crm/contacts/:id', optionalAuth, crmController.getContact);
router.put('/crm/contacts/:id', optionalAuth, crmController.updateContact);
router.post('/crm/contacts/:id/notes', optionalAuth, crmController.addNote);

// 10. Analytics & Reporting
router.get('/analytics/overview', optionalAuth, analyticsController.getOverview);

// 11. Workflows & Automations
router.get('/workflows', optionalAuth, workflowsController.list);
router.put('/workflows', optionalAuth, workflowsController.update);
router.get('/logs', optionalAuth, workflowsController.listLogs);
router.post('/webhooks/test', workflowsController.testWebhook);

// 12. Custom Booking Forms
router.get('/custom-forms', optionalAuth, customFormsController.list);
router.get('/custom-forms/:id', customFormsController.getOne);
router.post('/custom-forms', optionalAuth, customFormsController.create);
router.put('/custom-forms/:id', optionalAuth, customFormsController.update);
router.delete('/custom-forms/:id', optionalAuth, customFormsController.delete);

export default router;
