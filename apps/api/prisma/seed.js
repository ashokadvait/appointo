"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding SQLite database with rich enterprise dataset...');
    // Clean old data if any
    await prisma.activityLog.deleteMany();
    await prisma.followUp.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.eventType.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.connectedCalendar.deleteMany();
    await prisma.availabilitySchedule.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.routingForm.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.user.deleteMany();
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    // 1. Users
    const alex = await prisma.user.create({
        data: {
            email: 'alex.morgan@example.com',
            passwordHash,
            name: 'Alex Morgan',
            title: 'Principal Software Architect & Enterprise Consultant',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            timezone: 'America/New_York',
            username: 'alex',
            bio: 'Helping high-growth SaaS and enterprise teams build resilient distributed architectures and scale engineering execution.',
        },
    });
    const sarah = await prisma.user.create({
        data: {
            email: 'sarah.jenkins@example.com',
            passwordHash,
            name: 'Sarah Jenkins',
            title: 'Senior Solutions Architect',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            timezone: 'America/New_York',
            username: 'sarah',
            bio: 'Cloud migration & Kubernetes infrastructure specialist.',
        },
    });
    const david = await prisma.user.create({
        data: {
            email: 'david.chen@example.com',
            passwordHash,
            name: 'David Chen',
            title: 'Performance & Database Specialist',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            timezone: 'Europe/London',
            username: 'david',
            bio: 'PostgreSQL, high-throughput caching, and query optimization.',
        },
    });
    // 2. Team
    const team = await prisma.team.create({
        data: {
            name: 'Apex Strategic Engineering',
            slug: 'apex-engineering',
            description: 'Full-stack distributed systems & strategic enterprise advisory.',
            avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
            members: {
                create: [
                    { userId: alex.id, role: 'owner' },
                    { userId: sarah.id, role: 'admin' },
                    { userId: david.id, role: 'member' },
                ],
            },
        },
    });
    // 3. Availability Schedules
    const defaultDays = [
        { dayOfWeek: 1, enabled: true, intervals: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
        { dayOfWeek: 2, enabled: true, intervals: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
        { dayOfWeek: 3, enabled: true, intervals: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
        { dayOfWeek: 4, enabled: true, intervals: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
        { dayOfWeek: 5, enabled: true, intervals: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '16:00' }] },
        { dayOfWeek: 6, enabled: false, intervals: [] },
        { dayOfWeek: 0, enabled: false, intervals: [] },
    ];
    await prisma.availabilitySchedule.create({
        data: {
            userId: alex.id,
            name: 'Working Hours (Default)',
            isDefault: true,
            timezone: 'America/New_York',
            daysJson: JSON.stringify(defaultDays),
            overridesJson: JSON.stringify([
                { date: '2026-11-26', enabled: false, intervals: [], reason: 'Thanksgiving Holiday' },
                { date: '2026-11-27', enabled: false, intervals: [], reason: 'Company Day Off' },
            ]),
            bufferNoticeMinutes: 60,
            maxDaysAhead: 60,
        },
    });
    // 4. Connected Calendars
    await prisma.connectedCalendar.createMany({
        data: [
            {
                userId: alex.id,
                provider: 'google',
                email: 'alex.morgan@gmail.com',
                isPrimary: true,
                checkConflicts: true,
                addEvents: true,
            },
            {
                userId: alex.id,
                provider: 'outlook',
                email: 'alex.morgan@enterprise-client.com',
                isPrimary: false,
                checkConflicts: true,
                addEvents: false,
            },
        ],
    });
    // 5. Event Types
    const evt15 = await prisma.eventType.create({
        data: {
            userId: alex.id,
            slug: '15min',
            name: '15-Minute Intro & Quick Sync',
            duration: 15,
            color: '#3b82f6',
            description: 'A quick informal sync to introduce yourself, discuss ideas, and identify immediate next steps.',
            locationType: 'google_meet',
            locationDetails: 'https://meet.google.com/abc-defg-hij',
            bufferBefore: 5,
            bufferAfter: 5,
            schedulingType: 'one_on_one',
            requiresPayment: false,
            price: 0,
            customQuestionsJson: JSON.stringify([
                { id: 'q1', label: 'Primary topic or objective', type: 'text', required: true },
            ]),
        },
    });
    const evt30 = await prisma.eventType.create({
        data: {
            userId: alex.id,
            slug: '30min',
            name: '30-Minute Discovery & Strategy Call',
            duration: 30,
            color: '#6366f1',
            description: 'Deep dive into your product requirements, architectural scope, and delivery milestones.',
            locationType: 'zoom',
            locationDetails: 'https://zoom.us/j/987654321',
            bufferBefore: 10,
            bufferAfter: 10,
            schedulingType: 'one_on_one',
            requiresPayment: true,
            price: 75.0,
            currency: 'USD',
            customQuestionsJson: JSON.stringify([
                { id: 'q1', label: 'Company or Project Name', type: 'text', required: true },
                { id: 'q2', label: 'Key deliverables or questions for this call', type: 'textarea', required: true },
                {
                    id: 'q3',
                    label: 'Current Stage',
                    type: 'select',
                    options: ['Idea / Concept', 'Active MVP in Development', 'Live in Production', 'Enterprise Scaling'],
                    required: false,
                },
            ]),
        },
    });
    const evt60 = await prisma.eventType.create({
        data: {
            userId: alex.id,
            teamId: team.id,
            slug: '60min-review',
            name: '60-Minute Technical Architecture Review',
            duration: 60,
            color: '#10b981',
            description: 'Comprehensive engineering or architecture review. Bring your repository, design doc, or live systems.',
            locationType: 'google_meet',
            locationDetails: 'https://meet.google.com/eng-arch-call',
            bufferBefore: 15,
            bufferAfter: 15,
            schedulingType: 'collective',
            requiresPayment: true,
            price: 250.0,
            currency: 'USD',
            customQuestionsJson: JSON.stringify([
                { id: 'q1', label: 'Repository or Architecture Spec URL', type: 'text', required: true },
                { id: 'q2', label: 'Key performance bottlenecks or security constraints', type: 'textarea', required: true },
            ]),
        },
    });
    const evtRoundRobin = await prisma.eventType.create({
        data: {
            teamId: team.id,
            slug: 'enterprise-advisory',
            name: '45-Minute Enterprise Solutions Advisory',
            duration: 45,
            color: '#ec4899',
            description: 'Strategic advisory with an Apex engineering architect assigned automatically via Round-Robin.',
            locationType: 'zoom',
            locationDetails: 'https://zoom.us/j/apex-advisory',
            bufferBefore: 10,
            bufferAfter: 10,
            schedulingType: 'round_robin',
            requiresPayment: true,
            price: 180.0,
            currency: 'USD',
            customQuestionsJson: JSON.stringify([
                { id: 'q1', label: 'Estimated Engineering Headcount', type: 'text', required: true },
                { id: 'q2', label: 'Target Launch Deadline', type: 'text', required: false },
            ]),
        },
    });
    // 6. Bookings with Payments and Follow-up Pipelines
    const now = new Date();
    // Booking 1: Upcoming scheduled call
    const start1 = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    start1.setHours(14, 0, 0, 0);
    const end1 = new Date(start1.getTime() + 30 * 60 * 1000);
    const bk1 = await prisma.booking.create({
        data: {
            eventTypeId: evt30.id,
            hostUserId: alex.id,
            inviteeName: 'Michael Scott',
            inviteeEmail: 'michael@dundermifflin.com',
            inviteeTimezone: 'America/New_York',
            startTime: start1,
            endTime: end1,
            location: 'https://zoom.us/j/987654321',
            status: 'scheduled',
            privateNotes: 'Referred by Scranton chamber of commerce. Interested in CRM automation.',
            customAnswersJson: JSON.stringify({
                q1: 'Dunder Mifflin Paper Co',
                q2: 'Automate order booking and delivery notifications',
                q3: 'Live in Production',
            }),
            followUps: {
                create: [
                    { type: 'confirmation', status: 'sent', sentAt: now },
                    { type: 'reminder_24h', status: 'pending', scheduledFor: new Date(start1.getTime() - 24 * 3600 * 1000) },
                    { type: 'reminder_1h', status: 'pending', scheduledFor: new Date(start1.getTime() - 3600 * 1000) },
                    { type: 'followup_post', status: 'pending', scheduledFor: new Date(end1.getTime() + 3600 * 1000) },
                ],
            },
            payment: {
                create: {
                    amount: 75.0,
                    currency: 'USD',
                    status: 'paid',
                    provider: 'stripe',
                    transactionId: 'ch_3N8mSc91kXz',
                    customerEmail: 'michael@dundermifflin.com',
                },
            },
        },
    });
    // Booking 2: Completed review
    const start2 = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    start2.setHours(16, 0, 0, 0);
    const end2 = new Date(start2.getTime() + 60 * 60 * 1000);
    const bk2 = await prisma.booking.create({
        data: {
            eventTypeId: evt60.id,
            hostUserId: alex.id,
            inviteeName: 'Elena Rostova',
            inviteeEmail: 'elena.r@quantumai.dev',
            inviteeTimezone: 'America/Los_Angeles',
            startTime: start2,
            endTime: end2,
            location: 'https://meet.google.com/eng-arch-call',
            status: 'completed',
            privateNotes: 'Completed review on distributed cache contention. Followed up with benchmark doc.',
            customAnswersJson: JSON.stringify({
                q1: 'https://github.com/example/quantum-pipeline',
                q2: 'Redis cluster lock contention under 50k req/sec',
            }),
            followUps: {
                create: [
                    { type: 'confirmation', status: 'sent', sentAt: start2 },
                    { type: 'reminder_24h', status: 'sent', sentAt: new Date(start2.getTime() - 24 * 3600 * 1000) },
                    { type: 'reminder_1h', status: 'sent', sentAt: new Date(start2.getTime() - 3600 * 1000) },
                    { type: 'followup_post', status: 'sent', sentAt: new Date(end2.getTime() + 3600 * 1000) },
                ],
            },
            payment: {
                create: {
                    amount: 250.0,
                    currency: 'USD',
                    status: 'paid',
                    provider: 'stripe',
                    transactionId: 'ch_3M9qEl20pRt',
                    customerEmail: 'elena.r@quantumai.dev',
                },
            },
        },
    });
    // 7. Contacts CRM
    await prisma.contact.create({
        data: {
            userId: alex.id,
            name: 'Michael Scott',
            email: 'michael@dundermifflin.com',
            timezone: 'America/New_York',
            phone: '+1 570-555-0199',
            tagsJson: JSON.stringify(['Enterprise', 'VIP', 'Paper-Industry']),
            totalBookings: 2,
            totalSpend: 150.0,
            lastMeetingAt: start1,
            notesJson: JSON.stringify([
                { id: 'n1', authorName: 'Alex Morgan', content: 'Very enthusiastic about automation. Prefers text/email updates.', createdAt: new Date().toISOString() },
            ]),
        },
    });
    await prisma.contact.create({
        data: {
            userId: alex.id,
            name: 'Elena Rostova',
            email: 'elena.r@quantumai.dev',
            timezone: 'America/Los_Angeles',
            phone: '+1 415-555-0142',
            tagsJson: JSON.stringify(['AI / ML', 'Enterprise', 'High-LTV']),
            totalBookings: 3,
            totalSpend: 750.0,
            lastMeetingAt: start2,
            notesJson: JSON.stringify([
                { id: 'n2', authorName: 'Alex Morgan', content: 'Architecture review passed successfully. Discussing Q1 retained advisory contract.', createdAt: new Date().toISOString() },
            ]),
        },
    });
    // 8. Routing Forms & Lead Qualification
    await prisma.routingForm.create({
        data: {
            userId: alex.id,
            title: 'Enterprise Inbound Solutions Qualifier',
            description: 'Help us match you with the right engineering practice lead based on team scale and architecture requirements.',
            isPublished: true,
            questionsJson: JSON.stringify([
                {
                    id: 'q_budget',
                    label: 'What is your approximate quarterly engineering consulting budget?',
                    type: 'select',
                    options: ['Under $5,000', '$5,000 - $15,000', '$15,000 - $50,000', '$50,000+'],
                    required: true,
                },
                {
                    id: 'q_scale',
                    label: 'Current monthly active users / traffic volume',
                    type: 'select',
                    options: ['Early Prototype (< 1k MAU)', 'Growth (10k - 100k MAU)', 'High-Scale (1M+ MAU)'],
                    required: true,
                },
            ]),
            rulesJson: JSON.stringify([
                {
                    id: 'r1',
                    fieldId: 'q_budget',
                    operator: 'equals',
                    value: '$50,000+',
                    action: 'route_to_event_type',
                    targetId: evtRoundRobin.id,
                },
                {
                    id: 'r2',
                    fieldId: 'q_budget',
                    operator: 'equals',
                    value: '$15,000 - $50,000',
                    action: 'route_to_event_type',
                    targetId: evt60.id,
                },
            ]),
            fallbackEventTypeId: evt30.id,
        },
    });
    // 9. Workflows
    await prisma.workflow.createMany({
        data: [
            {
                userId: alex.id,
                key: 'confirmation',
                title: 'Immediate Booking Confirmation',
                trigger: 'immediately_after_booking',
                channel: 'email',
                subject: 'Confirmed: {event_name} with {host_name} on {event_date}',
                body: 'Hi {invitee_name},\n\nYour meeting has been scheduled!\n\n📅 Date & Time: {event_date} at {event_time} ({invitee_timezone})\n📍 Location: {meeting_link}\n\nA calendar invite (.ics) is attached so you can add this directly to Google, Outlook, or Apple Calendar.\n\nNeed to reschedule?\n{reschedule_url}\n\nBest,\n{host_name}',
                isEnabled: true,
            },
            {
                userId: alex.id,
                key: 'reminder_24h',
                title: '24-Hour Advance Reminder',
                trigger: '24_hours_before',
                channel: 'email',
                subject: 'Reminder: {event_name} tomorrow at {event_time}',
                body: 'Hi {invitee_name},\n\nFriendly reminder about our call tomorrow:\n\n📅 {event_name}\n🕒 {event_date} at {event_time} ({invitee_timezone})\n🔗 Join Link: {meeting_link}\n\nSee you tomorrow!\n{host_name}',
                isEnabled: true,
            },
            {
                userId: alex.id,
                key: 'reminder_1h',
                title: '1-Hour Final Notice Reminder',
                trigger: '1_hour_before',
                channel: 'email',
                subject: 'Starting in 1 hour: {event_name}',
                body: 'Hi {invitee_name},\n\nOur call starts in 1 hour! Here is your access link:\n👉 {meeting_link}',
                isEnabled: true,
            },
            {
                userId: alex.id,
                key: 'followup_post',
                title: 'Post-Meeting Action Items',
                trigger: '1_hour_after',
                channel: 'email',
                subject: 'Thank you for meeting! Next steps from {host_name}',
                body: 'Hi {invitee_name},\n\nThank you for connecting today to discuss {event_name}!\n\nNext steps:\n1. Review the discussed architecture and action items.\n2. Feel free to reply directly to this thread with any additional thoughts.\n\nBest regards,\n{host_name}',
                isEnabled: true,
            },
        ],
    });
    // 10. Activity Logs
    await prisma.activityLog.createMany({
        data: [
            {
                userId: alex.id,
                bookingId: bk1.id,
                type: 'BOOKING_CREATED',
                recipient: 'michael@dundermifflin.com',
                description: 'New booking confirmed for 30-Minute Discovery & Strategy Call',
            },
            {
                userId: alex.id,
                bookingId: bk1.id,
                type: 'CONFIRMATION_SENT',
                recipient: 'michael@dundermifflin.com',
                description: 'Sent booking confirmation email with attached .ics calendar file',
            },
            {
                userId: alex.id,
                bookingId: bk2.id,
                type: 'FOLLOWUP_POST_SENT',
                recipient: 'elena.r@quantumai.dev',
                description: 'Post-meeting action items & feedback inquiry sent',
            },
        ],
    });
    console.log('✅ SQLite database seeded successfully with users, team, event types, bookings, CRM contacts, and workflows!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
