import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../common/BrandLogo.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const MULTILINGUAL_CREDITS = [
  { lang: 'English', text: 'Made by Tilak Dalai' },
  { lang: 'Hindi', text: 'तिलक दलाई द्वारा निर्मित' },
  { lang: 'Odia', text: 'ତିଲକ ଦଳାଇଙ୍କ ଦ୍ୱାରା ନିର୍ମିତ', font: 'font-odia' },
  { lang: 'Sanskrit', text: 'तिलक दलाइ द्वारा निर्मितम्' },
  { lang: 'Bengali', text: 'তিলক দালাইয়ের তৈরি' },
  { lang: 'Spanish', text: 'Creado por Tilak Dalai' },
  { lang: 'French', text: 'Créé par Tilak Dalai' },
  { lang: 'German', text: 'Erstellt von Tilak Dalai' },
  { lang: 'Japanese', text: 'ティラク・ダライ制作' },
  { lang: 'Korean', text: '틸락 달라이 제작' },
  { lang: 'Chinese', text: '由 Tilak Dalai 创作' },
  { lang: 'Portuguese', text: 'Criado por Tilak Dalai' },
];

export default function MultilingualLoader({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const { reducedMotion } = useTheme();

  useEffect(() => {
    // Cycle languages every 1.6s
    const textInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MULTILINGUAL_CREDITS.length);
    }, 1600);

    // Progress bar simulation up to 100%
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 110);

    // Timeout safety fallback (max 2.8 seconds)
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  const current = MULTILINGUAL_CREDITS[index];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090D16] text-white overflow-hidden selection:bg-blue-600"
    >
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-purple-600/15 to-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Logo */}
        <motion.div
          animate={reducedMotion ? {} : { scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6 drop-shadow-[0_0_25px_rgba(59,130,246,0.45)]"
        >
          <BrandLogo size={68} animated={!reducedMotion} />
        </motion.div>

        {/* Brand Name & Tagline */}
        <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
          TAVI AI
        </h1>
        <p className="mt-1 text-xs tracking-widest text-slate-400 uppercase font-medium">
          An intelligent companion for everyone
        </p>

        {/* Creator Name Ribbon */}
        <div className="mt-8 mb-4">
          <span className="text-[11px] font-semibold tracking-[0.25em] text-cyan-400/90 uppercase border-b border-cyan-500/30 pb-0.5">
            TILAK DALAI
          </span>
        </div>

        {/* Rotating Multilingual Credit */}
        <div className="h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.text}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`text-sm text-slate-300 font-medium ${current.font || ''}`}
            >
              {current.text}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-slate-800/80 rounded-full mt-6 overflow-hidden border border-slate-700/50">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

