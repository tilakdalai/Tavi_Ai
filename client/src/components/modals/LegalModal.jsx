import React from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck, FileText } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, type = 'privacy' }) {
  if (!isOpen) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-xl w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-6 sm:p-7 dark:text-white text-slate-900 shadow-2xl relative max-h-[85vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5 mb-1">
          {isPrivacy ? (
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          ) : (
            <FileText className="w-5 h-5 text-purple-500" />
          )}
          <h2 className="text-xl font-bold dark:text-white text-slate-900">
            {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
          </h2>
        </div>
        <p className="text-xs dark:text-slate-400 text-slate-500 mb-4">
          Tavi AI • Created by Tilak Dalai • Last updated: November 2026
        </p>

        <div className="flex-1 overflow-y-auto pr-1 text-xs dark:text-slate-300 text-slate-600 space-y-3 leading-relaxed">
          {isPrivacy ? (
            <>
              <p>
                <strong>1. Information Collection:</strong> Tavi AI collects your account identifier (via Google Authentication or email), user display name, conversation history, and optional memory preferences to deliver personalized digital assistant services.
              </p>
              <p>
                <strong>2. AI Processing Notice:</strong> User conversational prompts and attached document context are transmitted securely to our configured backend AI inference service to synthesize replies. We do not sell your personal data.
              </p>
              <p>
                <strong>3. User Data Isolation:</strong> Your private conversations and memories are cryptographically isolated at the database layer using verified authentication tokens. No other user can access or read your chats.
              </p>
              <p>
                <strong>4. Deletion & Control:</strong> You maintain full ownership of your data. You may rename, pin, archive, or delete individual conversations and memories at any time directly through the interface.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>1. Acceptance:</strong> By accessing or using Tavi AI, created by Tilak Dalai, you agree to comply with these terms.
              </p>
              <p>
                <strong>2. Appropriate Use:</strong> Tavi AI is designed to assist with learning, coding, brainstorming, and daily productivity. You agree not to use Tavi for unlawful activities, hate speech, or malicious exploits.
              </p>
              <p>
                <strong>3. AI Capabilities & Accuracy:</strong> Tavi AI provides answers synthesized from large language model technology. While high accuracy is prioritized, responses should be reviewed for critical programming, medical, or financial applications.
              </p>
              <p>
                <strong>4. Attribution:</strong> Tavi AI is the intellectual property and creation of Tilak Dalai. Reverse engineering or unauthorized commercial brand replication is prohibited.
              </p>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
        >
          Understood & Close
        </button>
      </motion.div>
    </div>
  );
}

