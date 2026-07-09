import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, BarChart3, User, Sparkles } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <nav class="sticky top-0 z-50 w-full glass-card border-b border-darkBorder px-6 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="h-9 w-9 rounded-lg bg-gradient-to-tr from-accentIndigo to-accentBlue flex items-center justify-center font-bold text-lg text-white shadow-md shadow-accentIndigo/20">
          J
        </div>
        <span class="text-xl font-bold tracking-tight text-white bg-clip-text">
          JobIntel<span class="text-accentIndigo">Hub</span>
        </span>
      </div>

      {user && (
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-1 bg-zinc-900/60 p-1 rounded-lg border border-darkBorder">
            <button
              onClick={() => setActiveTab('dashboard')}
              class={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              class={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart3 size={16} />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              class={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles size={16} class="text-pink-500 animate-pulse" />
              <span>AI Sandbox</span>
            </button>
          </div>

          <div class="flex items-center space-x-4 border-l border-darkBorder pl-6">
            <div class="flex items-center space-x-2">
              <div class="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 border border-darkBorder">
                <User size={16} />
              </div>
              <div class="hidden md:block text-left">
                <p class="text-sm font-medium text-zinc-200">{user.name}</p>
                <p class="text-xs text-textMuted">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              class="p-2 rounded-lg text-zinc-400 hover:text-accentRose hover:bg-zinc-950 transition-colors border border-transparent hover:border-darkBorder"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
