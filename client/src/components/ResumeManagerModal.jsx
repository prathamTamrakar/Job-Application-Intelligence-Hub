import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Loader2, Save } from 'lucide-react';
import api from '../utils/api';

const ResumeManagerModal = ({ isOpen, onClose }) => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Create / Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen]);

  const fetchResumes = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/resumes');
      if (res.data && res.data.success) {
        setResumes(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load resumes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setSaveLoading(true);
    setErrorMsg('');
    try {
      if (activeResumeId) {
        // Update
        const res = await api.put(`/resumes/${activeResumeId}`, { name, text });
        if (res.data && res.data.success) {
          setIsEditing(false);
          setActiveResumeId(null);
          setName('');
          setText('');
          fetchResumes();
        }
      } else {
        // Create
        const res = await api.post('/resumes', { name, text });
        if (res.data && res.data.success) {
          setIsEditing(false);
          setName('');
          setText('');
          fetchResumes();
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save resume.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditClick = (resume) => {
    setActiveResumeId(resume._id);
    setName(resume.name);
    setText(resume.text);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume version?')) return;
    try {
      const res = await api.delete(`/resumes/${id}`);
      if (res.data && res.data.success) {
        fetchResumes();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete resume.');
    }
  };

  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div class="w-full max-w-3xl bg-darkCard border border-darkBorder rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-darkBorder">
          <h3 class="text-xl font-semibold text-white">Manage Resume Profiles</h3>
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

        <div class="p-6 flex-1 overflow-y-auto">
          {isEditing ? (
            /* Create / Edit Form */
            <form onSubmit={handleCreateOrUpdate} class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                  Resume Name / Identifier *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Resume_SDE_V2, Resume_FullStack_2026"
                  class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo transition-all"
                  required
                />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                  Resume Plain Text Content *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the full text content of your resume here..."
                  rows={12}
                  class="w-full bg-zinc-950 border border-darkBorder rounded-xl p-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo transition-all resize-y font-sans"
                  required
                />
              </div>

              <div class="flex items-center justify-end space-x-3 border-t border-darkBorder pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setActiveResumeId(null);
                    setName('');
                    setText('');
                  }}
                  class="px-5 py-2.5 bg-zinc-900 border border-darkBorder text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  class="px-5 py-2.5 bg-gradient-to-r from-accentIndigo to-accentBlue hover:from-accentIndigo/90 hover:to-accentBlue/90 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 shadow-md shadow-accentIndigo/10 cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? (
                    <Loader2 size={16} class="animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{activeResumeId ? 'Update Resume' : 'Save Resume'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Resumes List */
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <p class="text-sm text-textMuted">
                  Create different versions of your resume to compare ATS keywords.
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  class="flex items-center space-x-1.5 bg-zinc-900 border border-darkBorder hover:bg-zinc-800 text-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add New Resume</span>
                </button>
              </div>

              {loading ? (
                <div class="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 size={28} class="animate-spin text-accentIndigo" />
                  <p class="text-xs text-textMuted">Loading resume versions...</p>
                </div>
              ) : resumes.length === 0 ? (
                <div class="text-center py-16 border border-dashed border-darkBorder rounded-2xl">
                  <p class="text-sm text-textMuted">No resume versions saved yet.</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    class="text-accentIndigo hover:underline text-sm font-semibold mt-2 cursor-pointer"
                  >
                    Create your first resume profile
                  </button>
                </div>
              ) : (
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumes.map((resume) => (
                    <div
                      key={resume._id}
                      class="bg-zinc-950 border border-darkBorder rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all group"
                    >
                      <div>
                        <h4 class="text-sm font-semibold text-white truncate">{resume.name}</h4>
                        <p class="text-xs text-textMuted mt-1">
                          Created: {new Date(resume.createdAt).toLocaleDateString()}
                        </p>
                        <p class="text-xs text-zinc-500 mt-2 line-clamp-3 bg-zinc-900/30 p-2 rounded border border-darkBorder/40">
                          {resume.text}
                        </p>
                      </div>

                      <div class="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-darkBorder/40">
                        <button
                          onClick={() => handleEditClick(resume)}
                          class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          title="Edit Resume text"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(resume._id)}
                          class="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          title="Delete Resume"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeManagerModal;
