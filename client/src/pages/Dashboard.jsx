import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, RefreshCw, Calendar, FileText, ChevronRight, X, ExternalLink, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AddApplicationModal from '../components/AddApplicationModal';
import ResumeManagerModal from '../components/ResumeManagerModal';

const STATUS_BADGES = {
  Applied: 'text-zinc-400 bg-zinc-950 border-zinc-800',
  OA: 'text-purple-400 bg-purple-950/20 border-purple-800/40',
  Interview: 'text-blue-400 bg-blue-950/20 border-blue-800/40',
  Offer: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/40',
  Rejected: 'text-rose-400 bg-rose-950/20 border-rose-800/40',
  Ghosted: 'text-amber-500 bg-amber-950/20 border-amber-800/40',
};

const Dashboard = ({ onSelectApplication }) => {
  const { user, updateUserSettings } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showResumeManager, setShowResumeManager] = useState(false);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(user?.settings?.followUpDays || 7);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [resumeVersion, setResumeVersion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (user?.settings?.followUpDays) {
      setFollowUpDays(user.settings.followUpDays);
    }
  }, [user]);

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (resumeVersion) params.resumeVersion = resumeVersion;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/applications', { params });
      if (res.data && res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load applications. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [status, resumeVersion, startDate, endDate]); // Trigger fetch automatically when dropdown filters change

  // Handle Search on Submit/Debounce (here we can trigger via button or Enter)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setResumeVersion('');
    setStartDate('');
    setEndDate('');
    // Trigger manual fetch since state changes won't batch sync synchronously in the same loop
    setTimeout(() => {
      fetchApplications();
    }, 50);
  };

  // Settings Submit
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await updateUserSettings(followUpDays);
      setShowSettings(false);
      fetchApplications();
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Trigger Scanner
  const handleTriggerScanner = async () => {
    setTriggerLoading(true);
    try {
      const res = await api.post('/reminders/trigger');
      if (res.data && res.data.success) {
        alert(`Scanner Executed Successfully!\nStale Applications Identified: ${res.data.logsCount}\nReminder logs saved (check Node console for email outputs).`);
        fetchApplications();
      }
    } catch (err) {
      alert('Failed to run scanner: ' + err.message);
    } finally {
      setTriggerLoading(false);
    }
  };

  // Stale check helper
  const followUpThreshold = user?.settings?.followUpDays || 7;
  const isAppStale = (app) => {
    if (!['Applied', 'OA', 'Interview'].includes(app.status)) return false;
    const updatedAtDate = new Date(app.updatedAt);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - followUpThreshold);
    return updatedAtDate <= cutoff;
  };

  // Stats derivation
  const totalApps = applications.length;
  const oas = applications.filter((app) => app.status === 'OA').length;
  const interviews = applications.filter((app) => app.status === 'Interview').length;
  const offers = applications.filter((app) => app.status === 'Offer').length;
  const rejections = applications.filter((app) => app.status === 'Rejected').length;
  const pending = applications.filter((app) => ['Applied', 'OA', 'Interview'].includes(app.status)).length;
  const rejectionRate = totalApps > 0 ? Math.round((rejections / totalApps) * 100) : 0;

  return (
    <div class="space-y-8 px-4 md:px-0">
      {/* Page Header */}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-white">Application Pipeline</h1>
          <p class="text-sm text-textMuted mt-1">
            Monitor, track, and update your active applications
          </p>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowResumeManager(true)}
            class="flex items-center justify-center space-x-1.5 bg-zinc-900 border border-darkBorder hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl px-4 py-3 font-semibold text-sm transition-all cursor-pointer"
            title="Manage Resumes"
          >
            <FileText size={16} />
            <span class="hidden sm:inline">Resumes</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            class={`flex items-center justify-center p-3 border rounded-xl transition-all cursor-pointer ${
              showSettings 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                : 'bg-zinc-900 border-darkBorder text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Follow-up Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            class="flex items-center justify-center space-x-2 bg-gradient-to-r from-accentIndigo to-accentBlue hover:from-accentIndigo/90 hover:to-accentBlue/90 text-white rounded-xl px-5 py-3 font-semibold text-sm transition-all shadow-md shadow-accentIndigo/20 cursor-pointer flex-1 md:flex-initial"
          >
            <Plus size={18} />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-amber-500"></div>
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <Settings size={18} class="text-amber-500" />
                Follow-up & Reminder Settings
              </h3>
              <p class="text-xs text-textMuted mt-1">
                Configure notifications threshold and trigger manual diagnostic scans.
              </p>
            </div>
            
            <form onSubmit={handleSaveSettings} class="flex items-center gap-3 w-full md:w-auto">
              <div class="flex items-center gap-2">
                <span class="text-sm text-zinc-300 whitespace-nowrap">Stale Threshold:</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  class="w-16 bg-zinc-950 border border-darkBorder rounded-lg px-2.5 py-1.5 text-sm text-center font-bold text-zinc-200 focus:outline-none focus:border-amber-500"
                />
                <span class="text-sm text-zinc-500">Days</span>
              </div>
              <button
                type="submit"
                disabled={settingsLoading}
                class="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {settingsLoading ? 'Saving...' : 'Save'}
              </button>
            </form>

            <div class="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 md:border-l border-darkBorder pt-4 md:pt-0 md:pl-6">
              <span class="text-xs text-textMuted hidden lg:inline">Test Cron Scheduler:</span>
              <button
                type="button"
                onClick={handleTriggerScanner}
                disabled={triggerLoading}
                class="px-4 py-1.5 bg-zinc-900 border border-darkBorder hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {triggerLoading ? (
                  <Loader2 size={12} class="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                <span>Run Scanner Manual Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards Dashboard */}
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Applications */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-5 relative overflow-hidden">
          <p class="text-xs font-semibold text-textMuted uppercase tracking-wider">Total logged</p>
          <p class="text-3xl font-bold text-white mt-2">{totalApps}</p>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800"></div>
        </div>

        {/* Pending Responses */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-5 relative overflow-hidden">
          <p class="text-xs font-semibold text-textMuted uppercase tracking-wider">In Progress</p>
          <p class="text-3xl font-bold text-indigo-400 mt-2">{pending}</p>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-accentIndigo/50"></div>
        </div>

        {/* Active Interviews */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-5 relative overflow-hidden">
          <p class="text-xs font-semibold text-textMuted uppercase tracking-wider">Interviews</p>
          <p class="text-3xl font-bold text-blue-400 mt-2">{interviews}</p>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/50"></div>
        </div>

        {/* Offers */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-5 relative overflow-hidden">
          <p class="text-xs font-semibold text-textMuted uppercase tracking-wider">Offers</p>
          <p class="text-3xl font-bold text-emerald-400 mt-2">{offers}</p>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/50"></div>
        </div>

        {/* Rejection Rate */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-5 relative overflow-hidden col-span-2 lg:col-span-1">
          <p class="text-xs font-semibold text-textMuted uppercase tracking-wider">Rejection Rate</p>
          <p class="text-3xl font-bold text-rose-400 mt-2">{rejectionRate}%</p>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/50"></div>
        </div>
      </div>

      {/* Filters Form */}
      <div class="bg-darkCard border border-darkBorder rounded-2xl p-6">
        <form onSubmit={handleSearchSubmit} class="space-y-4">
          <div class="flex flex-col lg:flex-row gap-4 items-end">
            {/* Search Input */}
            <div class="w-full lg:flex-1">
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Search Applications
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by company, position title, keywords..."
                  class="w-full bg-zinc-950 border border-darkBorder rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div class="w-full lg:w-48">
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
              >
                <option value="">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="OA">OA (Online Assessment)</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Ghosted">Ghosted</option>
              </select>
            </div>

            {/* Resume Version Filter */}
            <div class="w-full lg:w-48">
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Resume Version
              </label>
              <input
                type="text"
                value={resumeVersion}
                onChange={(e) => setResumeVersion(e.target.value)}
                placeholder="Resume_SDE_V1"
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
              />
            </div>

            {/* Search Submit Button */}
            <div class="flex gap-2 w-full lg:w-auto">
              <button
                type="submit"
                class="bg-zinc-800 border border-darkBorder hover:bg-zinc-700 text-white rounded-xl px-5 py-3 text-sm font-semibold transition-all cursor-pointer flex-1 lg:flex-initial"
              >
                Apply
              </button>
              {(search || status || resumeVersion || startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  class="bg-zinc-900 border border-darkBorder hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl p-3 text-sm font-semibold transition-all cursor-pointer"
                  title="Clear Filters"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Date range toggle / expander */}
          <div class="flex flex-wrap items-center gap-4 pt-2 border-t border-darkBorder/40">
            <span class="text-xs text-textMuted font-medium flex items-center gap-1.5">
              <Filter size={14} /> Date Range:
            </span>
            <div class="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                class="bg-zinc-950 border border-darkBorder rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
              />
              <span class="text-xs text-zinc-600">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                class="bg-zinc-950 border border-darkBorder rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Main Table / Grid List */}
      <div class="bg-darkCard border border-darkBorder rounded-2xl overflow-hidden shadow-sm">
        <div class="px-6 py-5 border-b border-darkBorder flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">Logged Applications</h3>
          <button
            onClick={fetchApplications}
            class="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={16} class={`${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div class="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw size={36} class="animate-spin text-accentIndigo" />
            <p class="text-sm text-textMuted">Syncing pipeline applications...</p>
          </div>
        ) : errorMsg ? (
          <div class="text-center py-20 text-rose-400 text-sm">{errorMsg}</div>
        ) : applications.length === 0 ? (
          <div class="flex flex-col items-center justify-center py-24 text-center px-4">
            <div class="h-12 w-12 rounded-xl bg-zinc-900 border border-darkBorder flex items-center justify-center text-zinc-500 mb-4">
              <FileText size={22} />
            </div>
            <h4 class="text-lg font-semibold text-zinc-300">No applications found</h4>
            <p class="text-sm text-textMuted max-w-sm mt-1">
              Start adding your job applications manually or use our browser extension to capture them automatically.
            </p>
          </div>
        ) : (
          <div class="divide-y divide-darkBorder">
            {applications.map((app) => {
              const formattedDate = new Date(app.dateApplied).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={app._id}
                  onClick={() => onSelectApplication(app._id)}
                  class="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-zinc-900/30 transition-all cursor-pointer group"
                >
                  <div class="flex-1 min-w-0 pr-4 space-y-1">
                    <div class="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 class="text-base font-semibold text-white truncate max-w-xs group-hover:text-accentIndigo transition-colors">
                        {app.company}
                      </h4>
                      {app.jobLink && (
                        <a
                          href={app.jobLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          class="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition-all"
                          title="Open job link"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <p class="text-sm text-zinc-300 font-medium truncate max-w-md">
                      {app.role}
                    </p>
                    
                    {/* Keywords list */}
                    {app.techStackKeywords && app.techStackKeywords.length > 0 && (
                      <div class="flex flex-wrap gap-1 mt-2">
                        {app.techStackKeywords.slice(0, 4).map((kw) => (
                          <span
                            key={kw}
                            class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 capitalize"
                          >
                            {kw}
                          </span>
                        ))}
                        {app.techStackKeywords.length > 4 && (
                          <span class="text-[9px] text-textMuted self-center pl-1">
                            +{app.techStackKeywords.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div class="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                    <div class="text-left md:text-right space-y-1">
                      <div class="flex items-center space-x-2 md:justify-end">
                        <span class="text-xs text-textMuted flex items-center gap-1">
                          <Calendar size={12} />
                          {formattedDate}
                        </span>
                        <span class="hidden md:inline-block text-zinc-700">•</span>
                        <span class="text-xs text-textMuted flex items-center gap-1">
                          <FileText size={12} />
                          {app.resumeVersion}
                        </span>
                      </div>
                      {app.notes && (
                        <p class="text-xs text-textMuted max-w-xs truncate hidden md:block">
                          {app.notes}
                        </p>
                      )}
                    </div>

                    <div class="flex items-center space-x-3">
                      {isAppStale(app) && (
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-1" title="Needs follow-up attention">
                          <AlertCircle size={10} />
                          Stale
                        </span>
                      )}
                      <span
                        class={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          STATUS_BADGES[app.status] || STATUS_BADGES.Applied
                        }`}
                      >
                        {app.status}
                      </span>
                      <ChevronRight size={18} class="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSuccess={(newApp) => {
          fetchApplications();
        }}
      />

      {/* Resume Manager Modal */}
      <ResumeManagerModal
        isOpen={showResumeManager}
        onClose={() => setShowResumeManager(false)}
      />
    </div>
  );
};

export default Dashboard;
