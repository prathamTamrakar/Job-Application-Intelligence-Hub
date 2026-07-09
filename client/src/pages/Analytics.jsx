import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, Sparkles, Hourglass, Target, Loader2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

// Fallback Mock Data for demo mode (if database is empty)
const MOCK_RESUME_DATA = [
  { name: 'Resume_SDE_V2', rate: 42, applications: 45 },
  { name: 'Resume_FullStack', rate: 31, applications: 35 },
  { name: 'Resume_General', rate: 12, applications: 20 },
];

const MOCK_KEYWORD_DATA = [
  { name: 'React', rate: 48 },
  { name: 'Node.js', rate: 38 },
  { name: 'Python', rate: 25 },
  { name: 'TypeScript', rate: 41 },
  { name: 'AWS', rate: 30 },
];

const MOCK_FUNNEL_DATA = [
  { stage: 'Applied', count: 100, percentage: 100 },
  { stage: 'OA Recd', count: 45, percentage: 45 },
  { stage: 'Interview', count: 18, percentage: 18 },
  { stage: 'Offer', count: 4, percentage: 4 },
];

const MOCK_RESPONSE_TREND = [
  { week: 'Week 1', days: 12 },
  { week: 'Week 2', days: 10 },
  { week: 'Week 3', days: 8 },
  { week: 'Week 4', days: 7 },
  { week: 'Week 5', days: 9 },
  { week: 'Week 6', days: 6 },
];

const MOCK_RESUME_MATCH_SCORES = [
  { name: 'Resume_SDE_V2', avgScore: 82.5 },
  { name: 'Resume_FullStack', avgScore: 71.2 },
  { name: 'Resume_General', avgScore: 48.0 }
];

const MOCK_CORRELATION = {
  highMatchRate: 64,
  lowMatchRate: 18,
  highCount: 15,
  lowCount: 22
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div class="bg-zinc-950 border border-darkBorder p-3 rounded-lg text-xs">
        <p class="font-semibold text-white">{label}</p>
        <p class="text-indigo-400 mt-1">Callback Rate: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/analytics');
      if (res.data && res.data.success) {
        if (res.data.isRealData) {
          setData(res.data.data);
          setIsDemoMode(false);
        } else {
          // Empty DB fallback
          setIsDemoMode(true);
          setData(null);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load real-time analytics data. Displaying demo overview.');
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={36} class="animate-spin text-accentIndigo" />
        <p class="text-sm text-textMuted">Compiling pipeline analytics...</p>
      </div>
    );
  }

  // Derive charts data depending on whether we have real data or fallback mock data
  const hasTrendData = data?.trendData && data.trendData.length > 0;
  const hasKeywordData = data?.keywordStats && data.keywordStats.length > 0;
  const hasResumeData = data?.resumeStats && data.resumeStats.length > 0;
  const hasMatchScoreData = data?.resumeMatchScores && data.resumeMatchScores.length > 0;

  const resumeData = !isDemoMode && hasResumeData ? data.resumeStats : MOCK_RESUME_DATA;
  const keywordData = !isDemoMode && hasKeywordData ? data.keywordStats : MOCK_KEYWORD_DATA;
  const funnelData = !isDemoMode ? data.funnelData : MOCK_FUNNEL_DATA;
  const trendData = !isDemoMode && hasTrendData ? data.trendData : MOCK_RESPONSE_TREND;
  
  const resumeMatchScores = !isDemoMode && hasMatchScoreData ? data.resumeMatchScores : MOCK_RESUME_MATCH_SCORES;
  const correlation = !isDemoMode && data?.correlation ? data.correlation : MOCK_CORRELATION;

  const averageResponseDays = !isDemoMode ? data.summary.averageResponseDays : 7.4;
  const topResume = !isDemoMode ? data.summary.topResume : 'Resume_SDE_V2';
  const topResumeRate = !isDemoMode ? data.summary.topResumeRate : 42;
  const topKeyword = !isDemoMode ? data.summary.topKeyword : 'React';
  const topKeywordRate = !isDemoMode ? data.summary.topKeywordRate : 48;

  return (
    <div class="space-y-8">
      {/* Header */}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-darkBorder/40 pb-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <BarChart3 class="text-accentIndigo" /> Intelligence Analytics
          </h1>
          <p class="text-sm text-textMuted mt-1">
            Data-driven feedback loops to discover what is working
          </p>
        </div>

        <div class="flex items-center gap-2">
          {isDemoMode ? (
            <div class="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-500 text-xs font-semibold">
              <AlertCircle size={14} />
              <span>Demo Mode Active (Log applications for live stats)</span>
            </div>
          ) : (
            <div class="flex items-center space-x-1.5 bg-emerald-950/20 border border-emerald-900/40 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-semibold">
              <Sparkles size={14} class="animate-pulse" />
              <span>Live Database Stats Sync</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Analytics Summary */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Resume */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 flex items-start space-x-4">
          <div class="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-accentIndigo">
            <Target size={20} />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-textMuted uppercase tracking-wider">Top Resume Version</h4>
            <p class="text-xl font-bold text-white mt-1">{topResume}</p>
            <p class="text-xs text-emerald-400 mt-0.5 font-medium">{topResumeRate}% Callback Rate</p>
          </div>
        </div>

        {/* Top Tech Keyword */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 flex items-start space-x-4">
          <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-accentBlue">
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-textMuted uppercase tracking-wider">Top Stack Tag</h4>
            <p class="text-xl font-bold text-white mt-1">{topKeyword}</p>
            <p class="text-xs text-indigo-400 mt-0.5 font-medium">{topKeywordRate}% Callback Rate</p>
          </div>
        </div>

        {/* Response Duration */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 flex items-start space-x-4">
          <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <Hourglass size={20} />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-textMuted uppercase tracking-wider">Avg Response Delay</h4>
            <p class="text-xl font-bold text-white mt-1">
              {averageResponseDays > 0 ? `${averageResponseDays} Days` : 'N/A'}
            </p>
            <p class="text-xs text-textMuted mt-0.5">Based on timeline logs</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Resume Success Rates */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6">
          <h3 class="text-base font-bold text-white mb-6">Callback Rate by Resume Version (%)</h3>
          <div class="h-80 w-full">
            {resumeData.length === 0 ? (
              <div class="h-full flex items-center justify-center text-zinc-500 text-sm">No Resume Data logged</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="rate" fill="url(#indigoGrad)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Keyword Callback Rates */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6">
          <h3 class="text-base font-bold text-white mb-6">Callback Rate by Tech Stack Keyword (%)</h3>
          <div class="h-80 w-full">
            {keywordData.length === 0 ? (
              <div class="h-full flex items-center justify-center text-zinc-500 text-sm">No Keyword Data logged</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis type="number" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={11} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Conversion Funnel */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6">
          <h3 class="text-base font-bold text-white mb-6">Application Funnel Conversion</h3>
          <div class="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#emeraldGrad)" strokeWidth={2} />
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Time to Response Trend */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6">
          <h3 class="text-base font-bold text-white mb-6">Time-to-Response Trends (Days)</h3>
          <div class="h-80 w-full">
            {trendData.length === 0 ? (
              <div class="h-full flex items-center justify-center text-zinc-500 text-sm">No Trend Data logged yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="week" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="days" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 5: Average Match Score by Resume Version */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6">
          <h3 class="text-base font-bold text-white mb-6">Avg AI Match Score by Resume Version (%)</h3>
          <div class="h-80 w-full">
            {resumeMatchScores.length === 0 ? (
              <div class="h-full flex items-center justify-center text-zinc-500 text-sm">No Match Scores logged yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumeMatchScores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill="url(#purpleGrad)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Callout 6: AI Match Correlation Report */}
        <div class="bg-darkCard border border-darkBorder rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 class="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles size={18} class="text-purple-500" />
              AI Match Correlation Report
            </h3>
            <p class="text-xs text-textMuted leading-relaxed font-normal">
              Analyzing how your AI resume alignment matches translates into callbacks (OA, Interviews, Offers) from companies.
            </p>
            
            <div class="mt-6 space-y-4">
              {/* Highly aligned block */}
              <div class="bg-zinc-950 p-4 border border-darkBorder rounded-xl flex items-center justify-between">
                <div>
                  <span class="text-xs font-semibold text-emerald-450">High Match Scores (&gt;=75%)</span>
                  <p class="text-[10px] text-textMuted mt-0.5">Based on {correlation.highCount} tracked applications</p>
                </div>
                <div class="text-right">
                  <span class="text-xl font-extrabold text-white">{correlation.highMatchRate}%</span>
                  <p class="text-[9px] text-textMuted uppercase font-semibold">Callback Rate</p>
                </div>
              </div>

              {/* Weakly aligned block */}
              <div class="bg-zinc-950 p-4 border border-darkBorder rounded-xl flex items-center justify-between">
                <div>
                  <span class="text-xs font-semibold text-rose-455">Lower Match Scores (&lt;75%)</span>
                  <p class="text-[10px] text-textMuted mt-0.5">Based on {correlation.lowCount} tracked applications</p>
                </div>
                <div class="text-right">
                  <span class="text-xl font-extrabold text-white">{correlation.lowMatchRate}%</span>
                  <p class="text-[9px] text-textMuted uppercase font-semibold">Callback Rate</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl text-xs text-purple-400 leading-relaxed font-medium">
            <strong>Insight:</strong> Highly aligned resumes (+75%) yield a <strong>
              {correlation.highMatchRate > correlation.lowMatchRate 
                ? `${Math.max(0, correlation.highMatchRate - correlation.lowMatchRate)}% higher` 
                : 'comparable'
              }
            </strong> callback rate than lower aligned ones. Tailor your resume before applying!
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
