import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const Login = ({ onToggleAuth }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-[85vh] flex items-center justify-center px-4">
      <div class="w-full max-w-md glass-card rounded-2xl p-8 border border-darkBorder shadow-2xl relative overflow-hidden">
        {/* Top subtle highlight */}
        <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accentIndigo to-transparent"></div>
        
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h2>
          <p class="text-sm text-textMuted">
            Track, analyze, and optimize your job applications
          </p>
        </div>

        {errorMsg && (
          <div class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-5">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
              Email Address
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@example.com"
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
              Password
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                class="w-full bg-zinc-950 border border-darkBorder rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-gradient-to-r from-accentIndigo to-accentBlue hover:from-accentIndigo/90 hover:to-accentBlue/90 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-md shadow-accentIndigo/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} class="animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div class="mt-8 text-center border-t border-darkBorder pt-6">
          <p class="text-sm text-textMuted">
            Don't have an account?{' '}
            <button
              onClick={onToggleAuth}
              class="font-medium text-accentIndigo hover:text-accentIndigo/80 hover:underline transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
