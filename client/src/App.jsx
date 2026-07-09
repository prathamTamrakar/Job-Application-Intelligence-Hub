import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ApplicationDetail from './pages/ApplicationDetail';
import Analytics from './pages/Analytics';
import ResumeSandbox from './pages/ResumeSandbox';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'analytics'
  const [selectedAppId, setSelectedAppId] = useState(null);

  // loading check
  if (loading) {
    return (
      <div class="min-h-screen bg-darkBg flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} class="animate-spin text-accentIndigo" />
        <p class="text-sm text-textMuted tracking-wider">Loading your workspace...</p>
      </div>
    );
  }

  // Not logged in view
  if (!user) {
    return (
      <div class="min-h-screen bg-darkBg text-zinc-100 font-sans flex flex-col">
        {/* Simple Header */}
        <header class="max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between border-b border-darkBorder/30">
          <div class="flex items-center space-x-3">
            <div class="h-9 w-9 rounded-lg bg-gradient-to-tr from-accentIndigo to-accentBlue flex items-center justify-center font-bold text-lg text-white">
              J
            </div>
            <span class="text-xl font-bold tracking-tight text-white">
              JobIntel<span class="text-accentIndigo">Hub</span>
            </span>
          </div>
        </header>

        {/* Auth Body */}
        <main class="flex-1 flex items-center justify-center">
          {authView === 'login' ? (
            <Login onToggleAuth={() => setAuthView('signup')} />
          ) : (
            <Signup onToggleAuth={() => setAuthView('login')} />
          )}
        </main>

        {/* Footer */}
        <footer class="max-w-7xl mx-auto w-full px-6 py-6 border-t border-darkBorder/20 text-center text-xs text-textMuted">
          &copy; {new Date().getFullYear()} Job Application Intelligence Hub. Developed for portfolio optimization.
        </footer>
      </div>
    );
  }

  // Logged in Workspace Layout
  return (
    <div class="min-h-screen bg-darkBg text-zinc-100 font-sans flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        // Clear selected application when shifting tabs
        setSelectedAppId(null);
      }} />

      <main class="flex-1 max-w-7xl w-full mx-auto py-8 px-6">
        {activeTab === 'dashboard' ? (
          selectedAppId ? (
            <ApplicationDetail
              applicationId={selectedAppId}
              onBack={() => setSelectedAppId(null)}
            />
          ) : (
            <Dashboard onSelectApplication={(id) => setSelectedAppId(id)} />
          )
        ) : activeTab === 'analytics' ? (
          <Analytics />
        ) : (
          <ResumeSandbox />
        )}
      </main>

      <footer class="max-w-7xl mx-auto w-full px-6 py-6 border-t border-darkBorder/20 text-center text-xs text-textMuted mt-12">
        Job Application Intelligence Hub &bull; Portfolio-Grade Full-Stack System
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
