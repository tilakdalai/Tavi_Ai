import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sun, Moon, Globe, Volume2, EyeOff, Save, Check, Play, Square, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { api } from '../../services/api.js';
import voiceService from '../../services/voiceService.js';

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी (Hindi)' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { id: 'sa', label: 'संस्कृतम् (Sanskrit)' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const { currentUser, mongoUser, idToken, updateMongoUser } = useAuth();
  const { theme, setTheme, reducedMotion, setReducedMotion } = useTheme();

  const [language, setLanguage] = useState(mongoUser?.preferredLanguage || 'en');
  const [autoPlayVoice, setAutoPlayVoice] = useState(
    mongoUser?.preferences?.voiceAutoPlay || false
  );
  const [voicePitch, setVoicePitch] = useState(mongoUser?.preferences?.voicePitch || 1.14);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    return () => {
      voiceService.stop();
      setIsPlayingTestVoice(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    if (isPlayingTestVoice) {
      voiceService.stop();
      setIsPlayingTestVoice(false);
      return;
    }

    const testTexts = {
      or: 'ନମସ୍କାର! ମୁଁ ଟାଭି AI, ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ସହଯୋଗୀ। ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?',
      hi: 'नमस्ते! मैं टावि AI हूँ, आपकी व्यक्तिगत AI सहायक। आज मैं आपकी क्या मदद कर सकती हूँ?',
      sa: 'नमस्ते! अहं टावि AI अस्मि, भवतः वैयक्तिकः सहायकः।',
      hinglish: 'Hello! Main Tavi AI hoon, aapki sweet personal assistant. Aaj main aapki kya help kar sakti hoon?',
      en: 'Hello! I am Tavi, your sweet personal AI assistant. How can I assist you today?',
    };

    const textToSpeak = testTexts[language] || testTexts.en;

    setIsPlayingTestVoice(true);
    voiceService.speak(textToSpeak, {
      pitch: voicePitch,
      rate: 0.97,
      onEnd: () => setIsPlayingTestVoice(false),
      onError: () => setIsPlayingTestVoice(false),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        preferredLanguage: language,
        preferences: {
          theme,
          reducedMotion,
          voiceAutoPlay: autoPlayVoice,
          voicePitch,
        },
      };

      if (idToken) {
        await api.updateUserProfile(idToken, updates);
      }

      updateMongoUser(updates);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.warn('Save settings error:', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-md w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-6 sm:p-7 dark:text-white text-slate-900 shadow-2xl relative transition-colors duration-300"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-1 transition-colors">Settings & Preferences</h2>
        <p className="text-xs dark:text-slate-400 text-slate-500 mb-6 transition-colors">
          Customize your Tavi conversational experience.
        </p>

        <div className="space-y-5 text-xs">
          {/* Theme Selector */}
          <div>
            <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-2 transition-colors">Appearance Theme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold shadow-sm'
                    : 'dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-400 bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Midnight</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                  theme === 'light'
                    ? 'bg-blue-50 border-blue-500 text-blue-600 font-semibold shadow-sm'
                    : 'dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-400 bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Clean Light</span>
              </button>
            </div>
          </div>

          {/* Response Language */}
          <div>
            <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-2 transition-colors">
              Preferred Assistant Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 dark:bg-slate-800 dark:border-slate-700 bg-slate-50 border-slate-200 rounded-xl text-xs dark:text-white text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sweet Girl Voice Persona & Live Preview */}
          <div className="p-3.5 rounded-2xl dark:bg-slate-800/50 dark:border-slate-700/60 bg-gradient-to-r from-pink-50/50 via-purple-50/30 to-blue-50/50 border border-slate-200/90 dark:border-slate-700/70 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="font-semibold dark:text-slate-200 text-slate-800 text-xs">
                  Sweet Girl Voice Profile
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 font-medium">
                  Multilingual
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestVoice}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-medium shadow-sm transition-all"
                title="Hear a voice preview"
              >
                {isPlayingTestVoice ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test Voice</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-500 mb-2.5 leading-relaxed">
              Tavi uses natural melodic feminine tones that automatically detect and speak in any language (English, Odia, Hindi, and more).
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Calm & Soft', pitch: 1.08 },
                { label: 'Sweet & Warm', pitch: 1.14 },
                { label: 'Bright & Melodic', pitch: 1.22 },
              ].map((style) => (
                <button
                  key={style.label}
                  type="button"
                  onClick={() => setVoicePitch(style.pitch)}
                  className={`py-1 px-2 rounded-lg text-[10px] font-medium border text-center transition-all ${
                    Math.abs(voicePitch - style.pitch) < 0.03
                      ? 'bg-pink-500/15 border-pink-500 text-pink-500 dark:text-pink-400 font-semibold shadow-xs'
                      : 'dark:bg-slate-800/80 dark:border-slate-700 bg-white border-slate-200 dark:text-slate-400 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Auto-Play */}
          <div className="flex items-center justify-between p-3 rounded-xl dark:bg-slate-800/40 dark:border-slate-700/50 bg-slate-50 border border-slate-200 transition-colors">
            <div className="flex items-center space-x-2.5">
              <Volume2 className="w-4 h-4 text-cyan-500" />
              <div>
                <div className="font-semibold dark:text-slate-200 text-slate-800">Auto-Read Responses</div>
                <div className="text-[10px] dark:text-slate-400 text-slate-500">Read assistant replies aloud automatically</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoPlayVoice}
              onChange={(e) => setAutoPlayVoice(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3 rounded-xl dark:bg-slate-800/40 dark:border-slate-700/50 bg-slate-50 border border-slate-200 transition-colors">
            <div className="flex items-center space-x-2.5">
              <EyeOff className="w-4 h-4 text-purple-500" />
              <div>
                <div className="font-semibold dark:text-slate-200 text-slate-800">Reduced Motion</div>
                <div className="text-[10px] dark:text-slate-400 text-slate-500">Minimize animations across the app</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-blue-500/20"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

