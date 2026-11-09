import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Brain, Plus, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function MemoryModal({ isOpen, onClose }) {
  const { idToken } = useAuth();
  const [memories, setMemories] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [category, setCategory] = useState('fact');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isOpen || !idToken) return;

    setLoading(true);
    api
      .getMemories(idToken)
      .then((data) => {
        setMemories(data.memories || []);
      })
      .catch((err) => {
        console.warn('Load memories error:', err.message);
      })
      .finally(() => setLoading(false));
  }, [isOpen, idToken]);

  if (!isOpen) return null;

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || !idToken) return;

    setAdding(true);
    try {
      const { memory } = await api.createMemory(idToken, newContent.trim(), category);
      if (memory) {
        setMemories((prev) => [memory, ...prev]);
        setNewContent('');
      }
    } catch (err) {
      console.warn('Add memory error:', err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!idToken) return;
    try {
      await api.deleteMemory(idToken, id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.warn('Delete memory error:', err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all saved memories? This cannot be undone.')) return;
    if (!idToken) return;
    try {
      await api.clearMemories(idToken);
      setMemories([]);
    } catch (err) {
      console.warn('Clear memories error:', err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-lg w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-6 sm:p-7 dark:text-white text-slate-900 shadow-2xl relative max-h-[85vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-500" />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-slate-900">Tavi Memory Engine</h2>
        </div>
        <p className="text-xs dark:text-slate-400 text-slate-500 mb-4">
          Tavi remembers your key preferences and facts across sessions to deliver personalized answers.
        </p>

        {/* Add Memory Form */}
        <form onSubmit={handleAddMemory} className="mb-4 dark:bg-slate-800/40 bg-slate-50 p-3 rounded-2xl border dark:border-slate-700/50 border-slate-200">
          <label className="block text-[11px] font-semibold dark:text-slate-300 text-slate-700 mb-1">
            Teach Tavi something about you:
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. I work with React and prefer code in TypeScript"
              className="flex-1 px-3 py-1.5 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={adding || !newContent.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center space-x-1 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Memory Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-6 text-xs dark:text-slate-500 text-slate-400">Loading memories...</div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8 text-xs dark:text-slate-500 text-slate-400">
              No memories saved yet. Teach Tavi something above or converse naturally!
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between p-3 rounded-xl dark:bg-slate-800/60 bg-slate-50 border dark:border-slate-700/60 border-slate-200 text-xs"
              >
                <div className="flex items-start space-x-2 min-w-0 pr-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="dark:text-slate-200 text-slate-800 leading-snug">{m.content}</span>
                </div>
                <button
                  onClick={() => handleDelete(m._id)}
                  className="p-1 dark:text-slate-500 dark:hover:text-rose-400 text-slate-400 hover:text-rose-600 transition-colors flex-shrink-0"
                  title="Forget memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        {memories.length > 0 && (
          <div className="pt-4 border-t dark:border-slate-800/80 border-slate-200 flex items-center justify-between text-xs">
            <span className="dark:text-slate-500 text-slate-400 text-[11px]">{memories.length} active memories</span>
            <button
              onClick={handleClearAll}
              className="dark:text-rose-400 dark:hover:text-rose-300 text-rose-600 hover:text-rose-700 text-[11px] font-medium transition-colors"
            >
              Clear All Memories
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

