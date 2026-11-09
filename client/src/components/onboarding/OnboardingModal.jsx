import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, Globe, Cpu, UserCheck } from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

const LANGUAGES = [
  { id: 'en', label: 'English', sub: 'Default' },
  { id: 'hi', label: 'हिंदी (Hindi)', sub: 'Devanagari' },
  { id: 'hinglish', label: 'Hinglish', sub: 'Hindi in Roman' },
  { id: 'or', label: 'ଓଡ଼ିଆ (Odia)', sub: 'Oriya Script' },
  { id: 'sa', label: 'संस्कृतम् (Sanskrit)', sub: 'Classical' },
];

export default function OnboardingModal({ isOpen, onComplete }) {
  const { currentUser, idToken, updateMongoUser } = useAuth();
  const [step, setStep] = useState(1);
  const [preferredName, setPreferredName] = useState(currentUser?.displayName || '');
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setSaving(true);
    try {
      const updates = {
        displayName: preferredName.trim() || currentUser?.displayName || 'Tavi User',
        preferredLanguage: language,
        onboardingCompleted: true,
      };

      if (idToken) {
        await api.updateUserProfile(idToken, updates);
      }

      updateMongoUser(updates);
      if (onComplete) onComplete();
    } catch (err) {
      console.warn('[Onboarding error]:', err.message);
      if (onComplete) onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-md w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-6 sm:p-8 dark:text-white text-slate-900 shadow-2xl relative overflow-hidden"
      >
        {/* Step Progress indicators */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-blue-500'
                    : s < step
                    ? 'w-4 bg-blue-700'
                    : 'w-4 dark:bg-slate-800 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-wider dark:text-slate-400 text-slate-500">
            Step {step} of 4
          </span>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome & Overview */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-2"
            >
              <div className="w-16 h-16 mx-auto mb-4">
                <BrandLogo size={64} animated />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
                Welcome to Tavi AI
              </h2>
              <p className="text-xs uppercase tracking-widest dark:text-slate-400 text-slate-500 font-semibold mt-1">
                One AI. Infinite Possibilities.
              </p>
              <p className="text-xs dark:text-slate-300 text-slate-600 mt-4 leading-relaxed">
                Tavi is your intelligent digital companion, designed by{' '}
                <strong className="text-blue-500">Tilak Dalai</strong> to help you think, learn,
                code, and solve problems effortlessly.
              </p>

              <button
                onClick={() => setStep(2)}
                className="w-full mt-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/25"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Preferred Name */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold dark:text-white text-slate-900">What should Tavi call you?</h2>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">
                Personalize how Tavi addresses you during conversations.
              </p>

              <div className="mt-6">
                <label className="block text-[11px] dark:text-slate-400 text-slate-600 font-medium mb-1.5">
                  Your Preferred Name
                </label>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Response Language */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-500 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold dark:text-white text-slate-900">Choose your primary language</h2>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">
                Tavi naturally understands and replies in multiple languages.
              </p>

              <div className="mt-5 space-y-2 max-h-48 overflow-y-auto pr-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left text-xs ${
                      language === lang.id
                        ? 'dark:bg-blue-600/20 dark:border-blue-500/80 dark:text-white bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{lang.label}</div>
                      <div className="text-[10px] dark:text-slate-400 text-slate-500">{lang.sub}</div>
                    </div>
                    {language === lang.id && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                  </button>
                ))}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <span>Next: Features</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Capabilities & Ready */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-500 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold dark:text-white text-slate-900">You're all set!</h2>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">
                Explore what Tavi AI can do for you:
              </p>

              <div className="mt-4 space-y-2 text-xs dark:text-slate-300 text-slate-600">
                <div className="flex items-start space-x-2 dark:bg-slate-800/40 bg-slate-50 p-2.5 rounded-xl border dark:border-slate-800 border-slate-200">
                  <span className="text-blue-500 font-bold">💬</span>
                  <span><strong>Reasoning & Chat:</strong> Brainstorm, summarize, and solve problems.</span>
                </div>
                <div className="flex items-start space-x-2 dark:bg-slate-800/40 bg-slate-50 p-2.5 rounded-xl border dark:border-slate-800 border-slate-200">
                  <span className="text-purple-500 font-bold">🧠</span>
                  <span><strong>Memory Engine:</strong> Remembers your key preferences and facts.</span>
                </div>
                <div className="flex items-start space-x-2 dark:bg-slate-800/40 bg-slate-50 p-2.5 rounded-xl border dark:border-slate-800 border-slate-200">
                  <span className="text-cyan-500 font-bold">🎙️</span>
                  <span><strong>Voice & Docs:</strong> Real-time voice dictation and document analysis.</span>
                </div>
              </div>

              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/25"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>{saving ? 'Creating Profile...' : 'Start Conversing with Tavi'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

