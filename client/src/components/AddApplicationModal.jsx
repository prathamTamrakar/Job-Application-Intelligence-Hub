import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../utils/api';

const AddApplicationModal = ({ isOpen, onClose, onAddSuccess }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().split('T')[0]);
  const [resumeVersion, setResumeVersion] = useState('Default');
  const [status, setStatus] = useState('Applied');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !role) {
      setErrorMsg('Company and Role are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/applications', {
        company,
        role,
        jobLink,
        dateApplied,
        resumeVersion,
        status,
        notes,
      });

      if (res.data && res.data.success) {
        // Reset form
        setCompany('');
        setRole('');
        setJobLink('');
        setDateApplied(new Date().toISOString().split('T')[0]);
        setResumeVersion('Default');
        setStatus('Applied');
        setNotes('');
        onAddSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div class="w-full max-w-2xl bg-darkCard border border-darkBorder rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-darkBorder">
          <h3 class="text-xl font-semibold text-white">Log Job Application</h3>
          <button
            onClick={onClose}
            class="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div class="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Google, Stripe, etc."
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Role / Title *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Software Engineer Intern, Frontend Developer"
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Job Posting URL
              </label>
              <input
                type="url"
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                placeholder="https://linkedin.com/jobs/..."
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Date Applied
              </label>
              <input
                type="date"
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Resume Version Used
              </label>
              <input
                type="text"
                value={resumeVersion}
                onChange={(e) => setResumeVersion(e.target.value)}
                placeholder="Resume_SDE_V2, Resume_General"
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
              >
                <option value="Applied">Applied</option>
                <option value="OA">OA (Online Assessment)</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Ghosted">Ghosted</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referral from John Doe, tech stack details, etc."
              rows={4}
              class="w-full bg-zinc-950 border border-darkBorder rounded-xl p-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all resize-none"
            />
          </div>

          <div class="flex items-center justify-end space-x-3 border-t border-darkBorder pt-5">
            <button
              type="button"
              onClick={onClose}
              class="px-5 py-2.5 bg-zinc-900 border border-darkBorder text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              class="px-5 py-2.5 bg-gradient-to-r from-accentIndigo to-accentBlue hover:from-accentIndigo/90 hover:to-accentBlue/90 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 shadow-md shadow-accentIndigo/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} class="animate-spin" />
              ) : (
                <span>Log Application</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddApplicationModal;
