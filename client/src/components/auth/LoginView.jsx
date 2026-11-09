import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Mail, Lock, User, RefreshCw } from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginView({ onOpenPrivacy, onOpenTerms }) {
  const {
    loginWithEmail,
    registerWithEmail,
    loginAsGuest,
    loading,
    authError,
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email) {
      setFormError('Please enter your email or username.');
      return;
    }

    try {
      if (mode === 'register') {
        await registerWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setFormError(err.message || 'Sign in failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#090D16] text-white relative overflow-hidden select-none">
      {/* Background radial gradient auras */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-b from-blue-600/15 via-purple-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-t from-cyan-600/15 to-transparent blur-[140px] pointer-events-none rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative z-10"
      >
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <BrandLogo size={64} animated />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
            Tavi AI
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 mt-1 font-semibold">
            One AI. Infinite Possibilities.
          </p>
        </div>

        {/* Welcoming Subtitle */}
        <div className="text-center mb-6 px-2">
          <h2 className="text-lg font-semibold text-slate-100">
            Meet Tavi, your AI companion.
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Think, create, search, and explore with privacy-first personal AI.
          </p>
        </div>

        {/* Global Error Banner */}
        {(authError || formError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{formError || authError}</span>
            <button
              onClick={() => {
                setFormError('');
              }}
              className="ml-2 underline text-rose-400 hover:text-rose-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary Instant Explorer Button */}
        <button
          onClick={() => loginAsGuest('Guest Explorer')}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-cyan-200" />
          <span>Launch Tavi AI (Instant Access)</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 mt-2">
          Start chatting immediately without signing in.
        </p>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f172a] px-3 text-slate-500 text-[10px] tracking-wider">
              or enter with custom profile
            </span>
          </div>
        </div>

        {/* Custom Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Tilak Dalai"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Password (Optional)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-all border border-slate-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Profile'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-3">
          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === 'login' ? 'register' : 'login'));
              setFormError('');
            }}
            className="text-[11px] text-blue-400 hover:underline"
          >
            {mode === 'login'
              ? "Want to customize your display name? Create profile"
              : 'Already have a profile? Sign in'}
          </button>
        </div>

        {/* Creator Attribution & Legal */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400">
            Designed & Developed by <span className="font-semibold text-blue-400">Tilak Dalai</span>
          </div>

          <div className="flex justify-center space-x-4 mt-3 text-[10px] text-slate-500">
            <button onClick={onOpenPrivacy} className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={onOpenTerms} className="hover:text-slate-400 transition-colors">
              Terms of Service
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
