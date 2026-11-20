'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@calendly/types';
import { api } from '@/lib/api-client';
import {
  LayoutGrid,
  Calendar,
  Bell,
  Clock,
  Users,
  GitBranch,
  CreditCard,
  UserCheck,
  BarChart3,
  Sliders,
  Code2,
  ChevronDown,
  LucideIcon,
  ClipboardList,
  CalendarCheck,
  Link2,
  Home,
  LogOut,
  LogIn,
} from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number | null;
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  pendingFollowupCount: number;
  onOpenShareLinks?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  allUsers,
  onSwitchUser,
  pendingFollowupCount,
  onOpenShareLinks,
}) => {
  const router = useRouter();

  const handleLogout = () => {
    api.logout();
    router.push('/login');
  };
  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Event Types', icon: LayoutGrid },
    {
      id: 'followups',
      label: 'Appointments',
      icon: CalendarCheck,
      badge: pendingFollowupCount > 0 ? pendingFollowupCount : null,
    },
    { id: 'booking', label: 'Booking Wizard', icon: Calendar },
    { id: 'forms', label: 'Custom Forms', icon: ClipboardList },
    { id: 'availability', label: 'Availability', icon: Clock },
    // { id: 'teams', label: 'Teams', icon: Users },
    // { id: 'routing', label: 'Routing Forms', icon: GitBranch },
    // { id: 'crm', label: 'CRM Contacts', icon: UserCheck },
    // { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    // { id: 'workflows', label: 'Workflows', icon: Sliders },
    { id: 'embed', label: 'Embed & Share', icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Container */}
        <Link href="/" className="flex items-center gap-3 group transition" title="Go to Home Page">
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
              <span className="font-extrabold tracking-tight text-slate-900 text-base">Calendly</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Full-Stack Scheduling & Lead Routing Platform</p>
          </div>
        </Link>

        {/* Quick Actions & User Switcher */}
        <div className="flex items-center gap-2">
          {/* Link back to Home Landing Page */}
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition active:scale-95"
            title="View Product Home & Features"
          >
            <Home className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline">Home</span>
          </Link>

          {onOpenShareLinks && (
            <button
              type="button"
              onClick={onOpenShareLinks}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 transition active:scale-95"
              title="Share public booking links for free slots by purpose or event type"
            >
              <Link2 className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Share Links</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 pl-2 pr-2 py-1 shadow-xs">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-7 w-7 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-2 ring-white">
                  {(currentUser.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-none">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 leading-none font-medium">@{currentUser.username}</span>
              </div>

              {/* User Switcher Dropdown */}
              {allUsers.length > 1 && (
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const u = allUsers.find((x) => x.id === e.target.value);
                    if (u) onSwitchUser(u);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-xs cursor-pointer focus:outline-none"
                  title="Switch user account"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Log In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                        isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
