import React from 'react';
import { Sparkles, Code2, Compass, Globe } from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';
import FadeContent from '../common/FadeContent.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const STARTER_PROMPTS = [
  {
    icon: Globe,
    title: 'Real-Time Web Search',
    desc: 'What are the latest tech headlines and major world updates today?',
    color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
  },
  {
    icon: Code2,
    title: 'Full-Stack Engineering',
    desc: 'Write and review clean, production-ready code with best practices.',
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
  },
  {
    icon: Compass,
    title: 'Deep Concept Breakdown',
    desc: 'Explain quantum computing, neural networks, or algorithms simply.',
    color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30',
  },
  {
    icon: Sparkles,
    title: 'About Creator',
    desc: 'Tell me about your creator Tilak Dalai and what inspired Tavi AI.',
    color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
  },
];

export default function WelcomeScreen({ onSelectPrompt }) {
  const { currentUser, mongoUser } = useAuth();
  const displayName = mongoUser?.displayName || currentUser?.displayName || 'there';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-3xl mx-auto w-full select-none">
      {/* Header with FadeContent */}
      <FadeContent
        effect="focus"
        duration={0.9}
        ease="power2.out"
        trigger="mount"
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
          <BrandLogo size={64} animated />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-slate-100 text-slate-900 transition-colors">
          Hello, <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">{displayName}</span>. I'm Tavi.
        </h1>
        <p className="text-xs uppercase tracking-widest dark:text-slate-400 text-slate-500 font-semibold mt-2 transition-colors">
          One AI. Infinite Possibilities.
        </p>

        <div className="mt-2.5 flex items-center justify-center space-x-1.5 text-xs dark:text-slate-400 text-slate-500 transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Intelligent Personal AI Assistant</span>
        </div>

        <p className="text-xs dark:text-slate-400 text-slate-500 mt-2 transition-colors">
          Designed & Developed by <strong className="text-blue-500">Tilak Dalai</strong>
        </p>
      </FadeContent>

      {/* Starter Prompts Grid with FadeContent stagger */}
      <FadeContent
        effect="fade"
        duration={0.8}
        stagger={0.1}
        staggerFrom="start"
        ease="power2.out"
        trigger="mount"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
      >
        {STARTER_PROMPTS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => onSelectPrompt(item.desc)}
              className="group flex flex-col text-left p-4 rounded-2xl dark:bg-slate-900/60 dark:hover:bg-slate-800/80 dark:border-slate-800/80 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center space-x-2.5 mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.color} border`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold dark:text-slate-200 text-slate-800 dark:group-hover:text-blue-400 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-600 line-clamp-2 leading-relaxed transition-colors">
                {item.desc}
              </p>
            </button>
          );
        })}
      </FadeContent>
    </div>
  );
}
