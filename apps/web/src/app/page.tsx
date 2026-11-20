'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Globe,
  Users,
  Zap,
  CreditCard,
  Link2,
  Star,
  ChevronDown,
  ChevronUp,
  Play,
  Layers,
  MessageSquare,
  BarChart3,
  Sliders,
  Code2,
  Laptop,
  Building2,
  CheckCircle,
  CalendarCheck,
  Award,
  Lock,
  Headphones,
  Compass,
  ArrowUpRight,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnualBilling, setIsAnnualBilling] = useState(true);
  const [activePersona, setActivePersona] = useState<'sales' | 'recruiting' | 'consulting' | 'engineering'>('sales');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // User state if already logged in
  const [storedUser, setStoredUser] = useState<any>(null);

  // Interactive Scheduler Demo State
  const [selectedEventTypeIndex, setSelectedEventTypeIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState('2026-11-10');
  const [selectedSlot, setSelectedSlot] = useState<string | null>('10:00 AM');
  const [isDemoBooked, setIsDemoBooked] = useState(false);

  useEffect(() => {
    const user = api.getStoredUser();
    if (user) setStoredUser(user);
  }, []);

  const sampleEventTypes = [
    {
      id: '1',
      title: '30-Min Strategy Consultation',
      duration: 30,
      description: 'Quick discovery conversation to evaluate architecture requirements and growth bottlenecks.',
      tag: 'Most Popular',
      color: 'from-blue-600 to-indigo-600',
      price: 'Free',
    },
    {
      id: '2',
      title: '45-Min Enterprise Product Demo',
      duration: 45,
      description: 'Tailored walk-through of advanced routing forms, multi-calendar sync, and automated workflows.',
      tag: 'Sales & Teams',
      color: 'from-purple-600 to-pink-600',
      price: 'Free',
    },
    {
      id: '3',
      title: '60-Min Architecture Advisory',
      duration: 60,
      description: 'Deep-dive session to review technical roadmaps, database optimization, and high-concurrency systems.',
      tag: 'Paid Consulting',
      color: 'from-emerald-600 to-teal-600',
      price: '$250',
    },
  ];

  const sampleSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:30 AM',
    '02:00 PM',
    '03:30 PM',
    '05:00 PM',
  ];

  const datesList = [
    { day: 'Mon', date: 'Nov 10', val: '2026-11-10', available: true },
    { day: 'Tue', date: 'Nov 11', val: '2026-11-11', available: true },
    { day: 'Wed', date: 'Nov 12', val: '2026-11-12', available: true },
    { day: 'Thu', date: 'Nov 13', val: '2026-11-13', available: true },
    { day: 'Fri', date: 'Nov 14', val: '2026-11-14', available: true },
  ];

  const handleTestBooking = () => {
    setIsDemoBooked(true);
    setTimeout(() => {
      // Give feedback and guide user to dashboard
    }, 2000);
  };

  const faqs = [
    {
      q: 'How does Calendly prevent double bookings?',
      a: 'Calendly syncs seamlessly with Google Calendar, Microsoft Outlook, Office 365, and Apple iCloud in real time. Whenever a new event is added to any of your connected calendars, those slots are instantly blocked across all your scheduling links to guarantee zero overlaps.',
    },
    {
      q: 'Can I ask qualifying questions before a meeting is confirmed?',
      a: 'Yes! With custom lead qualification forms, you can require invitees to specify their company name, team size, budget, or upload documents before securing a time on your calendar. You can even route them to specific event types based on their answers.',
    },
    {
      q: 'How do automated follow-up workflows work?',
      a: 'Calendly automates your entire meeting lifecycle: instant calendar ICS invites, SMS & email reminders 24 hours and 1 hour before the call to eliminate no-shows, and automated post-meeting survey or thank-you follow-ups.',
    },
    {
      q: 'Can I collect payments for bookings?',
      a: 'Yes. With built-in Stripe payment integration, you can charge fixed rates or require upfront deposits before an appointment can be booked on your calendar.',
    },
    {
      q: 'Is there a free trial or free forever plan?',
      a: 'Absolutely! Our Free Forever tier lets you connect 1 calendar and accept unlimited 1-on-1 bookings. You can upgrade to Standard or Teams anytime as your scheduling requirements grow.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>New: Custom Lead Qualification Forms & Automated 4-Stage Follow-Ups are live!</span>
        <Link
          href="/dashboard"
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-white/30 transition backdrop-blur-xs"
        >
          Explore in Dashboard
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 2. MAIN HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white group-hover:scale-105 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 text-lg">Calendly</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#interactive-demo" className="hover:text-blue-600 transition">Live Demo</a>
            <a href="#solutions" className="hover:text-blue-600 transition">Solutions</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
            <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {storedUser ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
              >
                <span>Dashboard ({storedUser.name.split(' ')[0]})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition shadow-2xs"
                >
                  Open Dashboard
                </Link>
                <Link
                  href="/login?tab=register"
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#interactive-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-blue-600"
            >
              Live Demo
            </a>
            <a
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-blue-600"
            >
              Solutions
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-blue-600"
            >
              Pricing
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="w-full text-center py-2 text-xs font-bold text-white bg-blue-600 rounded-xl"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/30">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-200/30 via-indigo-100/20 to-sky-100/30 blur-3xl pointer-events-none -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-blue-700 mb-6 shadow-2xs animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>The Modern Scheduling Platform That Eliminates Email Friction</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
            Easy scheduling ahead. Turn meetings into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              momentum.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Calendly is your hub for scheduling meetings professionally. Connect your calendar,
            share your custom link, qualify prospects with forms, and let clients pick open times in seconds.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/login?tab=register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-xl active:scale-95 transition"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition"
            >
              <CalendarCheck className="h-4 w-4 text-blue-600" />
              <span>Launch Dashboard</span>
            </Link>
          </div>

          {/* Micro Assurance */}
          <p className="mt-4 text-xs text-slate-500 font-medium">
            Free forever plan • No credit card required • Connects with Google, Outlook & Apple Calendar
          </p>

          {/* Key Stat Cards Ribbon */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-xs">
              <span className="block text-2xl md:text-3xl font-black text-slate-900">20M+</span>
              <span className="text-xs font-semibold text-slate-500">Active Professionals</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-xs">
              <span className="block text-2xl md:text-3xl font-black text-blue-600">85%</span>
              <span className="text-xs font-semibold text-slate-500">Less Time Scheduling</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-xs">
              <span className="block text-2xl md:text-3xl font-black text-indigo-600">4-Stage</span>
              <span className="text-xs font-semibold text-slate-500">Follow-Up Workflows</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-xs">
              <span className="block text-2xl md:text-3xl font-black text-emerald-600">99.99%</span>
              <span className="text-xs font-semibold text-slate-500">Enterprise Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE SCHEDULER DEMO WIDGET */}
      <section id="interactive-demo" className="py-16 bg-slate-50 border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Live Product Experience
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-3">
              Experience the booking flow your clients will love
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Select an event type, pick a day, choose a slot, and see how friction-free Calendly scheduling is.
            </p>
          </div>

          {/* Interactive Scheduling Card Container */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
            {/* Top Bar of Card */}
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Alex Morgan"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-xs"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">Alex Morgan</h4>
                  <p className="text-xs text-slate-500 font-medium">Principal Software Architect • calendly.com/alex</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Calendar Synced • Free Slots Available</span>
              </div>
            </div>

            {/* Body of Demo Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Column 1: Event Type Selector (5 cols) */}
              <div className="md:col-span-5 p-6 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  1. Select Meeting Type
                </span>
                <div className="space-y-2.5">
                  {sampleEventTypes.map((et, index) => {
                    const isSelected = selectedEventTypeIndex === index;
                    return (
                      <button
                        key={et.id}
                        type="button"
                        onClick={() => {
                          setSelectedEventTypeIndex(index);
                          setIsDemoBooked(false);
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                            {et.tag}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">{et.price}</span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-900 leading-snug">{et.title}</h5>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-medium">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{et.duration} mins</span>
                          <span>•</span>
                          <span>Google Meet / Zoom</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Date & Slots (7 cols) */}
              <div className="md:col-span-7 p-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  2. Select Date & Time Slot
                </span>

                {/* Days Tabs */}
                <div className="grid grid-cols-5 gap-1.5 mb-5">
                  {datesList.map((d) => {
                    const isSel = selectedDate === d.val;
                    return (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d.val);
                          setIsDemoBooked(false);
                        }}
                        className={`p-2.5 rounded-xl text-center border transition-all ${
                          isSel
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <span className={`block text-[10px] font-bold uppercase ${isSel ? 'text-blue-100' : 'text-slate-400'}`}>
                          {d.day}
                        </span>
                        <span className="block text-xs font-black mt-0.5">{d.date.split(' ')[1]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Slots Grid */}
                <span className="text-xs font-bold text-slate-700 block mb-2">Available Slots (Eastern Time):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sampleSlots.map((slot) => {
                    const isSel = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setIsDemoBooked(false);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          isSel
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {/* Action button */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  {isDemoBooked ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 animate-fade-in text-center">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white mb-2">
                        <Check className="h-5 w-5" />
                      </div>
                      <h4 className="text-xs font-extrabold">Appointment Confirmed!</h4>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {sampleEventTypes[selectedEventTypeIndex].title} booked for {selectedDate} at {selectedSlot}.
                        Calendar invites & email reminders dispatched.
                      </p>
                      <Link
                        href="/dashboard"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        View Bookings in Dashboard
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTestBooking}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
                    >
                      <span>Confirm Demo Booking ({selectedSlot})</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BRAND SOCIAL PROOF LOGOS */}
      <section className="py-12 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Trusted by teams at 100,000+ top high-growth companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-1.5">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M6 2l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zm12 0l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4z"/></svg>
              Dropbox
            </span>
            <span className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-1.5">
              <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              Zendesk
            </span>
            <span className="text-xl font-black tracking-tight text-slate-800">
              <span className="text-red-500">e</span><span className="text-blue-500">b</span><span className="text-yellow-500">a</span><span className="text-green-500">y</span>
            </span>
            <span className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-1.5">
              <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              Bitly
            </span>
            <span className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-1.5">
              <Compass className="h-5 w-5 text-indigo-600" />
              Compass
            </span>
            <span className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="h-5 w-5 text-red-500" />
              Twilio
            </span>
          </div>
        </div>
      </section>

      {/* 6. KEY FEATURES GRID */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Full-Stack Scheduling Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-3">
              Everything you need to automate your appointment lifecycle
            </h2>
            <p className="text-base text-slate-600 mt-2">
              From lead intake to automated reminders and post-meeting follow-ups, Calendly handles every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition group">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Multi-Calendar Conflict Detection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your work and personal Google, Outlook, Office 365, or iCloud calendars. Free/busy slots are evaluated dynamically so you are never double-booked.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition group">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Automated 4-Stage Follow-Ups</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Slash no-shows by up to 80% with automated confirmation emails, calendar invite attachments (.ics), 24h & 1h SMS reminders, and post-call feedback requests.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition group">
              <div className="h-11 w-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Custom Lead Qualification Forms</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Build questions with text, radio, dropdowns, and file uploads. Qualify high-intent enterprise prospects before they book on your calendar.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition group">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Round-Robin & Collective Routing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Distribute inbound leads evenly across sales reps with round-robin matching, or find overlapping availability across 5+ team members for collective demos.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition group">
              <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Built-in Stripe Payments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Charge for consultations, mentoring sessions, or expert advisory calls. Accept credit cards and deposits seamlessly before calendar slots are held.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition group">
              <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Embed Anywhere & Share Links</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Embed your scheduling widget inline on Webflow, WordPress, React, or Shopify. Or copy single-purpose links for email signatures and LinkedIn bios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS (3 STEPS) */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Simple 3-Step Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-3">
              How Calendly works for you
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Start scheduling seamlessly in fewer than two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-sm mb-4 shadow-md shadow-blue-500/20">
                1
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Set Your Availability</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tell Calendly your working hours, preferred buffers between meetings, and daily limits. We automatically block off already-busy calendar blocks.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-sm mb-4 shadow-md shadow-indigo-500/20">
                2
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Share Your Link</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send your personalized Calendly link via email, message, or embed the booking scheduler directly on your landing page.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white font-black text-sm mb-4 shadow-md shadow-purple-500/20">
                3
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Get Booked & Relax</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Attendees pick a convenient time. Events sync to both parties&apos; calendars with meeting video links (Google Meet, Zoom) and automated reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SOLUTIONS BY ROLE SECTION */}
      <section id="solutions" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Tailored Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-3">
              Built for every team and workflow
            </h2>
          </div>

          {/* Persona Tabs */}
          <div className="flex justify-center mb-8 overflow-x-auto no-scrollbar">
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              {[
                { id: 'sales', label: 'Sales & Revenue' },
                { id: 'recruiting', label: 'Recruiting & Talent' },
                { id: 'consulting', label: 'Consultants & Agencies' },
                { id: 'engineering', label: 'Engineering Leaders' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePersona(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activePersona === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Card Content */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            {activePersona === 'sales' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Accelerate Pipeline</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">Book demos while buyer intent is at its peak</h3>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Embed Calendly directly on your marketing site. Qualify leads by company size and budget, then instantly route them to the right account executive.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-medium text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Round-robin lead distribution across sales reps
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Automated 24h & 1h SMS reminders to eliminate demo no-shows
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Syncs with Salesforce, HubSpot, and CRM contacts
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 p-6 flex flex-col justify-center items-center text-center">
                  <span className="text-4xl font-black text-blue-600">+42%</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">Inbound Demo Conversion</span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    &quot;Our sales reps stopped wasting 3 hours a day sending availability emails. Prospects pick a time and show up.&quot;
                  </p>
                </div>
              </div>
            )}

            {activePersona === 'recruiting' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Candidate Experience</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">Screen top candidates 3x faster</h3>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Give candidates a premium interview scheduling experience. Match availability across panel interviewers without manual cross-referencing.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-medium text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Collective availability matching for panel interviews
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Resume & portfolio upload inside custom forms
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Automatic timezone adjustment for remote candidates
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-gradient-to-tr from-purple-50 to-pink-50 border border-purple-100 p-6 flex flex-col justify-center items-center text-center">
                  <span className="text-4xl font-black text-purple-600">3.2x</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">Faster Time-to-Offer</span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    &quot;Our hiring managers love the collective calendar matching. It made our interview coordination seamless.&quot;
                  </p>
                </div>
              </div>
            )}

            {activePersona === 'consulting' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Monetize Your Time</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">Collect payments and protect focus hours</h3>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Turn your calendar into a revenue channel. Collect upfront consulting retainers via Stripe before any appointment is held.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-medium text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Built-in Stripe checkout for paid consultations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Configurable buffer times before and after appointments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Automated invoice & calendar invite delivery
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 p-6 flex flex-col justify-center items-center text-center">
                  <span className="text-4xl font-black text-emerald-600">$0</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">Unpaid No-Shows</span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    &quot;I charge $250 for advisory calls. Calendly collects payment before the meeting is confirmed. It completely transformed my practice.&quot;
                  </p>
                </div>
              </div>
            )}

            {activePersona === 'engineering' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Deep Work Protection</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">Shield your focus blocks and prevent burnout</h3>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Never get interrupted during deep coding sessions again. Set maximum daily meeting counts and minimum 24-hour notice periods.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-medium text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Daily meeting caps (e.g. max 3 calls/day)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Minimum scheduling notice to prevent sudden calendar hijacking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Strict buffer windows between back-to-back reviews
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-gradient-to-tr from-slate-100 to-blue-50 border border-slate-200 p-6 flex flex-col justify-center items-center text-center">
                  <span className="text-4xl font-black text-slate-800">4.5 hrs</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">Daily Protected Deep Work</span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    &quot;Calendly ensures meetings only cluster on my designated afternoons, leaving my mornings pristine for architecture work.&quot;
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. PRICING SECTION */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-3">
              Plans that scale with your schedule
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Start with our free forever plan and upgrade as your team grows.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${!isAnnualBilling ? 'text-slate-900' : 'text-slate-500'}`}>
                Billed Monthly
              </span>
              <button
                type="button"
                onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAnnualBilling ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAnnualBilling ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ${isAnnualBilling ? 'text-slate-900' : 'text-slate-500'} flex items-center gap-1.5`}>
                Billed Annually
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Plan 1: Free */}
            <div className="rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Free</h3>
                <p className="text-xs text-slate-500 mt-1">For individuals getting started</p>
                <div className="my-5">
                  <span className="text-3xl font-black text-slate-900">$0</span>
                  <span className="text-xs text-slate-400 font-medium"> / forever</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>1 Event Type</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Unlimited 1-on-1 bookings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Google Calendar & Outlook sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Confirmation notifications</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/login?tab=register"
                className="mt-6 w-full text-center py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Sign Up Free
              </Link>
            </div>

            {/* Plan 2: Standard */}
            <div className="rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Standard</h3>
                <p className="text-xs text-slate-500 mt-1">For professionals needing versatility</p>
                <div className="my-5">
                  <span className="text-3xl font-black text-slate-900">
                    {isAnnualBilling ? '$10' : '$12'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium"> / seat / mo</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Unlimited event types</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Automated email reminders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Multiple calendars per user</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Custom brand colors & styling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Stripe & PayPal payment collection</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/login?tab=register"
                className="mt-6 w-full text-center py-2.5 rounded-xl border border-blue-600 bg-white text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
              >
                Start 14-Day Trial
              </Link>
            </div>

            {/* Plan 3: Teams (POPULAR) */}
            <div className="rounded-3xl border-2 border-blue-600 p-6 flex flex-col justify-between bg-blue-50/20 shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                Most Popular
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Teams</h3>
                <p className="text-xs text-slate-500 mt-1">For sales, recruiting & engineering teams</p>
                <div className="my-5">
                  <span className="text-3xl font-black text-blue-600">
                    {isAnnualBilling ? '$16' : '$20'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium"> / seat / mo</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Everything in Standard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Round-robin meeting routing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Collective multi-host availability</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Custom lead qualification forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>SMS reminders & 4-stage follow-ups</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/login?tab=register"
                className="mt-6 w-full text-center py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                Try Teams Free
              </Link>
            </div>

            {/* Plan 4: Enterprise */}
            <div className="rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">For organizations requiring strict security</p>
                <div className="my-5">
                  <span className="text-3xl font-black text-slate-900">Custom</span>
                  <span className="text-xs text-slate-400 font-medium"> / contract</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>SAML Single Sign-On (SSO)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>SCIM automated user provisioning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Audit logs & compliance exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Dedicated customer success manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>99.99% guaranteed SLA</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="mt-6 w-full text-center py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ ACCORDION */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-3">
              Got questions? We have answers.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. BOTTOM CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to reclaim your calendar and schedule without the back-and-forth?
          </h2>
          <p className="mt-4 text-base text-blue-100 max-w-xl mx-auto">
            Join over 20 million professionals who schedule meetings faster with Calendly. Setup takes less than 2 minutes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/login?tab=register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-blue-700 shadow-xl hover:bg-blue-50 active:scale-95 transition"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-xs px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 active:scale-95 transition"
            >
              <Calendar className="h-4 w-4" />
              <span>Launch Dashboard</span>
            </Link>
          </div>

          <p className="mt-4 text-xs text-blue-200 font-medium">
            No credit card required • Cancel anytime • 100% free plan available
          </p>
        </div>
      </section>

      {/* 12. COMPREHENSIVE FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 text-white mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <span className="text-lg font-black text-white">Calendly</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
                The enterprise-grade scheduling automation platform that eliminates back-and-forth emails. Designed for high-velocity teams and independent professionals.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational (99.99%)</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#interactive-demo" className="hover:text-white transition">Live Demo</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing Plans</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Web App Dashboard</Link></li>
                <li><Link href="/login" className="hover:text-white transition">User Sign In</Link></li>
              </ul>
            </div>

            {/* Col 3: Solutions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Solutions</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#solutions" className="hover:text-white transition">Sales & Revenue</a></li>
                <li><a href="#solutions" className="hover:text-white transition">Recruiting & HR</a></li>
                <li><a href="#solutions" className="hover:text-white transition">Consultants & Agencies</a></li>
                <li><a href="#solutions" className="hover:text-white transition">Engineering Leaders</a></li>
              </ul>
            </div>

            {/* Col 4: Trust & Compliance */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Security & Trust</h4>
              <ul className="space-y-2 text-xs">
                <li><span className="text-slate-400">SOC2 Type II Certified</span></li>
                <li><span className="text-slate-400">GDPR & CCPA Compliant</span></li>
                <li><span className="text-slate-400">256-Bit SSL Encryption</span></li>
                <li><span className="text-slate-400">Google & Microsoft Verified</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 Calendly Clone Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:text-slate-400 transition">Privacy Notice</Link>
              <Link href="/" className="hover:text-slate-400 transition">Terms of Service</Link>
              <Link href="/" className="hover:text-slate-400 transition">Security Policy</Link>
              <Link href="/dashboard" className="hover:text-slate-400 transition">Go to App</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
