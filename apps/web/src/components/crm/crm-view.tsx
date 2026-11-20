'use client';

import React, { useState } from 'react';
import { Contact } from '@calendly/types';
import { api } from '@/lib/api-client';
import { useDialog } from '@/components/ui/dialog-provider';
import { Users, Search, Mail, Phone, Calendar, DollarSign, Tag, Plus, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CRMViewProps {
  contacts: Contact[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

export const CRMView: React.FC<CRMViewProps> = ({ contacts, onRefresh, onNotify }) => {
  const { showAlert, showToast } = useDialog();
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    contacts.length > 0 ? contacts[0] : null
  );
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newNote.trim()) return;

    setAddingNote(true);
    try {
      const updated = await api.addContactNote(selectedContact.id, newNote);
      setSelectedContact(updated);
      setNewNote('');
      showToast('Note added to contact profile', 'success');
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Error Adding Note',
        message: err.message || 'Failed to add note',
        type: 'error',
      });
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              CRM & Invitee Directory
            </h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              Client Insights
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Track all client interactions, lifetime meeting volume, revenue, tags, and private preparation notes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts, tags, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contacts Directory List */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Contacts ({filteredContacts.length})
          </span>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredContacts.map((c) => {
              const isSelected = selectedContact?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-blue-500 bg-white shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      <span className="text-xs text-slate-500 block truncate">{c.email}</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {c.totalBookings} {c.totalBookings === 1 ? 'call' : 'calls'}
                    </span>
                  </div>

                  {c.tags && c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}

            {filteredContacts.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                No contacts found matching &quot;{search}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Contact Detail View */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-5 gap-3">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{selectedContact.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {selectedContact.email}
                    </span>
                    {selectedContact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {selectedContact.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Lifetime Spend
                    </span>
                    <span className="text-base font-extrabold text-emerald-600">
                      ${selectedContact.totalSpend.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Total Bookings
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {selectedContact.totalBookings}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Contact Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedContact.tags?.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Private Notes Feed */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Host Private Notes
                  </h4>
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an internal note about client requirements, background..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={addingNote || !newNote.trim()}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </form>

                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {selectedContact.notes?.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200/60 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700">{n.authorName}</span>
                        <span>{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{n.content}</p>
                    </div>
                  ))}

                  {(!selectedContact.notes || selectedContact.notes.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No notes recorded for this contact.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              Select a contact to view meeting history and notes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
