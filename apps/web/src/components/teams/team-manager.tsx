'use client';

import React, { useState } from 'react';
import { Team, User } from '@calendly/types';
import { api } from '@/lib/api-client';
import { useDialog } from '@/components/ui/dialog-provider';
import { Users, UserPlus, Shield, Crown, Globe, Mail, Sparkles, Trash2, ArrowRight } from 'lucide-react';

interface TeamManagerProps {
  teams: Team[];
  allUsers: User[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  teams,
  allUsers,
  onRefresh,
  onNotify,
}) => {
  const { showAlert, showConfirm, showToast } = useDialog();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(
    teams.length > 0 ? teams[0] : null
  );

  // New Team Modal
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // Add Member State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;
    try {
      const created = await api.createTeam({ name: teamName, description: teamDesc });
      onNotify(`Team "${created.name}" created successfully!`);
      setTeamName('');
      setTeamDesc('');
      setShowCreateTeam(false);
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Team Creation Failed',
        message: err.message || 'Failed to create team',
        type: 'error',
      });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedUserId) return;
    try {
      await api.addTeamMember(selectedTeam.id, selectedUserId, selectedRole);
      showToast('Team member added successfully', 'success');
      setSelectedUserId('');
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Add Member Failed',
        message: err.message || 'Failed to add team member',
        type: 'error',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;
    const confirmed = await showConfirm({
      title: 'Remove Team Member?',
      message: 'Are you sure you want to remove this member from the team? They will no longer receive team event bookings.',
      confirmText: 'Remove Member',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.removeTeamMember(selectedTeam.id, memberId);
      showToast('Member removed from team', 'success');
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Removal Failed',
        message: err.message || 'Failed to remove member',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Team & Employee Management
            </h2>
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
              Round-Robin & Collective
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Distribute meetings evenly across team consultants (Round-Robin) or require all members to attend (Collective).
          </p>
        </div>

        <button
          onClick={() => setShowCreateTeam(true)}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>New Team</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Teams List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Your Organizations ({teams.length})
          </span>

          <div className="space-y-2">
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedTeam?.id === t.id
                    ? 'border-purple-500 bg-white shadow-md ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80'}
                    alt={t.name}
                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{t.name}</h3>
                    <span className="text-xs text-slate-400">
                      {t.members?.length || 0} members &bull; /{t.slug}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Add Member Box */}
          {selectedTeam && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Add Team Member
              </span>
              <form onSubmit={handleAddMember} className="space-y-3">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800"
                  required
                >
                  <option value="">Select a user...</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  type="submit"
                  disabled={!selectedUserId}
                  className="w-full rounded-xl bg-purple-50 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition disabled:opacity-50"
                >
                  + Add to Team
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Team Members Details */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {selectedTeam ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{selectedTeam.name}</h3>
                  <p className="text-xs text-slate-500">{selectedTeam.description}</p>
                </div>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-mono font-bold text-purple-700 border border-purple-200">
                  Slug: /{selectedTeam.slug}
                </span>
              </div>

              {/* Members Grid */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Team Members ({selectedTeam.members?.length || 0})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTeam.members?.map((m) => {
                    const u = m.user || allUsers.find((x) => x.id === m.userId);
                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex items-center justify-between gap-3 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={u?.name || 'Member'}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">{u?.name}</span>
                              {m.role === 'owner' ? (
                                <Crown className="h-3 w-3 text-amber-500" />
                              ) : m.role === 'admin' ? (
                                <Shield className="h-3 w-3 text-purple-600" />
                              ) : null}
                            </div>
                            <span className="block text-[11px] text-slate-500 truncate">{u?.email}</span>
                            <span className="block text-[10px] text-slate-400 capitalize">{m.role}</span>
                          </div>
                        </div>

                        {m.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scheduling Distribution Info */}
              <div className="rounded-2xl bg-purple-50/50 border border-purple-100 p-5 space-y-2">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Team Scheduling Distribution Capabilities
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When you configure an event type under this team, choose between:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="rounded-xl bg-white p-3 border border-purple-100">
                    <span className="font-bold text-slate-900 block mb-1">Round-Robin</span>
                    <span className="text-slate-500">
                      Automatically cycles inbound appointments to available members based on booking count to balance workload evenly.
                    </span>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-purple-100">
                    <span className="font-bold text-slate-900 block mb-1">Collective Meetings</span>
                    <span className="text-slate-500">
                      Calculates the intersection of all team members&apos; schedules. Only offers slots where all required hosts are free.
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Select or create a team to manage members and scheduling distribution.
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Solutions Practice"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief team purpose..."
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-md"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
