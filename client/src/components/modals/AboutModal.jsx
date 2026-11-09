import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Github, Linkedin, Globe, Code, Sparkles, Award } from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-md w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-6 sm:p-7 dark:text-white text-slate-900 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
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
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
            Tavi AI
          </h2>
          <p className="text-xs uppercase tracking-widest dark:text-slate-400 text-slate-500 font-semibold mt-0.5">
            One AI. Infinite Possibilities.
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[11px] text-blue-500 font-medium">
            Version 1.0.0 • Production Ready
          </div>
        </div>

        {/* Creator Identity Section */}
        <div className="dark:bg-slate-800/50 bg-slate-50 border dark:border-slate-700/60 border-slate-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center space-x-2 text-xs font-bold dark:text-slate-200 text-slate-700 uppercase tracking-wider mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Designed & Developed by</span>
          </div>

          <h3 className="text-lg font-bold dark:text-white text-slate-900">Tilak Dalai</h3>
          <p className="text-xs text-blue-500 font-medium mt-0.5">
            Student & Full-Stack Web Developer
          </p>

          <div className="mt-3 text-xs dark:text-slate-300 text-slate-600 leading-relaxed space-y-1">
            <p>
              <strong>Education:</strong> B.Tech in Computer Science and Engineering
            </p>
            <p>
              <strong>Institution:</strong> Government College of Engineering, Kalahandi, Odisha, India
            </p>
            <p>
              <strong>Technical Skills:</strong> Java, Python, C/C++, JavaScript, React.js, Node.js, Express, SQL, AI Integration.
            </p>
          </div>

          {/* Social Profiles */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t dark:border-slate-700/60 border-slate-200">
            <a
              href="https://tilak-portfolio-wine.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600/50 dark:text-white bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              <span>Portfolio</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="https://github.com/tilakdalai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600/50 dark:text-white bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Github className="w-3.5 h-3.5 dark:text-slate-200 text-slate-700" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="https://www.linkedin.com/in/tilak-dalai-04001a334/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600/50 dark:text-white bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-500" />
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Architecture & AI Engine Info */}
        <div className="dark:bg-slate-800/30 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-2xl p-4 text-xs dark:text-slate-400 text-slate-600 space-y-1.5">
          <div className="flex items-center space-x-1.5 dark:text-slate-300 text-slate-800 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>AI Architecture & Technology</span>
          </div>
          <p>• <strong>Cognitive System:</strong> Tavi Real-Time Reasoning & Live Web Engine</p>
          <p>• <strong>Frontend:</strong> React 18, Vite, Tailwind CSS, Framer Motion</p>
          <p>• <strong>Backend:</strong> Node.js, Express.js, Server-Sent Events (SSE)</p>
          <p>• <strong>Persistence:</strong> MongoDB Atlas NoSQL with Mongoose</p>
          <p>• <strong>Authentication:</strong> Native Privacy-First Local Authentication</p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

