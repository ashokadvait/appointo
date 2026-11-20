# Calendly Enterprise: Full-Stack Monorepo

An enterprise-grade, customizable scheduling engine and lead qualification platform inspired by [Calendly](https://calendly.com/), re-architected with a **dedicated Express + TypeScript API**, **Prisma ORM with SQLite**, and **Next.js 14 App Router** styled with **Tailwind CSS v3**.

---

## 🏛️ System Architecture

```
calendly-clone/
├── package.json                         # Root workspaces & concurrently runner
├── apps/
│   ├── api/                             # Dedicated Express.js + TypeScript Backend (Port 4000)
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # Prisma schema (SQLite: dev.db)
│   │   │   └── seed.ts                  # Enterprise database seed script
│   │   ├── src/
│   │   │   ├── app.ts                   # Express app factory (CORS, JSON, routes)
│   │   │   ├── index.ts                 # Server entrypoint
│   │   │   ├── prisma.ts                # PrismaClient singleton
│   │   │   ├── middleware/              # JWT auth & demo fallbacks
│   │   │   ├── controllers/             # 11 Modular enterprise controllers
│   │   │   └── routes/                  # Express REST API master router
│   │   └── package.json
│   └── web/                             # Next.js 14 App Router Frontend (Port 3000)
│       ├── src/
│       │   ├── app/                     # Layout, globals.css, pages, public book portals
│       │   ├── components/              # 11 Module UI components (Tailwind v3)
│       │   └── lib/                     # Typed API client & formatting utilities
│       ├── next.config.mjs              # /api/* proxy rewrites to localhost:4000
│       └── tailwind.config.ts           # Custom Tailwind theme
└── packages/
    ├── types/                           # Shared TypeScript domain models
    └── core/                            # Pure domain algorithms (slots, ICS, follow-ups)
```

---

## 🌟 The 11 Enterprise Modules

| # | Module | Priority | Capabilities |
| :--- | :--- | :--- | :--- |
| **1** | **Authentication & User Profiles** | Must have | Multi-user support with JWT authentication, password hashing, user profiles (name, avatar, timezone, public handle `/alex`, bio), and 1-click demo user switcher. |
| **2** | **Calendar Integration & Availability** | Must have | Weekly availability schedules with multiple time intervals per day (e.g. 09:00–12:00, 13:00–17:00), date-specific overrides (vacation/blackouts), and connected Google/Outlook conflict checking. |
| **3** | **Event Type Management** | Must have | 1-on-1, Group, Round-Robin, and Collective meetings with custom URLs, duration options, location links, buffer times, privacy toggles, and dynamic intake question builder. |
| **4** | **Booking Page & Booking Engine** | Must have | Public client booking portals (`/book` and `/book/[slug]`), auto timezone detection & switcher, dynamic slot calculator intersecting working hours, notice buffers, and active bookings. |
| **5** | **Appointment Management** | Must have | Lifecycle status tracking (Scheduled, Completed, Cancelled, Rescheduled, No-Show), rescheduling with token and slot recalculation, cancellation with reason, private notes, and RFC 5545 `.ics` export. |
| **6** | **Email & Notification Automation** | Must have | 4-stage automated follow-up engine (Immediate Confirmation, 24h Advance Notice, 1h Urgent Call, Post-Meeting Action Items), workflow template editor with `{event_name}`, `{invitee_name}`, `{meeting_link}` variables, and webhook forwarder. |
| **7** | **Team & Employee Management** | High | Organization & Team creation, member roles (Owner, Admin, Member), Round-Robin distribution, and Collective meeting synchronization across team calendars. |
| **8** | **Routing Forms & Lead Qualification** | High | Conditional screening forms (e.g. Budget, Company Scale, Urgency) with rule evaluation engine that dynamically redirects qualified leads to specific event types or senior consultants, with a live interactive simulator. |
| **9** | **Payments & Subscriptions** | High | Paid event types (price, currency: USD, EUR, GBP, INR), mock Stripe checkout session generator, transactions ledger, and 1-click refund processing. |
| **10** | **CRM & Contacts Directory** | High | Directory of all attendees/leads, lifetime booking counts, lifetime spend/revenue, tags (`#VIP`, `#Enterprise`), past meeting timeline, and internal host notes feed. |
| **11** | **Analytics & Reporting** | Medium | Conversion & completion rate KPIs, cancellation & no-show rates, gross revenue metrics, popular days distribution chart, top performing event types, and team member workload distribution. |

---

## 🚀 Quick Start

### 1. Install Dependencies & Prepare Database
```bash
# Install monorepo dependencies
npm install

# Push Prisma schema to SQLite (dev.db)
npm run prisma:push

# Seed database with rich enterprise demo data
npm run prisma:seed
```

### 2. Run Both Backend & Frontend
```bash
npm run dev
```

- **Next.js Web Frontend**: [http://localhost:3000](http://localhost:3000)
- **Dedicated Express API**: [http://localhost:4000](http://localhost:4000)
- **API Healthcheck**: [http://localhost:4000/health](http://localhost:4000/health)
- **Public Booking View**: [http://localhost:3000/book](http://localhost:3000/book)
