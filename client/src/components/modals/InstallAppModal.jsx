import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Download,
  CheckCircle,
  Share,
  PlusSquare,
  Monitor,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';

export default function InstallAppModal({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-md w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-6 sm:p-7 dark:text-white text-slate-900 shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3">
            <BrandLogo size={64} animated />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-slate-900">
            Install Tavi AI App
          </h2>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">
            Access your assistant instantly from your Desktop, Start Menu, or Mobile Home Screen.
          </p>
        </div>

        {/* Already Installed View */}
        {isInstalled ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-emerald-400">
              Tavi AI is already installed!
            </p>
            <p className="text-xs dark:text-slate-400 text-slate-600">
              You are running Tavi in standalone app mode with instant launch and offline access.
            </p>
            <button
              onClick={onClose}
              className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs transition-colors"
            >
              Done
            </button>
          </div>
        ) : isIOS ? (
          /* iOS Safari Instructions */
          <div className="space-y-4 py-2">
            <div className="dark:bg-slate-800/50 bg-slate-50 border dark:border-slate-700/60 border-slate-200 rounded-2xl p-4 text-xs space-y-3">
              <div className="flex items-center space-x-2 font-bold text-blue-500">
                <Smartphone className="w-4 h-4" />
                <span>How to Install on iPhone / iPad (Safari)</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="dark:text-slate-300 text-slate-700">
                  Tap the <strong className="inline-flex items-center space-x-1"><Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> Share button</strong> in the Safari toolbar.
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="dark:text-slate-300 text-slate-700">
                  Scroll down and tap <strong className="inline-flex items-center space-x-1"><PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> Add to Home Screen</strong>.
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="dark:text-slate-300 text-slate-700">
                  Tap <strong>Add</strong> at the top right to complete installation.
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        ) : (
          /* Chrome / Edge / Windows / Android Native PWA Prompt */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl dark:bg-slate-800/40 bg-slate-50 border dark:border-slate-800 border-slate-200">
                <Monitor className="w-4 h-4 text-cyan-500 mb-1" />
                <div className="font-semibold dark:text-white text-slate-900">Desktop App</div>
                <div className="text-[10px] dark:text-slate-400 text-slate-500">Standalone window without browser tabs</div>
              </div>

              <div className="p-3 rounded-2xl dark:bg-slate-800/40 bg-slate-50 border dark:border-slate-800 border-slate-200">
                <Sparkles className="w-4 h-4 text-purple-500 mb-1" />
                <div className="font-semibold dark:text-white text-slate-900">Quick Launch</div>
                <div className="text-[10px] dark:text-slate-400 text-slate-500">Launch directly from Taskbar or Dock</div>
              </div>
            </div>

            <button
              onClick={async () => {
                const installed = await onInstall();
                if (installed) {
                  onClose();
                }
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Install Tavi AI App</span>
            </button>

            <p className="text-[10px] text-center dark:text-slate-500 text-slate-400">
              You can also click the Install icon (💻 / ⊕) in your browser's address bar at any time.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

