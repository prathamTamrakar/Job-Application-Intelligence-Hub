import React, { useState } from 'react';
import { Sparkles, FileText, Briefcase, Settings, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';

const PRESETS = {
  none: {
    label: 'No Job Description (Run General CV Audit)',
    jd: ''
  },
  fullstack: {
    label: 'Preset: Full Stack Developer (MERN)',
    jd: `Role: Full Stack Developer (MERN Stack)
Requirements:
- Deep expertise in building frontends using React.js, modern state managers, and Tailwind CSS.
- Heavy backend experience using Node.js, Express.js, and writing structured REST APIs.
- Hands-on experience working with MongoDB, database modeling, schema optimization, and SQL fallback.
- Solid understanding of JSON Web Tokens (JWT) authentication and session workflows.
- Familiarity with CI/CD build scripts, Docker containerization, and basic cloud deployments (AWS/Heroku).`
  },
  frontend: {
    label: 'Preset: Frontend React Developer',
    jd: `Role: Frontend React Developer
Requirements:
- Strong skills in React.js, JavaScript, and TypeScript.
- Strong experience in styling with Tailwind CSS and responsive layout design.
- Expertise in global state management using Redux Toolkit or Context API.
- Familiarity with modern build tools like Vite and testing with Jest / React Testing Library.
- Excellent understanding of page performance optimization, Web Vitals, and SEO best practices.`
  },
  backend: {
    label: 'Preset: Backend Node.js Developer',
    jd: `Role: Backend Node.js Developer
Requirements:
- Strong skills building scalable Express.js backend services and RESTful APIs.
- Heavy experience with MongoDB, Mongoose schemas, and writing aggregation pipelines.
- Strong knowledge of API design, JWT authentication, password hashing, and security standards.
- Experience in background task runners, node-cron job schedulers, and queue systems.
- Knowledge of Redis caching, Docker, and AWS deployments is a major plus.`
  },
  datascience: {
    label: 'Preset: Python Data Scientist',
    jd: `Role: Junior Data Scientist / ML Engineer
Requirements:
- Proficiency in Python, SQL, and Git workflows.
- Extensive experience working with data analytics libraries: Pandas, NumPy, and Matplotlib.
- Hands-on experience training machine learning models with Scikit-Learn, XGBoost, and TensorFlow.
- Experience cleaning messy datasets and building ETL pipelines.
- Strong math foundation in statistics, probability, and linear algebra.`
  },
  devops: {
    label: 'Preset: DevOps & Cloud Engineer',
    jd: `Role: Junior DevOps / Cloud Infrastructure Engineer
Requirements:
- Experience managing Linux-based server environments and AWS cloud architecture.
- Heavy expertise with Docker containerization and deploying Kubernetes (EKS/ECS) clusters.
- Strong skills writing infrastructure-as-code scripts using Terraform or CloudFormation.
- Practical experience constructing CI/CD pipelines (GitHub Actions, GitLab CI, or Jenkins).
- Solid knowledge of networking parameters (VPCs, subnets, route tables, firewalls) and basic scripting (Bash/Python).`
  },
  custom: {
    label: 'Custom (Paste your own Job Description below)',
    jd: ''
  }
};

const ResumeSandbox = () => {
  const [resumeText, setResumeText] = useState('');
  const [presetOption, setPresetOption] = useState('none');
  const [customJd, setCustomJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const activeJd = presetOption === 'custom' ? customJd : PRESETS[presetOption]?.jd || '';

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const payload = {
        resumeText: resumeText.trim(),
        jobDescription: activeJd.trim() || undefined
      };

      const res = await api.post('/resumes/sandbox-analyze', payload);
      if (res.data && res.data.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to complete ad-hoc sandbox analysis. Please verify your Groq API Key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-8">
      {/* Page Header */}
      <div class="border-b border-darkBorder/40 pb-4">
        <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Sparkles class="text-pink-500" /> AI Resume Sandbox & Optimizer
        </h1>
        <p class="text-sm text-textMuted mt-1">
          Paste your resume text to run quick ad-hoc audits or test alignment against specific roles instantly.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input Form */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 relative overflow-hidden h-fit">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-transparent"></div>
          
          <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileText size={18} class="text-pink-500" /> Sandbox Inputs
          </h3>

          <form onSubmit={handleAnalyze} class="space-y-6">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Paste Resume Text Content *
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the full text content of your resume/CV here..."
                rows={10}
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl p-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-pink-500 transition-all resize-y font-sans leading-relaxed"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Compare Against Job Description?
              </label>
              <select
                value={presetOption}
                onChange={(e) => {
                  setPresetOption(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomJd('');
                  }
                }}
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-pink-500 transition-all"
              >
                {Object.keys(PRESETS).map((key) => (
                  <option key={key} value={key}>
                    {PRESETS[key].label}
                  </option>
                ))}
              </select>
            </div>

            {presetOption !== 'none' && (
              <div class="animate-in fade-in slide-in-from-top-2 duration-200">
                <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                  Job Description Content
                </label>
                <textarea
                  value={presetOption === 'custom' ? customJd : PRESETS[presetOption].jd}
                  onChange={(e) => {
                    if (presetOption === 'custom') {
                      setCustomJd(e.target.value);
                    }
                  }}
                  readOnly={presetOption !== 'custom'}
                  placeholder="Paste the target Job Description here..."
                  rows={6}
                  class={`w-full border rounded-xl p-4 text-sm transition-all resize-y font-sans leading-relaxed ${
                    presetOption === 'custom'
                      ? 'bg-zinc-950 border-darkBorder text-zinc-200 focus:border-pink-500 focus:outline-none'
                      : 'bg-zinc-900 border-darkBorder/40 text-zinc-400 cursor-not-allowed'
                  }`}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !resumeText.trim()}
              class="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-pink-600/10 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} class="animate-spin" />
                  <span>Groq AI Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Analyze Sandbox Profile</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Results Display */}
        <div class="space-y-6">
          {errorMsg && (
            <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-sm flex items-start gap-3">
              <AlertCircle size={20} class="flex-shrink-0 mt-0.5 text-red-500" />
              <div>
                <h4 class="font-bold text-white mb-1">Sandbox Analysis Error</h4>
                <p class="leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {!result && !loading && !errorMsg && (
            <div class="bg-darkCard border border-darkBorder rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div class="p-4 bg-zinc-900 rounded-full border border-darkBorder mb-4 text-zinc-650">
                <Sparkles size={36} />
              </div>
              <h4 class="text-base font-bold text-white mb-2">Awaiting Sandbox Profile Inputs</h4>
              <p class="text-xs text-textMuted max-w-sm leading-relaxed">
                Paste your resume text in the left panel and click Analyze to receive instantaneous LLM audited feedback.
              </p>
            </div>
          )}

          {loading && (
            <div class="bg-darkCard border border-darkBorder rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px] space-y-4">
              <Loader2 size={40} class="animate-spin text-pink-500" />
              <div>
                <h4 class="text-base font-bold text-white mb-1">Groq LPU Processing...</h4>
                <p class="text-xs text-textMuted max-w-xs leading-relaxed">
                  Executing structural comparison prompt. Average response time is under 1.5 seconds.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-transparent"></div>
              
              <h3 class="text-base font-bold text-white mb-6">AI Optimization Results</h3>

              {result.type === 'audit' ? (
                /* STANDALONE AUDIT OUTPUT */
                <div class="space-y-6">
                  {/* Score Block */}
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
                          class={result.score >= 75 ? 'text-emerald-500' : result.score >= 50 ? 'text-amber-500' : 'text-rose-500'}
                          strokeDasharray={`${result.score}, 100`}
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
                        <span class="text-xl font-extrabold text-white">{result.score}%</span>
                        <p class="text-[7px] text-textMuted uppercase font-bold tracking-wider">Score</p>
                      </div>
                    </div>
                    
                    <div class="min-w-0">
                      <h4 class="text-xs font-bold text-white uppercase tracking-wider">General CV Audit Score</h4>
                      <p class="text-xs text-textMuted mt-1 leading-relaxed">
                        Your resume shows a strength rating of {result.score}%. Check out identified strengths and suggestions below to raise your score.
                      </p>
                    </div>
                  </div>

                  {/* Tech Stack identified */}
                  {result.techStack && result.techStack.length > 0 && (
                    <div>
                      <h4 class="text-xs font-bold uppercase tracking-wider text-textMuted mb-2.5">
                        Identified Technical Stack
                      </h4>
                      <div class="flex flex-wrap gap-1.5">
                        {result.techStack.map((tech) => (
                          <span key={tech} class="px-2.5 py-1 rounded-lg text-xs bg-zinc-950 border border-darkBorder text-zinc-300 font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses Columns */}
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div class="bg-zinc-950/40 border border-darkBorder/70 p-4 rounded-xl">
                      <h4 class="text-[10px] font-bold uppercase tracking-wider text-emerald-450 mb-2.5">
                        Profile Strengths
                      </h4>
                      <ul class="space-y-1.5">
                        {result.strengths?.map((str, index) => (
                          <li key={index} class="text-[11px] text-zinc-300 flex items-start space-x-1.5">
                            <span class="text-emerald-500 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div class="bg-zinc-950/40 border border-darkBorder/70 p-4 rounded-xl">
                      <h4 class="text-[10px] font-bold uppercase tracking-wider text-rose-455 mb-2.5">
                        Areas of Improvement
                      </h4>
                      <ul class="space-y-1.5">
                        {result.weaknesses?.map((weak, index) => (
                          <li key={index} class="text-[11px] text-zinc-300 flex items-start space-x-1.5">
                            <span class="text-rose-500 font-bold">•</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* General CV Suggestions */}
                  {result.suggestions && result.suggestions.length > 0 && (
                    <div class="border-t border-darkBorder/40 pt-4">
                      <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Sparkles size={12} class="text-pink-500" />
                        Optimizer Recommendations
                      </h4>
                      <ul class="space-y-2">
                        {result.suggestions.map((suggestion, index) => (
                          <li key={index} class="text-xs text-zinc-300 flex items-start space-x-2 leading-relaxed">
                            <span class="text-pink-550 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* MATCH COMPARISON OUTPUT */
                <div class="space-y-6">
                  {/* Score Block */}
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
                          class={result.matchScore >= 75 ? 'text-emerald-500' : result.matchScore >= 50 ? 'text-amber-500' : 'text-rose-500'}
                          strokeDasharray={`${result.matchScore}, 100`}
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
                        <span class="text-xl font-extrabold text-white">{result.matchScore}%</span>
                        <p class="text-[7px] text-textMuted uppercase font-bold tracking-wider">Score</p>
                      </div>
                    </div>
                    
                    <div class="min-w-0">
                      <h4 class="text-xs font-bold text-white uppercase tracking-wider">ATS Alignment Score</h4>
                      <p class="text-xs text-textMuted mt-1 leading-relaxed">
                        {result.matchScore >= 75 
                          ? 'Excellent CV alignment. You possess most of the core technical requirements listed in this role description.'
                          : result.matchScore >= 50
                            ? 'Moderate alignment. Try tailoring your experience sections to explicitly include the missing keywords listed below.'
                            : 'Weak CV alignment. Consider rewriting your CV project blocks or learning core stack competencies to fit the description.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Keywords Tag columns */}
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matched Keywords */}
                    <div class="bg-zinc-950/40 border border-darkBorder/70 p-4 rounded-xl">
                      <h4 class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2.5">
                        Matched Tech Keywords ({result.matchedKeywords?.length || 0})
                      </h4>
                      {result.matchedKeywords?.length === 0 ? (
                        <p class="text-[11px] text-zinc-550">None detected</p>
                      ) : (
                        <div class="flex flex-wrap gap-1.5">
                          {result.matchedKeywords?.map((kw) => (
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
                        Missing JD Keywords ({result.missingKeywords?.length || 0})
                      </h4>
                      {result.missingKeywords?.length === 0 ? (
                        <p class="text-[11px] text-zinc-550">None detected</p>
                      ) : (
                        <div class="flex flex-wrap gap-1.5">
                          {result.missingKeywords?.map((kw) => (
                            <span key={kw} class="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tailoring suggestions */}
                  {result.suggestions && result.suggestions.length > 0 && (
                    <div class="border-t border-darkBorder/40 pt-4">
                      <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Sparkles size={12} class="text-pink-500" />
                        AI Alignment Suggestions
                      </h4>
                      <ul class="space-y-2">
                        {result.suggestions.map((suggestion, index) => (
                          <li key={index} class="text-xs text-zinc-300 flex items-start space-x-2 leading-relaxed">
                            <span class="text-pink-555 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeSandbox;
