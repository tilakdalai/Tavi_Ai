import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Archive,
  Trash2,
  Edit2,
  Check,
  X,
  Sun,
  Moon,
  Brain,
  ShieldAlert,
  Info,
  LogOut,
  ChevronRight,
  Download,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function Sidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onPinConversation,
  onArchiveConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenAbout,
  onOpenMemory,
  onOpenAdmin,
  onOpenInstall,
  isOpen = false,
  onClose,
}) {
  const { currentUser, mongoUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pinned' | 'archived'
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const isAdmin = mongoUser?.role === 'admin' || currentUser?.email?.includes('admin');

  // Filter conversations
  const filtered = conversations.filter((conv) => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'pinned') return conv.isPinned && !conv.isArchived;
    if (activeTab === 'archived') return conv.isArchived;
    return !conv.isArchived;
  });

  // Group by date
  const groupConversations = (items) => {
    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    items.forEach((conv) => {
      const date = new Date(conv.updatedAt || conv.createdAt);
      const diffDays = Math.floor((now - date) / oneDay);

      if (diffDays === 0) {
        groups.Today.push(conv);
      } else if (diffDays === 1) {
        groups.Yesterday.push(conv);
      } else if (diffDays <= 7) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  };

  const grouped = groupConversations(filtered);

  const startRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const submitRename = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col dark:bg-slate-950 bg-white border-r dark:border-slate-800/80 border-slate-200 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b dark:border-slate-800/60 border-slate-200 transition-colors">
          <div className="flex items-center space-x-2.5">
            <BrandLogo size={28} />
            <div>
              <div className="text-sm font-extrabold tracking-wide dark:text-white text-slate-900 flex items-center space-x-1 transition-colors">
                <span>Tavi AI</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium tracking-tight">
                By Tilak Dalai
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 active:scale-[0.99]"
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">⌘N</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 dark:bg-slate-900 bg-slate-100 border dark:border-slate-800/80 border-slate-200 rounded-xl text-xs dark:text-slate-200 text-slate-800 dark:placeholder-slate-500 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-3 pb-2 space-x-1 text-[11px] font-medium border-b dark:border-slate-800/60 border-slate-200 transition-colors">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'dark:bg-slate-800 dark:text-white bg-slate-200 text-slate-900 font-semibold'
                : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`flex-1 py-1 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
              activeTab === 'pinned'
                ? 'dark:bg-slate-800 dark:text-white bg-slate-200 text-slate-900 font-semibold'
                : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>Pinned</span>
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-1 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
              activeTab === 'archived'
                ? 'dark:bg-slate-800 dark:text-white bg-slate-200 text-slate-900 font-semibold'
                : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="w-3 h-3" />
            <span>Archived</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No conversations found.
            </div>
          ) : (
            Object.entries(grouped).map(([groupTitle, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={groupTitle}>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 mb-1">
                    {groupTitle}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((conv) => {
                      const isActive = conv._id === activeConversationId;
                      const isEditing = editingId === conv._id;

                      return (
                        <div
                          key={conv._id}
                          onClick={() => {
                            if (!isEditing) {
                              onSelectConversation(conv._id);
                              if (onClose) onClose();
                            }
                          }}
                          className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            isActive
                              ? 'dark:bg-blue-600/15 dark:text-blue-400 bg-blue-50 text-blue-600 font-semibold border dark:border-blue-500/20 border-blue-200'
                              : 'dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 dark:text-slate-500 dark:group-hover:text-slate-300 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') submitRename(conv._id, e);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="w-full dark:bg-slate-800 bg-white border border-blue-500 rounded px-1.5 py-0.5 text-xs dark:text-white text-slate-900 focus:outline-none"
                              />
                            ) : (
                              <span className="truncate">{conv.title}</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={(e) => submitRename(conv._id, e)}
                                  className="p-1 hover:text-emerald-400"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(null);
                                  }}
                                  className="p-1 hover:text-slate-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPinConversation(conv._id, !conv.isPinned);
                                  }}
                                  title={conv.isPinned ? 'Unpin' : 'Pin'}
                                  className={`p-1 hover:text-amber-400 ${
                                    conv.isPinned ? 'text-amber-400 opacity-100' : 'text-slate-400'
                                  }`}
                                >
                                  <Pin className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={(e) => startRename(conv, e)}
                                  title="Rename"
                                  className="p-1 text-slate-400 hover:text-blue-400"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onArchiveConversation(conv._id, !conv.isArchived);
                                  }}
                                  title={conv.isArchived ? 'Unarchive' : 'Archive'}
                                  className="p-1 text-slate-400 hover:text-purple-400"
                                >
                                  <Archive className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this conversation permanently?')) {
                                      onDeleteConversation(conv._id);
                                    }
                                  }}
                                  title="Delete"
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Profile & Utilities Panel */}
        <div className="p-3 border-t dark:border-slate-800/80 border-slate-200 dark:bg-slate-950/80 bg-slate-50/90 space-y-1 transition-colors">
          {/* Quick Tools buttons */}
          <div className="flex items-center justify-around pb-2 border-b dark:border-slate-800/60 border-slate-200 transition-colors">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-2 rounded-xl dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 flex items-center justify-center transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
            </button>

            {onOpenInstall && (
              <button
                onClick={onOpenInstall}
                title="Install Tavi AI App"
                className="p-2 rounded-xl dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-900 text-slate-600 hover:text-blue-600 hover:bg-slate-200/70 flex items-center justify-center transition-colors"
              >
                <Download className="w-4 h-4 text-blue-500" />
              </button>
            )}

            <button
              onClick={onOpenMemory}
              title="Memory Engine"
              className="p-2 rounded-xl dark:text-slate-400 dark:hover:text-purple-400 dark:hover:bg-slate-900 text-slate-600 hover:text-purple-600 hover:bg-slate-200/70 flex items-center justify-center transition-colors"
            >
              <Brain className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAbout}
              title="About Tavi & Creator"
              className="p-2 rounded-xl dark:text-slate-400 dark:hover:text-cyan-400 dark:hover:bg-slate-900 text-slate-600 hover:text-cyan-600 hover:bg-slate-200/70 flex items-center justify-center transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>

            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                title="Admin Dashboard"
                className="p-2 rounded-xl dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-900 text-slate-600 hover:text-rose-600 hover:bg-slate-200/70 flex items-center justify-center transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </button>
            )}
          </div>

          {/* User Profile Bar */}
          <div className="flex items-center justify-between pt-1">
            <div
              onClick={onOpenSettings}
              className="flex items-center space-x-2.5 flex-1 min-w-0 cursor-pointer p-1.5 rounded-xl dark:hover:bg-slate-900 hover:bg-slate-200/70 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium dark:text-slate-200 text-slate-800 truncate transition-colors">
                  {mongoUser?.displayName || currentUser?.displayName || 'User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser?.email || 'Guest Explorer'}
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-900 text-slate-500 hover:text-rose-600 hover:bg-slate-200/70 rounded-xl transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

