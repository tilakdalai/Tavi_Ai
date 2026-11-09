import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Menu, Plus, Sparkles, Sun, Moon, Download } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import BrandLogo from './components/common/BrandLogo.jsx';
import MultilingualLoader from './components/loading/MultilingualLoader.jsx';
import LoginView from './components/auth/LoginView.jsx';
import OnboardingModal from './components/onboarding/OnboardingModal.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import WelcomeScreen from './components/chat/WelcomeScreen.jsx';
import MessageList from './components/chat/MessageList.jsx';
import Composer from './components/chat/Composer.jsx';
import AboutModal from './components/modals/AboutModal.jsx';
import SettingsModal from './components/modals/SettingsModal.jsx';
import MemoryModal from './components/modals/MemoryModal.jsx';
import AdminModal from './components/modals/AdminModal.jsx';
import LegalModal from './components/modals/LegalModal.jsx';
import InstallAppModal from './components/modals/InstallAppModal.jsx';
import { usePWAInstall } from './hooks/usePWAInstall.js';
import { api } from './services/api.js';
import voiceService from './services/voiceService.js';

function MainChatApp() {
  const { currentUser, mongoUser, idToken, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();

  // App initialization states
  const [showInitialLoader, setShowInitialLoader] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingCitations, setStreamingCitations] = useState([]);
  const [selectedModel, setSelectedModel] = useState('beam:cloud');
  const [searchMode, setSearchMode] = useState('auto');
  const [streamingStatus, setStreamingStatus] = useState(null);

  // UI Navigation states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [legalModal, setLegalModal] = useState({ open: false, type: 'privacy' });

  const abortControllerRef = useRef(null);

  // Load conversations when authenticated (with instant localStorage cache fallback)
  const loadConversations = async () => {
    try {
      const cached = localStorage.getItem('tavi_conversations_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
        }
      }
    } catch (e) {}

    if (!idToken) return;
    try {
      const data = await api.getConversations(idToken);
      const convList = data.conversations || [];
      setConversations(convList);
      try {
        localStorage.setItem('tavi_conversations_cache', JSON.stringify(convList));
      } catch (e) {}

      if (!activeConversationId && convList.length > 0) {
        // Load first active conversation if none selected
        selectConversation(convList[0]._id);
      }
    } catch (err) {
      console.warn('Load conversations error:', err.message);
    }
  };

  useEffect(() => {
    if (idToken) {
      loadConversations();
    }
  }, [idToken]);

  // Load messages for selected conversation with zero-lag cache display
  const selectConversation = async (id) => {
    if (!id) return;
    setActiveConversationId(id);

    // 1. Immediately read from localStorage cache so chat history displays with 0 lag
    try {
      const cached = localStorage.getItem(`tavi_msgs_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (e) {}

    if (!idToken) return;

    // 2. Fetch fresh conversation messages from server
    try {
      const data = await api.getConversation(idToken, id);
      const fetched = data.messages || [];
      setMessages(fetched);
      try {
        localStorage.setItem(`tavi_msgs_${id}`, JSON.stringify(fetched));
      } catch (e) {}
    } catch (err) {
      console.warn('Load conversation messages error:', err.message);
    }
  };

  // Start a new clean chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setStreamingCitations([]);
    setStreamingStatus(null);
  };

  // Rename conversation
  const handleRename = async (id, newTitle) => {
    if (!idToken) return;
    try {
      await api.updateConversation(idToken, id, { title: newTitle });
      setConversations((prev) => {
        const updated = prev.map((c) => (c._id === id ? { ...c, title: newTitle } : c));
        try {
          localStorage.setItem('tavi_conversations_cache', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    } catch (err) {
      console.warn('Rename error:', err.message);
    }
  };

  // Pin conversation
  const handlePin = async (id, isPinned) => {
    if (!idToken) return;
    try {
      await api.updateConversation(idToken, id, { isPinned });
      setConversations((prev) => {
        const updated = prev.map((c) => (c._id === id ? { ...c, isPinned } : c));
        try {
          localStorage.setItem('tavi_conversations_cache', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    } catch (err) {
      console.warn('Pin error:', err.message);
    }
  };

  // Archive conversation
  const handleArchive = async (id, isArchived) => {
    if (!idToken) return;
    try {
      await api.updateConversation(idToken, id, { isArchived });
      setConversations((prev) => {
        const updated = prev.map((c) => (c._id === id ? { ...c, isArchived } : c));
        try {
          localStorage.setItem('tavi_conversations_cache', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.warn('Archive error:', err.message);
    }
  };

  // Delete conversation
  const handleDelete = async (id) => {
    try {
      localStorage.removeItem(`tavi_msgs_${id}`);
    } catch (e) {}

    if (!idToken) return;
    try {
      await api.deleteConversation(idToken, id);
      setConversations((prev) => {
        const updated = prev.filter((c) => c._id !== id);
        try {
          localStorage.setItem('tavi_conversations_cache', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.warn('Delete error:', err.message);
    }
  };

  // Send message & stream response
  const handleSendMessage = async ({ content, attachments = [], model, searchMode: searchModeProp }) => {
    if (!content.trim() && attachments.length === 0) return;

    const userMessage = {
      role: 'user',
      content,
      attachments,
      createdAt: new Date().toISOString(),
    };

    let targetConvId = activeConversationId;

    // If starting a brand new conversation, create it first
    if (!targetConvId && idToken) {
      try {
        const titleDerived = content.length > 40 ? `${content.slice(0, 38)}...` : content;
        const newConvData = await api.createConversation(idToken, titleDerived);
        if (newConvData.conversation?._id) {
          targetConvId = newConvData.conversation._id;
          setActiveConversationId(targetConvId);
          setConversations((prev) => {
            const updated = [newConvData.conversation, ...prev];
            try {
              localStorage.setItem('tavi_conversations_cache', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      } catch (err) {
        console.warn('Auto conversation create notice:', err.message);
      }
    }

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      if (targetConvId) {
        try {
          localStorage.setItem(`tavi_msgs_${targetConvId}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    setIsStreaming(true);
    setStreamingContent('');
    setStreamingCitations([]);
    setStreamingStatus(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedText = '';
    let accumulatedCitations = [];

    await api.streamChat({
      token: idToken,
      conversationId: targetConvId,
      content,
      attachments,
      model: model || selectedModel,
      searchMode: searchModeProp || searchMode,
      language: mongoUser?.preferredLanguage || 'en',
      signal: abortController.signal,
      onStatus: (status) => {
        setStreamingStatus(status);
      },
      onSources: (sources) => {
        accumulatedCitations = sources;
        setStreamingCitations(sources);
      },
      onChunk: (chunk, citations) => {
        if (chunk) {
          accumulatedText += chunk;
          setStreamingContent(accumulatedText);
        }
        if (citations) {
          accumulatedCitations = citations;
          setStreamingCitations(citations);
        }
      },
      onDone: (fullText, citations) => {
        setIsStreaming(false);
        setStreamingStatus(null);
        const finalAssistantMsg = {
          role: 'assistant',
          content: fullText || accumulatedText,
          citations: citations || accumulatedCitations,
          modelMetadata: { model: model || selectedModel },
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => {
          const updated = [...prev, finalAssistantMsg];
          if (targetConvId) {
            try {
              localStorage.setItem(`tavi_msgs_${targetConvId}`, JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        });
        setStreamingContent('');
        setStreamingCitations([]);

        // Auto-read response aloud if enabled in settings (sweet feminine voice & auto multilingual)
        if (mongoUser?.preferences?.voiceAutoPlay) {
          voiceService.speak(fullText || accumulatedText);
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingStatus(null);
        const errorMsg = {
          role: 'assistant',
          content: `⚠️ **Connection Notice:** ${err.message || 'Unable to complete response.'}`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => {
          const updated = [...prev, errorMsg];
          if (targetConvId) {
            try {
              localStorage.setItem(`tavi_msgs_${targetConvId}`, JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        });
        setStreamingContent('');
      },
    });
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingStatus(null);
      if (streamingContent) {
        setMessages((prev) => {
          const updated = [
            ...prev,
            {
              role: 'assistant',
              content: streamingContent + ' *(Stopped)*',
              citations: streamingCitations,
              createdAt: new Date().toISOString(),
            },
          ];
          if (activeConversationId) {
            try {
              localStorage.setItem(`tavi_msgs_${activeConversationId}`, JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        });
        setStreamingContent('');
      }
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (messages.length < 2 || isStreaming) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant message
      setMessages((prev) => prev.slice(0, prev.length - 1));
      handleSendMessage({
        content: lastUserMsg.content,
        attachments: lastUserMsg.attachments,
        model: selectedModel,
      });
    }
  };

  // Render initial multilingual loading screen
  if (showInitialLoader) {
    return (
      <MultilingualLoader
        onComplete={() => {
          setShowInitialLoader(false);
        }}
      />
    );
  }

  // Render login screen if unauthenticated
  if (!currentUser) {
    return (
      <>
        <LoginView
          onOpenPrivacy={() => setLegalModal({ open: true, type: 'privacy' })}
          onOpenTerms={() => setLegalModal({ open: true, type: 'terms' })}
        />
        <LegalModal
          isOpen={legalModal.open}
          type={legalModal.type}
          onClose={() => setLegalModal({ open: false, type: 'privacy' })}
        />
      </>
    );
  }

  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#090D16] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* First-Time User Onboarding Modal */}
      {mongoUser && !mongoUser.onboardingCompleted && (
        <OnboardingModal
          isOpen={true}
          onComplete={() => {
            // Reload conversations or start conversation
            loadConversations();
          }}
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRename}
        onPinConversation={handlePin}
        onArchiveConversation={handleArchive}
        onDeleteConversation={handleDelete}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAbout={() => setShowAbout(true)}
        onOpenMemory={() => setShowMemory(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenInstall={() => setShowInstallModal(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Navbar */}
        <header className="h-14 px-4 border-b dark:border-slate-800/60 border-slate-200/80 flex items-center justify-between flex-shrink-0 dark:bg-slate-950/60 bg-white/80 backdrop-blur-md z-10 transition-colors duration-300">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="text-xs font-semibold dark:text-slate-200 text-slate-800 truncate max-w-[140px] sm:max-w-[200px] transition-colors">
                {activeConversation?.title || 'New Conversation'}
              </span>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/50 bg-slate-100 text-slate-700 border-slate-200 text-[11px] border transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">Tavi AI</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Install App PWA Button */}
            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) {
                    installApp();
                  } else {
                    setShowInstallModal(true);
                  }
                }}
                title="Install Tavi AI App"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {/* Quick Dark/Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/60 dark:text-slate-300 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-1.5"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden md:inline text-[11px]">Dark</span>
                </>
              )}
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/60 dark:text-slate-200 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Content Area: Welcome Screen or Message List */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {(!activeConversationId && messages.length === 0) ? (
            <WelcomeScreen
              onSelectPrompt={(promptText) => {
                handleSendMessage({ content: promptText });
              }}
            />
          ) : (
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              streamingCitations={streamingCitations}
              streamingStatus={streamingStatus}
              onRegenerate={handleRegenerate}
            />
          )}

          {/* Composer Input Bar */}
          <Composer
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isStreaming={isStreaming}
            searchMode={searchMode}
            onSelectSearchMode={setSearchMode}
          />
        </div>
      </main>

      {/* Modals */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <MemoryModal isOpen={showMemory} onClose={() => setShowMemory(false)} />
      <AdminModal isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
      <LegalModal
        isOpen={legalModal.open}
        type={legalModal.type}
        onClose={() => setLegalModal({ open: false, type: 'privacy' })}
      />
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={installApp}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainChatApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
