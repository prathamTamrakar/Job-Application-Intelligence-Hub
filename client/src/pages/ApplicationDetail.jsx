import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, FileText, Link2, Trash2, Edit2, Check, X, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Timeline from '../components/Timeline';

const STATUS_OPTIONS = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Ghosted'];

const ApplicationDetail = ({ applicationId, onBack }) => {
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Edit mode details
  const [isEditing, setIsEditing] = useState(false);
  const [editCompany, setEditCompany] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editJobLink, setEditJobLink] = useState('');
  const [editResumeVersion, setEditResumeVersion] = useState('');
  const [editResumeVersionId, setEditResumeVersionId] = useState('');
  const [editJobDescription, setEditJobDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Status transition form
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Resumes list
  const [resumes, setResumes] = useState([]);
  
  // AI analysis state
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Delete status
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch application details
  const fetchAppDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/applications/${applicationId}`);
      if (res.data && res.data.success) {
        const data = res.data.data;
        setApp(data);
        // Initialize edit states
        setEditCompany(data.company);
        setEditRole(data.role);
        setEditJobLink(data.jobLink || '');
        setEditResumeVersion(data.resumeVersion || 'Default');
        setEditResumeVersionId(data.resumeVersionId || '');
        setEditJobDescription(data.jobDescription || '');
        setEditNotes(data.notes || '');
        setEditDate(new Date(data.dateApplied).toISOString().split('T')[0]);
        // Set default status update
        setNewStatus(data.status);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      if (res.data && res.data.success) {
        setResumes(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load resumes list:', err);
    }
  };

  const fetchMatchAnalysis = async () => {
    try {
      const res = await api.get(`/applications/${applicationId}/analyze-match`);
      if (res.data && res.data.success) {
        setAnalysis(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load match analysis:', err);
    }
  };

  const handleAnalyzeMatch = async () => {
    setAnalysisLoading(true);
    setAnalysisError('');
    try {
      const res = await api.post(`/applications/${applicationId}/analyze-match`);
      if (res.data && res.data.success) {
        setAnalysis(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setAnalysisError(err.response?.data?.message || 'Failed to complete analysis.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchAppDetails();
      fetchResumes();
      fetchMatchAnalysis();
    }
  }, [applicationId]);

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCompany || !editRole) return;

    setEditLoading(true);
    try {
      const res = await api.put(`/applications/${applicationId}`, {
        company: editCompany,
        role: editRole,
        jobLink: editJobLink,
        resumeVersion: editResumeVersion,
        resumeVersionId: editResumeVersionId || null,
        jobDescription: editJobDescription,
        notes: editNotes,
        dateApplied: editDate,
      });

      if (res.data && res.data.success) {
        setApp(res.data.data);
        setIsEditing(false);
        fetchMatchAnalysis(); // Refresh match analysis if resume changed
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update details');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Status Update
  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    setStatusLoading(true);
    try {
      const res = await api.put(`/applications/${applicationId}`, {
        status: newStatus,
        statusNotes: statusNotes || `Updated status to ${newStatus}`,
      });

      if (res.data && res.data.success) {
        setApp(res.data.data);
        setStatusNotes(''); // Reset transition note
        // Refetch to ensure history is updated properly
        await fetchAppDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/applications/${applicationId}`);
      if (res.data && res.data.success) {
        onBack();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete application');
      setDeleteLoading(false);
    }
  };

  // Handle manual follow up trigger
  const handleFollowUp = async () => {
    setFollowUpLoading(true);
    try {
      const res = await api.put(`/applications/${applicationId}/followup`);
      if (res.data && res.data.success) {
        setApp(res.data.data);
        await fetchAppDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to record follow-up event');
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Stale check
  const followUpThreshold = user?.settings?.followUpDays || 7;
  const isStale = app && ['Applied', 'OA', 'Interview'].includes(app.status) && (() => {
    const updatedAtDate = new Date(app.updatedAt);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - followUpThreshold);
    return updatedAtDate <= cutoff;
  })();

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={36} class="animate-spin text-accentIndigo" />
        <p class="text-sm text-textMuted">Retrieving application metadata...</p>
      </div>
    );
  }

  if (errorMsg || !app) {
    return (
      <div class="text-center py-20">
        <p class="text-rose-400 mb-4">{errorMsg || 'Application not found'}</p>
        <button
          onClick={onBack}
          class="flex items-center space-x-2 text-zinc-400 hover:text-white mx-auto py-2 px-4 rounded-xl border border-darkBorder bg-zinc-900"
        >
          <ArrowLeft size={16} />
          <span>Back to pipeline</span>
        </button>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Back & Actions */}
      <div class="flex items-center justify-between border-b border-darkBorder/40 pb-4">
        <button
          onClick={onBack}
          class="flex items-center space-x-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} class="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to pipeline</span>
        </button>

        <div class="flex items-center space-x-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              class="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-darkBorder rounded-xl transition-all cursor-pointer"
              title="Edit Details"
            >
              <Edit2 size={16} />
            </button>
          )}

          {deleteConfirm ? (
            <div class="flex items-center space-x-1 bg-rose-950/20 border border-rose-900/50 p-1 rounded-xl">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                class="p-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              class="p-2.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 border border-transparent hover:border-darkBorder rounded-xl transition-all cursor-pointer"
              title="Delete Application"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata details + update status form */}
        <div class="lg:col-span-2 space-y-6">
          {/* Stale Warning Banner */}
          {isStale && (
            <div class="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-6 py-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div class="flex items-center space-x-3">
                <AlertTriangle class="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p class="text-sm font-semibold text-white">Stale Application Alert</p>
                  <p class="text-xs text-textMuted mt-0.5">
                    No status update has been logged for this application in over {followUpThreshold} days.
                  </p>
                </div>
              </div>
              <button
                onClick={handleFollowUp}
                disabled={followUpLoading}
                class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {followUpLoading ? 'Recording...' : 'Mark as Followed Up'}
              </button>
            </div>
          )}

          {/* Main Info Card */}
          <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accentIndigo via-accentBlue to-transparent"></div>
            
            {isEditing ? (
              <form onSubmit={handleEditSubmit} class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                      Role / Position Title
                    </label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                      Job Link
                    </label>
                    <input
                      type="url"
                      value={editJobLink}
                      onChange={(e) => setEditJobLink(e.target.value)}
                      class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                      Date Applied
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                      Linked Resume Version *
                    </label>
                    {resumes.length === 0 ? (
                      <div class="flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={editResumeVersion}
                          onChange={(e) => setEditResumeVersion(e.target.value)}
                          placeholder="e.g. Resume_SDE_V2"
                          class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all"
                        />
                        <span class="text-[10px] text-amber-500 font-medium">No saved resumes found. Add one on the main dashboard to run AI matching.</span>
                      </div>
                    ) : (
                      <select
                        value={editResumeVersionId}
                        onChange={(e) => {
                          setEditResumeVersionId(e.target.value);
                          const selected = resumes.find(r => r._id === e.target.value);
                          if (selected) {
                            setEditResumeVersion(selected.name);
                          }
                        }}
                        class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all"
                        required
                      >
                        <option value="">-- Select a saved resume --</option>
                        {resumes.map((r) => (
                          <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                    Application Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    class="w-full bg-zinc-950 border border-darkBorder rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all resize-none"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                    Job Description (for AI Match Analysis)
                  </label>
                  <textarea
                    value={editJobDescription}
                    onChange={(e) => setEditJobDescription(e.target.value)}
                    placeholder="Paste the full job description text here..."
                    rows={8}
                    class="w-full bg-zinc-950 border border-darkBorder rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all resize-y"
                  />
                </div>

                <div class="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    class="px-4 py-2 bg-zinc-900 border border-darkBorder text-zinc-400 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    class="px-4 py-2 bg-accentIndigo hover:bg-accentIndigo/90 text-white rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    {editLoading ? <Loader2 size={14} class="animate-spin" /> : <Check size={14} />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div class="space-y-6">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs font-semibold text-accentIndigo uppercase tracking-wider bg-accentIndigo/10 px-2 py-0.5 rounded">
                      Active Application
                    </span>
                    <span class="text-zinc-700">•</span>
                    <span class="text-xs text-textMuted">
                      Last update: {new Date(app.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 class="text-2xl font-bold text-white mt-2">{app.company}</h2>
                  <p class="text-lg text-zinc-200 font-medium mt-0.5">{app.role}</p>
                </div>

                {/* Metadata Row */}
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-t border-b border-darkBorder/40">
                  <div class="flex items-center space-x-2">
                    <div class="p-2 bg-zinc-900 rounded-lg text-zinc-400 border border-darkBorder">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p class="text-[10px] text-textMuted uppercase font-semibold">Date Applied</p>
                      <p class="text-xs text-zinc-200 font-medium">
                        {new Date(app.dateApplied).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2">
                    <div class="p-2 bg-zinc-900 rounded-lg text-zinc-400 border border-darkBorder">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p class="text-[10px] text-textMuted uppercase font-semibold">Resume Used</p>
                      <p class="text-xs text-zinc-200 font-medium">
                        {resumes.find(r => r._id === app.resumeVersionId)?.name || app.resumeVersion || 'Default'}
                      </p>
                    </div>
                  </div>

                  {app.jobLink && (
                    <div class="flex items-center space-x-2 col-span-2 md:col-span-1">
                      <div class="p-2 bg-zinc-900 rounded-lg text-zinc-400 border border-darkBorder">
                        <Link2 size={16} />
                      </div>
                      <div class="min-w-0">
                        <p class="text-[10px] text-textMuted uppercase font-semibold">Job Posting</p>
                        <a
                          href={app.jobLink}
                          target="_blank"
                          rel="noreferrer"
                          class="text-xs text-accentIndigo hover:underline block truncate"
                        >
                          View Listing
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {app.notes && (
                  <div>
                    <h5 class="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                      Notes / Description
                    </h5>
                    <p class="text-sm text-zinc-300 bg-zinc-950 p-4 rounded-xl border border-darkBorder whitespace-pre-wrap">
                      {app.notes}
                    </p>
                  </div>
                )}

                {/* Parsing Tech Keywords */}
                {app.techStackKeywords && app.techStackKeywords.length > 0 && (
                  <div>
                    <h5 class="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles size={12} class="text-indigo-400" />
                      Auto-detected Stack Keywords
                    </h5>
                    <div class="flex flex-wrap gap-1.5">
                      {app.techStackKeywords.map((kw) => (
                        <span
                          key={kw}
                          class="px-2.5 py-1 rounded-lg text-xs bg-indigo-950/20 border border-indigo-900/40 text-indigo-300 font-medium capitalize"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Description Accordion */}
                {app.jobDescription && (
                  <details class="group border-t border-darkBorder/40 pt-4">
                    <summary class="flex items-center justify-between text-xs font-semibold text-textMuted uppercase tracking-wider cursor-pointer list-none select-none">
                      <span class="flex items-center gap-1.5 hover:text-white transition-colors">
                        <FileText size={12} />
                        Job Description Text
                      </span>
                      <span class="text-zinc-500 group-open:rotate-180 transition-transform duration-200">▼</span>
                    </summary>
                    <p class="text-xs text-zinc-400 bg-zinc-950 p-4 rounded-xl border border-darkBorder mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {app.jobDescription}
                    </p>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* AI Match Analysis Card */}
          {!isEditing && (
            <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 relative overflow-hidden">
              <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-transparent"></div>
              
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles size={18} class="text-pink-500" />
                    AI Resume ↔ JD Match Analysis
                  </h3>
                  <p class="text-xs text-textMuted mt-1">Powered by Groq Llama 3.3</p>
                </div>
                
                {analysis && !analysisLoading && (
                  <button
                    onClick={handleAnalyzeMatch}
                    class="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-darkBorder hover:bg-zinc-800 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer"
                  >
                    Re-run Analysis
                  </button>
                )}
              </div>

              {/* Warnings / Configurations checks */}
              {(!app.resumeVersionId || !app.jobDescription) ? (
                <div class="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-500/90 leading-relaxed">
                  <p class="font-bold flex items-center gap-1.5 mb-1 text-white">
                    <AlertTriangle size={14} class="text-amber-500" />
                    Setup Required for AI Matching
                  </p>
                  To check how well your CV aligns with this job, please:
                  <ul class="list-disc list-inside mt-1.5 space-y-1">
                    {!app.resumeVersionId && <li>Link a saved resume version (click the edit icon above)</li>}
                    {!app.jobDescription && <li>Paste the job description text (click the edit icon above)</li>}
                  </ul>
                </div>
              ) : analysisLoading ? (
                /* Loading State */
                <div class="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 size={32} class="animate-spin text-pink-500" />
                  <p class="text-xs text-textMuted font-medium text-center">Groq analyzing resume alignment...</p>
                  <p class="text-[10px] text-zinc-650">Typically completes in under 2 seconds</p>
                </div>
              ) : analysisError ? (
                /* Error State */
                <div class="space-y-4">
                  <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs leading-relaxed">
                    <p class="font-bold text-white mb-1">Analysis Failed</p>
                    {analysisError}
                  </div>
                  <button
                    onClick={handleAnalyzeMatch}
                    class="w-full bg-zinc-900 border border-darkBorder hover:bg-zinc-800 text-zinc-350 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : !analysis ? (
                /* Initial State - Ready to analyze */
                <div class="text-center py-8">
                  <p class="text-xs text-textMuted mb-4">
                    Ready to compare resume <strong class="text-zinc-200">"{resumes.find(r => r._id === app.resumeVersionId)?.name || 'Default'}"</strong> with the job description.
                  </p>
                  <button
                    onClick={handleAnalyzeMatch}
                    class="w-full bg-gradient-to-r from-purple-650 to-pink-650 hover:from-purple-550 hover:to-pink-550 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/15 cursor-pointer"
                  >
                    Analyze Alignment Match
                  </button>
                </div>
              ) : (
                /* Results loaded state */
                <div class="space-y-6">
                  {/* Score block */}
                  <div class="flex items-center gap-6 bg-zinc-950 p-4 border border-darkBorder rounded-xl">
                    <div class="relative flex items-center justify-center w-20 h-20 flex-shrink-0">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          class="text-zinc-900 stroke-zinc-900"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          class={analysis.matchScore >= 75 ? 'text-emerald-500' : analysis.matchScore >= 50 ? 'text-amber-500' : 'text-rose-500'}
                          strokeDasharray={`${analysis.matchScore}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div class="absolute text-center">
                        <span class="text-xl font-extrabold text-white">{analysis.matchScore}%</span>
                        <p class="text-[7px] text-textMuted uppercase font-bold tracking-wider">Score</p>
                      </div>
                    </div>
                    
                    <div class="min-w-0">
                      <h4 class="text-xs font-bold text-white uppercase tracking-wider">ATS Score Rating</h4>
                      <p class="text-xs text-textMuted mt-1 leading-relaxed">
                        {analysis.matchScore >= 75 
                          ? 'Excellent CV alignment. You possess most of the core technical requirements listed in the job post.'
                          : analysis.matchScore >= 50
                            ? 'Moderate alignment. Consider updating your resume to mention missing stack items before applying.'
                            : 'Weak CV alignment. Highly recommend restructuring your technical projects to reflect matching requirements.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Keywords Tag columns */}
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matched Keywords */}
                    <div class="bg-zinc-950/40 border border-darkBorder/70 p-4 rounded-xl">
                      <h4 class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2.5">
                        Matched Tech Keywords ({analysis.matchedKeywords?.length || 0})
                      </h4>
                      {analysis.matchedKeywords?.length === 0 ? (
                        <p class="text-[11px] text-zinc-550">None detected</p>
                      ) : (
                        <div class="flex flex-wrap gap-1.5">
                          {analysis.matchedKeywords?.map((kw) => (
                            <span key={kw} class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Missing Keywords */}
                    <div class="bg-zinc-950/40 border border-darkBorder/70 p-4 rounded-xl">
                      <h4 class="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2.5">
                        Missing JD Keywords ({analysis.missingKeywords?.length || 0})
                      </h4>
                      {analysis.missingKeywords?.length === 0 ? (
                        <p class="text-[11px] text-zinc-550">None detected</p>
                      ) : (
                        <div class="flex flex-wrap gap-1.5">
                          {analysis.missingKeywords?.map((kw) => (
                            <span key={kw} class="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actionable Suggestions */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div class="border-t border-darkBorder/40 pt-4">
                      <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Sparkles size={12} class="text-pink-500" />
                        Groq CV Suggestions
                      </h4>
                      <ul class="space-y-2">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} class="text-xs text-zinc-300 flex items-start space-x-2 leading-relaxed">
                            <span class="text-pink-500 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div class="text-[10px] text-textMuted border-t border-darkBorder/40 pt-3">
                    Last analyzed on {new Date(analysis.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Update Status form */}
          <div class="bg-darkCard border border-darkBorder rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Advance Status Pipeline</h3>
            <form onSubmit={handleStatusUpdateSubmit} class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-1">
                  <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accentIndigo transition-all"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                    Transition Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="e.g. Cleared round 1, scheduled panel interview..."
                    class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo transition-all"
                  />
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={statusLoading || newStatus === app.status}
                  class="px-5 py-2.5 bg-zinc-800 border border-darkBorder hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {statusLoading ? (
                    <Loader2 size={16} class="animate-spin" />
                  ) : (
                    <span>Update Status</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 h-full">
            <h3 class="text-lg font-semibold text-white mb-6">Status Timeline</h3>
            <Timeline history={app.statusHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
