import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileText,
  ChevronDown,
  Globe,
  Search,
  Zap,
} from 'lucide-react';

const SEARCH_MODES = [
  { id: 'auto', name: 'Auto Search', desc: 'Smart search for real-time queries', icon: Globe, color: 'text-cyan-400' },
  { id: 'web', name: 'Force Web Search', desc: 'Always search & scrape live web', icon: Search, color: 'text-emerald-400' },
  { id: 'ai_only', name: 'AI Only', desc: 'Direct reasoning without web lookup', icon: Zap, color: 'text-amber-400' },
];

export default function Composer({
  onSendMessage,
  onStopGeneration,
  isStreaming = false,
  searchMode = 'auto',
  onSelectSearchMode,
}) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showSearchMenu, setShowSearchMenu] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [content]);

  // Handle Speech-to-Text via Web Speech API
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please try Google Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsRecording(false);
    }
  };

  // Handle File Upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            textContent: reader.result || '',
          },
        ]);
      };
      // Read as text for document/code files
      reader.readAsText(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Submit
  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage({
      content: content.trim(),
      attachments,
      searchMode,
    });
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 sm:p-4 border-t dark:border-slate-800/80 border-slate-200/80 dark:bg-[#090D16]/90 bg-white/90 backdrop-blur-lg transition-colors duration-300">
      <div className="max-w-3xl mx-auto w-full">
        {/* Search Mode Selector & Character Counter */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center space-x-2">
            {/* Live Search Mode Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSearchMenu((prev) => !prev)}
                type="button"
                className="flex items-center space-x-1.5 text-[11px] font-medium dark:text-slate-400 dark:hover:text-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:border-slate-700/60 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200 px-2.5 py-1 rounded-full border transition-colors"
              >
                {(() => {
                  const curr = SEARCH_MODES.find((s) => s.id === searchMode) || SEARCH_MODES[0];
                  const Icon = curr.icon;
                  return (
                    <>
                      <Icon className={`w-3 h-3 ${curr.color}`} />
                      <span>{curr.name}</span>
                    </>
                  );
                })()}
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showSearchMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 shadow-2xl p-1.5 z-30 transition-colors">
                  <div className="text-[10px] uppercase font-bold text-slate-500 px-2.5 py-1">
                    Web Search Engine Mode
                  </div>
                  {SEARCH_MODES.map((sm) => {
                    const SmIcon = sm.icon;
                    return (
                      <button
                        key={sm.id}
                        onClick={() => {
                          if (onSelectSearchMode) onSelectSearchMode(sm.id);
                          setShowSearchMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-start space-x-2.5 transition-colors ${
                          searchMode === sm.id
                            ? 'dark:bg-blue-600/20 dark:text-blue-400 bg-blue-50 text-blue-600 font-semibold'
                            : 'dark:text-slate-300 dark:hover:bg-slate-800 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <SmIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${sm.color}`} />
                        <div>
                          <div className="text-xs">{sm.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal leading-tight">
                            {sm.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <span className="text-[10px] text-slate-500">
            {content.length > 0 && `${content.length} / 15,000`}
          </span>
        </div>

        {/* Attachment Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 px-1">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-200 bg-slate-100 border-slate-200 text-slate-800 text-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate max-w-[140px] font-medium">{att.name}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="p-0.5 rounded dark:hover:bg-slate-700 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Composer Box */}
        <div className="relative flex items-end rounded-2xl dark:bg-slate-900 dark:border-slate-800 bg-slate-100/90 border border-slate-200/90 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/50 shadow-inner p-2 transition-colors duration-300">
          {/* File Upload Hidden Input & Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept=".txt,.json,.csv,.md,.js,.ts,.py,.html,.css"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach document or code file"
            className="p-2 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded-xl transition-colors mb-0.5"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Mic Input Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            title={isRecording ? 'Listening... click to stop' : 'Voice dictation'}
            className={`p-2 rounded-xl transition-colors mb-0.5 ${
              isRecording
                ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                : 'dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening to your voice...'
                : 'Message Tavi... (Shift+Enter for newline)'
            }
            className="flex-1 max-h-48 resize-none bg-transparent px-2.5 py-1.5 text-sm dark:text-slate-100 dark:placeholder-slate-500 text-slate-900 placeholder-slate-400 focus:outline-none leading-relaxed transition-colors"
          />

          {/* Send or Stop Generation Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              title="Stop generation"
              className="p-2 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-200 hover:bg-slate-300 text-rose-500 transition-all mb-0.5"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() && attachments.length === 0}
              title="Send message"
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all mb-0.5 disabled:opacity-40 disabled:hover:bg-blue-600 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer Credit & Disclaimer */}
        <p className="text-[10px] text-center dark:text-slate-500 text-slate-400 mt-2 transition-colors">
          Tavi AI can make mistakes. Verify important facts. • Created by{' '}
          <span className="font-semibold dark:text-slate-400 text-slate-600">Tilak Dalai</span>
        </p>
      </div>
    </div>
  );
}

