import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  ExternalLink,
  FileText,
  Globe,
  Search,
  ChevronDown,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import voiceService from '../../services/voiceService.js';

export default function MessageItem({
  message,
  onRegenerate,
  isStreaming = false,
  streamingStatus = null,
}) {
  const { idToken } = useAuth();
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(message.feedback || null);
  const [showSources, setShowSources] = useState(false);

  const isAssistant = message.role === 'assistant';

  // Copy response content
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text-to-Speech with natural sweet feminine voice & auto multilingual detection
  const handleToggleSpeech = () => {
    if (speaking) {
      voiceService.stop();
      setSpeaking(false);
    } else {
      voiceService.speak(message.content, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  useEffect(() => {
    return () => {
      if (speaking) {
        voiceService.stop();
      }
    };
  }, [speaking]);

  // Submit feedback
  const handleFeedback = async (type) => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    if (message._id && idToken) {
      try {
        await api.submitFeedback(idToken, message._id, newFeedback);
      } catch (err) {
        console.warn('Feedback submission error:', err.message);
      }
    }
  };

  return (
    <div
      className={`py-5 px-4 sm:px-6 flex space-x-3 sm:space-x-4 transition-colors duration-300 ${
        isAssistant
          ? 'dark:bg-slate-900/40 dark:border-slate-800/40 bg-slate-100/70 border-slate-200/90 border-y'
          : 'bg-transparent'
      }`}
    >
      {/* Avatar Icon */}
      <div className="flex-shrink-0 pt-0.5">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-xl dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border flex items-center justify-center shadow-sm transition-colors overflow-hidden">
            <BrandLogo size={28} animated={isStreaming} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            U
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-bold dark:text-slate-200 text-slate-800 transition-colors">
            {isAssistant ? 'Tavi AI' : 'You'}
          </span>
          <span className="text-[10px] dark:text-slate-500 text-slate-400 transition-colors">
            {message.createdAt
              ? new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Just now'}
          </span>
        </div>

        {/* Attached Documents if present */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {message.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg dark:bg-slate-800/80 dark:border-slate-700/60 dark:text-slate-300 bg-white border border-slate-200 text-slate-700 text-xs shadow-sm transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium truncate max-w-[150px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Live Search Status Pipeline Banner */}
        {isStreaming && streamingStatus && (
          <div className="mb-3 px-3 py-2 rounded-xl dark:bg-slate-800/70 dark:border-cyan-500/30 dark:text-cyan-300 bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center space-x-2.5 text-xs transition-colors">
            <Globe className="w-4 h-4 text-cyan-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="font-medium">{streamingStatus}</span>
            <span className="flex space-x-1 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}

        {/* Message Content rendered with ReactMarkdown */}
        <div className="prose dark:prose-invert prose-slate max-w-none dark:text-slate-200 text-slate-800 leading-relaxed break-words transition-colors">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom code block with copy button
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const lang = match ? match[1] : '';
                const codeString = String(children).replace(/\n$/, '');

                if (!inline && lang) {
                  return (
                    <div className="relative my-3 rounded-xl overflow-hidden border dark:border-slate-800 border-slate-200 dark:bg-[#0d1117] bg-slate-900 text-slate-100 shadow-sm">
                      <div className="flex items-center justify-between px-3 py-1.5 dark:bg-slate-800/70 bg-slate-800 border-b dark:border-slate-700/50 border-slate-700 text-[11px] text-slate-400 font-mono">
                        <span>{lang}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(codeString);
                          }}
                          className="flex items-center space-x-1 hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy code</span>
                        </button>
                      </div>
                      <pre className="p-3 text-xs overflow-x-auto font-mono text-slate-200 leading-normal">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                }

                return (
                  <code
                    className="px-1.5 py-0.5 rounded dark:bg-slate-800 dark:text-blue-300 bg-slate-100 text-blue-600 font-mono text-xs border dark:border-transparent border-slate-200"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {/* Real-time Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
          )}
        </div>

        {/* Google-like Verified Sources Cards (Collapsible Toggle) */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t dark:border-slate-800/80 border-slate-200 transition-colors">
            <button
              type="button"
              onClick={() => setShowSources((prev) => !prev)}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl dark:bg-slate-800/70 dark:hover:bg-slate-800 dark:border-slate-700/60 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-medium transition-all group cursor-pointer select-none"
              aria-expanded={showSources}
              title={showSources ? 'Hide verified sources' : 'Show verified sources'}
            >
              <Globe className="w-3.5 h-3.5 text-blue-500 group-hover:rotate-12 transition-transform duration-200 flex-shrink-0" />
              <span className="text-[11px] uppercase tracking-wider dark:text-slate-300 text-slate-700 font-semibold">
                Verified Sources ({message.citations.length})
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-transform duration-200 ${
                  showSources ? 'rotate-180 text-blue-500' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3">
                    {message.citations.map((c, i) => {
                      let domain = c.domain;
                      if (!domain && c.url) {
                        try {
                          domain = new URL(c.url).hostname.replace(/^www\./, '');
                        } catch {
                          domain = 'web';
                        }
                      }
                      const faviconUrl = c.favicon || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null);

                      return (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col justify-between p-2.5 rounded-xl dark:bg-slate-800/40 dark:hover:bg-slate-800/80 dark:border-slate-700/50 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500/50 transition-all hover:shadow-md"
                        >
                          <div>
                            <div className="flex items-center space-x-1.5 mb-1.5">
                              {faviconUrl ? (
                                <img
                                  src={faviconUrl}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              )}
                              <span className="text-[10px] font-medium dark:text-slate-400 text-slate-500 group-hover:text-cyan-500 truncate max-w-[120px]">
                                {domain || 'Source'}
                              </span>
                              <span className="text-[9px] text-slate-400 ml-auto font-mono">[{i + 1}]</span>
                            </div>
                            <h4 className="text-xs font-medium dark:text-slate-200 text-slate-800 group-hover:text-blue-500 line-clamp-2 leading-snug">
                              {c.title || c.url}
                            </h4>
                          </div>

                          {c.snippet && (
                            <p className="text-[11px] dark:text-slate-400/90 text-slate-600 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                              {c.snippet}
                            </p>
                          )}

                          <div className="flex items-center space-x-1 text-[10px] text-blue-500 group-hover:text-blue-600 mt-2 font-medium">
                            <span>Visit page</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action Toolbar for Assistant Messages */}
        {isAssistant && !isStreaming && (
          <div className="flex items-center space-x-1 mt-3 pt-2 dark:text-slate-400 text-slate-500 transition-colors">
            <button
              onClick={handleCopy}
              title="Copy message"
              className="p-1.5 rounded-lg dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleToggleSpeech}
              title={speaking ? 'Stop speech' : 'Read aloud'}
              className="p-1.5 rounded-lg dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => handleFeedback('like')}
              title="Helpful response"
              className={`p-1.5 rounded-lg transition-colors ${
                feedback === 'like'
                  ? 'text-blue-500 bg-blue-500/10'
                  : 'dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleFeedback('dislike')}
              title="Not helpful"
              className={`p-1.5 rounded-lg transition-colors ${
                feedback === 'dislike'
                  ? 'text-rose-500 bg-rose-500/10'
                  : 'dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerate response"
                className="p-1.5 rounded-lg dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

